import { authAPI } from '../../api/auth';
import { useLocalStorage } from '../config';
import { RECENT_SEARCHES_STORAGE_KEY } from '../accountData/keys';
import { normalizeDomainSearchQuery } from './query';
import { accountStorageKey } from '../authentication/userScope';
import { readStorage, writeStorage, removeStorage, createOperationQueue } from '../common/storage';

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
const listeners = new Set<(storageKey: string) => void>();

export const recentSearchesStorageKey = (userId: string | null) => userId
  ? accountStorageKey(RECENT_SEARCHES_STORAGE_KEY, userId)
  : RECENT_SEARCHES_STORAGE_KEY;

const requireActor = async (expectedUserId?: string | null) => {
  if (!useLocalStorage) throw new Error(`Connect A Backend To Use Recent Searches`);
  const session = await authAPI.restoreSession();
  const userId = session?.user?.id ?? null;
  if (expectedUserId !== undefined && userId !== expectedUserId) throw new Error(`Your Account Changed — Try Again`);
  return userId;
};

const readSnapshot = async (userId: string | null): Promise<RecentDomainSearch[] | null> => {
  const saved = await readStorage(recentSearchesStorageKey(userId));
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

const readRecentSearches = async (userId: string | null) => {
  const saved = await readSnapshot(userId);
  return saved ?? (userId ? await readSnapshot(null) : null) ?? [];
};

const notifyRecentSearches = (storageKey: string) => {
  for (const listener of listeners) listener(storageKey);
};

export const subscribeRecentSearches = (listener: (storageKey: string) => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
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
  notifyRecentSearches(storageKey);
});

export const clearRecentSearches = (expectedUserId?: string | null): Promise<void> => serialize(async () => {
  const userId = await requireActor(expectedUserId);
  const storageKey = recentSearchesStorageKey(userId);
  await requireActor(userId);
  if (userId) await writeStorage(storageKey, JSON.stringify({ version: 1, userId, records: [] }));
  else await removeStorage(storageKey);
  notifyRecentSearches(storageKey);
});
