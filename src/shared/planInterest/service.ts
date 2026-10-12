import { planId } from '../plans/values';
import { getPlanVisitor } from './client';
import { useLocalStorage } from '../config';
import type { Plan } from '../models/plans/Plan';
import { firebaseEnabled } from '../firebase/config';
import { canManagePlans } from '../admin/permissions';
import { getFeatureFlags } from '../featureFlags/service';
import { restoreSession } from '../authentication/service';
import { subscribePublishedPlans } from '../plans/service';
import { PlanInterest } from '../models/plans/PlanInterest';
import { readStorage, writeStorage, subscribeStorage, createOperationQueue } from '../common/storage';
import { planInterestLimit, type PlanVote, type PlanInterestState, type PlanInterestSummary } from './types';
import { readPlanInterest, normalizePlanVote, planInterestState, readPlanInterestSummary, adjustPlanInterestSummary } from './values';
import { getCloudPlanInterestStates, setCloudPlanVote, registerCloudPlanInterest, subscribeCloudPlanInterestSummary } from './firebase';

interface InterestSnapshot { version: 1; nextNumber: number; records: PlanInterest[]; summaries: PlanInterestSummary[] }
const storageKey = `domains-database:plan-interest:v1`;
const serialize = createOperationQueue(storageKey);
const cloudEnabled = firebaseEnabled && !useLocalStorage;
export const planInterestStorageSource = cloudEnabled ? `firestore` : `local`;
const failure = () => new Error(`Saved Plan Interest Could Not Be Read — Nothing Was Changed`);
const readSnapshot = (saved: string | null): InterestSnapshot => {
  if (saved === null) return { version: 1, records: [], summaries: [], nextNumber: 1 };
  let value: Record<string, unknown>;
  try { value = JSON.parse(saved); } catch { throw failure(); }
  if (!value || value.version !== 1 || Object.keys(value).length !== 4 || !Array.isArray(value.records) || !Array.isArray(value.summaries)
    || !Number.isSafeInteger(value.nextNumber) || Number(value.nextNumber) < 1 || value.summaries.length > planInterestLimit) throw failure();
  const records = value.records.map(readPlanInterest);
  const summaries = value.summaries.map(readPlanInterestSummary);
  if (new Set(records.map(record => record.id)).size !== records.length || new Set(records.map(record => record.number)).size !== records.length
    || new Set(records.map(record => `${record.planId}:${record.actorKey}`)).size !== records.length
    || new Set(summaries.map(summary => summary.planId)).size !== summaries.length || records.some(record => record.number >= Number(value.nextNumber))) throw failure();
  for (const summary of summaries) {
    const own = records.filter(record => record.planId === summary.planId);
    if (summary.up !== own.filter(record => record.vote === `up`).length || summary.down !== own.filter(record => record.vote === `down`).length
      || summary.interested !== own.filter(record => record.interested).length) throw failure();
  }
  if (records.some(record => !summaries.some(summary => summary.planId === record.planId))) throw failure();
  return { version: 1, records, summaries, nextNumber: Number(value.nextNumber) };
};
const readLocal = async () => {
  if (!useLocalStorage) throw new Error(`Connect Firebase To Save Plan Interest`);
  return readSnapshot(await readStorage(storageKey));
};
const loadPublishedPlans = () => new Promise<Plan[]>((resolve, reject) => {
  let stop: (() => void) | undefined;
  let settled = false;
  const finish = () => { clearTimeout(timeout); settled = true; stop?.(); };
  const timeout = setTimeout(() => { finish(); reject(new Error(`Published Plans Could Not Be Confirmed`)); }, 20_000);
  stop = subscribePublishedPlans(plans => { finish(); resolve(plans); }, error => { finish(); reject(error); });
  if (settled) stop();
});
const localActor = async () => {
  const visitor = await getPlanVisitor();
  const user = (await restoreSession())?.user ?? null;
  if (user && !user.active) throw new Error(`This Account Is Deactivated`);
  return { user, guestKey: `guest:${visitor}`, key: user ? `user:${user.id}` : `guest:${visitor}` };
};
const pair = (snapshot: InterestSnapshot, planId: string, actor: Awaited<ReturnType<typeof localActor>>) => {
  const own = snapshot.records.find(record => record.planId === planId && record.actorKey === actor.key);
  const guest = actor.user ? snapshot.records.find(record => record.planId === planId && record.actorKey === actor.guestKey && !record.migratedTo) : undefined;
  if (own && own.userId !== (actor.user?.id ?? ``) || guest && guest.userId !== ``) throw failure();
  if (!actor.user && own?.migratedTo) throw new Error(`Sign In To Manage This Plan Vote`);
  return { own, guest };
};
const assertActor = async (actor: Awaited<ReturnType<typeof localActor>>) => {
  if ((await localActor()).key !== actor.key) throw new Error(`Your Account Changed — Try Again`);
};
export const getPlanInterestStates = async (ids: readonly string[]): Promise<PlanInterestState[]> => {
  if (!Array.isArray(ids) || ids.length > 100 || new Set(ids).size !== ids.length) throw new Error(`Choose Valid Published Plans`);
  const selected = ids.map(id => planId(id));
  if (!selected.length) return [];
  if (cloudEnabled) return getCloudPlanInterestStates(selected);
  const [snapshot, actor, plans] = await Promise.all([readLocal(), localActor(), loadPublishedPlans()]);
  await assertActor(actor);
  return selected.map(id => {
    if (!plans.some(plan => plan.id === id)) throw new Error(`That Published Plan Is No Longer Available`);
    const { own, guest } = pair(snapshot, id, actor);
    return planInterestState(id, own ?? guest);
  });
};
const saveLocal = (id: string, vote: PlanVote, action: `vote` | `interest`): Promise<PlanInterestState> => serialize(async () => {
  const [snapshot, actor, plans, flags] = await Promise.all([readLocal(), localActor(), loadPublishedPlans(), getFeatureFlags()]);
  const plan = plans.find(record => record.id === id);
  if (!plan) throw new Error(`That Published Plan Is No Longer Available`);
  if (flags.pricingTable) throw new Error(`Pricing Is Available — Refresh To Continue`);
  if (action === `interest` && !actor.user) throw new Error(`Sign In To Share Your Plan Interest`);
  const { own, guest } = pair(snapshot, id, actor);
  const original = own ?? guest;
  const desiredVote = action === `vote` ? vote ?? `none` : original?.vote === `up` ? `up` : `none`;
  const interested = action === `interest` || own?.interested === true;
  if (own && !guest && own.vote === desiredVote && own.interested === interested) return planInterestState(id, own);
  if (!original && desiredVote === `none` && !interested) return planInterestState(id);
  if (!Number.isSafeInteger(snapshot.nextNumber + 1)) throw new Error(`Plan Interest Number Limit Reached`);
  const record = new PlanInterest({
    ...(own ?? { number: snapshot.nextNumber++ }),
    planId: id,
    vote: desiredVote,
    interested,
    actorKey: actor.key,
    updated: new Date().toISOString(),
    userId: actor.user?.id ?? ``,
  });
  const summary = snapshot.summaries.find(saved => saved.planId === id) ?? { planId: id, planName: plan.name, up: 0, down: 0, interested: 0, updated: record.updated };
  const oldRecords = [own, guest].filter((item): item is PlanInterest => Boolean(item));
  const nextSummary = adjustPlanInterestSummary(summary, oldRecords, record, plan.name);
  if (!snapshot.summaries.some(saved => saved.planId === id) && snapshot.summaries.length >= planInterestLimit) throw new Error(`Plan Interest Summary Limit Reached`);
  snapshot.summaries = [...snapshot.summaries.filter(saved => saved.planId !== id), nextSummary];
  snapshot.records = [...snapshot.records.filter(saved => saved.id !== record.id), record];
  if (guest) snapshot.records = snapshot.records.map(saved => saved.id === guest.id ? new PlanInterest({ ...guest, vote: `none`, interested: false, migratedTo: actor.key, updated: record.updated }) : saved);
  await assertActor(actor);
  const saved = JSON.stringify({ ...snapshot, records: snapshot.records.map(saved => saved.toRecord()) });
  await writeStorage(storageKey, saved);
  if (await readStorage(storageKey) !== saved) throw new Error(`Plan Interest Could Not Be Confirmed On This Device`);
  await assertActor(actor);
  return planInterestState(id, record);
});
export const setPlanVote = async (id: string, vote: PlanVote): Promise<PlanInterestState> => {
  planId(id);
  normalizePlanVote(vote);
  return cloudEnabled ? setCloudPlanVote(id, vote) : saveLocal(id, vote, `vote`);
};
export const registerPlanInterest = async (id: string): Promise<PlanInterestState> => {
  planId(id);
  return cloudEnabled ? registerCloudPlanInterest(id) : saveLocal(id, null, `interest`);
};
export const subscribePlanInterestSummary = (onValue: (summaries: PlanInterestSummary[]) => void, onError?: (error: Error) => void): (() => void) => {
  if (cloudEnabled) return subscribeCloudPlanInterestSummary(onValue, onError);
  let active = true;
  let stop: (() => void) | undefined;
  let revision = 0;
  const fail = (error: unknown) => { if (active) onError?.(error instanceof Error ? error : new Error(`Plan Interest Could Not Be Loaded`)); };
  void restoreSession().then(session => {
    if (!useLocalStorage || !canManagePlans(session?.user)) throw new Error(`Admin Access Is Required`);
    const actorId = session!.user.id;
    if (!active) return;
    stop = subscribeStorage(storageKey, saved => {
      const request = ++revision;
      void restoreSession().then(current => {
        if (!active || request !== revision) return;
        if (current?.user.id !== actorId || !canManagePlans(current?.user)) throw new Error(`Your Plan Interest Access Changed — Refresh This Page`);
        onValue(readSnapshot(saved).summaries);
      }).catch(fail);
    }, fail);
  }).catch(fail);
  return () => { active = false; revision++; stop?.(); };
};
