import { createHash, randomUUID } from 'node:crypto';
import { hasPaidBillingAccess } from '../../shared/accountPlans';
import { BillingError, type BillingActor } from '../billing/types';
import type { Transaction, Firestore } from 'firebase-admin/firestore';
import { genID, getAppCollectionIDNumber } from '../../shared/common/ids';
import { getBillingDatabase, requireBillingActor } from '../billing/firebase';
import { featureSettingsId, readFeatureSettings, createFeatureSettings, resolveFeatureFlags } from '../../shared/featureFlags/values';
import { feedbackLimits, type FeedbackEntry, type SupportThread, type SupportMessage, type SupportReadState } from '../../shared/feedback/types';
import { feedbackText, normalizePublicMediaUrl, readFeedbackEntry, readSupportThread, readSupportMessage, readSupportReadState } from '../../shared/feedback/validation';

export class FeedbackError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
const invalid = (message = `Send A Valid Feedback Request`) => new FeedbackError(400, `feedback_input_invalid`, message);
const unavailable = () => new FeedbackError(503, `feedback_unavailable`, `Feedback Is Temporarily Unavailable — Try Again`);
const forbidden = () => new FeedbackError(403, `feedback_forbidden`, `This Conversation Is Not Available To Your Account`);
const attemptValue = (value: unknown) => {
  if (typeof value !== `string` || !/^[A-Za-z0-9-]{16,100}$/.test(value)) throw invalid(`Refresh The Form And Try Again`);
  return value;
};
const recordId = (value: unknown, type: string) => {
  if (getAppCollectionIDNumber(value, type) < 1 || typeof value !== `string` || value.includes(`/`) || value.length > 250) throw invalid(`Choose A Valid ${type === `Feedback` ? `Feedback Item` : `Conversation`}`);
  return value;
};
const inputObject = (value: unknown, fields: readonly string[]) => {
  if (!value || typeof value !== `object` || Array.isArray(value) || Object.keys(value).some(key => !fields.includes(key))) throw invalid();
  return value as Record<string, unknown>;
};
const normalizeInput = <T,>(normalize: () => T): T => {
  try { return normalize(); } catch (failure) { if (failure instanceof FeedbackError) throw failure; throw invalid(failure instanceof Error ? failure.message : undefined); }
};
const attemptKey = (actor: BillingActor, operation: string, attemptId: string) => createHash(`sha256`).update(JSON.stringify([actor.id, operation, attemptId])).digest(`hex`);
const inputFingerprint = (value: unknown) => createHash(`sha256`).update(JSON.stringify(value)).digest(`hex`);
const confirmAttempt = (saved: Record<string, unknown>, fingerprint: string, actor: BillingActor, operation: string) => {
  if (saved.fingerprint !== fingerprint || saved.actorId !== actor.id || saved.operation !== operation) throw new FeedbackError(409, `feedback_attempt_changed`, `This Submission Changed — Send It As A New Message`);
};
const freshIdentity = (type: string, number: number, name: string, date: Date, uuid: string) => genID(type, number, name, date, uuid).id;
const actorName = (actor: BillingActor) => actor.name.trim().slice(0, 100) || `Account`;

export const requireFeedbackActor = async (request: Request) => {
  try { return await requireBillingActor(request); }
  catch (failure) {
    if (failure instanceof BillingError && failure.status === 401) throw new FeedbackError(401, `feedback_sign_in_required`, `Sign In Again To Use Feedback`);
    if (failure instanceof BillingError && failure.status === 403) throw new FeedbackError(403, `feedback_account_unavailable`, `Your Account Could Not Be Confirmed`);
    throw new FeedbackError(503, `feedback_database_unavailable`, `Feedback Server Is Not Configured — Try Again Later`);
  }
};

const confirmActor = async (transaction: Transaction, database: Firestore, actor: BillingActor, ownerOnly = false) => {
  const [identity, account] = await Promise.all([
    transaction.get(database.doc(`identities/${actor.firebaseUid}`)), transaction.get(database.doc(`users/${actor.id}`)),
  ]);
  const user = account.data();
  if (identity.data()?.id !== actor.id || identity.data()?.firebase_uid !== actor.firebaseUid || user?.id !== actor.id
    || identity.data()?.number !== user?.number || getAppCollectionIDNumber(actor.id, `User`) !== user?.number
    || user?.firebase_uid !== actor.firebaseUid || user?.active !== true || user?.role !== actor.role
    || (ownerOnly && user?.role !== `Owner`)) throw new FeedbackError(403, `feedback_account_changed`, `Your Feedback Access Changed — Sign In Again`);
};

