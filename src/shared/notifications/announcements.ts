import { authAPI } from '../../api/auth';
import { useLocalStorage } from '../config';
import { Types, Roles } from '../../types/types';
import { isAppCollectionID } from '../common/ids';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseEnabled } from '../firebase/config';
import { assertOwnerSession } from '../authentication/firebase';
import { getFirebaseDb, getFirebaseAuth } from '../firebase/client';
import { sampleNotifications, type HeaderNotification } from '../sampleNotifications';
import { Notification, AnnouncementStatus } from '../models/notifications/Notification';
import { readStorage, writeStorage, subscribeStorage, createOperationQueue } from '../common/storage';
import { doc, query, where, collection, onSnapshot, runTransaction, onSnapshotsInSync } from 'firebase/firestore';

const storageKey = `domains-database:announcements:v1`;
const importVersion = 1;
const subscribers = new Set<AnnouncementSubscriber>();
const imports = new Map<string, Promise<void>>();
const serialize = createOperationQueue(storageKey);
const originals = () => sampleNotifications.map(notification => ({ ...notification }));
let notifications = originals();
let stopWatch: (() => void) | undefined;

interface AnnouncementSubscriber {
  next: (records: HeaderNotification[]) => void;
  error?: (failure: Error) => void;
}

const toHeaderNotification = (record: Notification): HeaderNotification => {
  const before = typeof record.metadata.before === `string` ? record.metadata.before : ``;
  const after = typeof record.metadata.after === `string` ? record.metadata.after : ``;
  const message = record.description || record.details;
  const original = sampleNotifications.some(notification => notification.id === record.providerId);
  return {
    after,
    before,
    title: record.title || record.name,
    id: original ? record.providerId! : record.id,
    icon: record.icon === `Sparkles` ? `Sparkles` : `Info`,
    message: (before || after) && (!message || message === `${before}sign up${after}`) ? undefined : message,
  };
};

const publish = (records: Notification[], imported: boolean) => {
  const saved = records.filter(record => record.active).sort((left, right) => left.number - right.number).map(toHeaderNotification);
  const values = imported ? saved : [...saved, ...originals().filter(original => !saved.some(record => record.id === original.id))];
  if (JSON.stringify(values) !== JSON.stringify(notifications)) notifications = values;
  for (const subscriber of subscribers) subscriber.next(notifications);
};

const report = (failure: unknown) => {
  const error = failure instanceof Error ? failure : new Error(`Notification(s) Could Not Be Loaded`);
  for (const subscriber of subscribers) subscriber.error?.(error);
};

const watchCloud = () => {
  const database = getFirebaseDb();
  const authentication = getFirebaseAuth();
  let uid = authentication.currentUser?.uid ?? ``;
  let permissionDenied = false;
  let stopSnapshots: () => void = () => undefined;
  const start = () => {
    stopSnapshots();
    let active = true;
    let imported: boolean | undefined;
    let records: Notification[] | undefined;
    permissionDenied = false;
    const fail = (failure: unknown) => {
      if (!active) return;
      permissionDenied = (failure as { code?: string })?.code === `permission-denied`;
      stopSnapshots();
      report(failure);
    };
    const stopRecords = onSnapshot(query(collection(database, `notifications`), where(`active`, `==`, true)), { includeMetadataChanges: true }, snapshot => {
      if (!active || (snapshot.metadata.fromCache && snapshot.empty && !records)) return;
      try {
        records = snapshot.docs.map(document => {
          const saved = document.data();
          if (saved.id !== document.id || !isAppCollectionID(saved.id, Types.Notification)) throw new Error(`Saved Notification(s) Could Not Be Read`);
          return new Notification(saved);
        });
      } catch (failure) { fail(failure); }
    }, fail);
    const stopCounter = onSnapshot(doc(database, `counters`, `notifications`), { includeMetadataChanges: true }, snapshot => {
      if (!active || (snapshot.metadata.fromCache && !snapshot.exists())) return;
      imported = snapshot.data()?.initialAnnouncementsVersion === importVersion;
    }, fail);
    // The import marker and its records are committed together; publish after both listeners catch up.
    const stopSync = onSnapshotsInSync(database, () => {
      if (active && records && imported !== undefined) publish(records, imported);
    });
    stopSnapshots = () => { active = false; stopSync(); stopCounter(); stopRecords(); };
  };
  start();
  const stopAuth = onAuthStateChanged(authentication, user => {
    const currentUid = user?.uid ?? ``;
    if (currentUid !== uid && permissionDenied) start();
    uid = currentUid;
  });
  return () => { stopAuth(); stopSnapshots(); };
};

