import type Stripe from 'stripe';
import { randomUUID } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { getBillingDatabase } from './firebase';
import { getAppCollectionIDNumber } from '../../shared/common/ids';
import { BillingError, type BillingActor, type BillingStatus, type CheckoutInput } from './types';
import { getBillingStripe, getBillingOrigin, getStarterPriceId, getWebhookSecret, hostedStripeUrl, requireStarterPrice, getPortalConfigurationId } from './config';
import { acquireBillingLock, bindBillingCustomer, ensureBillingAccount, finishBillingSync, releaseBillingLock, updateLockedAccount, type BillingAccount, type SubscriptionState } from './store';

const objectId = (value: string | { id: string } | null | undefined) => typeof value === `string` ? value : value?.id ?? ``;
const metadataMatches = (metadata: Stripe.Metadata | null, account: BillingAccount) => metadata?.billing_account_id === account.id && metadata?.app_user_id === account.userId && metadata?.plan_slug === `starter`;
const paidStatus = (status: string | null) => status === `active` || status === `trialing`;
const existingSubscription = (status: string | null) => !!status && ![`canceled`, `incomplete_expired`].includes(status);
const statusOf = (account: BillingAccount, actor: BillingActor): BillingStatus => {
  const entitled = paidStatus(account.subscriptionStatus) && account.accessUntil instanceof Timestamp && account.accessUntil.toMillis() > Date.now();
  return {
    owner: actor.owner,
    plan: entitled ? `starter` : `free`,
    portalAvailable: !!account.stripe_customer_id,
    checkoutAvailable: !actor.owner && !existingSubscription(account.subscriptionStatus),
    subscription: account.subscriptionStatus ? {
      status: account.subscriptionStatus,
      cancelAtPeriodEnd: account.cancelAtPeriodEnd === true,
      currentPeriodEnd: account.currentPeriodEnd ? new Date(account.currentPeriodEnd * 1000).toISOString() : null,
    } : null,
  };
};

const currentSubscriptionState = async (account: BillingAccount): Promise<SubscriptionState> => {
  const empty: SubscriptionState = { plan: `free`, accessUntil: null, currentPeriodEnd: null, cancelAtPeriodEnd: false, subscriptionStatus: null };
  if (!account.stripe_customer_id) return empty;
  const stripe = getBillingStripe();
  const subscriptions = await stripe.subscriptions.list({ limit: 100, status: `all`, customer: account.stripe_customer_id });
  if (subscriptions.has_more) throw new BillingError(503, `billing_subscription_conflict`, `Contact Support To Review Your Subscriptions`);
  const relevant = subscriptions.data.filter(subscription => subscription.livemode && metadataMatches(subscription.metadata, account));
  const continuing = relevant.filter(subscription => existingSubscription(subscription.status));
  if (continuing.length > 1) throw new BillingError(503, `billing_subscription_conflict`, `More Than One Subscription Needs Review — Open Billing Or Contact Support`);
  const selected = continuing[0] ?? relevant.sort((first, second) => second.created - first.created)[0];
  if (!selected) return empty;
  const items = selected.items.data;
  const item = items[0];
  const valid = !!item && !selected.items.has_more && items.length === 1 && item.quantity === 1
    && item.price.id === getStarterPriceId() && item.price.currency === `usd` && item.price.unit_amount === 133
    && item.price.recurring?.interval === `month` && item.price.recurring.interval_count === 1;
  const periodEnd = item && Number.isSafeInteger(item.current_period_end) ? item.current_period_end : null;
  const state: SubscriptionState = { ...empty, stripe_subscription_id: selected.id, currentPeriodEnd: periodEnd, cancelAtPeriodEnd: selected.cancel_at_period_end, subscriptionStatus: selected.status };
  if (!valid || !paidStatus(selected.status) || !periodEnd || selected.pause_collection || selected.collection_method !== `charge_automatically`) return state;
  const now = Math.floor(Date.now() / 1000);
  let paidThrough = 0;
  if (selected.status === `trialing` && selected.trial_start && selected.trial_start <= now && selected.trial_end && selected.trial_end > selected.trial_start) paidThrough = Math.min(periodEnd, selected.trial_end);
  else {
    const invoices = await stripe.invoices.list({ limit: 10, status: `paid`, subscription: selected.id, customer: account.stripe_customer_id });
    for (const invoice of invoices.data) {
      if (!invoice.livemode || invoice.status !== `paid`) continue;
      for (const line of invoice.lines.data) {
        const details = line.parent?.subscription_item_details;
        if (details?.subscription === selected.id && details.subscription_item === item.id
          && objectId(line.pricing?.price_details?.price) === item.price.id && Number.isSafeInteger(line.period.end)
          && Number.isSafeInteger(line.period.start) && line.period.start <= now && line.period.end > now
          && line.period.end > line.period.start) paidThrough = Math.max(paidThrough, Math.min(periodEnd, line.period.end));
      }
    }
  }
  if (paidThrough * 1000 > Date.now()) return { ...state, plan: `starter`, accessUntil: Timestamp.fromMillis(paidThrough * 1000) };
  return state;
};

