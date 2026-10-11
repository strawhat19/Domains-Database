import { FirebaseError } from 'firebase/app';
import { getFirebaseDb, getFirebaseAuth } from './client';
import { canManageNotifications } from '../admin/permissions';
import { numberCollectionPage, type CollectionPage } from './collection';
import { restoreSession, subscribeAuthState } from '../authentication/service';
import { readAnnouncement, normalizeAnnouncement, announcementId } from '../notifications/values';
import { Notification, AnnouncementStatus, type AdminNotificationInput } from '../models/notifications/Notification';
import { doc, query, limit, where, orderBy, startAfter, collection, onSnapshot, runTransaction, serverTimestamp, getDocFromServer, getDocsFromServer, type Transaction } from 'firebase/firestore';

export const notificationError = (failure: unknown): Error => {
  if (!(failure instanceof FirebaseError)) return failure instanceof Error ? failure : new Error(`Notification(s) Could Not Be Loaded`);
  if (failure.code === `permission-denied`) return new Error(`Notification Access Was Denied — Check Your Role And Firestore Rules`);
  if (failure.code === `failed-precondition`) return new Error(`Notifications Need The Firestore Indexes In This Repository`);
  if (failure.code === `unavailable`) return new Error(`Notifications Could Not Connect To Firestore — Try Again`);
  return new Error(`Notification Database Is Unavailable — Try Again`);
};
const assertAccount = (uid: string) => {
  if (getFirebaseAuth().currentUser?.uid !== uid) throw new Error(`Your Account Changed — Try Again`);
};
const requireAdmin = async () => {
  const user = (await restoreSession())?.user;
  if (!canManageNotifications(user) || !user?.firebase_uid) throw new Error(`Admin Access Is Required`);
  assertAccount(user.firebase_uid);
  const saved = await getDocFromServer(doc(getFirebaseDb(), `users`, user.id));
  assertAccount(user.firebase_uid);
  const data = saved.data();
  if (data?.id !== user.id || data?.firebase_uid !== user.firebase_uid || !canManageNotifications(data as typeof user)) throw new Error(`Admin Access Is Required`);
  return user;
};
const requireTransactionAdmin = async (transaction: Transaction, id: string, uid: string) => {
  assertAccount(uid);
  const snapshot = await transaction.get(doc(getFirebaseDb(), `users`, id));
  const data = snapshot.data();
  if (data?.id !== id || data?.firebase_uid !== uid || !canManageNotifications(data as Awaited<ReturnType<typeof requireAdmin>>)) throw new Error(`Admin Access Is Required`);
  assertAccount(uid);
};
const pageQuery = (cursor: number | null) => {
  if (cursor !== null && (!Number.isSafeInteger(cursor) || cursor < 1)) throw new Error(`Choose A Valid Page`);
  return query(collection(getFirebaseDb(), `notifications`), orderBy(`number`, `desc`), ...(cursor === null ? [] : [startAfter(cursor)]), limit(51));
};
export const getAdminNotificationPage = async (cursor: number | null = null): Promise<CollectionPage<Notification>> => {
  const actor = await requireAdmin();
  const snapshot = await getDocsFromServer(pageQuery(cursor));
  assertAccount(actor.firebase_uid!);
  return numberCollectionPage(snapshot.docs.map(record => readAnnouncement(record.data(), record.id)));
};
export const subscribeAdminNotificationPage = (onValue: (page: CollectionPage<Notification>) => void, onError?: (failure: Error) => void, cursor: number | null = null) => {
  let active = true;
  const stops: (() => void)[] = [];
  const stop = () => { active = false; stops.splice(0).forEach(unsubscribe => unsubscribe()); };
  const fail = (failure: unknown) => { if (active) { stop(); onError?.(notificationError(failure)); } };
  const timeout = setTimeout(() => fail(new Error(`Could Not Confirm Live Notifications — Check Your Connection And Refresh`)), 20_000);
  stops.push(() => clearTimeout(timeout));
  void requireAdmin().then(actor => {
    if (!active) return;
    const uid = actor.firebase_uid!;
    stops.push(subscribeAuthState(() => {
      if (getFirebaseAuth().currentUser?.uid !== uid) { fail(new Error(`Your Account Changed — Try Again`)); return; }
      void restoreSession().then(session => {
        if (active && !canManageNotifications(session?.user)) fail(new Error(`Your Admin Access Changed — Refresh This Page`));
      }).catch(fail);
    }));
    stops.push(onSnapshot(pageQuery(cursor), { includeMetadataChanges: true }, snapshot => {
      if (!active || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
      try {
        assertAccount(uid);
        const records = snapshot.docs.map(record => readAnnouncement(record.data(), record.id));
        clearTimeout(timeout);
        onValue(numberCollectionPage(records));
      } catch (failure) { fail(failure); }
    }, fail));
  }).catch(fail);
  return stop;
};
export const subscribePublishedNotificationRecords = (onValue: (records: Notification[]) => void, onError?: (failure: Error) => void) => {
  let active = true;
  const timeout = setTimeout(() => { if (active) onError?.(new Error(`Could Not Confirm Published Notifications — Check Your Connection`)); }, 20_000);
  const stop = onSnapshot(query(collection(getFirebaseDb(), `notifications`), where(`active`, `==`, true), orderBy(`number`, `desc`), limit(100)), { includeMetadataChanges: true }, snapshot => {
    if (!active || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
    try {
      const records = snapshot.docs.map(record => readAnnouncement(record.data(), record.id));
      clearTimeout(timeout);
      onValue(records);
    } catch (failure) { onError?.(notificationError(failure)); }
  }, failure => { clearTimeout(timeout); if (active) onError?.(notificationError(failure)); });
  return () => { active = false; clearTimeout(timeout); stop(); };
};
const assertSlugAvailable = async (slug: string, id?: string) => {
  const queries = [query(collection(getFirebaseDb(), `notifications`), where(`slug`, `==`, slug), limit(2))];
  if ([`development`, `support`].includes(slug)) queries.push(query(collection(getFirebaseDb(), `notifications`), where(`providerId`, `==`, slug), limit(2)));
  if (/^notification-[1-9][0-9]*$/.test(slug)) queries.push(query(collection(getFirebaseDb(), `notifications`), where(`number`, `==`, Number(slug.slice(13))), limit(2)));
  const results = await Promise.all(queries.map(reference => getDocsFromServer(reference)));
  if (results.some(result => result.docs.some(record => record.id !== id))) throw new Error(`That Slug Is Already In Use`);
};
const counterNumber = (data: Record<string, unknown> | undefined) => {
  const number = data?.number ?? 0;
  if (!Number.isSafeInteger(number) || Number(number) < 0) throw new Error(`Saved Notification Counter Needs Attention`);
  return Number(number);
};
export const saveCloudAnnouncement = async (input: AdminNotificationInput, id?: string): Promise<Notification> => {
  const values = normalizeAnnouncement(input);
  const actor = await requireAdmin();
  if (id) announcementId(id);
  await assertSlugAvailable(values.slug, id);
  assertAccount(actor.firebase_uid!);
  const database = getFirebaseDb();
  const savedId = await runTransaction(database, async transaction => {
    await requireTransactionAdmin(transaction, actor.id, actor.firebase_uid!);
    const existingRef = id ? doc(database, `notifications`, id) : null;
    const existing = existingRef ? await transaction.get(existingRef) : null;
    if (existingRef && !existing?.exists()) throw new Error(`Saved Notification Was Not Found`);
    const original = existing ? readAnnouncement(existing.data(), existing.id) : null;
    const counterRef = doc(database, `counters`, `notifications`);
    const counter = !original ? await transaction.get(counterRef) : null;
    const number = original?.number ?? counterNumber(counter?.data()) + 1;
    const record = new Notification({ ...original, ...values, uid: ``, number, name: values.title, description: values.body, details: values.body, id: original?.id, link: values.link, suffix: values.suffix, updated: new Date().toISOString() });
    const slugRef = doc(database, `notificationSlugs`, values.slug);
    const reservation = await transaction.get(slugRef);
    if (reservation.exists() && reservation.data()?.id !== record.id) throw new Error(`That Slug Is Already In Use`);
    const oldSlugRef = original && original.slug !== values.slug ? doc(database, `notificationSlugs`, original.slug) : null;
    const oldReservation = oldSlugRef ? await transaction.get(oldSlugRef) : null;
    assertAccount(actor.firebase_uid!);
    transaction.set(existingRef ?? doc(database, `notifications`, record.id), { ...record.toRecord(), created: existing?.data()?.created ?? existing?.data()?.created_at ?? serverTimestamp(), updated: serverTimestamp() });
    if (!original) transaction.set(counterRef, { number, recordIds: [record.id] }, { merge: true });
    if (!reservation.exists()) transaction.set(slugRef, { id: record.id, slug: values.slug });
    if (oldSlugRef && oldReservation?.data()?.id === record.id) transaction.delete(oldSlugRef);
    return record.id;
  });
  assertAccount(actor.firebase_uid!);
  const saved = await getDocFromServer(doc(database, `notifications`, savedId));
  assertAccount(actor.firebase_uid!);
  return readAnnouncement(saved.data(), saved.id);
};
export const updateCloudAnnouncementStatus = async (id: string, status: AnnouncementStatus): Promise<Notification> => {
  announcementId(id);
  if (!Object.values(AnnouncementStatus).includes(status)) throw new Error(`Choose A Valid Notification Status`);
  const actor = await requireAdmin();
  const database = getFirebaseDb();
  await runTransaction(database, async transaction => {
    await requireTransactionAdmin(transaction, actor.id, actor.firebase_uid!);
    const reference = doc(database, `notifications`, id);
    const existing = await transaction.get(reference);
    const original = readAnnouncement(existing.data(), id);
    const slugRef = doc(database, `notificationSlugs`, original.slug);
    const reservation = await transaction.get(slugRef);
    if (reservation.exists() && reservation.data()?.id !== id) throw new Error(`That Slug Is Already In Use`);
    const record = new Notification({ ...original, status, updated: new Date().toISOString() });
    assertAccount(actor.firebase_uid!);
    transaction.set(reference, { ...record.toRecord(), created: existing.data()?.created ?? existing.data()?.created_at, updated: serverTimestamp() });
    if (!reservation.exists()) transaction.set(slugRef, { id, slug: record.slug });
  });
  assertAccount(actor.firebase_uid!);
  const saved = await getDocFromServer(doc(database, `notifications`, id));
  assertAccount(actor.firebase_uid!);
  return readAnnouncement(saved.data(), id);
};
export const deleteCloudAnnouncement = async (id: string): Promise<void> => {
  announcementId(id);
  const actor = await requireAdmin();
  const database = getFirebaseDb();
  await runTransaction(database, async transaction => {
    await requireTransactionAdmin(transaction, actor.id, actor.firebase_uid!);
    const reference = doc(database, `notifications`, id);
    const existing = await transaction.get(reference);
    const record = readAnnouncement(existing.data(), id);
    const slugRef = doc(database, `notificationSlugs`, record.slug);
    const reservation = await transaction.get(slugRef);
    assertAccount(actor.firebase_uid!);
    transaction.delete(reference);
    if (reservation.data()?.id === id) transaction.delete(slugRef);
  });
  assertAccount(actor.firebase_uid!);
};
export const importCloudInitialAnnouncements = async (originals: (number: number) => Notification[]): Promise<void> => {
  const actor = await requireAdmin();
  const database = getFirebaseDb();
  const savedCounter = await getDocFromServer(doc(database, `counters`, `notifications`));
  if (savedCounter.data()?.initialAnnouncementsVersion === 1) return;
  await Promise.all(originals(counterNumber(savedCounter.data())).map(record => assertSlugAvailable(record.slug)));
  assertAccount(actor.firebase_uid!);
  await runTransaction(database, async transaction => {
    await requireTransactionAdmin(transaction, actor.id, actor.firebase_uid!);
    const counterRef = doc(database, `counters`, `notifications`);
    const counter = await transaction.get(counterRef);
    if (counter.data()?.initialAnnouncementsVersion === 1) return;
    const records = originals(counterNumber(counter.data()));
    const reservations = await Promise.all(records.map(record => transaction.get(doc(database, `notificationSlugs`, record.slug))));
    if (reservations.some(reservation => reservation.exists())) throw new Error(`Initial Notices Already Have Saved Slugs — Review Existing Notifications`);
    assertAccount(actor.firebase_uid!);
    records.forEach(record => {
      transaction.set(doc(database, `notifications`, record.id), { ...record.toRecord(), created: serverTimestamp(), updated: serverTimestamp() });
      transaction.set(doc(database, `notificationSlugs`, record.slug), { id: record.id, slug: record.slug });
    });
    transaction.set(counterRef, { number: counterNumber(counter.data()) + records.length, recordIds: records.map(record => record.id), initialAnnouncementsVersion: 1 }, { merge: true });
  });
  assertAccount(actor.firebase_uid!);
};
