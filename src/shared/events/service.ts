import { useLocalStorage } from '../config';
import { firebaseEnabled } from '../firebase/config';
import { CalendarEvent } from '../models/events/Event';
import { canManageEvents } from '../admin/permissions';
import type { EventInput, EventRange, EventWindow } from './types';
import { restoreSession, AUTH_SESSION_KEY, AUTH_ACCOUNTS_KEY } from '../authentication/service';
import { eventId, readEvent, normalizeEvent, normalizeEventRange, selectEventWindow } from './values';
import { readStorage, writeStorage, subscribeStorage, createOperationQueue } from '../common/storage';
import { eventError, subscribeCloudEvents, createCloudEvent, updateCloudEvent, deleteCloudEvent } from './firebase';

interface EventSnapshot { version: 1; nextNumber: number; records: CalendarEvent[] }
const storageKey = `domains-database:events:v1`;
const serialize = createOperationQueue(storageKey);
const cloudEnabled = firebaseEnabled && !useLocalStorage;
export const eventStorageSource = cloudEnabled ? `firestore` : useLocalStorage ? `local` : `unavailable`;
const requireLocalManager = async () => {
  if (!useLocalStorage) throw new Error(`Connect Firebase To Manage Events`);
  const user = (await restoreSession())?.user;
  if (!canManageEvents(user)) throw new Error(`Admin Access Is Required`);
  return user!;
};
const readLocalSnapshot = (saved: string | null): EventSnapshot => {
  if (saved === null) return { version: 1, records: [], nextNumber: 1 };
  let value: Record<string, unknown>;
  try { value = JSON.parse(saved); } catch { throw new Error(`Saved Events Could Not Be Read — Nothing Was Changed`); }
  if (!value || value.version !== 1 || Object.keys(value).some(key => ![`version`, `records`, `nextNumber`].includes(key))
    || !Array.isArray(value.records) || !Number.isSafeInteger(value.nextNumber) || Number(value.nextNumber) < 1) throw new Error(`Saved Events Could Not Be Read — Nothing Was Changed`);
  const records = value.records.map(data => readEvent(data, data?.id));
  if (new Set(records.map(record => record.id)).size !== records.length || new Set(records.map(record => record.number)).size !== records.length
    || records.some(record => record.number >= Number(value.nextNumber))) throw new Error(`Saved Event Identity Needs Attention — Nothing Was Changed`);
  return { version: 1, records, nextNumber: Number(value.nextNumber) };
};
const readLocal = async () => readLocalSnapshot(await readStorage(storageKey));
const assertLocalManager = async (id: string) => {
  if ((await requireLocalManager()).id !== id) throw new Error(`Your Account Changed — Try Again`);
};
const saveLocal = async (snapshot: EventSnapshot, actorId: string) => {
  await assertLocalManager(actorId);
  await writeStorage(storageKey, JSON.stringify({ ...snapshot, records: snapshot.records.map(record => record.toRecord()) }));
  await assertLocalManager(actorId);
};
const runOperation = async <T,>(operation: () => Promise<T>): Promise<T> => {
  try { return await operation(); } catch (failure) { throw eventError(failure); }
};
export const subscribeEvents = (onValue: (window: EventWindow) => void, onError: ((failure: Error) => void) | undefined, inputRange: EventRange) => {
  let range: EventRange;
  try { range = normalizeEventRange(inputRange); }
  catch (failure) { onError?.(eventError(failure)); return () => undefined; }
  if (cloudEnabled) return subscribeCloudEvents(onValue, onError, range);
  let active = true;
  let revision = 0;
  const stops: (() => void)[] = [];
  const stop = () => { active = false; revision++; stops.splice(0).forEach(unsubscribe => unsubscribe()); };
  const fail = (failure: unknown) => { if (active) { stop(); onError?.(eventError(failure)); } };
  void requireLocalManager().then(actor => {
    if (!active) return;
    const refresh = () => {
      const request = ++revision;
      void assertLocalManager(actor.id).then(readLocal).then(async snapshot => {
        await assertLocalManager(actor.id);
        if (active && request === revision) onValue(selectEventWindow(snapshot.records, range));
      }).catch(fail);
    };
    for (const key of [storageKey, AUTH_SESSION_KEY, AUTH_ACCOUNTS_KEY]) {
      stops.push(subscribeStorage(key, refresh, fail));
    }
  }).catch(fail);
  return stop;
};
export const createEvent = (input: EventInput): Promise<CalendarEvent> => runOperation(async () => {
  const values = normalizeEvent(input);
  if (cloudEnabled) return createCloudEvent(values);
  const actor = await requireLocalManager();
  return serialize(async () => {
    await assertLocalManager(actor.id);
    const snapshot = await readLocal();
    if (!Number.isSafeInteger(snapshot.nextNumber + 1)) throw new Error(`Event Number Limit Reached`);
    const record = new CalendarEvent({ ...values, number: snapshot.nextNumber, creatorId: actor.id });
    snapshot.nextNumber++;
    snapshot.records.push(record);
    await saveLocal(snapshot, actor.id);
    return record;
  });
});
export const updateEvent = (id: string, input: EventInput): Promise<CalendarEvent> => runOperation(async () => {
  eventId(id);
  const values = normalizeEvent(input);
  if (cloudEnabled) return updateCloudEvent(id, values);
  const actor = await requireLocalManager();
  return serialize(async () => {
    await assertLocalManager(actor.id);
    const snapshot = await readLocal();
    const original = snapshot.records.find(record => record.id === id);
    if (!original) throw new Error(`Saved Event Was Not Found`);
    const record = new CalendarEvent({ ...original, ...values, updated: new Date().toISOString() });
    snapshot.records = snapshot.records.map(current => current.id === id ? record : current);
    await saveLocal(snapshot, actor.id);
    return record;
  });
});
export const deleteEvent = (id: string): Promise<void> => runOperation(async () => {
  eventId(id);
  if (cloudEnabled) return deleteCloudEvent(id);
  const actor = await requireLocalManager();
  return serialize(async () => {
    await assertLocalManager(actor.id);
    const snapshot = await readLocal();
    if (!snapshot.records.some(record => record.id === id)) throw new Error(`Saved Event Was Not Found`);
    snapshot.records = snapshot.records.filter(record => record.id !== id);
    await saveLocal(snapshot, actor.id);
  });
});

export type { EventInput, EventRange, EventWindow } from './types';