const requireContactFeature = async (transaction: Transaction, database: Firestore, actor: BillingActor) => {
  const saved = (await transaction.get(database.doc(`featureSettings/${featureSettingsId}`))).data();
  const normalizeDate = (value: unknown) => (value as { toDate?: () => Date })?.toDate?.().toISOString() ?? value;
  const settings = saved ? readFeatureSettings({ ...saved, created: normalizeDate(saved.created), updated: normalizeDate(saved.updated) }) : createFeatureSettings();
  const billing = actor.owner ? undefined : (await transaction.get(database.doc(`billingUsers/${actor.id}`))).data();
  const accessUntil = billing?.accessUntil?.toMillis?.();
  const paid = hasPaidBillingAccess({ plan: billing?.plan === `starter` ? `starter` : `free`, subscriptionStatus: typeof billing?.subscriptionStatus === `string` ? billing.subscriptionStatus : null, accessUntil: typeof accessUntil === `number` ? accessUntil : null });
  const plan = paid ? `starter` : `free`;
  const minimum = settings.audiences.contact.plans?.[0];
  const tiers: { id: string; slug: string; number: number; displayOrder: number }[] = [];
  if (settings.audiences.contact.planMode === `minimum` && minimum && minimum !== `free` && plan !== `free`) {
    for (const slug of new Set([minimum, plan])) {
      const tier = (await transaction.get(database.doc(`planSlugs/${slug}`))).data();
      if (tier?.slug === slug && typeof tier.id === `string` && Number.isSafeInteger(tier.number)
        && getAppCollectionIDNumber(tier.id, `Plan`) === tier.number && Number.isSafeInteger(tier.displayOrder)) tiers.push({ id: tier.id, slug, number: Number(tier.number), displayOrder: Number(tier.displayOrder) });
    }
  }
  if (!resolveFeatureFlags(settings, { role: actor.role, active: true, plan }, tiers).contact) throw new FeedbackError(403, `feedback_contact_disabled`, `Contact And Feedback Are Currently Unavailable`);
};

const readCounter = async (transaction: Transaction, database: Firestore, name: string, type: string) => {
  const reference = database.doc(`counters/${name}`);
  const saved = await transaction.get(reference);
  const data = saved.data();
  if (!saved.exists) return { reference, number: 1 };
  if (!Number.isSafeInteger(data?.number) || data?.number < 1 || getAppCollectionIDNumber(data?.lastId, type) !== data?.number
    || !Number.isSafeInteger(data.number + 1)) throw unavailable();
  return { reference, number: Number(data.number) + 1 };
};
const canUseThread = (thread: SupportThread, actor: BillingActor) => actor.owner || thread.customerId === actor.id;

export const submitSupportContact = async (actor: BillingActor, value: unknown, attempt: unknown): Promise<SupportThread> => {
  const input = normalizeInput(() => {
    const data = inputObject(value, [`subject`, `message`, `phone`]);
    return { subject: feedbackText(data.subject, `A Subject`, feedbackLimits.title, true), body: feedbackText(data.message, `A Message`, feedbackLimits.description, true), phone: feedbackText(data.phone, `A Phone Number`, 40) };
  });
  const attemptId = attemptValue(attempt);
  const fingerprint = inputFingerprint(input);
  const date = new Date();
  const created = date.toISOString();
  const uuid = randomUUID().replaceAll(`-`, ``);
  const database = getBillingDatabase();
  return database.runTransaction(async transaction => {
    await confirmActor(transaction, database, actor);
    const attemptRef = database.doc(`feedbackAttempts/${attemptKey(actor, `contact`, attemptId)}`);
    const prior = (await transaction.get(attemptRef)).data();
    if (prior) {
      confirmAttempt(prior, fingerprint, actor, `contact`);
      const thread = readSupportThread((await transaction.get(database.doc(`supportThreads/${recordId(prior.threadId, `SupportThread`)}`))).data(), prior.threadId);
      if (thread.customerId !== actor.id) throw forbidden();
      return thread;
    }
    await requireContactFeature(transaction, database, actor);
    const mappingRef = database.doc(`supportThreadAccounts/${actor.id}`);
    const mapping = (await transaction.get(mappingRef)).data();
    const original = mapping ? readSupportThread((await transaction.get(database.doc(`supportThreads/${recordId(mapping.threadId, `SupportThread`)}`))).data(), mapping.threadId) : null;
    if (original && original.customerId !== actor.id) throw forbidden();
    const counter = original ? null : await readCounter(transaction, database, `supportThreads`, `SupportThread`);
    const id = original?.id ?? freshIdentity(`SupportThread`, counter!.number, `Support`, date, uuid);
    const number = (original?.lastMessageNumber ?? 0) + 1;
    if (!Number.isSafeInteger(number)) throw unavailable();
    const activityAt = new Date(Math.max(Date.now(), original ? Date.parse(original.lastMessageAt) + 1 : 0)).toISOString();
    const thread: SupportThread = { id, number: original?.number ?? counter!.number, type: `SupportThread`, customerId: actor.id,
      customerName: actorName(actor), customerEmail: actor.email.slice(0, 254), customerPhone: input.phone,
      subject: input.subject, status: `open`, created: original?.created ?? created, updated: activityAt,
      lastMessageNumber: number, lastMessageAt: activityAt, lastMessageText: input.body.slice(0, 200), lastSenderId: actor.id };
    const message: SupportMessage = { id: freshIdentity(`SupportMessage`, number, `Message`, date, uuid), number, type: `SupportMessage`, threadId: id,
      senderId: actor.id, senderName: actorName(actor), senderKind: `customer`, body: input.body, created: activityAt };
    transaction.set(database.doc(`supportThreads/${id}`), thread);
    transaction.create(database.doc(`supportThreads/${id}/messages/${message.id}`), message);
    if (counter) transaction.set(counter.reference, { number: counter.number, lastId: id });
    if (!original) transaction.create(mappingRef, { threadId: id });
    transaction.create(attemptRef, { actorId: actor.id, operation: `contact`, threadId: id, recordId: id, fingerprint, created });
    return thread;
  });
};

