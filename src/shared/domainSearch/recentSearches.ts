import { authAPI } from '../../api/auth';
import { useLocalStorage, persistenceEnabled } from '../config';
import { RECENT_SEARCHES_STORAGE_KEY } from '../accountData/keys';
import { normalizeDomainSearchQuery } from './query';
import { accountStorageKey } from '../authentication/userScope';
import { readStorage, writeStorage, removeStorage, subscribeStorage, createOperationQueue } from '../common/storage';

export interface RecentDomainSearch {
  query: string;
  submittedAt: string;
}

interface RecentSearchSnapshot {
  version: 1;
  userId?: string;
  records: RecentDomainSearch[];
}

export const RECENT_SEARCHES_LIMIT = 12;
export { RECENT_SEARCHES_STORAGE_KEY } from '../accountData/keys';
const serialize = createOperationQueue(RECENT_SEARCHES_STORAGE_KEY);

export const recentSearchesStorageKey = (userId: string | null) => userId
  ? accountStorageKey(RECENT_SEARCHES_STORAGE_KEY, userId)
  : RECENT_SEARCHES_STORAGE_KEY;

const requireActor = async (expectedUserId?: string | null) => {
  if (!persistenceEnabled) throw new Error(`Connect A Backend To Use Recent Searches`);
  const session = await authAPI.restoreSession();
  const userId = session?.user?.id ?? null;
  if (expectedUserId !== undefined && userId !== expectedUserId) throw new Error(`Your Account Changed — Try Again`);
  return userId;
};

const restoreSnapshot = (saved: string | null, userId: string | null): RecentDomainSearch[] | null => {
  if (saved === null) return null;
  try {
    const snapshot = JSON.parse(saved) as RecentSearchSnapshot;
    if (snapshot?.version !== 1 || snapshot.userId !== (userId ?? undefined)
      || !Array.isArray(snapshot.records) || snapshot.records.length > RECENT_SEARCHES_LIMIT) throw new Error();
    const queries = new Set<string>();
    const records = snapshot.records.map(record => {
      if (!record || typeof record.query !== `string` || normalizeDomainSearchQuery(record.query) !== record.query
        || queries.has(record.query) || typeof record.submittedAt !== `string` || !Number.isFinite(Date.parse(record.submittedAt))) throw new Error();
      queries.add(record.query);
      return { query: record.query, submittedAt: record.submittedAt };
    });
    return records.sort((first, second) => Date.parse(second.submittedAt) - Date.parse(first.submittedAt));
  } catch {
    throw new Error(`Saved Recent Searches Could Not Be Read`);
  }
};

const readSnapshot = async (userId: string | null): Promise<RecentDomainSearch[] | null> => restoreSnapshot(
  await readStorage(recentSearchesStorageKey(userId)), userId,
);

const readRecentSearches = async (userId: string | null) => {
  const saved = await readSnapshot(userId);
  return saved ?? (userId && useLocalStorage ? await readSnapshot(null) : null) ?? [];
};

export const subscribeRecentSearches = (
  userId: string | null,
  onValue: (records: RecentDomainSearch[]) => boolean | void,
  onError: (error: Error) => void,
) => {
  let active = true;
  let saved: string | null | undefined;
  let legacy: string | null | undefined = userId && useLocalStorage ? undefined : null;
  const unsubscribers: (() => void)[] = [];
  const update = () => {
    if (!active || saved === undefined || legacy === undefined) return false;
    try {
      const records = restoreSnapshot(saved, userId) ?? (userId && useLocalStorage ? restoreSnapshot(legacy, null) : null) ?? [];
      return onValue(records);
    } catch (reason) {
      onError(reason instanceof Error ? reason : new Error(`Saved Recent Searches Could Not Be Read`));
      return false;
    }
  };
  void requireActor(userId).then(() => {
    if (!active) return;
    unsubscribers.push(subscribeStorage(recentSearchesStorageKey(userId), value => { saved = value; return update(); }, onError));
    if (userId && useLocalStorage) unsubscribers.push(subscribeStorage(RECENT_SEARCHES_STORAGE_KEY, value => { legacy = value; return update(); }, onError));
  }).catch(reason => {
    if (active) onError(reason instanceof Error ? reason : new Error(`Could Not Load Recent Searches`));
  });
  return () => { active = false; for (const unsubscribe of unsubscribers) unsubscribe(); };
};

export const getRecentSearches = (expectedUserId?: string | null): Promise<RecentDomainSearch[]> => serialize(async () => {
  const userId = await requireActor(expectedUserId);
  const records = await readRecentSearches(userId);
  await requireActor(userId);
  return records;
});

export const rememberSearch = (value: string, expectedUserId?: string | null): Promise<void> => serialize(async () => {
  const userId = await requireActor(expectedUserId);
  const query = normalizeDomainSearchQuery(value);
  const saved = await readRecentSearches(userId);
  const storageKey = recentSearchesStorageKey(userId);
  const snapshot: RecentSearchSnapshot = {
    version: 1,
    ...(userId ? { userId } : {}),
    records: [{ query, submittedAt: new Date().toISOString() }, ...saved.filter(record => record.query !== query)].slice(0, RECENT_SEARCHES_LIMIT),
  };
  await requireActor(userId);
  await writeStorage(storageKey, JSON.stringify(snapshot));
});

export const clearRecentSearches = (expectedUserId?: string | null): Promise<void> => serialize(async () => {
  const userId = await requireActor(expectedUserId);
  const storageKey = recentSearchesStorageKey(userId);
  await requireActor(userId);
  if (userId) {
    await readSnapshot(userId);
    await writeStorage(storageKey, JSON.stringify({ version: 1, userId, records: [] }));
  }
  else await removeStorage(storageKey);
});
