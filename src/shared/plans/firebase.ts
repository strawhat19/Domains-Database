import { Plan } from '../models/plans/Plan';
import { FirebaseError } from 'firebase/app';
import { canManagePlans, canManageFeatures } from '../admin/permissions';
import { planLimits, planTierLimit, type PlanTier, type PlanInput } from './types';
import { planId, readPlan, normalizePlan } from './values';
import { getFirebaseDb, getFirebaseAuth } from '../firebase/client';
import { restoreSession, subscribeAuthState } from '../authentication/service';
import { numberCollectionPage, type CollectionPage } from '../firebase/collection';
import { doc, query, limit, where, orderBy, startAfter, collection, onSnapshot, deleteField, runTransaction, serverTimestamp, getDocFromServer, getDocsFromServer, type Transaction } from 'firebase/firestore';

export const planError = (failure: unknown): Error => {
  if (!(failure instanceof FirebaseError)) return failure instanceof Error ? failure : new Error(`Plan Request Could Not Be Completed`);
  if (failure.code === `permission-denied`) return new Error(`Plan Access Was Denied — Check Your Role And Firestore Rules`);
  if (failure.code === `failed-precondition`) return new Error(`Plans Need The Firestore Indexes In This Repository`);
  if (failure.code === `unavailable`) return new Error(`Plans Could Not Connect To Firestore — Try Again`);
  return new Error(`Plan Database Is Unavailable — Try Again`);
};
const assertAccount = (uid: string) => {
  if (getFirebaseAuth().currentUser?.uid !== uid) throw new Error(`Your Account Changed — Try Again`);
};
const requireManager = async (ownerOnly = false) => {
  const canManage = ownerOnly ? canManageFeatures : canManagePlans;
  const accessError = ownerOnly ? `Owner Access Is Required` : `Admin Access Is Required`;
  const user = (await restoreSession())?.user;
  if (!canManage(user) || !user?.firebase_uid) throw new Error(accessError);
  const actor = { id: user.id, firebaseUid: user.firebase_uid };
  assertAccount(actor.firebaseUid);
  const saved = await getDocFromServer(doc(getFirebaseDb(), `users`, actor.id));
  assertAccount(actor.firebaseUid);
  const data = saved.data();
  if (data?.id !== actor.id || data?.firebase_uid !== actor.firebaseUid || data?.active !== true || !canManage({ id: data.id, role: data.role, active: data.active })) throw new Error(accessError);
  return actor;
};
const requireTransactionManager = async (transaction: Transaction, actor: Awaited<ReturnType<typeof requireManager>>, ownerOnly = false) => {
  const canManage = ownerOnly ? canManageFeatures : canManagePlans;
  assertAccount(actor.firebaseUid);
  const saved = await transaction.get(doc(getFirebaseDb(), `users`, actor.id));
  const data = saved.data();
  if (data?.id !== actor.id || data?.firebase_uid !== actor.firebaseUid || data?.active !== true || !canManage({ id: data.id, role: data.role, active: data.active })) throw new Error(ownerOnly ? `Owner Access Is Required` : `Admin Access Is Required`);
  assertAccount(actor.firebaseUid);
};
const pageQuery = (cursor: number | null) => {
  if (cursor !== null && (!Number.isSafeInteger(cursor) || cursor < 1)) throw new Error(`Choose A Valid Page`);
  return query(collection(getFirebaseDb(), `plans`), orderBy(`number`, `desc`), ...(cursor === null ? [] : [startAfter(cursor)]), limit(51));
};
export const getCloudPlansPage = async (cursor: number | null): Promise<CollectionPage<Plan>> => {
  const actor = await requireManager();
  const saved = await getDocsFromServer(pageQuery(cursor));
  assertAccount(actor.firebaseUid);
  return numberCollectionPage(saved.docs.map(record => readPlan(record.data(), record.id)));
};
export const subscribeCloudPlansPage = (onValue: (page: CollectionPage<Plan>) => void, onError?: (failure: Error) => void, cursor: number | null = null) => {
  let active = true;
  const stops: (() => void)[] = [];
  const stop = () => { active = false; stops.splice(0).forEach(unsubscribe => unsubscribe()); };
  const fail = (failure: unknown) => { if (active) { stop(); onError?.(planError(failure)); } };
  const timeout = setTimeout(() => fail(new Error(`Could Not Confirm Live Plans — Check Your Connection And Refresh`)), 20_000);
  stops.push(() => clearTimeout(timeout));
  void requireManager().then(actor => {
    if (!active) return;
    stops.push(subscribeAuthState(() => {
      if (getFirebaseAuth().currentUser?.uid !== actor.firebaseUid) { fail(new Error(`Your Account Changed — Try Again`)); return; }
      void restoreSession().then(session => {
        if (active && (session?.user.id !== actor.id || !canManagePlans(session?.user))) fail(new Error(`Your Plan Access Changed — Refresh This Page`));
      }).catch(fail);
    }));
    stops.push(onSnapshot(pageQuery(cursor), { includeMetadataChanges: true }, snapshot => {
      if (!active || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
      try {
        assertAccount(actor.firebaseUid);
        const records = snapshot.docs.map(record => readPlan(record.data(), record.id));
        clearTimeout(timeout);
        onValue(numberCollectionPage(records));
      } catch (failure) { fail(failure); }
    }, fail));
  }).catch(fail);
  return stop;
};
export const subscribeCloudPublishedPlans = (onValue: (plans: Plan[]) => void, onError?: (failure: Error) => void) => {
  let active = true;
  let unsubscribe: () => void = () => undefined;
  const fail = (failure: unknown) => { if (active) onError?.(planError(failure)); };
  const timeout = setTimeout(() => fail(new Error(`Could Not Confirm Published Plans — Check Your Connection And Refresh`)), 20_000);
  try {
    unsubscribe = onSnapshot(query(collection(getFirebaseDb(), `plans`), where(`active`, `==`, true), orderBy(`displayOrder`, `asc`), orderBy(`number`, `asc`), limit(planLimits.published)), { includeMetadataChanges: true }, snapshot => {
      if (!active || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
      try {
        const records = snapshot.docs.map(record => readPlan(record.data(), record.id));
        clearTimeout(timeout);
        onValue(records);
      } catch (failure) { clearTimeout(timeout); fail(failure); }
    }, failure => { clearTimeout(timeout); fail(failure); });
  } catch (failure) { clearTimeout(timeout); fail(failure); }
  return () => { active = false; clearTimeout(timeout); unsubscribe(); };
};
const planTier = (record: Plan): PlanTier => ({ id: record.id, slug: record.slug, number: record.number, displayOrder: record.displayOrder });
export const readPlanTier = (data: Record<string, unknown> | undefined, slug: string): PlanTier | null => {
  if (!data || data.slug !== slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100
    || Object.keys(data).some(key => ![`id`, `slug`, `number`, `displayOrder`].includes(key))) throw new Error(`Saved Plan Tier Needs Attention`);
  const id = planId(data.id);
  if (!(`number` in data) && !(`displayOrder` in data)) return null;
  if (!Number.isSafeInteger(data.number) || Number(data.number) < 1 || Number(data.number) !== Number(id.split(`_`)?.[1])
    || !Number.isSafeInteger(data.displayOrder) || Number(data.displayOrder) < 0) throw new Error(`Saved Plan Tier Needs Attention`);
  return { id, slug, number: Number(data.number), displayOrder: Number(data.displayOrder) };
};
export const subscribeCloudPlanTiers = (onValue: (tiers: PlanTier[]) => void, onError?: (failure: Error) => void) => {
  let active = true;
  let unsubscribe: () => void = () => undefined;
  const fail = (failure: unknown) => { if (active) onError?.(planError(failure)); };
  const timeout = setTimeout(() => fail(new Error(`Could Not Confirm Plan Tiers — Check Your Connection And Refresh`)), 20_000);
  try {
    unsubscribe = onSnapshot(query(collection(getFirebaseDb(), `planSlugs`), limit(planTierLimit + 1)), { includeMetadataChanges: true }, snapshot => {
      if (!active || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
      try {
        if (snapshot.size > planTierLimit) throw new Error(`Feature Targeting Supports Up To ${planTierLimit} Plans`);
        const tiers = snapshot.docs.flatMap(record => {
          const tier = readPlanTier(record.data(), record.id);
          return tier ? [tier] : [];
        });
        if (new Set(tiers.map(tier => tier.id)).size !== tiers.length || new Set(tiers.map(tier => tier.number)).size !== tiers.length) throw new Error(`Saved Plan Tier Identity Needs Attention`);
        clearTimeout(timeout);
        onValue(tiers.sort((first, second) => first.displayOrder - second.displayOrder || first.number - second.number));
      } catch (failure) { clearTimeout(timeout); fail(failure); }
    }, failure => { clearTimeout(timeout); fail(failure); });
  } catch (failure) { clearTimeout(timeout); fail(failure); }
  return () => { active = false; clearTimeout(timeout); unsubscribe(); };
};
export const prepareCloudPlanTiers = async (records: readonly Plan[]): Promise<void> => {
  if (records.length > planTierLimit) throw new Error(`Feature Targeting Supports Up To ${planTierLimit} Plans — Nothing Was Changed`);
  const actor = await requireManager(true);
  const database = getFirebaseDb();
  for (const record of records) {
    const id = planId(record.id);
    await runTransaction(database, async transaction => {
      await requireTransactionManager(transaction, actor, true);
      const saved = await transaction.get(doc(database, `plans`, id));
      const original = readPlan(saved.data(), id);
      const reference = doc(database, `planSlugs`, original.slug);
      const reservation = await transaction.get(reference);
      const data = reservation.data();
      if (!reservation.exists() || data?.id !== id || data?.slug !== original.slug) throw new Error(`Saved Plan Slug Needs Attention`);
      if (data.number === original.number && data.displayOrder === original.displayOrder) return;
      assertAccount(actor.firebaseUid);
      transaction.set(reference, planTier(original));
    });
  }
};
const savedPlan = async (id: string, actor: Awaited<ReturnType<typeof requireManager>>) => {
  assertAccount(actor.firebaseUid);
  const saved = await getDocFromServer(doc(getFirebaseDb(), `plans`, id));
  assertAccount(actor.firebaseUid);
  return readPlan(saved.data(), id);
};
const counterNumber = (data: Record<string, unknown> | undefined) => {
  if (!data) return 0;
  if (Object.keys(data).length !== 2 || !Number.isSafeInteger(data.number) || Number(data.number) < 1
    || typeof data.lastPlanId !== `string` || Number(data.number) !== Number(data.lastPlanId.split(`_`)?.[1])) throw new Error(`Saved Plan Counter Needs Attention`);
  planId(data.lastPlanId);
  return Number(data.number);
};
export const createCloudPlan = async (input: PlanInput): Promise<Plan> => {
  const values = normalizePlan(input);
  const actor = await requireManager();
  const database = getFirebaseDb();
  const id = await runTransaction(database, async transaction => {
    await requireTransactionManager(transaction, actor);
    const counterRef = doc(database, `counters`, `plans`);
    const counter = await transaction.get(counterRef);
    const number = counterNumber(counter.data()) + 1;
    if (!Number.isSafeInteger(number)) throw new Error(`Plan Number Limit Reached`);
    const slugRef = doc(database, `planSlugs`, values.slug);
    const reservation = await transaction.get(slugRef);
    if (reservation.exists()) throw new Error(`That Plan Slug Is Already In Use`);
    const record = new Plan({ ...values, number });
    const reference = doc(database, `plans`, record.id);
    const existing = await transaction.get(reference);
    if (existing.exists()) throw new Error(`Plan Identity Already Exists — Try Again`);
    assertAccount(actor.firebaseUid);
    transaction.set(reference, { ...record.toRecord(), created: serverTimestamp(), updated: serverTimestamp() });
    transaction.set(counterRef, { number, lastPlanId: record.id });
    transaction.set(slugRef, planTier(record));
    return record.id;
  });
  return savedPlan(id, actor);
};
export const updateCloudPlan = async (id: string, input: PlanInput): Promise<Plan> => {
  planId(id);
  const values = normalizePlan(input);
  const actor = await requireManager();
  const database = getFirebaseDb();
  await runTransaction(database, async transaction => {
    await requireTransactionManager(transaction, actor);
    const reference = doc(database, `plans`, id);
    const saved = await transaction.get(reference);
    const original = readPlan(saved.data(), id);
    if (values.slug !== original.slug) throw new Error(`Plan Slugs Cannot Change After Creation`);
    const slugRef = doc(database, `planSlugs`, original.slug);
    const reservation = await transaction.get(slugRef);
    if (reservation.data()?.id !== id || reservation.data()?.slug !== original.slug) throw new Error(`Saved Plan Slug Needs Attention`);
    const record = new Plan({ ...original, ...values, updated: new Date().toISOString() });
    assertAccount(actor.firebaseUid);
    transaction.set(reference, { ...record.toRecord(), created: saved.data()?.created, updated: serverTimestamp() });
    transaction.set(slugRef, planTier(record));
  });
  return savedPlan(id, actor);
};
export const setCloudPlanActive = async (id: string, active: boolean): Promise<Plan> => {
  planId(id);
  if (typeof active !== `boolean`) throw new Error(`Choose A Valid Plan Status`);
  const actor = await requireManager();
  const database = getFirebaseDb();
  await runTransaction(database, async transaction => {
    await requireTransactionManager(transaction, actor);
    const reference = doc(database, `plans`, id);
    const saved = await transaction.get(reference);
    const original = readPlan(saved.data(), id);
    if (original.active === active) return;
    const slugRef = doc(database, `planSlugs`, original.slug);
    const reservation = await transaction.get(slugRef);
    if (reservation.data()?.id !== id || reservation.data()?.slug !== original.slug) throw new Error(`Saved Plan Slug Needs Attention`);
    assertAccount(actor.firebaseUid);
    transaction.update(reference, { active, updated: serverTimestamp(), highlighted: deleteField() });
    transaction.set(slugRef, planTier(original));
  });
  return savedPlan(id, actor);
};
