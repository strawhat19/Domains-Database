import { SOCIAL_STORAGE_KEY } from './keys';

const resets = new Set<string>();
const revisions = new Map<string, number>();
const listeners = new Set<(userId: string) => void>();

export const getAccountDataRevision = (userId: string) => revisions.get(userId) ?? 0;
export const subscribeAccountDataReset = (listener: (userId: string) => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export const beginAccountDataReset = (userId: string) => {
  resets.add(userId);
  revisions.set(userId, getAccountDataRevision(userId) + 1);
  for (const listener of listeners) {
    try { listener(userId); } catch { /* Subscriber state cannot prevent account cleanup. */ }
  }
};
export const finishAccountDataReset = (userId: string) => { resets.delete(userId); };
export const assertAccountDataWritable = (key: string) => {
  for (const userId of resets) {
    if (key.endsWith(`:user:${userId}`) || key === SOCIAL_STORAGE_KEY) throw new Error(`Account Data Is Being Deleted — Try Again`);
  }
};
