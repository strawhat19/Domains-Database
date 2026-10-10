import { useLocalStorage } from '../config';
import type { PortfolioPreferences } from './types';
import { COLUMN_STORAGE_KEY } from '../portfolioColumns';
import { accountStorageKey } from '../authentication/userScope';
import { readStorage, writeStorage, subscribeStorage, createOperationQueue } from '../common/storage';

export const PREFERENCES_STORAGE_KEY = `domains-database:preferences:v1`;
const migrationQueue = createOperationQueue();
export const portfolioStorageKey = (baseKey: string, userId: string | null = null) => userId
  ? accountStorageKey(baseKey, userId)
  : `${baseKey}:guest`;

export const readPortfolioPreferences = (userId: string | null = null) => {
  return readStorage(portfolioStorageKey(PREFERENCES_STORAGE_KEY, userId));
};

export const subscribePortfolioStorage = (
  baseKey: string,
  userId: string | null,
  onValue: (value: string | null) => boolean | void,
  onError?: (error: Error) => void,
) => subscribeStorage(portfolioStorageKey(baseKey, userId), onValue, onError);

export const subscribePortfolioPreferences = (
  userId: string | null,
  onValue: (value: string | null) => boolean | void,
  onError?: (error: Error) => void,
) => subscribePortfolioStorage(PREFERENCES_STORAGE_KEY, userId, onValue, onError);

export const savePortfolioPreferences = (preferences: PortfolioPreferences, userId: string | null = null) => {
  return writeStorage(portfolioStorageKey(PREFERENCES_STORAGE_KEY, userId), JSON.stringify(preferences));
};

export const claimLegacyPortfolioPreferences = (userId: string) => migrationQueue(async () => {
  if (!useLocalStorage) return;
  const capturedUserId = userId;
  for (const baseKey of [PREFERENCES_STORAGE_KEY, COLUMN_STORAGE_KEY]) {
    const key = accountStorageKey(baseKey, capturedUserId);
    if (await readStorage(key) !== null) continue;
    const legacy = await readStorage(baseKey);
    if (legacy !== null) await writeStorage(key, legacy);
  }
});
