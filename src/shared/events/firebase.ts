import { FirebaseError } from 'firebase/app';
import { CalendarEvent } from '../models/events/Event';
import { canManageEvents } from '../admin/permissions';
import { getFirebaseDb, getFirebaseAuth } from '../firebase/client';
import { eventId, readEvent, normalizeEvent, normalizeEventRange } from './values';
import { eventLimits, type EventInput, type EventRange, type EventWindow } from './types';
import { restoreSession, subscribeAuthState } from '../authentication/service';
import { doc, query, limit, where, orderBy, Timestamp, collection, onSnapshot, runTransaction, serverTimestamp, getDocFromServer, type Transaction } from 'firebase/firestore';

export const eventError = (failure: unknown): Error => {
  if (!(failure instanceof FirebaseError)) return failure instanceof Error ? failure : new Error(`Event Request Could Not Be Completed`);
  if (failure.code === `permission-denied`) return new Error(`Event Access Was Denied — Check Your Role And Firestore Rules`);
  if (failure.code === `failed-precondition` && /index/i.test(failure.message)) return new Error(`Events Need The Firestore Indexes In This Repository`);
  if (failure.code === `failed-precondition`) return new Error(`Event Database Requirements Were Not Met — Refresh And Try Again`);
  if (failure.code === `unavailable`) return new Error(`Events Could Not Connect To Firestore — Try Again`);
  return new Error(`Event Database Is Unavailable — Try Again`);
};
const assertAccount = (uid: string) => {
  if (getFirebaseAuth().currentUser?.uid !== uid) throw new Error(`Your Account Changed — Try Again`);
};
const requireManager = async () => {
  const user = (await restoreSession())?.user;
  if (!canManageEvents(user) || !user?.firebase_uid) throw new Error(`Admin Access Is Required`);
  const actor = { id: user.id, firebaseUid: user.firebase_uid };
  assertAccount(actor.firebaseUid);
  const saved = await getDocFromServer(doc(getFirebaseDb(), `users`, actor.id));
  assertAccount(actor.firebaseUid);
  const data = saved.data();
  if (data?.id !== actor.id || data?.firebase_uid !== actor.firebaseUid || data?.active !== true || !canManageEvents({ id: data.id, role: data.role, active: data.active })) throw new Error(`Admin Access Is Required`);
  return actor;
};
const assertManagerSession = async (actor: Awaited<ReturnType<typeof requireManager>>) => {
  assertAccount(actor.firebaseUid);
  const user = (await restoreSession())?.user;
  assertAccount(actor.firebaseUid);
  if (user?.id !== actor.id || user?.firebase_uid !== actor.firebaseUid || !canManageEvents(user)) throw new Error(`Your Event Access Changed — Refresh This Page`);
};
const requireTransactionManager = async (transaction: Transaction, actor: Awaited<ReturnType<typeof requireManager>>) => {
  assertAccount(actor.firebaseUid);
  const saved = await transaction.get(doc(getFirebaseDb(), `users`, actor.id));
  const data = saved.data();
  if (data?.id !== actor.id || data?.firebase_uid !== actor.firebaseUid || data?.active !== true || !canManageEvents({ id: data.id, role: data.role, active: data.active })) throw new Error(`Admin Access Is Required`);
  assertAccount(actor.firebaseUid);
};
const eventQuery = (range: EventRange) => query(
  collection(getFirebaseDb(), `events`),
  where(`endsAt`, `>`, Timestamp.fromDate(new Date(range.start))),
  where(`startsAt`, `<`, Timestamp.fromDate(new Date(range.end))),
  orderBy(`endsAt`, `asc`),
  orderBy(`startsAt`, `asc`),
  limit(eventLimits.records + 1),
);
export const subscribeCloudEvents = (onValue: (window: EventWindow) => void, onError: ((failure: Error) => void) | undefined, inputRange: EventRange) => {
  let active = true;
  let revision = 0;
  let latest: EventWindow | null = null;
  const stops: (() => void)[] = [];
  const stop = () => { active = false; latest = null; revision++; stops.splice(0).forEach(unsubscribe => unsubscribe()); };
  const fail = (failure: unknown) => { if (active) { stop(); onError?.(eventError(failure)); } };
  const timeout = setTimeout(() => fail(new Error(`Could Not Confirm Live Events — Check Your Connection And Refresh`)), 20_000);
  stops.push(() => clearTimeout(timeout));
  void requireManager().then(actor => {
    if (!active) return;
    const range = normalizeEventRange(inputRange);
    const publish = () => {
      const request = ++revision;
      void assertManagerSession(actor).then(() => {
        if (!active || request !== revision || !latest) return;
        clearTimeout(timeout);
        onValue(latest);
      }).catch(fail);
    };
    stops.push(subscribeAuthState(() => {
      if (getFirebaseAuth().currentUser?.uid !== actor.firebaseUid) { fail(new Error(`Your Account Changed — Try Again`)); return; }
      publish();
    }));
    stops.push(onSnapshot(eventQuery(range), { includeMetadataChanges: true }, snapshot => {
      if (!active || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
      try {
        const records = snapshot.docs.map(record => readEvent(record.data(), record.id));
        latest = { hasMore: records.length > eventLimits.records, records: records.slice(0, eventLimits.records) };
        publish();
      } catch (failure) { fail(failure); }
    }, fail));
  }).catch(fail);
  return stop;
};
const savedEvent = async (id: string, actor: Awaited<ReturnType<typeof requireManager>>) => {
  await assertManagerSession(actor);
  const saved = await getDocFromServer(doc(getFirebaseDb(), `events`, id));
  await assertManagerSession(actor);
  return readEvent(saved.data(), id);
};
const counterNumber = (data: Record<string, unknown> | undefined) => {
  if (!data) return 0;
  if (Object.keys(data).length !== 2 || !Number.isSafeInteger(data.number) || Number(data.number) < 1
    || typeof data.lastEventId !== `string` || Number(data.number) !== Number(data.lastEventId.split(`_`)?.[1])) throw new Error(`Saved Event Counter Needs Attention`);
  eventId(data.lastEventId);
  return Number(data.number);
};
const cloudDates = (record: CalendarEvent) => ({
  endsAt: Timestamp.fromDate(new Date(record.endsAt)),
  startsAt: Timestamp.fromDate(new Date(record.startsAt)),
});
export const createCloudEvent = async (input: EventInput): Promise<CalendarEvent> => {
  const values = normalizeEvent(input);
  const actor = await requireManager();
  const database = getFirebaseDb();
  const id = await runTransaction(database, async transaction => {
    await requireTransactionManager(transaction, actor);
    const counterRef = doc(database, `counters`, `events`);
    const counter = await transaction.get(counterRef);
    const number = counterNumber(counter.data()) + 1;
    if (!Number.isSafeInteger(number)) throw new Error(`Event Number Limit Reached`);
    const record = new CalendarEvent({ ...values, number, creatorId: actor.id });
    const reference = doc(database, `events`, record.id);
    const existing = await transaction.get(reference);
    if (existing.exists()) throw new Error(`Event Identity Already Exists — Try Again`);
    assertAccount(actor.firebaseUid);
    transaction.set(reference, { ...record.toRecord(), ...cloudDates(record), created: serverTimestamp(), updated: serverTimestamp() });
    transaction.set(counterRef, { number, lastEventId: record.id });
    return record.id;
  });
  return savedEvent(id, actor);
};
export const updateCloudEvent = async (id: string, input: EventInput): Promise<CalendarEvent> => {
  eventId(id);
  const values = normalizeEvent(input);
  const actor = await requireManager();
  const database = getFirebaseDb();
  await runTransaction(database, async transaction => {
    await requireTransactionManager(transaction, actor);
    const reference = doc(database, `events`, id);
    const saved = await transaction.get(reference);
    const original = readEvent(saved.data(), id);
    const record = new CalendarEvent({ ...original, ...values, updated: new Date().toISOString() });
    assertAccount(actor.firebaseUid);
    transaction.set(reference, { ...record.toRecord(), ...cloudDates(record), created: saved.data()?.created, updated: serverTimestamp() });
  });
  return savedEvent(id, actor);
};
export const deleteCloudEvent = async (id: string): Promise<void> => {
  eventId(id);
  const actor = await requireManager();
  const database = getFirebaseDb();
  await runTransaction(database, async transaction => {
    await requireTransactionManager(transaction, actor);
    const reference = doc(database, `events`, id);
    readEvent((await transaction.get(reference)).data(), id);
    assertAccount(actor.firebaseUid);
    transaction.delete(reference);
  });
  await assertManagerSession(actor);
};
