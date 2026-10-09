import { getFirebaseDb, getFirebaseAuth } from './client';
import { genID, getAppCollectionIDNumber } from '../common/ids';
import { doc, runTransaction, type Transaction, type DocumentData } from 'firebase/firestore';

interface StorageScope { key: string; userId: string }
interface SavedValue { revision: number; value: string | null; firebaseUid: string }
interface RecordChange { id: string; record?: DocumentData }
interface SplitSnapshot { name: string; field: string; collection: string; type: string }
const savedValues = new Map<string, SavedValue>();
export const clearFirestoreStorageCache = () => { savedValues.clear(); };
const RECORDS_PER_TRANSACTION = 400;
const splitSnapshots: Record<string, SplitSnapshot> = {
  [`domains-database:portfolio:v1`]: { name: `portfolio`, field: `domains`, collection: `domains`, type: `Domain` },
  [`domains-database:connections:v1`]: { name: `connections`, field: `accounts`, collection: `connections`, type: `Connection` },
  [`domains-database:auction-inventory:v1`]: { name: `auctionInventory`, field: `records`, collection: `auctionInventory`, type: `Auction` },
};
const isRecord = (value: unknown): value is DocumentData => Boolean(value) && typeof value === `object` && !Array.isArray(value);
export const getFirestoreStorageScope = (key: string): StorageScope | null => {
  const index = key.lastIndexOf(`:user:`);
  return index < 0 ? null : { key: key.slice(0, index), userId: key.slice(index + 6) };
};
const requireActor = () => {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error(`Sign In To Access Your Saved Data`);
  return user.uid;
};
const assertActor = (firebaseUid: string) => {
  if (getFirebaseAuth().currentUser?.uid !== firebaseUid) throw new Error(`Your Account Changed — Try Again`);
};
const revisionOf = (value: DocumentData | undefined) => {
  if (!value) return 0;
  if (!Number.isSafeInteger(value.revision) || value.revision < 1) throw new Error(`Saved Cloud Data Could Not Be Read`);
  return value.revision as number;
};
const snapshotRef = (scope: StorageScope, name: string) => doc(getFirebaseDb(), `users`, scope.userId, `snapshots`, name);
const keyRef = (scope: StorageScope) => doc(getFirebaseDb(), `users`, scope.userId, `storageKeys`, encodeURIComponent(scope.key));
const dataRef = (scope: StorageScope, id: string) => doc(getFirebaseDb(), `users`, scope.userId, `data`, id);
const recordRef = (scope: StorageScope, split: SplitSnapshot, id: string) => doc(getFirebaseDb(), `users`, scope.userId, split.collection, id);
const readSplit = async (transaction: Transaction, scope: StorageScope, split: SplitSnapshot) => {
  const metadata = (await transaction.get(snapshotRef(scope, split.name))).data();
  const revision = revisionOf(metadata);
  if (!metadata) return { revision, value: null };
  if (!isRecord(metadata.snapshot) || !Array.isArray(metadata.ids)
    || metadata.ids.some((id: unknown) => typeof id !== `string` || getAppCollectionIDNumber(id, split.type) < 1)
    || new Set(metadata.ids).size !== metadata.ids.length) throw new Error(`Saved Cloud Data Could Not Be Read`);
  const records = await Promise.all(metadata.ids.map(async (id: string) => {
    const record = (await transaction.get(recordRef(scope, split, id))).data();
    if (!record || record.id !== id || record.number !== getAppCollectionIDNumber(id, split.type)) throw new Error(`Saved Cloud Data Could Not Be Read`);
    return record;
  }));
  return { revision, value: JSON.stringify({ ...metadata.snapshot, [split.field]: records }) };
};
const readValue = async (transaction: Transaction, scope: StorageScope) => {
  const index = (await transaction.get(keyRef(scope))).data();
  if (!index) return { revision: 0, value: null };
  if (typeof index.id !== `string` || getAppCollectionIDNumber(index.id, `Data`) !== index.number) throw new Error(`Saved Cloud Data Could Not Be Read`);
  const record = (await transaction.get(dataRef(scope, index.id))).data();
  if (!record || record.id !== index.id || record.key !== scope.key || typeof record.value !== `string`) throw new Error(`Saved Cloud Data Could Not Be Read`);
  return { revision: revisionOf(record), value: record.value as string };
};
export const readFirestoreStorage = async (key: string): Promise<string | null> => {
  const scope = getFirestoreStorageScope(key);
  if (!scope) throw new Error(`Cloud Storage Requires An Account`);
  const firebaseUid = requireActor();
  const split = splitSnapshots[scope.key];
  savedValues.delete(key);
  const result = await runTransaction(getFirebaseDb(), async transaction => {
    assertActor(firebaseUid);
    return split ? readSplit(transaction, scope, split) : readValue(transaction, scope);
  });
  assertActor(firebaseUid);
  savedValues.set(key, { ...result, firebaseUid });
  return result.value;
};
const assertRevision = (expected: SavedValue | undefined, revision: number, firebaseUid: string) => {
  if (expected?.firebaseUid !== firebaseUid || expected?.revision !== revision) throw new Error(`Saved Data Changed On Another Device — Refresh And Try Again`);
};
const parseRecord = (value: string | null) => {
  if (value === null) return null;
  try { const parsed: unknown = JSON.parse(value); return isRecord(parsed) ? parsed : null; }
  catch { return null; }
};
const canonicalValue = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalValue)
  : isRecord(value) ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalValue(value[key])])) : value;