export const subscribeAnnouncements = (next: AnnouncementSubscriber[`next`], error?: AnnouncementSubscriber[`error`]) => {
  const subscriber = { next, error };
  subscribers.add(subscriber);
  next(notifications);
  if (!stopWatch) {
    try {
      stopWatch = firebaseEnabled && !useLocalStorage ? watchCloud() : subscribeStorage(storageKey, value => {
        try {
          if (!value) { publish([], false); return; }
          const saved = JSON.parse(value) as { initialAnnouncementsVersion?: number; records: Notification[] };
          publish(saved.records.map(record => new Notification(record)), saved.initialAnnouncementsVersion === importVersion);
        } catch (failure) { report(failure); }
      }, report);
    } catch (failure) { report(failure); }
  }
  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size) return;
    stopWatch?.();
    stopWatch = undefined;
  };
};

const createOriginals = (number: number) => sampleNotifications.map((original, index) => new Notification({
  uid: ``,
  active: true,
  icon: original.icon,
  number: number + index + 1,
  name: original.title,
  title: original.title,
  providerId: original.id,
  status: AnnouncementStatus.Active,
  description: `${original.before}sign up${original.after}`,
  metadata: { after: original.after, before: original.before },
}));

export const populateInitialAnnouncements = async (): Promise<void> => {
  if (!firebaseEnabled || useLocalStorage) return serialize(async () => {
    const value = await readStorage(storageKey);
    const saved = value ? JSON.parse(value) as { records: Notification[]; initialAnnouncementsVersion?: number } : undefined;
    if (saved?.initialAnnouncementsVersion === importVersion) return;
    const previous = saved?.records ?? [];
    const number = previous.reduce((maximum, record) => Math.max(maximum, record.number), 0);
    await writeStorage(storageKey, JSON.stringify({
      initialAnnouncementsVersion: importVersion,
      records: [...previous, ...createOriginals(number).map(record => record.toRecord())],
    }));
  });
  const session = await authAPI.restoreSession();
  const user = session?.user;
  if (!user?.active || user.role !== Roles.Owner || !user.firebase_uid) throw new Error(`Owner Access Is Required`);
  const uid = user.firebase_uid;
  assertOwnerSession(uid);
  const pending = imports.get(uid);
  if (pending) return pending;
  const database = getFirebaseDb();
  const counterReference = doc(database, `counters`, `notifications`);
  const operation = runTransaction(database, async transaction => {
    const counter = await transaction.get(counterReference);
    assertOwnerSession(uid);
    if (counter.data()?.initialAnnouncementsVersion === importVersion) return;
    const number = counter.data()?.number ?? 0;
    if (!Number.isSafeInteger(number) || number < 0) throw new Error(`Saved Notification Counter Could Not Be Read`);
    const records = createOriginals(number);
    for (const record of records) transaction.set(doc(database, `notifications`, record.id), record.toRecord());
    transaction.set(counterReference, {
      number: number + records.length,
      initialAnnouncementsVersion: importVersion,
    }, { merge: true });
  });
  imports.set(uid, operation);
  try { await operation; }
  catch (failure) { imports.delete(uid); throw failure; }
};