export const syncBillingAccount = async (account: BillingAccount, requireActive = true) => {
  const lock = await acquireBillingLock(account.id, requireActive);
  try { return await finishBillingSync(lock, await currentSubscriptionState(lock.account)); }
  finally { await releaseBillingLock(lock).catch(() => undefined); }
};
export const getBillingStatus = async (actor: BillingActor): Promise<BillingStatus> => {
  getBillingStripe();
  getStarterPriceId();
  getWebhookSecret();
  const account = await ensureBillingAccount(actor);
  return statusOf(await syncBillingAccount(account), actor);
};

const requirePublishedStarter = async (input: CheckoutInput) => {
  if (typeof input.planId !== `string` || input.planId.length > 240 || !getAppCollectionIDNumber(input.planId, `Plan`)
    || input.priceCents !== 133 || input.currency !== `USD` || input.billingInterval !== `month`) {
    throw new BillingError(400, `billing_offer_invalid`, `Choose The Published Starter Plan`);
  }
  const saved = (await getBillingDatabase().doc(`plans/${input.planId}`).get()).data();
  if (saved?.id !== input.planId || saved?.number !== getAppCollectionIDNumber(input.planId, `Plan`) || saved?.type !== `Plan`
    || saved?.slug !== `starter` || saved?.active !== true || saved?.priceCents !== input.priceCents || saved?.currency !== input.currency
    || saved?.billingInterval !== input.billingInterval) throw new BillingError(409, `billing_offer_changed`, `Starter Pricing Changed — Review The Published Plan`);
  return saved;
};
const ensureCustomer = async (account: BillingAccount) => {
  if (account.stripe_customer_id) return account;
  const customer = await getBillingStripe().customers.create({
    name: account.name.slice(0, 100),
    ...(account.customerEmail ? { email: account.customerEmail } : {}),
    metadata: { app_user_id: account.userId, billing_account_id: account.id, app_project: `domainsdatabase-e62a3` },
  }, { idempotencyKey: `billing-customer-${account.id}` });
  if (!customer.livemode) throw new BillingError(503, `billing_mode_mismatch`, `Live Stripe Billing Is Required`);
  return bindBillingCustomer(account, customer.id);
};

