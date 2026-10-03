import { readStorage } from '../common/storage';
import { AUTH_ACCOUNTS_KEY, AUTH_SESSION_KEY } from './service';

export const AUTH_PRESENCE_KEYS = [`user`, `users`, AUTH_SESSION_KEY, AUTH_ACCOUNTS_KEY];

const containsUser = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(containsUser);
  if (!value || typeof value !== `object`) return false;
  const record = value as Record<string, unknown>;
  if ([record.id, record.uid, record.name, record.email, record.userId, record.displayName].some(field => typeof field === `string` && Boolean(field.trim()))) return true;
  return [record.user, record.users, record.records, record.accounts].some(containsUser);
};

export const hasSavedAccount = async (): Promise<boolean> => {
  const storedValues = await Promise.all(AUTH_PRESENCE_KEYS.map(readStorage));
  return storedValues.some(stored => {
    if (!stored?.trim()) return false;
    try {
      return containsUser(JSON.parse(stored));
    } catch {
      throw new Error(`Saved User Data Could Not Be Read`);
    }
  });
};
