import { Platform } from 'react-native';
import { useLocalStorage } from '../config';
import { FirebaseError } from 'firebase/app';
import { Roles, Types } from '../../types/types';
import { firebaseEnabled } from '../firebase/config';
import { getAppCollectionIDNumber } from '../common/ids';
import { assertOwnerSession } from '../authentication/firebase';
import { createFirestoreCollection } from '../firebase/collection';
import { restoreSession, subscribeAuthState } from '../authentication/service';
import { FormSubmission } from '../models/forms/FormSubmission';
import { getFirebaseAuth, getFirebaseDb } from '../firebase/client';
import type { ContactSubmissionInput, SubmissionStatus } from './types';
import { readStorage, writeStorage, subscribeStorage, createOperationQueue } from '../common/storage';
import { doc, collection, runTransaction, serverTimestamp, Timestamp, type DocumentData } from 'firebase/firestore';

interface SubmissionSnapshot {
  version: 1;
  nextNumber: number;
  records: FormSubmission[];
}

const cloudEnabled = firebaseEnabled && !useLocalStorage;
const SUBMISSIONS_STORAGE_KEY = `domains-database:form-submissions:v1`;
const serialize = createOperationQueue(SUBMISSIONS_STORAGE_KEY);
const statuses: SubmissionStatus[] = [`new`, `read`, `archived`];
const fields = [`id`, `uid`, `form`, `name`, `type`, `email`, `number`, `status`, `subject`, `message`, `created`, `updated`];
const requireText = (value: unknown, label: string, limit: number) => {
  if (typeof value !== `string` || !value.trim() || value.trim().length > limit) throw new Error(`Enter ${label} Of 1 To ${limit} Characters`);
  return value.trim();
};
const normalizeInput = (input: ContactSubmissionInput) => {
  if (input?.website !== undefined && (typeof input.website !== `string` || input.website.trim())) throw new Error(`Submission Could Not Be Saved`);
  const name = requireText(input?.name, `A Name`, 100);
  const email = requireText(input?.email, `An Email`, 254).toLowerCase();
  const subject = requireText(input?.subject, `A Subject`, 200);
  const message = requireText(input?.message, `A Message`, 5000);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`Enter A Valid Email Address`);
  return { name, email, subject, message };
};
const readTimestamp = (value: unknown) => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value !== `string` || !Number.isFinite(new Date(value).getTime())) throw new Error(`Saved Submission Date Could Not Be Read`);
  return new Date(value).toISOString();
};
const readRecord = (record: DocumentData, expectedId?: string): FormSubmission => {
  if (!record || fields.some(field => !(field in record)) || Object.keys(record).some(field => !fields.includes(field))
    || record.type !== Types.FormSubmission || record.form !== `contact` || typeof record.uid !== `string`
    || (expectedId && record.id !== expectedId) || !Number.isSafeInteger(record.number) || record.number < 1
    || getAppCollectionIDNumber(record.id, Types.FormSubmission) !== record.number || !record.id?.startsWith?.(`FormSubmission_${record.number}_Contact_`)
    || !statuses.includes(record.status)) throw new Error(`Saved Submission Could Not Be Read`);
  const normalized = normalizeInput(record as ContactSubmissionInput);
  return new FormSubmission({ ...record, ...normalized, created: readTimestamp(record.created), updated: readTimestamp(record.updated) });
};
const requireOwner = async () => {
  const session = await restoreSession();
  if (!session?.user?.active || session.user.role !== Roles.Owner) throw new Error(`Owner Access Is Required`);
  if (!cloudEnabled) return session.user.id;
  const firebaseUid = getFirebaseAuth().currentUser?.uid;
  if (!firebaseUid || session.user.firebase_uid !== firebaseUid) throw new Error(`Sign In To View Submission(s)`);
  return firebaseUid;
};
const assertActor = (firebaseUid: string) => {
  if ((getFirebaseAuth().currentUser?.uid ?? ``) !== firebaseUid) throw new Error(`Your Account Changed — Try Again`);
};
const restoreLocal = (saved: string | null): SubmissionSnapshot => {
  if (!saved) return { version: 1, records: [], nextNumber: 1 };
  let parsed: SubmissionSnapshot;
  try { parsed = JSON.parse(saved); } catch { throw new Error(`Saved Submission(s) Could Not Be Read`); }
  if (parsed?.version !== 1 || !Array.isArray(parsed.records) || !Number.isSafeInteger(parsed.nextNumber) || parsed.nextNumber < 1) throw new Error(`Saved Submission(s) Could Not Be Read`);
  const records = parsed.records.map(record => readRecord(record));
  if (new Set(records.map(record => record.id)).size !== records.length || new Set(records.map(record => record.number)).size !== records.length
    || records.some(record => record.number >= parsed.nextNumber)) throw new Error(`Saved Submission(s) Could Not Be Read`);
  return { ...parsed, records };
};
const readLocal = async (): Promise<SubmissionSnapshot> => {
  if (!useLocalStorage || (Platform.OS === `web` && typeof window === `undefined`)) throw new Error(`Connect Firebase To Save Submission(s)`);
  return restoreLocal(await readStorage(SUBMISSIONS_STORAGE_KEY));
};
const saveLocal = (snapshot: SubmissionSnapshot) => writeStorage(SUBMISSIONS_STORAGE_KEY, JSON.stringify({
  ...snapshot, records: snapshot.records.map(record => record.toRecord()),
}));
const submissionError = (failure: unknown) => {
  if (!(failure instanceof FirebaseError)) return failure instanceof Error ? failure : new Error(`Submission Request Could Not Be Completed`);
  if (failure.code === `permission-denied`) return new Error(`Submission Request Was Not Allowed`);
  if (failure.code === `unavailable`) return new Error(`Firebase Is Unavailable — Try Again Later`);
  if (failure.code === `resource-exhausted`) return new Error(`Firestore Quota Exceeded — Try Again Later`);
  return new Error(`Submission Request Could Not Be Completed — Try Again`);
};
const runOperation = async <T,>(operation: () => Promise<T>): Promise<T> => {
  try { return await operation(); } catch (failure) { throw submissionError(failure); }
};