export const createBillingCheckout = async (actor: BillingActor, input: CheckoutInput) => {
  if (actor.owner) throw new BillingError(409, `billing_owner_access`, `Your Owner Account Already Has Access`);
  const origin = getBillingOrigin();
  getWebhookSecret();
  await requirePublishedStarter(input);
  const price = await requireStarterPrice();
  const stripe = getBillingStripe();
  let account = await ensureBillingAccount(actor);
  account = await syncBillingAccount(account);
  if (existingSubscription(account.subscriptionStatus)) throw new BillingError(409, `billing_subscription_exists`, `Manage Your Existing Subscription Instead Of Starting Another`);
  account = await ensureCustomer(account);
  const lock = await acquireBillingLock(account.id);
  try {
    const currentUser = (await getBillingDatabase().doc(`users/${actor.id}`).get()).data();
    if (currentUser?.active !== true || currentUser?.firebase_uid !== actor.firebaseUid) throw new BillingError(403, `billing_account_unavailable`, `This Account Is Unavailable`);
    if (currentUser?.role === `Owner`) throw new BillingError(409, `billing_owner_access`, `Your Owner Account Already Has Access`);
    const currentState = await currentSubscriptionState(lock.account);
    if (existingSubscription(currentState.subscriptionStatus)) throw new BillingError(409, `billing_subscription_exists`, `Manage Your Existing Subscription Instead Of Starting Another`);
    if (lock.account.stripe_checkout_session_id) {
      const previous = await stripe.checkout.sessions.retrieve(lock.account.stripe_checkout_session_id);
      if (!previous.livemode || objectId(previous.customer) !== lock.account.stripe_customer_id || !metadataMatches(previous.metadata, lock.account)) throw new BillingError(503, `billing_session_unavailable`, `Saved Checkout Could Not Be Confirmed`);
      if (previous.status === `complete` && (!objectId(previous.subscription) || currentState.stripe_subscription_id !== objectId(previous.subscription))) {
        throw new BillingError(409, `billing_confirmation_pending`, `Payment Confirmation Is Updating — Refresh Your Subscription`);
      }
      if (previous.status === `open` && lock.account.checkoutPlanId === input.planId && lock.account.checkoutPriceId === price.id) return { url: hostedStripeUrl(previous.url) };
      if (previous.status === `open`) await stripe.checkout.sessions.expire(previous.id);
    }
    if (lock.account.checkoutAttemptId && !lock.account.stripe_checkout_session_id) {
      const sessions = await stripe.checkout.sessions.list({ limit: 100, customer: lock.account.stripe_customer_id });
      if (sessions.has_more) throw new BillingError(503, `billing_session_conflict`, `Contact Support To Review Your Previous Checkout`);
      const previousSessions = sessions.data.filter(session => session.livemode && metadataMatches(session.metadata, lock.account));
      const openSessions = previousSessions.filter(session => session.status === `open`);
      if (openSessions.length > 1) throw new BillingError(503, `billing_session_conflict`, `More Than One Checkout Needs Review — Contact Support`);
      const previous = openSessions[0];
      if (previous) {
        if (previous.metadata?.checkout_attempt_id === lock.account.checkoutAttemptId && lock.account.checkoutPlanId === input.planId && lock.account.checkoutPriceId === price.id) {
          await updateLockedAccount(lock, { stripe_checkout_session_id: previous.id });
          return { url: hostedStripeUrl(previous.url) };
        }
        await stripe.checkout.sessions.expire(previous.id);
      }
      const completed = previousSessions.find(session => session.status === `complete` && session.metadata?.checkout_attempt_id === lock.account.checkoutAttemptId);
      if (completed && (!objectId(completed.subscription) || currentState.stripe_subscription_id !== objectId(completed.subscription))) {
        throw new BillingError(409, `billing_confirmation_pending`, `Payment Confirmation Is Updating — Refresh Your Subscription`);
      }
    }
    const reuseAttempt = lock.account.checkoutAttemptId && !lock.account.stripe_checkout_session_id
      && lock.account.checkoutPlanId === input.planId && lock.account.checkoutPriceId === price.id
      && Date.parse(lock.account.checkoutCreatedAt ?? ``) > Date.now() - 23 * 60 * 60 * 1000;
    const attempt = reuseAttempt ? lock.account.checkoutAttemptId! : randomUUID();
    const createdAt = reuseAttempt ? lock.account.checkoutCreatedAt! : new Date().toISOString();
    await updateLockedAccount(lock, { checkoutAttemptId: attempt, checkoutCreatedAt: createdAt, checkoutPlanId: input.planId, checkoutPriceId: price.id, stripe_checkout_session_id: null });
    const metadata = { plan_slug: `starter`, plan_id: input.planId, app_user_id: actor.id, billing_account_id: account.id, checkout_attempt_id: attempt };
    const integrationSuffix = attempt.replaceAll(`-`, ``).slice(0, 8).replace(/[0-9]/g, digit => String.fromCharCode(97 + Number(digit)));
    const session = await stripe.checkout.sessions.create({
      metadata,
      mode: `subscription`,
      customer: account.stripe_customer_id,
      client_reference_id: actor.id,
      line_items: [{ price: price.id, quantity: 1 }],
      subscription_data: { metadata },
      integration_identifier: `domainsdatabase_checkout_${integrationSuffix}`,
      cancel_url: `${origin}/subscription?plan=starter&checkout=cancelled`,
      success_url: `${origin}/subscription?plan=starter&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    }, { idempotencyKey: `billing-checkout-${account.id}-${attempt}` });
    if (!session.livemode || objectId(session.customer) !== account.stripe_customer_id || session.mode !== `subscription`) throw new BillingError(503, `billing_mode_mismatch`, `Live Stripe Billing Is Required`);
    await updateLockedAccount(lock, { stripe_checkout_session_id: session.id });
    return { url: hostedStripeUrl(session.url) };
  } finally { await releaseBillingLock(lock).catch(() => undefined); }
};

export const createBillingPortal = async (actor: BillingActor) => {
  const account = await ensureBillingAccount(actor);
  if (!account.stripe_customer_id) throw new BillingError(409, `billing_customer_missing`, `This Account Does Not Have Stripe Billing Yet`);
  const configuration = getPortalConfigurationId();
  const session = await getBillingStripe().billingPortal.sessions.create({ customer: account.stripe_customer_id, ...(configuration ? { configuration } : {}), return_url: `${getBillingOrigin()}/subscription?plan=starter&billing=updated` });
  return { url: hostedStripeUrl(session.url, true) };
};
export const reconcileBillingCheckout = async (actor: BillingActor, sessionId: string): Promise<BillingStatus> => {
  if (typeof sessionId !== `string` || !/^cs_live_[A-Za-z0-9_]{1,240}$/.test(sessionId)) throw new BillingError(400, `billing_session_invalid`, `Choose A Valid Checkout Session`);
  const account = await ensureBillingAccount(actor);
  const session = await getBillingStripe().checkout.sessions.retrieve(sessionId);
  if (!session.livemode || session.mode !== `subscription` || session.client_reference_id !== actor.id
    || !metadataMatches(session.metadata, account) || !account.stripe_customer_id || objectId(session.customer) !== account.stripe_customer_id) {
    throw new BillingError(403, `billing_session_forbidden`, `This Checkout Session Does Not Belong To Your Account`);
  }
  return statusOf(await syncBillingAccount(account), actor);
};
