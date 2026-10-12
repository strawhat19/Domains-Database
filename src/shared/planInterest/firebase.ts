import { FirebaseError } from 'firebase/app';
import { Roles } from '../../types/types';
import { readPlanTier } from '../plans/firebase';
import type { User } from '../models/users/User';
import { readPlanInterestSummary } from './values';
import { planId, readPlan } from '../plans/values';
import { getAppCollectionIDNumber } from '../common/ids';
import { canManageFeatures } from '../admin/permissions';
import type { PlanVote, PlanInterestState } from './types';
import { PlanInterest } from '../models/plans/PlanInterest';
import { readPlanInterest, planInterestState } from './values';
import { getFirebaseDb, getFirebaseAuth } from '../firebase/client';
import { planInterestLimit, type PlanInterestSummary } from './types';
import { restoreSession, subscribeAuthState } from '../authentication/service';
import { restoreGuestVotingIdentity, getGuestVotingAuth, getGuestVotingDb } from './guest';
import { featureSettingsId, readFeatureSettings, createFeatureSettings, resolveFeatureFlags } from '../featureFlags/values';
import { doc, query, limit, increment, collection, onSnapshot, runTransaction, serverTimestamp, getDocFromServer, type Firestore, type Transaction } from 'firebase/firestore';

interface InterestActor { uid: string; userId: string; mainUid: string | null; database: Firestore; guest: boolean }
const interestError = (failure: unknown) => {
  if (!(failure instanceof FirebaseError)) return failure instanceof Error ? failure : new Error(`Plan Interest Could Not Be Saved`);
  if (failure.code === `auth/operation-not-allowed`) return new Error(`Guest Voting Is Not Available Yet`);
  if (failure.code === `permission-denied`) return new Error(`Plan Voting Access Was Denied — Please Try Again Later`);
  if (failure.code === `unavailable` || failure.code === `auth/network-request-failed`) return new Error(`Plan Interest Could Not Connect To Firestore — Please Try Again`);
  if (failure.code === `resource-exhausted` || failure.code === `auth/too-many-requests`) return new Error(`Plan Voting Is Busy — Please Try Again Later`);
  return new Error(`Plan Interest Could Not Be Saved — Please Try Again`);
};
const getActor = async (createGuest = false, accountRequired = false): Promise<InterestActor | null> => {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const identity = auth.currentUser;
  if (identity && !identity.isAnonymous) {
    const user = (await restoreSession())?.user;
    if (!user?.active || user.firebase_uid !== identity.uid || auth.currentUser?.uid !== identity.uid) throw new Error(`Sign In Again To Share Plan Interest`);
    return { uid: identity.uid, userId: user.id, database: getFirebaseDb(), guest: false, mainUid: identity.uid };
  }
  if (accountRequired) throw new Error(`Sign In To Share Your Plan Interest`);
  const guest = await restoreGuestVotingIdentity(createGuest);
  if (auth.currentUser?.uid !== identity?.uid) throw new Error(`Your Account Changed — Try Again`);
  return guest ? { uid: guest.uid, userId: ``, database: getGuestVotingDb(), guest: true, mainUid: identity?.uid ?? null } : null;
};
const assertActor = (actor: InterestActor) => {
  if ((getFirebaseAuth().currentUser?.uid ?? null) !== actor.mainUid
    || actor.guest && getGuestVotingAuth().currentUser?.uid !== actor.uid) throw new Error(`Your Account Changed — Try Again`);
};
const lookupRef = (actor: InterestActor, id: string) => doc(actor.database, `planInterestLookup`, actor.uid, `plans`, id);
const lookupId = (data: Record<string, unknown> | undefined) => {
  if (!data || Object.keys(data).length !== 2 || typeof data.id !== `string` || data.id.includes(`/`)
    || !Number.isSafeInteger(data.number) || Number(data.number) < 1 || getAppCollectionIDNumber(data.id, `PlanInterest`) !== data.number
    || !data.id.startsWith(`PlanInterest_${data.number}_Plan_`)) throw new Error(`Saved Plan Interest Identity Needs Attention`);
  return data.id;
};
const actorRecord = (data: Record<string, unknown> | undefined, recordId: string, id: string, actor: InterestActor) => {
  const record = readPlanInterest(data);
  if (record.id !== recordId || record.planId !== id || record.actorKey !== actor.uid || record.userId !== actor.userId || record.migratedTo) throw new Error(`Saved Plan Interest Identity Needs Attention`);
  return record;
};
export const getCloudPlanInterestStates = async (ids: readonly string[]): Promise<PlanInterestState[]> => {
  try {
    const actor = await getActor();
    if (!actor) return ids.map(id => planInterestState(id));
    const states: PlanInterestState[] = [];
    for (const id of ids) {
      assertActor(actor);
      const saved = await getDocFromServer(lookupRef(actor, id));
      if (!saved.exists()) { states.push(planInterestState(id)); continue; }
      const recordId = lookupId(saved.data());
      const record = await getDocFromServer(doc(actor.database, `planInterestRecords`, recordId));
      assertActor(actor);
      if (!record.exists()) throw new Error(`Saved Plan Interest Needs Attention`);
      states.push(planInterestState(id, actorRecord(record.data(), recordId, id, actor)));
    }
    assertActor(actor);
    return states;
  } catch (failure) { throw interestError(failure); }
};
const transactionAccount = async (transaction: Transaction, actor: InterestActor): Promise<Pick<User, `role` | `plan` | `active`> | null> => {
  if (actor.guest) return null;
  const data = (await transaction.get(doc(actor.database, `users`, actor.userId))).data();
  const plan = data?.plan ?? `free`;
  if (data?.id !== actor.userId || data?.firebase_uid !== actor.uid || data?.active !== true
    || typeof data.role !== `string` || typeof plan !== `string`) throw new Error(`Your Account Could Not Be Verified`);
  return { role: data.role, plan: plan.toLowerCase(), active: true } as Pick<User, `role` | `plan` | `active`>;
};
const ensureInterestMode = async (transaction: Transaction, actor: InterestActor, user: Awaited<ReturnType<typeof transactionAccount>>) => {
  const saved = await transaction.get(doc(actor.database, `featureSettings`, featureSettingsId));
  const settings = saved.exists() ? readFeatureSettings(saved.data()) : createFeatureSettings();
  const audience = settings.audiences.pricingTable;
  if (!settings.flags.pricingTable || audience.roles && !audience.roles.includes(user?.role ?? Roles.Guest)) return;
  const minimum = audience.plans?.[0];
  const needsRanks = audience.planMode === `minimum` && !!minimum && minimum !== `free` && (user?.plan ?? `free`) !== `free`;
  const slugs = needsRanks ? [...new Set([minimum, user?.plan].filter((slug): slug is string => !!slug && slug !== `free`))] : [];
  const tiers = [];
  for (const slug of slugs) {
    const saved = await transaction.get(doc(actor.database, `planSlugs`, slug));
    if (!saved.exists()) continue;
    const tier = readPlanTier(saved.data(), slug);
    if (!tier) throw new Error(`Saved Plan Tier Needs Attention`);
    tiers.push(tier);
  }
  if (resolveFeatureFlags(settings, user, tiers).pricingTable) throw new Error(`Pricing Is Available — Refresh To Continue`);
};
const saveCloudState = async (id: string, action: `vote` | `interest`, vote: PlanVote): Promise<PlanInterestState> => {
  try {
    planId(id);
    const actor = await getActor(true, action === `interest`);
    if (!actor) throw new Error(`Guest Voting Is Not Available Yet`);
    const recordId = await runTransaction(actor.database, async transaction => {
      assertActor(actor);
      const user = await transactionAccount(transaction, actor);
      const plan = readPlan((await transaction.get(doc(actor.database, `plans`, id))).data(), id);
      if (!plan.active) throw new Error(`That Published Plan Is No Longer Available`);
      const lookup = lookupRef(actor, id);
      const binding = await transaction.get(lookup);
      let original: PlanInterest | undefined;
      let originalCreated: unknown;
      if (binding.exists()) {
        const recordId = lookupId(binding.data());
        const record = await transaction.get(doc(actor.database, `planInterestRecords`, recordId));
        if (!record.exists()) throw new Error(`Saved Plan Interest Needs Attention`);
        originalCreated = record.data()?.created;
        original = actorRecord(record.data(), recordId, id, actor);
      }
      const desiredVote = action === `vote` ? vote ?? `none` : original?.vote ?? `none`;
      const interested = action === `interest` || original?.interested === true;
      if (original && original.vote === desiredVote && original.interested === interested) return original.id;
      if (!original && desiredVote === `none` && !interested) return null;
      const clearing = original && desiredVote === `none` && original.vote !== `none` && interested === original.interested;
      if (!clearing) await ensureInterestMode(transaction, actor, user);
      const counterRef = doc(actor.database, `counters`, `planInterest`);
      let number = original?.number;
      if (!original) {
        const counter = await transaction.get(counterRef);
        const data = counter.data();
        if (counter.exists() && (!data || Object.keys(data).length !== 2 || !Number.isSafeInteger(data.number) || Number(data.number) < 1
          || typeof data.lastInterestId !== `string` || data.lastInterestId.includes(`/`) || getAppCollectionIDNumber(data.lastInterestId, `PlanInterest`) !== data.number)) throw new Error(`Saved Plan Interest Counter Needs Attention`);
        number = Number(data?.number ?? 0) + 1;
        if (!Number.isSafeInteger(number)) throw new Error(`Plan Interest Number Limit Reached`);
      }
      const record = new PlanInterest({ ...original, number, planId: id, actorKey: actor.uid, userId: actor.userId, vote: desiredVote, interested });
      assertActor(actor);
      transaction.set(doc(actor.database, `planInterestRecords`, record.id), {
        ...record.toRecord(),
        updated: serverTimestamp(),
        created: original ? originalCreated : serverTimestamp(),
      });
      if (!original) {
        transaction.set(counterRef, { number, lastInterestId: record.id });
        transaction.set(lookup, { id: record.id, number });
      }
      transaction.set(doc(actor.database, `planInterestSummary`, id), {
        planId: id,
        planName: plan.name,
        updated: serverTimestamp(),
        lastInterestId: record.id,
        up: increment(Number(desiredVote === `up`) - Number(original?.vote === `up`)),
        down: increment(Number(desiredVote === `down`) - Number(original?.vote === `down`)),
        interested: increment(Number(interested) - Number(original?.interested === true)),
      }, { merge: true });
      return record.id;
    });
    assertActor(actor);
    if (!recordId) return planInterestState(id);
    const saved = await getDocFromServer(doc(actor.database, `planInterestRecords`, recordId));
    assertActor(actor);
    if (!saved.exists()) throw new Error(`Saved Plan Interest Could Not Be Confirmed`);
    return planInterestState(id, actorRecord(saved.data(), recordId, id, actor));
  } catch (failure) { throw interestError(failure); }
};
export const setCloudPlanVote = (id: string, vote: PlanVote) => saveCloudState(id, `vote`, vote);
export const registerCloudPlanInterest = (id: string) => saveCloudState(id, `interest`, null);

