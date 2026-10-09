import { THEME_STORAGE_KEY } from '../themeContext/theme';
import { beginAccountDataReset, finishAccountDataReset } from './state';
import { readStorage, writeAccountResetStorage } from '../common/storage';
import { accountStorageKey } from '../authentication/userScope';
import { PORTFOLIO_STORAGE_KEY, useLocalStorage } from '../config';
import { PREFERENCES_STORAGE_KEY } from '../portfolioPreferences/storage';
import { COLUMN_STORAGE_KEY, getDefaultPortfolioColumns } from '../portfolioColumns';
import { SOCIAL_STORAGE_KEY, WATCHING_STORAGE_KEY, CONNECTIONS_STORAGE_KEY, NOTIFICATIONS_STORAGE_KEY, SYNC_POLICY_STORAGE_KEY, RECENT_SEARCHES_STORAGE_KEY } from './keys';

type StoredRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is StoredRecord => Boolean(value) && typeof value === `object` && !Array.isArray(value);
const readSnapshot = async (key: string): Promise<StoredRecord | null> => {
  const saved = await readStorage(key);
  if (saved === null) return null;
  try {
    const parsed: unknown = JSON.parse(saved);
    if (!isRecord(parsed)) throw new Error();
    return parsed;
  } catch { throw new Error(`Saved Account Data Could Not Be Read — Nothing Was Deleted`); }
};
const recordNumbers = (value: unknown): number[] => Array.isArray(value)
  ? value.flatMap(record => isRecord(record) && Number.isSafeInteger(record.number) && Number(record.number) > 0 ? [Number(record.number)] : [])
  : [];
const nextNumber = (snapshot: StoredRecord | null, field = `records`) => Math.max(
  Number.isSafeInteger(snapshot?.nextNumber) && Number(snapshot?.nextNumber) > 0 ? Number(snapshot?.nextNumber) : 1,
  1, ...recordNumbers(snapshot?.[field]).map(number => number + 1),
);
const emptyStatuses = () => Object.fromEntries([`vercel`, `godaddy`, `porkbun`, `namesilo`, `hostinger`, `namecheap`, `squarespace`]
  .map(provider => [provider, { count: 0, state: `idle`, checkedAt: ``, message: `Not Connected` }]));
const clearedSocialSnapshot = (snapshot: StoredRecord | null, userId: string) => {
  if (!snapshot) return null;
  if (snapshot.version !== 1 || !Array.isArray(snapshot.posts) || !Array.isArray(snapshot.follows)
    || !Number.isSafeInteger(snapshot.nextPostNumber) || Number(snapshot.nextPostNumber) < 1
    || !Number.isSafeInteger(snapshot.nextFollowNumber) || Number(snapshot.nextFollowNumber) < 1
    || snapshot.posts.some(post => !isRecord(post) || typeof post.authorId !== `string`)
    || snapshot.follows.some(follow => !isRecord(follow) || typeof follow.followerId !== `string` || typeof follow.followingId !== `string`)) {
    throw new Error(`Saved Community Data Could Not Be Read — Nothing Was Deleted`);
  }
  return {
    ...snapshot,
    posts: snapshot.posts.filter(post => post.authorId !== userId),
    follows: snapshot.follows.filter(follow => follow.followerId !== userId && follow.followingId !== userId),
    nextPostNumber: Math.max(Number(snapshot.nextPostNumber), ...recordNumbers(snapshot.posts).map(number => number + 1)),
    nextFollowNumber: Math.max(Number(snapshot.nextFollowNumber), ...recordNumbers(snapshot.follows).map(number => number + 1)),
  };
};

// The authentication service verifies the active session and actor, then revokes the session before calling this internal operation.
export const clearAccountData = async (userId: string, includeConnections: boolean): Promise<void> => {
  if (!useLocalStorage) throw new Error(`Connect A Backend To Delete Account Data`);
  if (!userId?.trim()) throw new Error(`Sign In To Delete Account Data`);
  beginAccountDataReset(userId);
  try {
    const scopedKey = (key: string) => accountStorageKey(key, userId);
    const [portfolio, notifications, watching, preferences, social, connections] = await Promise.all([
      readSnapshot(scopedKey(PORTFOLIO_STORAGE_KEY)),
      readSnapshot(scopedKey(NOTIFICATIONS_STORAGE_KEY)),
      readSnapshot(scopedKey(WATCHING_STORAGE_KEY)),
      readSnapshot(scopedKey(PREFERENCES_STORAGE_KEY)),
      readSnapshot(SOCIAL_STORAGE_KEY),
      includeConnections ? readSnapshot(scopedKey(CONNECTIONS_STORAGE_KEY)) : Promise.resolve(null),
    ]);
    const socialSnapshot = clearedSocialSnapshot(social, userId);
    const collectionNumber = Math.max(
      Number.isSafeInteger(preferences?.collectionNumber) && Number(preferences?.collectionNumber) >= 0 ? Number(preferences?.collectionNumber) : 0,
      0, ...recordNumbers(preferences?.collections),
    );
    const clearedPreferences = {
      orders: {}, view: `table`, groupBy: `none`, collections: [], customGroups: [],
      collectionNumber, showCosts: false, hiddenGroupKeys: [], showHiddenGroups: false,
    };
    const writes: [string, unknown][] = [
      [scopedKey(SYNC_POLICY_STORAGE_KEY), {
        userId, version: 1, lastSyncedAt: 0, manualAttempts: [], accountStatuses: {},
        connectionsUpdated: ``, manualCooldownUntil: 0, statuses: emptyStatuses(),
        successfulProviders: [], automaticSyncPaused: true,
      }],
      [scopedKey(PORTFOLIO_STORAGE_KEY), { version: 1, domains: [], nextNumber: nextNumber(portfolio, `domains`) }],
      [scopedKey(NOTIFICATIONS_STORAGE_KEY), { version: 1, records: [], nextNumber: nextNumber(notifications) }],
      [scopedKey(WATCHING_STORAGE_KEY), { userId, version: 1, records: [], nextNumber: nextNumber(watching) }],
      [scopedKey(RECENT_SEARCHES_STORAGE_KEY), { userId, version: 1, records: [] }],
      [scopedKey(COLUMN_STORAGE_KEY), { version: 6, widths: {}, flexibleColumns: [], useDefaultColumns: true, columns: getDefaultPortfolioColumns([]) }],
      [scopedKey(PREFERENCES_STORAGE_KEY), clearedPreferences],
    ];
    if (includeConnections) writes.push([scopedKey(CONNECTIONS_STORAGE_KEY), {
      userId, version: 2, accounts: [], nextNumber: nextNumber(connections, `accounts`), updated: new Date().toISOString(),
    }]);
    if (socialSnapshot) writes.push([SOCIAL_STORAGE_KEY, socialSnapshot]);
    for (const [key, snapshot] of writes) await writeAccountResetStorage(key, JSON.stringify(snapshot));
    await writeAccountResetStorage(scopedKey(THEME_STORAGE_KEY), `dark`);
  } finally { finishAccountDataReset(userId); }
};
