import { utf8ToBytes } from '@noble/hashes/utils.js';
import { getFirebaseDb, getFirebaseAuth } from './client';
import { genID, getAppCollectionIDNumber } from '../common/ids';
import { doc, runTransaction, type Transaction, type DocumentData } from 'firebase/firestore';
import { getRecordTimestamps, packRecordTimestamps, withoutRecordTimestamps, type RecordTimestamps } from './recordTimestamps';
import { splitSnapshots, readCloudSnapshot, clearCloudSnapshots, publishCloudSnapshot, subscribeCloudSnapshot, storageWriteBaselines, storageSubscribedBaselines, type SavedValue, type StorageScope, type SplitSnapshot } from './snapshots';

interface RecordChange { id: string; record?: DocumentData }
const savedValues = storageWriteBaselines;
export const clearFirestoreStorageCache = clearCloudSnapshots;
const RECORDS_PER_TRANSACTION = 400;
const MAX_CLOUD_DOCUMENT_BYTES = 750_000;
const MAX_TRANSACTION_RECORD_BYTES = 3_000_000;
const MAX_TIMESTAMP_SNAPSHOT_BYTES = 200_000;
const assertDocumentSize = (record: DocumentData) => {
  if (utf8ToBytes(JSON.stringify(record)).byteLength > MAX_CLOUD_DOCUMENT_BYTES) {
    throw new Error(`Saved Data Is Too Large For One Cloud Document — Export And Reduce It Before Saving`);
  }
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
export const readFirestoreStorage = async (key: string): Promise<string | null> => {
  const scope = getFirestoreStorageScope(key);
  if (!scope) throw new Error(`Cloud Storage Requires An Account`);
  const firebaseUid = requireActor();
  const result = await readCloudSnapshot(scope);
  assertActor(firebaseUid);
  savedValues.set(key, { ...result, firebaseUid });
  return result.value;
};
export const subscribeFirestoreStorage = (key: string, next: (value: string | null) => boolean | void, error?: (error: Error) => void) => {
  const scope = getFirestoreStorageScope(key);
  if (!scope) throw new Error(`Cloud Storage Requires An Account`);
  const firebaseUid = requireActor();
  return subscribeCloudSnapshot(scope, value => {
    assertActor(firebaseUid);
    return next(value);
  }, error);
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
const sameRecord = (left: unknown, right: unknown) => JSON.stringify(canonicalValue(left)) === JSON.stringify(canonicalValue(right));
const sameValue = (left: string | null, right: string | null) => {
  if (left === right) return true;
  if (left === null || right === null) return false;
  try { return sameRecord(JSON.parse(left), JSON.parse(right)); }
  catch { return false; }
};
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
  const timestampRecords = new Map<string, DocumentData>();
  const recordTimestamps: Record<string, RecordTimestamps> = {};
  for (const record of records) {
    if (!isRecord(record) || getAppCollectionIDNumber(record.id, split.type) !== record.number
      || !Number.isSafeInteger(record.number) || record.number < 1 || record.number >= parsed.nextNumber
      || ids.has(record.id) || numbers.has(record.number)
      || (split.type === `Domain` && record.uid !== scope.userId)) throw new Error(`Cloud Record ID And Number Must Match`);
    ids.add(record.id); numbers.add(record.number);
    const original = oldRecords.get(record.id);
    if (sameRecord(record, original)) {
      if (previous.recordTimestamps?.[record.id]) recordTimestamps[record.id] = previous.recordTimestamps[record.id];
      continue;
    }
    const times = split.type === `Domain` && original && getRecordTimestamps(original)
      ? getRecordTimestamps(record, previous.recordTimestamps?.[record.id]?.baseUpdated ?? original.updated) : undefined;
    if (times && original && sameRecord(withoutRecordTimestamps(record), withoutRecordTimestamps(original))) {
      timestampRecords.set(record.id, record);
      recordTimestamps[record.id] = times;
    } else { assertDocumentSize(record); writes.push({ id: record.id, record }); }
  }
  const removed: RecordChange[] = [...oldRecords.keys()].filter(id => !ids.has(id)).map(id => ({ id }));
  // Materialize timestamps when the shared metadata would grow too large for Firestore.
  if (utf8ToBytes(JSON.stringify({ snapshot, ids: [...ids], recordTimestamps: packRecordTimestamps(recordTimestamps) })).byteLength > MAX_TIMESTAMP_SNAPSHOT_BYTES) {
    for (const record of records) if (recordTimestamps[record.id]) { assertDocumentSize(record); writes.push({ id: record.id, record }); }
    timestampRecords.clear();
    for (const id of Object.keys(recordTimestamps)) delete recordTimestamps[id];
  }
  return { snapshot, oldRecords, recordTimestamps, timestampRecords, ids: [...ids], changes: [...removed, ...writes] };
};
const writeSplitChunk = async (transaction: Transaction, scope: StorageScope, split: SplitSnapshot, snapshot: DocumentData, records: Map<string, DocumentData>, recordTimestamps: Record<string, RecordTimestamps>, changes: RecordChange[], previous: SavedValue, firebaseUid: string) => {
  const current = (await transaction.get(snapshotRef(scope, split.name))).data();
  const revision = revisionOf(current);
  assertRevision(previous, revision, firebaseUid);
  assertActor(firebaseUid);
  for (const change of changes) {
    if (change.record) transaction.set(recordRef(scope, split, change.id), change.record);
    else transaction.delete(recordRef(scope, split, change.id));
  }
  const timestamps = packRecordTimestamps(recordTimestamps);
  transaction.set(snapshotRef(scope, split.name), { snapshot, ids: [...records.keys()], revision: revision + 1, ...(timestamps.length ? { recordTimestamps: timestamps } : {}) });
  return revision + 1;
};
const splitWriteChunks = (changes: RecordChange[], oldRecords: Map<string, DocumentData>) => {
  const chunks: RecordChange[][] = [];
  let chunk: RecordChange[] = [];
  let bytes = 0;
  for (const change of changes) {
    const recordBytes = utf8ToBytes(JSON.stringify(change.record ?? oldRecords.get(change.id) ?? {})).byteLength + 500;
    if (chunk.length && (chunk.length >= RECORDS_PER_TRANSACTION || bytes + recordBytes > MAX_TRANSACTION_RECORD_BYTES)) {
      chunks.push(chunk); chunk = []; bytes = 0;
    }
    chunk.push(change);
    bytes += recordBytes;
  }
  if (chunk.length || !chunks.length) chunks.push(chunk);
  return chunks;
};
const writeSplitSnapshot = async (key: string, scope: StorageScope, split: SplitSnapshot, value: string, previous: SavedValue, firebaseUid: string) => {
  const { ids, snapshot, oldRecords, changes, timestampRecords, recordTimestamps } = splitWritePlan(scope, split, value, previous);
  const chunks = splitWriteChunks(changes, oldRecords);
  const plannedIds = new Set(oldRecords.keys());
  const plannedTimestamps = { ...previous.recordTimestamps, ...recordTimestamps };
  for (const chunk of chunks) {
    for (const change of chunk) {
      if (change.record) plannedIds.add(change.id);
      else plannedIds.delete(change.id);
      delete plannedTimestamps[change.id];
    }
    assertDocumentSize({ snapshot, ids: [...plannedIds], revision: previous.revision + 1, recordTimestamps: packRecordTimestamps(plannedTimestamps) });
  }
  let committedChunks = 0;
  let baseline = previous;
  let currentRecords = new Map([...oldRecords, ...timestampRecords]);
  let currentTimestamps = { ...previous.recordTimestamps, ...recordTimestamps };
  try {
    for (const chunk of chunks) {
      assertActor(firebaseUid);
      const changedRecords = new Map(currentRecords);
      const timestamps = { ...currentTimestamps };
      for (const change of chunk) {
        if (change.record) changedRecords.set(change.id, change.record);
        else changedRecords.delete(change.id);
        delete timestamps[change.id];
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
        return writeSplitChunk(transaction, scope, split, snapshot, records, timestamps, chunk, baseline, firebaseUid);
      });
      committedChunks += 1;
      baseline = { revision, firebaseUid, recordTimestamps: timestamps, value: storedValue };
      currentRecords = records;
      currentTimestamps = timestamps;
      assertActor(firebaseUid);
      publishCloudSnapshot(scope, baseline);
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
    const record = { ...current, value, revision: revision + 1, updated: new Date().toISOString() };
    assertDocumentSize(record);
    transaction.set(reference, record);
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
  const previous = savedValues.get(key) ?? storageSubscribedBaselines.get(key);
  if (!previous) throw new Error(`Load Your Saved Data Before Saving — Refresh And Try Again`);
  if (previous.firebaseUid !== firebaseUid) throw new Error(`Your Account Changed — Try Again`);
  if (sameValue(previous.value, value)) {
    const latest = await readCloudSnapshot(scope);
    assertActor(firebaseUid);
    if (sameValue(latest.value, value)) { savedValues.set(key, latest); return; }
  }
  savedValues.delete(key);
  const split = splitSnapshots[scope.key];
  if (split) return writeSplitSnapshot(key, scope, split, value, previous, firebaseUid);
  assertDocumentSize({ value, key: scope.key });
  const revision = await runTransaction(getFirebaseDb(), async transaction => {
    assertActor(firebaseUid);
    return writeValue(transaction, scope, value, previous, firebaseUid);
  });
  assertActor(firebaseUid);
  publishCloudSnapshot(scope, { value, revision, firebaseUid });
};
export const removeFirestoreStorage = async (key: string): Promise<void> => {
  const scope = getFirestoreStorageScope(key);
  if (!scope) throw new Error(`Cloud Storage Requires An Account`);
  if (splitSnapshots[scope.key]) throw new Error(`Clear Saved Record(s) Through The Account Service`);
  const firebaseUid = requireActor();
  if (!savedValues.has(key)) await readFirestoreStorage(key);
  const previous = savedValues.get(key) ?? storageSubscribedBaselines.get(key);
  if (previous?.value === null) {
    const latest = await readCloudSnapshot(scope);
    assertActor(firebaseUid);
    if (latest.value === null) { savedValues.set(key, latest); return; }
  }
  savedValues.delete(key);
  await runTransaction(getFirebaseDb(), async transaction => {
    const index = (await transaction.get(keyRef(scope))).data();
    const reference = index ? dataRef(scope, index.id) : null;
    const current = reference ? (await transaction.get(reference)).data() : undefined;
    assertRevision(previous, revisionOf(current), firebaseUid);
    assertActor(firebaseUid);
    if (reference) transaction.delete(reference);
    if (index) transaction.delete(keyRef(scope));
  });
  assertActor(firebaseUid);
  publishCloudSnapshot(scope, { value: null, revision: 0, firebaseUid });
};