export const submitContact = (input: ContactSubmissionInput): Promise<FormSubmission> => runOperation(async () => {
  const normalized = normalizeInput(input);
  if (!cloudEnabled) return serialize(async () => {
    const snapshot = await readLocal();
    const record = new FormSubmission({ ...normalized, number: snapshot.nextNumber });
    if (!Number.isSafeInteger(record.number + 1)) throw new Error(`Submission Number Limit Reached`);
    snapshot.nextNumber += 1;
    snapshot.records.push(record);
    await saveLocal(snapshot);
    return record;
  });
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const firebaseUid = auth.currentUser?.uid ?? ``;
  const database = getFirebaseDb();
  const counterRef = doc(database, `counters`, `formSubmissions`);
  return runTransaction(database, async transaction => {
    assertActor(firebaseUid);
    const counterSnapshot = await transaction.get(counterRef);
    const counter = counterSnapshot.data();
    const previous = counterSnapshot.exists() ? counter?.number : 0;
    if (counterSnapshot.exists() && (!counter || Object.keys(counter).length !== 2 || !(`number` in counter) || !(`lastSubmissionId` in counter)
      || typeof counter.lastSubmissionId !== `string` || getAppCollectionIDNumber(counter.lastSubmissionId, Types.FormSubmission) !== previous
      || !counter.lastSubmissionId.startsWith(`FormSubmission_${previous}_Contact_`) || previous < 1)) throw new Error(`Saved Submission Counter Could Not Be Read`);
    if (!Number.isSafeInteger(previous) || previous < 0 || !Number.isSafeInteger(previous + 1)) throw new Error(`Saved Submission Counter Could Not Be Read`);
    const record = new FormSubmission({ ...normalized, uid: firebaseUid, number: previous + 1 });
    assertActor(firebaseUid);
    transaction.set(doc(database, `formSubmissions`, record.id), { ...record.toRecord(), created: serverTimestamp(), updated: serverTimestamp() });
    transaction.set(counterRef, { number: record.number, lastSubmissionId: record.id });
    return record;
  });
});

const submissionsCollection = createFirestoreCollection(
  () => collection(getFirebaseDb(), `formSubmissions`),
  snapshot => snapshot.docs.map(record => readRecord(record.data({ serverTimestamps: `estimate` }), record.id))
    .sort((first, second) => second.number - first.number),
  requireOwner,
  assertOwnerSession,
  subscribeAuthState,
  submissionError,
);
export const getSubmissions = (): Promise<FormSubmission[]> => runOperation(async () => {
  await requireOwner();
  if (!cloudEnabled) return serialize(async () => (await readLocal()).records.sort((first, second) => second.number - first.number));
  return submissionsCollection.get();
});
export const subscribeSubmissions = (onValue: (submissions: FormSubmission[]) => void, onError?: (error: Error) => void) => {
  if (cloudEnabled) return submissionsCollection.subscribe(onValue, onError);
  let active = true;
  let revision = 0;
  const unsubscribe = subscribeStorage(SUBMISSIONS_STORAGE_KEY, saved => {
    const request = ++revision;
    void requireOwner().then(() => {
      if (active && revision === request) onValue(restoreLocal(saved).records.sort((first, second) => second.number - first.number));
    }).catch(failure => { if (active && revision === request) onError?.(submissionError(failure)); });
  }, onError);
  return () => { active = false; revision++; unsubscribe(); };
};

export const updateSubmissionStatus = (id: string, status: SubmissionStatus): Promise<FormSubmission> => runOperation(async () => {
  if (!statuses.includes(status)) throw new Error(`Choose A Valid Submission Status`);
  if (getAppCollectionIDNumber(id, Types.FormSubmission) < 1) throw new Error(`Choose A Valid Submission`);
  const actor = await requireOwner();
  if (!cloudEnabled) return serialize(async () => {
    const snapshot = await readLocal();
    const original = snapshot.records.find(record => record.id === id);
    if (!original) throw new Error(`Submission Could Not Be Found`);
    if (original.status === status) return original;
    const record = new FormSubmission({ ...original, status, updated: new Date().toISOString() });
    snapshot.records = snapshot.records.map(current => current.id === id ? record : current);
    await saveLocal(snapshot);
    return record;
  });
  const reference = doc(getFirebaseDb(), `formSubmissions`, id);
  return runTransaction(getFirebaseDb(), async transaction => {
    assertActor(actor);
    const saved = await transaction.get(reference);
    if (!saved.exists()) throw new Error(`Submission Could Not Be Found`);
    const original = readRecord(saved.data(), id);
    assertActor(actor);
    if (original.status === status) return original;
    const record = new FormSubmission({ ...original, status, updated: new Date().toISOString() });
    transaction.update(reference, { status, updated: serverTimestamp() });
    return record;
  });
});
