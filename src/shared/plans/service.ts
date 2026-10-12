import { Plan } from '../models/plans/Plan';
import { useLocalStorage } from '../config';
import { firebaseEnabled } from '../firebase/config';
import { canManagePlans, canManageFeatures } from '../admin/permissions';
import { planLimits, planTierLimit, type PlanTier, type PlanInput } from './types';
import { restoreSession } from '../authentication/service';
import { planId, readPlan, normalizePlan, orderPublishedPlans } from './values';
import { numberCollectionPage, type CollectionPage } from '../firebase/collection';
import { readStorage, writeStorage, subscribeStorage, createOperationQueue } from '../common/storage';
import { planError, getCloudPlansPage, subscribeCloudPlansPage, subscribeCloudPublishedPlans, createCloudPlan, updateCloudPlan, setCloudPlanActive, subscribeCloudPlanTiers, prepareCloudPlanTiers } from './firebase';

interface PlanSnapshot { version: 1; nextNumber: number; records: Plan[] }
const storageKey = `domains-database:plans:v1`;
const serialize = createOperationQueue(storageKey);
const cloudEnabled = firebaseEnabled && !useLocalStorage;
export const planStorageSource = cloudEnabled ? `firestore` : `local`;
export const publishedPlanLimit = planLimits.published;
const requireLocalManager = async () => {
  if (!useLocalStorage) throw new Error(`Connect Firebase To Manage Plans`);
  const user = (await restoreSession())?.user;
  if (!canManagePlans(user)) throw new Error(`Admin Access Is Required`);
  return user!;
};
const readLocalSnapshot = (saved: string | null): PlanSnapshot => {
  if (saved === null) return { version: 1, records: [], nextNumber: 1 };
  let value: Record<string, unknown>;
  try { value = JSON.parse(saved); } catch { throw new Error(`Saved Plans Could Not Be Read — Nothing Was Changed`); }
  if (!value || value.version !== 1 || Object.keys(value).some(key => ![`version`, `records`, `nextNumber`].includes(key))
    || !Array.isArray(value.records) || !Number.isSafeInteger(value.nextNumber) || Number(value.nextNumber) < 1) throw new Error(`Saved Plans Could Not Be Read — Nothing Was Changed`);
  const records = value.records.map(data => readPlan(data, data?.id));
  if (new Set(records.map(record => record.id)).size !== records.length || new Set(records.map(record => record.number)).size !== records.length
    || new Set(records.map(record => record.slug)).size !== records.length || records.some(record => record.number >= Number(value.nextNumber))) throw new Error(`Saved Plan Identity Needs Attention — Nothing Was Changed`);
  return { version: 1, records, nextNumber: Number(value.nextNumber) };
};
const readLocal = async () => readLocalSnapshot(await readStorage(storageKey));
const assertLocalManager = async (id: string) => {
  if ((await requireLocalManager()).id !== id) throw new Error(`Your Account Changed — Try Again`);
};
const saveLocal = async (snapshot: PlanSnapshot, actorId: string) => {
  await assertLocalManager(actorId);
  await writeStorage(storageKey, JSON.stringify({ ...snapshot, records: snapshot.records.map(record => record.toRecord()) }));
  await assertLocalManager(actorId);
};
const runOperation = async <T,>(operation: () => Promise<T>): Promise<T> => {
  try { return await operation(); } catch (failure) { throw planError(failure); }
};
export const getPlansPage = (cursor: number | null = null): Promise<CollectionPage<Plan>> => runOperation(async () => {
  if (cloudEnabled) return getCloudPlansPage(cursor);
  const actor = await requireLocalManager();
  const snapshot = await readLocal();
  await assertLocalManager(actor.id);
  return numberCollectionPage(snapshot.records, cursor);
});
export const subscribePlansPage = (onValue: (page: CollectionPage<Plan>) => void, onError?: (failure: Error) => void, cursor: number | null = null) => {
  if (cloudEnabled) return subscribeCloudPlansPage(onValue, onError, cursor);
  let active = true;
  let revision = 0;
  let stop: () => void = () => undefined;
  const fail = (failure: unknown) => { if (active) onError?.(planError(failure)); };
  void requireLocalManager().then(actor => {
    if (!active) return;
    stop = subscribeStorage(storageKey, saved => {
      const request = ++revision;
      void assertLocalManager(actor.id).then(() => {
        if (active && request === revision) onValue(numberCollectionPage(readLocalSnapshot(saved).records, cursor));
      }).catch(fail);
    }, fail);
  }).catch(fail);
  return () => { active = false; revision++; stop(); };
};
export const subscribePublishedPlans = (onValue: (plans: Plan[]) => void, onError?: (failure: Error) => void) => {
  if (cloudEnabled) return subscribeCloudPublishedPlans(onValue, onError);
  if (!useLocalStorage) { onError?.(new Error(`Connect Firebase To Load Plans`)); return () => undefined; }
  return subscribeStorage(storageKey, saved => {
    try { onValue(orderPublishedPlans(readLocalSnapshot(saved).records.filter(record => record.active))); }
    catch (failure) { onError?.(planError(failure)); }
  }, onError);
};
export const subscribePlanTiers = (onValue: (tiers: PlanTier[]) => void, onError?: (failure: Error) => void) => {
  if (cloudEnabled) return subscribeCloudPlanTiers(onValue, onError);
  if (!useLocalStorage) { onError?.(new Error(`Connect Firebase To Load Plan Tiers`)); return () => undefined; }
  return subscribeStorage(storageKey, saved => {
    try {
      const records = readLocalSnapshot(saved).records;
      if (records.length > planTierLimit) throw new Error(`Feature Targeting Supports Up To ${planTierLimit} Plans`);
      onValue(records.map(({ id, slug, number, displayOrder }) => ({ id, slug, number, displayOrder })).sort((first, second) => first.displayOrder - second.displayOrder || first.number - second.number));
    } catch (failure) { onError?.(planError(failure)); }
  }, onError);
};
export const preparePlanTiers = (records: readonly Plan[]): Promise<void> => runOperation(async () => {
  if (cloudEnabled) return prepareCloudPlanTiers(records);
  if (!useLocalStorage) throw new Error(`Connect Firebase To Manage Plan Tiers`);
  const user = (await restoreSession())?.user;
  if (!canManageFeatures(user)) throw new Error(`Owner Access Is Required`);
  if (records.length > planTierLimit) throw new Error(`Feature Targeting Supports Up To ${planTierLimit} Plans — Nothing Was Changed`);
});
export const createPlan = (input: PlanInput): Promise<Plan> => runOperation(async () => {
  const values = normalizePlan(input);
  if (cloudEnabled) return createCloudPlan(values);
  return serialize(async () => {
    const actor = await requireLocalManager();
    const snapshot = await readLocal();
    if (snapshot.records.some(record => record.slug === values.slug)) throw new Error(`That Plan Slug Is Already In Use`);
    if (!Number.isSafeInteger(snapshot.nextNumber + 1)) throw new Error(`Plan Number Limit Reached`);
    const record = new Plan({ ...values, number: snapshot.nextNumber });
    snapshot.nextNumber++;
    snapshot.records.push(record);
    await saveLocal(snapshot, actor.id);
    return record;
  });
});
export const updatePlan = (id: string, input: PlanInput): Promise<Plan> => runOperation(async () => {
  planId(id);
  const values = normalizePlan(input);
  if (cloudEnabled) return updateCloudPlan(id, values);
  return serialize(async () => {
    const actor = await requireLocalManager();
    const snapshot = await readLocal();
    const original = snapshot.records.find(record => record.id === id);
    if (!original) throw new Error(`Saved Plan Was Not Found`);
    if (values.slug !== original.slug) throw new Error(`Plan Slugs Cannot Change After Creation`);
    const record = new Plan({ ...original, ...values, updated: new Date().toISOString() });
    snapshot.records = snapshot.records.map(current => current.id === id ? record : current);
    await saveLocal(snapshot, actor.id);
    return record;
  });
});
export const setPlanActive = (id: string, active: boolean): Promise<Plan> => runOperation(async () => {
  planId(id);
  if (typeof active !== `boolean`) throw new Error(`Choose A Valid Plan Status`);
  if (cloudEnabled) return setCloudPlanActive(id, active);
  return serialize(async () => {
    const actor = await requireLocalManager();
    const snapshot = await readLocal();
    const original = snapshot.records.find(record => record.id === id);
    if (!original) throw new Error(`Saved Plan Was Not Found`);
    if (original.active === active) { await assertLocalManager(actor.id); return original; }
    const record = new Plan({ ...original, active, updated: new Date().toISOString() });
    snapshot.records = snapshot.records.map(current => current.id === id ? record : current);
    await saveLocal(snapshot, actor.id);
    return record;
  });
});
export const archivePlan = (id: string) => setPlanActive(id, false);

export type { PlanTier, PlanInput, PlanCurrency, PlanBillingInterval } from './types';