export const submitFeedbackEntry = async (actor: BillingActor, kind: `review` | `bug`, value: unknown, attempt: unknown): Promise<FeedbackEntry> => {
  const input = normalizeInput(() => {
    const data = inputObject(value, kind === `review` ? [`rating`, `title`, `description`] : [`title`, `description`, `mediaUrl`]);
    const title = feedbackText(data.title, `A Title`, feedbackLimits.title);
    const description = feedbackText(data.description, kind === `review` ? `A Review` : `A Description`, feedbackLimits.description, kind === `review`);
    const mediaUrl = kind === `bug` ? normalizePublicMediaUrl(data.mediaUrl) : ``;
    if (kind === `review` && (!Number.isInteger(data.rating) || Number(data.rating) < 1 || Number(data.rating) > 5)) throw invalid(`Choose A Rating From 1 To 5`);
    if (kind === `bug` && !description && !mediaUrl) throw invalid(`Add A Description Or A Public Screenshot Or Video URL`);
    return { title, description, mediaUrl, rating: kind === `review` ? Number(data.rating) : null };
  });
  const attemptId = attemptValue(attempt);
  const fingerprint = inputFingerprint(input);
  const date = new Date();
  const created = date.toISOString();
  const uuid = randomUUID().replaceAll(`-`, ``);
  const database = getBillingDatabase();
  return database.runTransaction(async transaction => {
    await confirmActor(transaction, database, actor);
    const attemptRef = database.doc(`feedbackAttempts/${attemptKey(actor, kind, attemptId)}`);
    const prior = (await transaction.get(attemptRef)).data();
    if (prior) {
      confirmAttempt(prior, fingerprint, actor, kind);
      return readFeedbackEntry((await transaction.get(database.doc(`feedbackEntries/${recordId(prior.recordId, `Feedback`)}`))).data(), prior.recordId);
    }
    await requireContactFeature(transaction, database, actor);
    const counter = await readCounter(transaction, database, `feedbackEntries`, `Feedback`);
    const id = freshIdentity(`Feedback`, counter.number, kind === `review` ? `Review` : `Bug`, date, uuid);
    const record: FeedbackEntry = { ...input, id, number: counter.number, type: `Feedback`, kind, status: `new`, created, updated: created,
      authorId: actor.id, authorName: actorName(actor), authorEmail: actor.email.slice(0, 254) };
    transaction.create(database.doc(`feedbackEntries/${id}`), record);
    transaction.set(counter.reference, { number: counter.number, lastId: id });
    transaction.create(attemptRef, { actorId: actor.id, operation: kind, recordId: id, fingerprint, created });
    return record;
  });
};

