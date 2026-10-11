import { useLocalStorage } from '../config';
import type { User } from '../models/users/User';
import { firebaseEnabled } from '../firebase/config';
import { restoreSession } from '../authentication/service';
import { accountStorageKey } from '../authentication/userScope';
import { NOTIFICATION_READS_STORAGE_KEY } from '../accountData/keys';
import { readStorage, writeStorage, subscribeStorage, createOperationQueue } from '../common/storage';

export interface NotificationReadSnapshot { notice: string; readIds: string[] }
interface AccountReadScope { key: string; userId: string; firebaseUid?: string }
interface GuestReadSubscriber {
  next: (snapshot: NotificationReadSnapshot) => void;
  error?: (failure: Error) => void;
}

const maxReadIds = 2000;
const maxIdLength = 200;
const cloudEnabled = firebaseEnabled && !useLocalStorage;
const storageKey = NOTIFICATION_READS_STORAGE_KEY;
const guestNotice = `Read Preferences Apply For This Session Only`;
const accountNotice = cloudEnabled ? `` : `Read Preferences Are Saved On This Device`;
const guestSubscribers = new Set<GuestReadSubscriber>();
const queues = new Map<string, ReturnType<typeof createOperationQueue>>();
let guestReadIds: string[] = [];

const errorFromFailure = (failure: unknown) => failure instanceof Error ? failure : new Error(`Notification Read Preferences Could Not Be Loaded`);
const validId = (value: unknown): value is string => typeof value === `string` && !!value.trim()
  && value.trim() === value && value.length <= maxIdLength && !/[\/\\\u0000-\u001f\u007f]/.test(value);
const validIds = (value: unknown): value is string[] => Array.isArray(value)
  && value.length <= maxReadIds && value.every(validId);
const readIdsFromStorage = (saved: string | null): string[] => {
  if (saved === null) return [];
  let value: unknown;
  try { value = JSON.parse(saved); } catch { throw new Error(`Saved Notification Read Preferences Could Not Be Read — Nothing Was Changed`); }
  if (!value || typeof value !== `object` || Array.isArray(value)) throw new Error(`Saved Notification Read Preferences Could Not Be Read — Nothing Was Changed`);
  const record = value as Record<string, unknown>;
  if (record.version !== 1 || !validIds(record.readIds) || new Set(record.readIds).size !== record.readIds.length
    || Object.keys(record).some(key => ![`version`, `readIds`].includes(key))) throw new Error(`Saved Notification Read Preferences Could Not Be Read — Nothing Was Changed`);
  return [...record.readIds];
};
const snapshot = (readIds: string[], notice: string): NotificationReadSnapshot => ({ notice, readIds: [...readIds] });
const accountScope = (user: User): AccountReadScope => {
  if (!user?.active || !user.id?.trim() || (cloudEnabled && !user.firebase_uid)) throw new Error(`Sign In To Save Notification Read Preferences`);
  return { userId: user.id, firebaseUid: user.firebase_uid, key: accountStorageKey(storageKey, user.id) };
};
const assertAccount = async (scope: AccountReadScope) => {
  const current = (await restoreSession())?.user;
  if (!current?.active || current.id !== scope.userId || (cloudEnabled && current.firebase_uid !== scope.firebaseUid)) throw new Error(`Your Account Changed — Try Again`);
};
const assertGuest = async () => {
  if ((await restoreSession())?.user) throw new Error(`Your Account Changed — Try Again`);
};
const queueFor = (key: string) => {
  let queue = queues.get(key);
  if (!queue) { queue = createOperationQueue(key); queues.set(key, queue); }
  return queue;
};
const mergeReadIds = (saved: string[], ids: string[]) => {
  const combined = Array.from(new Set([...saved, ...ids]));
  if (combined.length > maxReadIds) throw new Error(`Notification Read History Is Full — Nothing Was Changed`);
  return combined;
};

export const subscribeNotificationReads = (
  user: User | null,
  onValue: GuestReadSubscriber[`next`],
  onError?: GuestReadSubscriber[`error`],
): (() => void) => {
  if (!user) {
    const subscriber = { next: onValue, error: onError };
    guestSubscribers.add(subscriber);
    onValue(snapshot(guestReadIds, guestNotice));
    return () => { guestSubscribers.delete(subscriber); };
  }
  let active = true;
  let revision = 0;
  let stop: () => void = () => undefined;
  const fail = (failure: unknown) => { if (active) onError?.(errorFromFailure(failure)); };
  let scope: AccountReadScope;
  try { scope = accountScope(user); } catch (failure) { fail(failure); return () => undefined; }
  void assertAccount(scope).then(() => {
    if (!active) return;
    stop = subscribeStorage(scope.key, saved => {
      const request = ++revision;
      let readIds: string[];
      try { readIds = readIdsFromStorage(saved); } catch (failure) { fail(failure); return false; }
      void assertAccount(scope).then(() => {
        if (active && request === revision) onValue(snapshot(readIds, accountNotice));
      }).catch(failure => { if (request === revision) fail(failure); });
      return true;
    }, fail);
  }).catch(fail);
  return () => { active = false; revision++; stop(); };
};

export const markNotificationsRead = async (user: User | null, ids: string[]): Promise<NotificationReadSnapshot> => {
  if (!validIds(ids)) throw new Error(`Choose Valid Notification(s) To Mark Read`);
  const requestedIds = [...ids];
  if (!user) return queueFor(`${storageKey}:guest`)(async () => {
    await assertGuest();
    guestReadIds = mergeReadIds(guestReadIds, requestedIds);
    for (const subscriber of guestSubscribers) {
      try { subscriber.next(snapshot(guestReadIds, guestNotice)); }
      catch (failure) { subscriber.error?.(errorFromFailure(failure)); }
    }
    return snapshot(guestReadIds, guestNotice);
  });
  const scope = accountScope(user);
  return queueFor(scope.key)(async () => {
    await assertAccount(scope);
    const saved = readIdsFromStorage(await readStorage(scope.key));
    const readIds = mergeReadIds(saved, requestedIds);
    await assertAccount(scope);
    if (readIds.length !== saved.length) await writeStorage(scope.key, JSON.stringify({ version: 1, readIds }));
    await assertAccount(scope);
    return snapshot(readIds, accountNotice);
  });
};
