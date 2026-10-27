import { Platform } from 'react-native';
import { absoluteSiteUrl } from '../seo';
import { useLocalStorage } from '../config';
import { FirebaseError } from 'firebase/app';
import { firebaseEnabled } from '../firebase/config';
import { canManageRoles } from '../admin/permissions';
import { getAppCollectionIDNumber } from '../common/ids';
import { getFirebaseAuth, getFirebaseDb } from '../firebase/client';
import { restoreSession, subscribeAuthState } from '../authentication/service';
import { readSupportThread, readSupportMessage, readFeedbackEntry, readSupportReadState } from './validation';
import { doc, query, limit, where, orderBy, startAfter, collection, onSnapshot, getDocsFromServer, type Query, type QuerySnapshot, type DocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { feedbackLimits, type FeedbackKind, type FeedbackEntry, type FeedbackStatus, type ReviewInput, type BugReportInput, type SupportThread, type SupportMessage, type SupportReadState, type SupportContactInput } from './types';

export interface SupportMessagesPage { records: SupportMessage[]; hasMore: boolean; cursor: number | null }
type FeedbackActor = { id: string; firebaseUid: string; owner: boolean };
const feedbackError = (failure: unknown): Error => {
  if (failure instanceof FirebaseError) {
    if (failure.code === `permission-denied`) return new Error(`Feedback Access Was Denied — Refresh Your Session Or Check Firestore Rules`);
    if (failure.code === `failed-precondition`) return new Error(`Feedback Needs The Firestore Indexes In This Repository`);
    if (failure.code === `unavailable`) return new Error(`Feedback Could Not Connect — Try Again`);
    return new Error(`Feedback Could Not Be Loaded — Try Again`);
  }
  return failure instanceof Error ? failure : new Error(`Feedback Request Could Not Be Completed`);
};
const assertActor = (actor: FeedbackActor) => {
  if (getFirebaseAuth().currentUser?.uid !== actor.firebaseUid) throw new Error(`Your Account Changed — Try Again`);
};
const requireActor = async (owner = false): Promise<FeedbackActor> => {
  if (useLocalStorage || !firebaseEnabled) throw new Error(`Connect Firebase To Use Feedback And Support Chat`);
  const user = (await restoreSession())?.user;
  if (!user?.id || !user.active || !user.firebase_uid || (owner && !canManageRoles(user))) throw new Error(owner ? `Owner Access Is Required` : `Sign In To Use Feedback And Support Chat`);
  const actor = { id: user.id, firebaseUid: user.firebase_uid, owner: canManageRoles(user) };
  assertActor(actor);
  return actor;
};
const validateThreadId = (id: string) => {
  if (getAppCollectionIDNumber(id, `SupportThread`) < 1 || id.includes(`/`) || id.length > 250) throw new Error(`Choose A Valid Conversation`);
};
const requestFeedback = async <T,>(input: Record<string, unknown>, read: (value: unknown) => T): Promise<T> => {
  const actor = await requireActor();
  const firebaseUser = getFirebaseAuth().currentUser;
  if (!firebaseUser) throw new Error(`Sign In To Use Feedback`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const stopAuth = subscribeAuthState(() => {
    if (getFirebaseAuth().currentUser?.uid !== actor.firebaseUid) controller.abort();
  });
  try {
    const token = await firebaseUser.getIdToken();
    assertActor(actor);
    const response = await fetch(Platform.OS === `web` ? `/api/feedback` : absoluteSiteUrl(`/api/feedback`), {
      method: `POST`, cache: `no-store`, credentials: `omit`, signal: controller.signal,
      headers: { Accept: `application/json`, 'Content-Type': `application/json`, Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    });
    const result: unknown = await response.json().catch(() => null);
    const current = await requireActor();
    assertActor(actor);
    if (current.id !== actor.id || current.owner !== actor.owner) throw new Error(`Your Account Changed — Try Again`);
    if (!response.ok) {
      const message = (result as { error?: unknown })?.error;
      throw new Error(typeof message === `string` ? message : `Feedback Could Not Be Saved — Try Again`);
    }
    return read(result);
  } catch (failure) {
    if (controller.signal.aborted) throw new Error(`Feedback Request Was Interrupted — Retry To Confirm Whether It Was Saved`);
    throw feedbackError(failure);
  } finally { clearTimeout(timeout); stopAuth(); }
};

const watch = <T,>(owner: boolean, reference: (actor: FeedbackActor) => Query<DocumentData>, read: (snapshot: QuerySnapshot<DocumentData>) => T[],
  onValue: (value: T[]) => void, onError?: (error: Error) => void) => {
  let active = true;
  const stops: (() => void)[] = [];
  const stop = () => { active = false; stops.splice(0).forEach(unsubscribe => unsubscribe()); };
  const fail = (failure: unknown) => { if (active) { stop(); onValue([]); onError?.(feedbackError(failure)); } };
  const timeout = setTimeout(() => fail(new Error(`Could Not Confirm Live Feedback — Refresh To Try Again`)), 20_000);
  stops.push(() => clearTimeout(timeout));
  void requireActor(owner).then(actor => {
    if (!active) return;
    const stopAuth = subscribeAuthState(() => {
      try { assertActor(actor); } catch (failure) { fail(failure); return; }
      void requireActor(owner).then(current => { if (active && (current.id !== actor.id || current.owner !== actor.owner)) fail(new Error(`Your Feedback Access Changed — Refresh This Page`)); }).catch(fail);
    });
    if (!active) { stopAuth(); return; }
    stops.push(stopAuth);
    const stopSnapshot = onSnapshot(reference(actor), { includeMetadataChanges: true }, snapshot => {
      if (!active || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
      try { assertActor(actor); const value = read(snapshot); clearTimeout(timeout); onValue(value); } catch (failure) { fail(failure); }
    }, fail);
    if (active) stops.push(stopSnapshot);
    else stopSnapshot();
  }).catch(fail);
  return stop;
};

export const submitContact = (input: SupportContactInput, attemptId: string): Promise<SupportThread> => requestFeedback({ operation: `contact`, input, attemptId }, readSupportThread);
export const submitReview = (input: ReviewInput, attemptId: string): Promise<FeedbackEntry> => requestFeedback({ operation: `review`, input, attemptId }, readFeedbackEntry);
export const submitBug = (input: BugReportInput, attemptId: string): Promise<FeedbackEntry> => requestFeedback({ operation: `bug`, input, attemptId }, readFeedbackEntry);
export const sendMessage = (threadId: string, body: string, attemptId: string): Promise<SupportMessage> => requestFeedback({ operation: `message`, threadId, body, attemptId }, readSupportMessage);
export const updateFeedbackStatus = (id: string, status: FeedbackStatus): Promise<FeedbackEntry> => requestFeedback({ operation: `status`, id, status }, readFeedbackEntry);
export const markThreadRead = (threadId: string, lastMessageNumber: number): Promise<SupportReadState> => requestFeedback({ operation: `read`, threadId, lastMessageNumber }, readSupportReadState);

export const subscribeThreads = (onValue: (records: SupportThread[]) => void, onError?: (error: Error) => void, owner = false) => watch(owner,
  actor => query(collection(getFirebaseDb(), `supportThreads`), ...(owner ? [] : [where(`customerId`, `==`, actor.id)]), orderBy(`lastMessageAt`, `desc`), orderBy(`number`, `desc`), limit(feedbackLimits.threads)),
  snapshot => snapshot.docs.map(record => readSupportThread(record.data(), record.id)), onValue, onError);

export const subscribeMessages = (threadId: string, onValue: (records: SupportMessage[]) => void, onError?: (error: Error) => void) => {
  try { validateThreadId(threadId); } catch (failure) { onError?.(feedbackError(failure)); return () => undefined; }
  return watch(false, () => query(collection(getFirebaseDb(), `supportThreads`, threadId, `messages`), orderBy(`number`, `desc`), limit(feedbackLimits.messages)),
    snapshot => snapshot.docs.map(record => readSupportMessage(record.data(), record.id)).reverse(), onValue, onError);
};

export const getMessagesPage = async (threadId: string, beforeNumber?: number): Promise<SupportMessagesPage> => {
  validateThreadId(threadId);
  if (beforeNumber !== undefined && (!Number.isSafeInteger(beforeNumber) || beforeNumber < 1)) throw new Error(`Choose A Valid Message Page`);
  const actor = await requireActor();
  const saved = await getDocsFromServer(query(collection(getFirebaseDb(), `supportThreads`, threadId, `messages`), orderBy(`number`, `desc`),
    ...(beforeNumber === undefined ? [] : [startAfter(beforeNumber)]), limit(feedbackLimits.messages + 1)));
  assertActor(actor);
  const current = await requireActor();
  assertActor(actor);
  if (current.id !== actor.id || current.owner !== actor.owner) throw new Error(`Your Account Changed — Try Again`);
  const records = saved.docs.slice(0, feedbackLimits.messages).map(record => readSupportMessage(record.data(), record.id)).reverse();
  return { records, hasMore: saved.docs.length > feedbackLimits.messages, cursor: records?.[0]?.number ?? null };
};
export const getOlderMessages = async (threadId: string, beforeNumber: number) => (await getMessagesPage(threadId, beforeNumber)).records;

export const subscribeFeedback = (kind: FeedbackKind, onValue: (records: FeedbackEntry[]) => void, onError?: (error: Error) => void) => {
  if (![`review`, `bug`].includes(kind)) { onError?.(new Error(`Choose A Valid Feedback Channel`)); return () => undefined; }
  return watch(true, () => query(collection(getFirebaseDb(), `feedbackEntries`), where(`kind`, `==`, kind), orderBy(`number`, `desc`), limit(feedbackLimits.entries)),
    snapshot => snapshot.docs.map(record => readFeedbackEntry(record.data(), record.id)), onValue, onError);
};

export const subscribeThreadReadState = (threadId: string, onValue: (record: SupportReadState | null) => void, onError?: (error: Error) => void) => {
  let active = true;
  const stops: (() => void)[] = [];
  const stop = () => { active = false; stops.splice(0).forEach(unsubscribe => unsubscribe()); };
  const fail = (failure: unknown) => { if (active) { stop(); onValue(null); onError?.(feedbackError(failure)); } };
  const timeout = setTimeout(() => fail(new Error(`Could Not Confirm Saved Read State — Refresh To Try Again`)), 20_000);
  stops.push(() => clearTimeout(timeout));
  try { validateThreadId(threadId); } catch (failure) { fail(failure); return stop; }
  void requireActor().then(actor => {
    if (!active) return;
    const stopAuth = subscribeAuthState(() => {
      try { assertActor(actor); } catch (failure) { fail(failure); return; }
      void requireActor().then(current => { if (active && (current.id !== actor.id || current.owner !== actor.owner)) fail(new Error(`Your Feedback Access Changed — Refresh This Page`)); }).catch(fail);
    });
    if (!active) { stopAuth(); return; }
    stops.push(stopAuth);
    const stopSnapshot = onSnapshot(doc(getFirebaseDb(), `supportThreads`, threadId, `readStates`, actor.id), { includeMetadataChanges: true }, (saved: DocumentSnapshot<DocumentData>) => {
      if (!active || saved.metadata.fromCache || saved.metadata.hasPendingWrites) return;
      try { assertActor(actor); clearTimeout(timeout); onValue(saved.exists() ? readSupportReadState(saved.data()) : null); } catch (failure) { fail(failure); }
    }, fail);
    if (active) stops.push(stopSnapshot);
    else stopSnapshot();
  }).catch(fail);
  return stop;
};