export const sendSupportMessage = async (actor: BillingActor, threadValue: unknown, bodyValue: unknown, attempt: unknown): Promise<SupportMessage> => {
  const threadId = recordId(threadValue, `SupportThread`);
  const body = normalizeInput(() => feedbackText(bodyValue, `A Message`, feedbackLimits.description, true));
  const attemptId = attemptValue(attempt);
  const fingerprint = inputFingerprint(body);
  const date = new Date();
  const created = date.toISOString();
  const uuid = randomUUID().replaceAll(`-`, ``);
  const database = getBillingDatabase();
  return database.runTransaction(async transaction => {
    await confirmActor(transaction, database, actor);
    const threadRef = database.doc(`supportThreads/${threadId}`);
    const thread = readSupportThread((await transaction.get(threadRef)).data(), threadId);
    if (!canUseThread(thread, actor)) throw forbidden();
    const attemptRef = database.doc(`feedbackAttempts/${attemptKey(actor, `message:${threadId}`, attemptId)}`);
    const prior = (await transaction.get(attemptRef)).data();
    if (prior) {
      confirmAttempt(prior, fingerprint, actor, `message`);
      if (prior.threadId !== threadId) throw forbidden();
      return readSupportMessage((await transaction.get(database.doc(`supportThreads/${threadId}/messages/${recordId(prior.recordId, `SupportMessage`)}`))).data(), prior.recordId);
    }
    if (thread.status === `closed`) throw new FeedbackError(409, `feedback_conversation_closed`, `This Conversation Is Closed`);
    if (!actor.owner) await requireContactFeature(transaction, database, actor);
    const number = thread.lastMessageNumber + 1;
    if (!Number.isSafeInteger(number)) throw unavailable();
    const activityAt = new Date(Math.max(Date.now(), Date.parse(thread.lastMessageAt) + 1)).toISOString();
    const id = freshIdentity(`SupportMessage`, number, `Message`, date, uuid);
    const record: SupportMessage = { id, number, type: `SupportMessage`, threadId, body, created: activityAt, senderId: actor.id, senderName: actorName(actor), senderKind: actor.owner ? `owner` : `customer` };
    transaction.create(database.doc(`supportThreads/${threadId}/messages/${id}`), record);
    transaction.update(threadRef, { status: `open`, updated: activityAt, lastMessageAt: activityAt, lastMessageNumber: number, lastMessageText: body.slice(0, 200), lastSenderId: actor.id });
    transaction.create(attemptRef, { actorId: actor.id, operation: `message`, threadId, recordId: id, fingerprint, created });
    return record;
  });
};

export const updateFeedbackEntryStatus = async (actor: BillingActor, idValue: unknown, value: unknown): Promise<FeedbackEntry> => {
  const id = recordId(idValue, `Feedback`);
  if (typeof value !== `string` || ![`new`, `read`, `archived`].includes(value)) throw invalid(`Choose A Valid Feedback Status`);
  const database = getBillingDatabase();
  return database.runTransaction(async transaction => {
    await confirmActor(transaction, database, actor, true);
    const reference = database.doc(`feedbackEntries/${id}`);
    const original = readFeedbackEntry((await transaction.get(reference)).data(), id);
    const record = { ...original, status: value as FeedbackEntry[`status`], updated: new Date().toISOString() };
    transaction.update(reference, { status: record.status, updated: record.updated });
    return record;
  });
};

export const markSupportThreadRead = async (actor: BillingActor, threadValue: unknown, number: unknown): Promise<SupportReadState> => {
  const threadId = recordId(threadValue, `SupportThread`);
  if (!Number.isSafeInteger(number) || Number(number) < 1) throw invalid(`Choose A Saved Message To Mark Read`);
  const database = getBillingDatabase();
  return database.runTransaction(async transaction => {
    await confirmActor(transaction, database, actor);
    const thread = readSupportThread((await transaction.get(database.doc(`supportThreads/${threadId}`))).data(), threadId);
    if (!canUseThread(thread, actor)) throw forbidden();
    if (Number(number) > thread.lastMessageNumber) throw invalid(`Choose A Saved Message To Mark Read`);
    const message = await transaction.get(database.collection(`supportThreads/${threadId}/messages`).where(`number`, `==`, number).limit(1));
    if (message.empty) throw invalid(`Choose A Saved Message To Mark Read`);
    const reference = database.doc(`supportThreads/${threadId}/readStates/${actor.id}`);
    const saved = await transaction.get(reference);
    const previous = saved.exists ? readSupportReadState(saved.data()) : null;
    const record: SupportReadState = { threadId, userId: actor.id, lastMessageNumber: Math.max(Number(number), previous?.lastMessageNumber ?? 0), updated: new Date().toISOString() };
    transaction.set(reference, record);
    return record;
  });
};
