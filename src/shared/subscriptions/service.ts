import { useLocalStorage } from '../config';
import type { Plan } from '../models/plans/Plan';
import { Platform, Linking } from 'react-native';
import { firebaseEnabled } from '../firebase/config';
import { getFirebaseAuth } from '../firebase/client';
import type { BillingActor, BillingStatus } from './types';
import { restoreSession } from '../authentication/service';

export class BillingRequestError extends Error {
  constructor(public code: string, message: string) { super(message); }
}
const unavailable = () => new BillingRequestError(`billing_invalid_response`, `Billing Returned An Unexpected Response — Try Again`);
const requireActor = async (actor: BillingActor) => {
  if (useLocalStorage || !firebaseEnabled) throw new BillingRequestError(`billing_not_connected`, `Connect Firebase To Subscribe`);
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!actor.userId || !actor.firebaseUid || !user || user.isAnonymous || user.uid !== actor.firebaseUid) {
    throw new BillingRequestError(`billing_session_changed`, `Sign In Again To Manage Your Subscription`);
  }
  const account = (await restoreSession())?.user;
  if (!account?.active || account.anonymous || account.id !== actor.userId || account.firebase_uid !== actor.firebaseUid
    || auth.currentUser?.uid !== actor.firebaseUid) throw new BillingRequestError(`billing_session_changed`, `Your Account Changed — Sign In Again`);
  return user;
};
const requestBilling = async (path: string, actor: BillingActor, body?: object, signal?: AbortSignal): Promise<unknown> => {
  const user = await requireActor(actor);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener(`abort`, abort, { once: true });
  if (signal?.aborted) abort();
  const timeout = setTimeout(abort, 30_000);
  try {
    const token = await user.getIdToken();
    if (getFirebaseAuth().currentUser?.uid !== actor.firebaseUid) throw new BillingRequestError(`billing_session_changed`, `Your Account Changed — Try Again`);
    const base = Platform.OS === `web` ? `` : `https://domaindatabases.com`;
    const response = await fetch(`${base}/api/billing/${path}`, {
      cache: `no-store`,
      credentials: `omit`,
      signal: controller.signal,
      method: body ? `POST` : `GET`,
      ...(body ? { body: JSON.stringify(body) } : {}),
      headers: { Accept: `application/json`, 'Content-Type': `application/json`, Authorization: `Bearer ${token}` },
    });
    const result = await response.json().catch(() => null);
    if (getFirebaseAuth().currentUser?.uid !== actor.firebaseUid) throw new BillingRequestError(`billing_session_changed`, `Your Account Changed — Try Again`);
    if (!response.ok) throw new BillingRequestError(typeof result?.code === `string` ? result.code : `billing_unavailable`, typeof result?.error === `string` ? result.error : `Billing Is Unavailable — Try Again`);
    return result;
  } catch (failure) {
    if (failure instanceof BillingRequestError) throw failure;
    if (controller.signal.aborted) throw new BillingRequestError(`billing_timeout`, signal?.aborted ? `Billing Request Cancelled` : `Billing Took Too Long — Try Again`);
    throw new BillingRequestError(`billing_unavailable`, `Could Not Reach Billing — Check Your Connection And Try Again`);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener(`abort`, abort);
  }
};
const readStatus = (value: unknown): BillingStatus => {
  const status = value as BillingStatus | null;
  const subscription = status?.subscription;
  if (!status || ![`free`, `starter`].includes(status.plan) || typeof status.owner !== `boolean`
    || typeof status.portalAvailable !== `boolean` || typeof status.checkoutAvailable !== `boolean`
    || (subscription !== null && (!subscription || typeof subscription.status !== `string` || !/^[a-z_]{1,80}$/.test(subscription.status)
      || typeof subscription.cancelAtPeriodEnd !== `boolean` || (subscription.currentPeriodEnd !== null
        && (typeof subscription.currentPeriodEnd !== `string` || !Number.isFinite(Date.parse(subscription.currentPeriodEnd))))))) throw unavailable();
  return {
    plan: status.plan,
    owner: status.owner,
    portalAvailable: status.portalAvailable,
    checkoutAvailable: status.checkoutAvailable,
    subscription: subscription ? { status: subscription.status, cancelAtPeriodEnd: subscription.cancelAtPeriodEnd, currentPeriodEnd: subscription.currentPeriodEnd } : null,
  };
};
const hostedUrl = (value: unknown, host: `checkout.stripe.com` | `billing.stripe.com`) => {
  try {
    const url = new URL(typeof value === `string` ? value : ``);
    if (url.protocol !== `https:` || url.hostname !== host || url.username || url.password || url.port) throw unavailable();
    return url.href;
  } catch { throw unavailable(); }
};
export const getStatus = async (actor: BillingActor, signal?: AbortSignal) => readStatus(await requestBilling(`status`, actor, undefined, signal));
export const reconcile = async (actor: BillingActor, sessionId: string, signal?: AbortSignal) => {
  if (!/^cs_live_[A-Za-z0-9_]{1,240}$/.test(sessionId)) throw new BillingRequestError(`billing_invalid_session`, `This Checkout Return Is Invalid — Reload Your Billing Status`);
  return readStatus(await requestBilling(`reconcile`, actor, { sessionId }, signal));
};
export const createCheckout = async (actor: BillingActor, plan: Plan, signal?: AbortSignal) => {
  if (!plan?.active || plan.slug !== `starter` || !Number.isSafeInteger(plan.priceCents) || plan.priceCents <= 0) {
    throw new BillingRequestError(`billing_plan_unavailable`, `Choose An Available Starter Plan`);
  }
  const result = await requestBilling(`checkout`, actor, { planId: plan.id, currency: plan.currency, priceCents: plan.priceCents, billingInterval: plan.billingInterval }, signal) as { url?: unknown } | null;
  return hostedUrl(result?.url, `checkout.stripe.com`);
};
export const createPortal = async (actor: BillingActor, signal?: AbortSignal) => {
  const result = await requestBilling(`portal`, actor, {}, signal) as { url?: unknown } | null;
  return hostedUrl(result?.url, `billing.stripe.com`);
};
export const openBillingUrl = async (value: string) => {
  const url = hostedUrl(value, value.startsWith(`https://checkout.stripe.com/`) ? `checkout.stripe.com` : `billing.stripe.com`);
  if (Platform.OS === `web` && typeof window !== `undefined`) window.location.assign(url);
  else await Linking.openURL(url);
};
