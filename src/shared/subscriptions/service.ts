import type { Plan } from '../models/plans/Plan';
import type { SubscriptionRequest } from './types';
import { planId, readPlan } from '../plans/values';
import { firebaseEnabled } from '../firebase/config';
import { doc, getDocFromServer } from 'firebase/firestore';
import { restoreSession } from '../authentication/service';
import { subscribePublishedPlans } from '../plans/service';
import { useLocalStorage, persistenceEnabled } from '../config';
import { accountStorageKey } from '../authentication/userScope';
import { getFirebaseDb, getFirebaseAuth } from '../firebase/client';
import { planCurrencies, planBillingIntervals } from '../plans/types';
import { readStorage, writeStorage, createOperationQueue } from '../common/storage';

interface SubscriptionSnapshot { version: 1; request: SubscriptionRequest }
const storageKey = `domains-database:subscription-request:v1`;
const serialize = createOperationQueue(storageKey);
const cloudEnabled = firebaseEnabled && !useLocalStorage;
export const subscriptionStorageSource = cloudEnabled ? `firestore` : `local`;
const unreadable = () => new Error(`Saved Subscription Request Could Not Be Read — Nothing Was Changed`);
const requireActor = async (expectedUserId: string) => {
  if (!persistenceEnabled) throw new Error(`Connect A Backend To Save A Subscription Request`);
  const user = (await restoreSession())?.user;
  if (!user?.id || !user.active || user.anonymous) throw new Error(`Sign In To Continue With Starter`);
  if (!expectedUserId?.trim() || user.id !== expectedUserId) throw new Error(`Your Account Changed — Try Again`);
  if (cloudEnabled && (!user.firebase_uid || getFirebaseAuth().currentUser?.uid !== user.firebase_uid
    || getFirebaseAuth().currentUser?.isAnonymous)) throw new Error(`Your Account Changed — Sign In Again`);
  return user;
};
const readRequest = (saved: string | null, userId: string): SubscriptionRequest | null => {
  if (saved === null) return null;
  try {
    const snapshot = JSON.parse(saved) as SubscriptionSnapshot;
    const request = snapshot?.request;
    if (!snapshot || snapshot.version !== 1 || Object.keys(snapshot).length !== 2 || !request || Array.isArray(request)
      || Object.keys(request).some(key => ![`userId`, `planId`, `planSlug`, `status`, `priceCents`, `currency`, `billingInterval`, `requestedAt`].includes(key))
      || request.userId !== userId || request.planSlug !== `starter` || request.status !== `awaiting-payment-setup`
      || !Number.isSafeInteger(request.priceCents) || request.priceCents <= 0
      || !planCurrencies.includes(request.currency) || !planBillingIntervals.includes(request.billingInterval)
      || typeof request.requestedAt !== `string` || request.requestedAt.length > 100 || !Number.isFinite(Date.parse(request.requestedAt))) throw unreadable();
    planId(request.planId);
    return { ...request };
  } catch { throw unreadable(); }
};
const loadLocalPlans = () => new Promise<Plan[]>((resolve, reject) => {
  let stop: (() => void) | undefined;
  let settled = false;
  const finish = () => { settled = true; clearTimeout(timeout); stop?.(); };
  const timeout = setTimeout(() => { finish(); reject(new Error(`Published Plans Could Not Be Confirmed`)); }, 20_000);
  stop = subscribePublishedPlans(plans => { finish(); resolve(plans); }, error => { finish(); reject(error); });
  if (settled) stop();
});
const currentStarter = async (selected: Plan): Promise<Plan> => {
  const id = planId(selected?.id);
  const plan = cloudEnabled
    ? await getDocFromServer(doc(getFirebaseDb(), `plans`, id)).then(saved => saved.exists() ? readPlan(saved.data(), saved.id) : null)
    : (await loadLocalPlans()).find(record => record.id === id);
  if (!plan?.active || plan.slug !== `starter` || plan.priceCents <= 0) throw new Error(`Starter Is Not Available — Return To Pricing`);
  if (selected.slug !== plan.slug || selected.priceCents !== plan.priceCents || selected.currency !== plan.currency
    || selected.billingInterval !== plan.billingInterval) throw new Error(`Starter Pricing Changed — Review The Latest Plan And Try Again`);
  return plan;
};
export const getRequest = (expectedUserId: string): Promise<SubscriptionRequest | null> => serialize(async () => {
  await requireActor(expectedUserId);
  const saved = await readStorage(accountStorageKey(storageKey, expectedUserId));
  await requireActor(expectedUserId);
  return readRequest(saved, expectedUserId);
});
export const saveRequest = (expectedUserId: string, selected: Plan): Promise<SubscriptionRequest> => serialize(async () => {
  await requireActor(expectedUserId);
  const key = accountStorageKey(storageKey, expectedUserId);
  const previous = readRequest(await readStorage(key), expectedUserId);
  await requireActor(expectedUserId);
  const plan = await currentStarter(selected);
  await requireActor(expectedUserId);
  const request: SubscriptionRequest = {
    planId: plan.id,
    userId: expectedUserId,
    planSlug: plan.slug,
    currency: plan.currency,
    priceCents: plan.priceCents,
    status: `awaiting-payment-setup`,
    billingInterval: plan.billingInterval,
    requestedAt: previous?.planId === plan.id && previous.priceCents === plan.priceCents && previous.currency === plan.currency
      && previous.billingInterval === plan.billingInterval ? previous.requestedAt : new Date().toISOString(),
  };
  await writeStorage(key, JSON.stringify({ version: 1, request }));
  await requireActor(expectedUserId);
  const confirmed = readRequest(await readStorage(key), expectedUserId);
  await requireActor(expectedUserId);
  if (!confirmed || JSON.stringify(confirmed) !== JSON.stringify(request)) throw new Error(`Subscription Request Could Not Be Confirmed — Try Again`);
  return confirmed;
});