const assertCounter = (previous: DocumentData | null, next: DocumentData | null) => {
  for (const field of [`nextNumber`, `collectionNumber`, `nextPostNumber`, `nextFollowNumber`]) {
    if (typeof previous?.[field] === `number` && (typeof next?.[field] !== `number` || next[field] < previous[field])) throw new Error(`Saved Record Number Changed — Refresh And Try Again`);
  }
};
const splitWritePlan = (scope: StorageScope, split: SplitSnapshot, value: string, previous: SavedValue) => {
  const parsed = parseRecord(value);
  const before = parseRecord(previous.value);
  if (!parsed || !Array.isArray(parsed[split.field]) || !Number.isSafeInteger(parsed.nextNumber) || parsed.nextNumber < 1) throw new Error(`Cloud Snapshot Could Not Be Saved`);
  assertCounter(before, parsed);
  const { [split.field]: records, ...snapshot } = parsed;
  const oldRecords = new Map<string, DocumentData>((before?.[split.field] ?? []).map((record: DocumentData) => [record.id, record]));
  const ids = new Set<string>();
  const numbers = new Set<number>();
  const writes: RecordChange[] = [];
  for (const record of records) {
    if (!isRecord(record) || getAppCollectionIDNumber(record.id, split.type) !== record.number
      || !Number.isSafeInteger(record.number) || record.number < 1 || record.number >= parsed.nextNumber
      || ids.has(record.id) || numbers.has(record.number)
      || (split.type === `Domain` && record.uid !== scope.userId)) throw new Error(`Cloud Record ID And Number Must Match`);
    ids.add(record.id); numbers.add(record.number);
    if (JSON.stringify(canonicalValue(record)) !== JSON.stringify(canonicalValue(oldRecords.get(record.id)))) writes.push({ id: record.id, record });
  }
  const removed: RecordChange[] = [...oldRecords.keys()].filter(id => !ids.has(id)).map(id => ({ id }));
  return { ids: [...ids], snapshot, oldRecords, changes: [...removed, ...writes] };
};
const writeSplitChunk = async (transaction: Transaction, scope: StorageScope, split: SplitSnapshot, snapshot: DocumentData, records: Map<string, DocumentData>, changes: RecordChange[], previous: SavedValue, firebaseUid: string) => {
  const current = (await transaction.get(snapshotRef(scope, split.name))).data();
  const revision = revisionOf(current);
  assertRevision(previous, revision, firebaseUid);
  assertActor(firebaseUid);
  for (const change of changes) {
    if (change.record) transaction.set(recordRef(scope, split, change.id), change.record);
    else transaction.delete(recordRef(scope, split, change.id));
  }
  transaction.set(snapshotRef(scope, split.name), { snapshot, ids: [...records.keys()], revision: revision + 1 });
  return revision + 1;
};
const writeSplitSnapshot = async (key: string, scope: StorageScope, split: SplitSnapshot, value: string, previous: SavedValue, firebaseUid: string) => {
  const { ids, snapshot, oldRecords, changes } = splitWritePlan(scope, split, value, previous);
  let committedChunks = 0;
  let baseline = previous;
  let currentRecords = oldRecords;
  try {
    for (let offset = 0; offset < Math.max(changes.length, 1); offset += RECORDS_PER_TRANSACTION) {
      assertActor(firebaseUid);
      const chunk = changes.slice(offset, offset + RECORDS_PER_TRANSACTION);
      const changedRecords = new Map(currentRecords);
      for (const change of chunk) {
        if (change.record) changedRecords.set(change.id, change.record);
        else changedRecords.delete(change.id);
      }
      const records = new Map<string, DocumentData>();
      for (const id of ids) {
        const record = changedRecords.get(id);
        if (record) records.set(id, record);
      }
      for (const [id, record] of changedRecords) if (!records.has(id)) records.set(id, record);
      const storedValue = JSON.stringify({ ...snapshot, [split.field]: [...records.values()] });
      const revision = await runTransaction(getFirebaseDb(), transaction => {
        assertActor(firebaseUid);
        return writeSplitChunk(transaction, scope, split, snapshot, records, chunk, baseline, firebaseUid);
      });
      committedChunks += 1;
      baseline = { revision, firebaseUid, value: storedValue };
      currentRecords = records;
      assertActor(firebaseUid);
      savedValues.set(key, baseline);
    }
  } catch (error) {
    if (!committedChunks) throw error;
    const reason = error instanceof Error ? error.message : `Cloud Storage Is Unavailable`;
    throw new Error(`Some Record(s) Saved — Refresh And Retry: ${reason}`);
  }
};
const writeValue = async (transaction: Transaction, scope: StorageScope, value: string, previous: SavedValue, firebaseUid: string) => {
  const index = (await transaction.get(keyRef(scope))).data();
  const reference = index ? dataRef(scope, index.id) : null;
  const current = reference ? (await transaction.get(reference)).data() : undefined;
  const revision = revisionOf(current);
  assertRevision(previous, revision, firebaseUid);
  assertCounter(parseRecord(previous.value), parseRecord(value));
  if (index) {
    if (!reference || !current || current.id !== index.id || current.key !== scope.key) throw new Error(`Saved Cloud Data Could Not Be Read`);
    assertActor(firebaseUid);
    transaction.set(reference, { ...current, value, revision: revision + 1, updated: new Date().toISOString() });
  } else {
    const counterReference = snapshotRef(scope, `storage`);
    const counter = (await transaction.get(counterReference)).data();
    const number = counter?.nextNumber ?? 1;
    if (!Number.isSafeInteger(number) || number < 1) throw new Error(`Saved Cloud Counter Could Not Be Read`);
    const identity = genID(`Data`, number, scope.key);
    assertActor(firebaseUid);
    transaction.set(dataRef(scope, identity.id), {
      value, number, id: identity.id, key: scope.key, uid: scope.userId,
      revision: 1, created: identity.date, updated: identity.date,
    });
    transaction.set(keyRef(scope), { number, id: identity.id, key: scope.key });
    transaction.set(counterReference, { nextNumber: number + 1 });
  }
  return revision + 1;
};
export const writeFirestoreStorage = async (key: string, value: string, reset = false): Promise<void> => {
  const scope = getFirestoreStorageScope(key);
  if (!scope) throw new Error(`Cloud Storage Requires An Account`);
  const firebaseUid = requireActor();
  if (reset) await readFirestoreStorage(key);
  const previous = savedValues.get(key);
  if (!previous) throw new Error(`Load Your Saved Data Before Saving — Refresh And Try Again`);
  if (previous.firebaseUid !== firebaseUid) throw new Error(`Your Account Changed — Try Again`);
  const split = splitSnapshots[scope.key];
  if (split) return writeSplitSnapshot(key, scope, split, value, previous, firebaseUid);
  const revision = await runTransaction(getFirebaseDb(), async transaction => {
    assertActor(firebaseUid);
    return writeValue(transaction, scope, value, previous, firebaseUid);
  });
  assertActor(firebaseUid);
  savedValues.set(key, { value, revision, firebaseUid });
};
export const removeFirestoreStorage = async (key: string): Promise<void> => {
  const scope = getFirestoreStorageScope(key);
  if (!scope) throw new Error(`Cloud Storage Requires An Account`);
  if (splitSnapshots[scope.key]) throw new Error(`Clear Saved Record(s) Through The Account Service`);
  const firebaseUid = requireActor();
  if (!savedValues.has(key)) await readFirestoreStorage(key);
  const previous = savedValues.get(key);
  await runTransaction(getFirebaseDb(), async transaction => {
    const index = (await transaction.get(keyRef(scope))).data();
    const reference = index ? dataRef(scope, index.id) : null;
    const current = reference ? (await transaction.get(reference)).data() : undefined;
    assertRevision(previous, revisionOf(current), firebaseUid);
    assertActor(firebaseUid);
    if (reference) transaction.delete(reference);
    transaction.delete(keyRef(scope));
  });
  assertActor(firebaseUid);
  savedValues.set(key, { value: null, revision: 0, firebaseUid });
};
