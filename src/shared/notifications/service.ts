import { useLocalStorage } from '../config';
import { firebaseEnabled } from '../firebase/config';
import { restoreSession } from '../authentication/service';
import { canManageNotifications } from '../admin/permissions';
import { numberCollectionPage, type CollectionPage } from '../firebase/collection';
import { sampleNotifications, type HeaderNotification } from '../sampleNotifications';
import { readStorage, writeStorage, subscribeStorage, createOperationQueue } from '../common/storage';
import { readAnnouncement, normalizeAnnouncement, toHeaderNotification, announcementId } from './values';
import { Notification, AnnouncementStatus, type AdminNotificationInput } from '../models/notifications/Notification';
import { getAdminNotificationPage, subscribeAdminNotificationPage, subscribePublishedNotificationRecords, saveCloudAnnouncement, updateCloudAnnouncementStatus, deleteCloudAnnouncement, importCloudInitialAnnouncements } from '../firebase/notifications';

const storageKey = `domains-database:announcements:v1`;
const serialize = createOperationQueue(storageKey);
const cloudEnabled = firebaseEnabled && !useLocalStorage;
interface LocalAnnouncements { version: 1; records: Notification[]; nextNumber: number; initialAnnouncementsVersion?: number }
const errorFromFailure = (failure: unknown) => failure instanceof Error ? failure : new Error(`Notification(s) Could Not Be Loaded`);
const requireLocalAdmin = async () => {
  if (!useLocalStorage) throw new Error(`Connect Firebase To Manage Notifications`);
  const user = (await restoreSession())?.user;
  if (!canManageNotifications(user)) throw new Error(`Admin Access Is Required`);
  return user!;
};
const localRecords = (saved: string | null): LocalAnnouncements => {
  if (!saved) return { version: 1, records: [], nextNumber: 1 };
  let value: Record<string, unknown>;
  try { value = JSON.parse(saved); } catch { throw new Error(`Saved Notification(s) Could Not Be Read`); }
  if (!value || (value.version !== undefined && value.version !== 1) || !Array.isArray(value.records)
    || (value.initialAnnouncementsVersion !== undefined && value.initialAnnouncementsVersion !== 1)
    || (value.nextNumber !== undefined && (!Number.isSafeInteger(value.nextNumber) || Number(value.nextNumber) < 1))) throw new Error(`Saved Notification(s) Could Not Be Read`);
  const ids = new Set<string>();
  const numbers = new Set<number>();
  const records = value.records.map(data => {
    const record = readAnnouncement(data, data?.id);
    if (ids.has(record.id) || numbers.has(record.number)) throw new Error(`Saved Notification Identity Needs Attention`);
    ids.add(record.id);
    numbers.add(record.number);
    return record;
  });
  return { version: 1, records, nextNumber: Math.max(Number(value.nextNumber ?? 1), ...records.map(record => record.number + 1)), ...(value.initialAnnouncementsVersion === 1 ? { initialAnnouncementsVersion: 1 } : {}) };
};
const readLocal = async () => localRecords(await readStorage(storageKey));
const saveLocal = async (snapshot: LocalAnnouncements, actorId: string) => {
  if ((await requireLocalAdmin()).id !== actorId) throw new Error(`Your Account Changed — Try Again`);
  await writeStorage(storageKey, JSON.stringify({ ...snapshot, records: snapshot.records.map(record => record.toRecord()) }));
};
export const getAdminNotificationsPage = async (cursor: number | null = null): Promise<CollectionPage<Notification>> => {
  if (cloudEnabled) return getAdminNotificationPage(cursor);
  const actor = await requireLocalAdmin();
  const snapshot = await readLocal();
  if ((await requireLocalAdmin()).id !== actor.id) throw new Error(`Your Account Changed — Try Again`);
  return numberCollectionPage(snapshot.records, cursor);
};
export const subscribeAdminNotifications = (onValue: (page: CollectionPage<Notification>) => void, onError?: (failure: Error) => void, cursor: number | null = null) => {
  if (cloudEnabled) return subscribeAdminNotificationPage(onValue, onError, cursor);
  let active = true;
  let revision = 0;
  let stop: () => void = () => undefined;
  const fail = (failure: unknown) => { if (active) onError?.(errorFromFailure(failure)); };
  void requireLocalAdmin().then(actor => {
    if (!active) return;
    stop = subscribeStorage(storageKey, saved => {
      const request = ++revision;
      void requireLocalAdmin().then(current => {
        if (!active || request !== revision) return;
        if (current.id !== actor.id) throw new Error(`Your Account Changed — Try Again`);
        onValue(numberCollectionPage(localRecords(saved).records, cursor));
      }).catch(fail);
    }, fail);
  }).catch(fail);
  return () => { active = false; revision++; stop(); };
};
export const saveAnnouncement = async (input: AdminNotificationInput, id?: string): Promise<Notification> => {
  const values = normalizeAnnouncement(input);
  if (cloudEnabled) return saveCloudAnnouncement(values, id);
  return serialize(async () => {
    const actor = await requireLocalAdmin();
    const snapshot = await readLocal();
    const original = id ? snapshot.records.find(record => record.id === announcementId(id)) : undefined;
    if (id && !original) throw new Error(`Saved Notification Was Not Found`);
    if (snapshot.records.some(record => record.slug === values.slug && record.id !== id)) throw new Error(`That Slug Is Already In Use`);
    const record = new Notification({ ...original, ...values, id: original?.id, uid: ``, name: values.title, description: values.body, details: values.body, number: original?.number ?? snapshot.nextNumber, updated: new Date().toISOString(), suffix: values.suffix, link: values.link });
    if (!original) snapshot.nextNumber++;
    snapshot.records = original ? snapshot.records.map(current => current.id === id ? record : current) : [...snapshot.records, record];
    await saveLocal(snapshot, actor.id);
    return record;
  });
};
export const updateAnnouncementStatus = async (id: string, status: AnnouncementStatus): Promise<Notification> => {
  announcementId(id);
  if (!Object.values(AnnouncementStatus).includes(status)) throw new Error(`Choose A Valid Notification Status`);
  if (cloudEnabled) return updateCloudAnnouncementStatus(id, status);
  return serialize(async () => {
    const actor = await requireLocalAdmin();
    const snapshot = await readLocal();
    const original = snapshot.records.find(record => record.id === id);
    if (!original) throw new Error(`Saved Notification Was Not Found`);
    const record = new Notification({ ...original, status, updated: new Date().toISOString() });
    snapshot.records = snapshot.records.map(current => current.id === id ? record : current);
    await saveLocal(snapshot, actor.id);
    return record;
  });
};
export const deleteAnnouncement = async (id: string): Promise<void> => {
  announcementId(id);
  if (cloudEnabled) return deleteCloudAnnouncement(id);
  return serialize(async () => {
    const actor = await requireLocalAdmin();
    const snapshot = await readLocal();
    if (!snapshot.records.some(record => record.id === id)) throw new Error(`Saved Notification Was Not Found`);
    snapshot.records = snapshot.records.filter(record => record.id !== id);
    await saveLocal(snapshot, actor.id);
  });
};
export const subscribeAnnouncements = (onValue: (records: HeaderNotification[]) => void, onError?: (failure: Error) => void) => {
  if (cloudEnabled) return subscribePublishedNotificationRecords(records => onValue(records.map(toHeaderNotification)), onError);
  if (!useLocalStorage) { onError?.(new Error(`Connect Firebase To Load Notifications`)); return () => undefined; }
  return subscribeStorage(storageKey, saved => {
    try { onValue(localRecords(saved).records.filter(record => record.active).sort((first, second) => second.number - first.number).slice(0, 100).map(toHeaderNotification)); }
    catch (failure) { onError?.(errorFromFailure(failure)); }
  }, onError);
};
const initialRecords = (number: number) => sampleNotifications.map((original, index) => new Notification({
  uid: ``,
  active: true,
  showTitle: true,
  icon: original.icon,
  slug: original.id,
  name: original.title,
  title: original.title,
  body: original.before,
  suffix: original.after,
  providerId: original.id,
  number: number + index + 1,
  status: AnnouncementStatus.Active,
  link: { href: `/signup`, label: `sign up` },
  description: `${original.before}sign up${original.after}`,
  kind: original.id === `development` ? `development` : `announcement`,
  metadata: { before: original.before, after: original.after },
}));
export const populateInitialAnnouncements = async (): Promise<void> => {
  if (cloudEnabled) return importCloudInitialAnnouncements(initialRecords);
  return serialize(async () => {
    const actor = await requireLocalAdmin();
    const snapshot = await readLocal();
    if (snapshot.initialAnnouncementsVersion === 1) return;
    if (snapshot.records.some(record => [`development`, `support`].includes(record.slug))) throw new Error(`Initial Notices Already Exist — Review Saved Notifications`);
    const records = initialRecords(snapshot.nextNumber - 1);
    snapshot.records.push(...records);
    snapshot.nextNumber += records.length;
    snapshot.initialAnnouncementsVersion = 1;
    await saveLocal(snapshot, actor.id);
  });
};

export type { AdminNotificationInput } from '../models/notifications/Notification';