export const subscribeCloudPlanInterestSummary = (onValue: (summaries: PlanInterestSummary[]) => void, onError?: (error: Error) => void) => {
  let active = true;
  const stops: (() => void)[] = [];
  const stop = () => { active = false; stops.splice(0).forEach(unsubscribe => unsubscribe()); };
  const fail = (failure: unknown) => { if (active) { stop(); onError?.(failure instanceof Error ? failure : new Error(`Plan Interest Could Not Be Loaded`)); } };
  const timeout = setTimeout(() => fail(new Error(`Could Not Confirm Plan Interest — Refresh To Try Again`)), 20_000);
  stops.push(() => clearTimeout(timeout));
  void restoreSession().then(async session => {
    const user = session?.user;
    if (!canManageFeatures(user) || !user?.firebase_uid) throw new Error(`Owner Access Is Required`);
    const actor = { id: user.id, uid: user.firebase_uid };
    const assertActor = () => { if (getFirebaseAuth().currentUser?.uid !== actor.uid) throw new Error(`Your Account Changed — Try Again`); };
    assertActor();
    const account = (await getDocFromServer(doc(getFirebaseDb(), `users`, actor.id))).data();
    assertActor();
    if (account?.id !== actor.id || account?.firebase_uid !== actor.uid || !canManageFeatures({ id: account.id, role: account.role, active: account.active })) throw new Error(`Owner Access Is Required`);
    if (!active) return;
    stops.push(subscribeAuthState(() => {
      if (!active) return;
      void restoreSession().then(current => {
        if (active && (current?.user.id !== actor.id || !canManageFeatures(current?.user))) fail(new Error(`Your Plan Interest Access Changed — Refresh This Page`));
      }).catch(fail);
    }));
    stops.push(onSnapshot(query(collection(getFirebaseDb(), `planInterestSummary`), limit(planInterestLimit + 1)), { includeMetadataChanges: true }, snapshot => {
      if (!active || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
      try {
        assertActor();
        if (snapshot.size > planInterestLimit) throw new Error(`Plan Interest Supports Up To ${planInterestLimit} Plan Summaries`);
        const summaries = snapshot.docs.map(saved => {
          const summary = readPlanInterestSummary(saved.data());
          if (summary.planId !== saved.id) throw new Error(`Saved Plan Interest Identity Needs Attention`);
          return summary;
        });
        clearTimeout(timeout);
        onValue(summaries.sort((first, second) => first.planName.localeCompare(second.planName) || first.planId.localeCompare(second.planId)));
      } catch (failure) { fail(failure); }
    }, fail));
  }).catch(fail);
  return stop;
};
