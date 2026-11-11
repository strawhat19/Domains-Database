import type Stripe from 'stripe';
import { assertStripeSellerReady } from './sellers';
import { BillingError, type BillingActor } from '../billing/types';
import { openMarketplaceThread } from '../marketplace/conversations';
import type { MarketplaceCheckout } from '../../shared/marketplace/paymentTypes';
import { getMarketplaceStripe, marketplaceReturnUrl, marketplaceStripeApp, marketplaceStripeUrl, requireMarketplaceStripe, type MarketplaceStripe } from './config';
import { applyOrderResult, confirmCheckoutRetry, getCheckoutSeller, getLockedOrder, getOrderRecord, getParticipantOrder, participantOrder, recordSellerFundsStatus, reserveOrder, validOrderId, type MarketplaceOrderRecord } from './orders';

const providerError = () => new BillingError(503, `marketplace_checkout_unconfirmed`, `Stripe Checkout Could Not Be Confirmed — Try Again`);
const reservedError = () => new BillingError(409, `marketplace_checkout_reserved`, `A Checkout Is Already In Progress For This Domain`);
const modeMatches = (config: MarketplaceStripe, order: MarketplaceOrderRecord) => config.mode === order.mode;
const checkoutEvents = new Set([`checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`]);
const stripeSessionCreationLeadSeconds = 2_100;
const stripeUnboundRecoveryDelaySeconds = 300;
const fetchSession = (config: MarketplaceStripe, id: string) => config.stripe.checkout.sessions.retrieve(id, { expand: [`payment_intent.latest_charge`] });
const nowSeconds = () => Math.floor(Date.now() / 1_000);
const isPending = (order: MarketplaceOrderRecord) => order.status === `pending`;
const canRetryPurchase = (order: MarketplaceOrderRecord) => order.status === `expired` || order.status === `failed`;
const stripeId = (value: string | { id: string } | null | undefined) => typeof value === `string` ? value : value?.id;

const paidChargeStatus = (order: MarketplaceOrderRecord, paymentIntentId: string, charge: Stripe.Charge) => {
  const destination = stripeId(charge.transfer_data?.destination);
  if (charge.livemode !== (order.mode === `live`) || stripeId(charge.payment_intent) !== paymentIntentId
    || charge.currency !== order.currency || charge.amount_captured !== order.amountCents || charge.status !== `succeeded`
    || !charge.paid || !charge.captured || (destination && destination !== order.stripeAccountId)) throw providerError();
  return destination && stripeId(charge.transfer) ? `transferred` as const : `review_required` as const;
};

const refreshSellerFundsStatus = async (config: MarketplaceStripe, order: MarketplaceOrderRecord) => {
  if (order.status !== `paid` || !modeMatches(config, order) || !order.stripeChargeId || !order.stripePaymentIntentId) return order;
  const charge = await config.stripe.charges.retrieve(order.stripeChargeId);
  const sellerFundsStatus = paidChargeStatus(order, order.stripePaymentIntentId, charge);
  if (sellerFundsStatus === order.sellerFundsStatus) return order;
  await recordSellerFundsStatus(order.id, charge.id, sellerFundsStatus);
  return { ...order, sellerFundsStatus };
};

const applyStripeSession = async (config: MarketplaceStripe, order: MarketplaceOrderRecord, session: Stripe.Checkout.Session, providerFailure = false) => {
  if (!modeMatches(config, order) || session.livemode !== (order.mode === `live`) || session.mode !== `payment`
    || session.metadata?.app !== marketplaceStripeApp || session.metadata?.order_id !== order.id || session.client_reference_id !== order.id
    || session.amount_total !== order.amountCents || session.currency !== order.currency || session.expires_at !== order.expiresAtSeconds
    || order.stripeCheckoutSessionId && order.stripeCheckoutSessionId !== session.id) throw providerError();
  const intent = typeof session.payment_intent === `string` ? await config.stripe.paymentIntents.retrieve(session.payment_intent, { expand: [`latest_charge`] }) : session.payment_intent;
  const paid = session.payment_status === `paid`;
  if (paid || intent) {
    const destination = intent?.transfer_data?.destination;
    if (!intent || intent.livemode !== (order.mode === `live`) || intent.metadata?.app !== marketplaceStripeApp || intent.metadata?.order_id !== order.id
      || intent.currency !== order.currency || intent.amount !== order.amountCents || intent.application_fee_amount !== order.commissionCents
      || stripeId(destination) !== order.stripeAccountId
      || paid && (session.status !== `complete` || intent.status !== `succeeded` || intent.amount_received !== order.amountCents)) throw providerError();
  }
  if (paid && intent) {
    const charge = typeof intent.latest_charge === `string` ? await config.stripe.charges.retrieve(intent.latest_charge) : intent.latest_charge;
    if (!charge) throw providerError();
    const sellerFundsStatus = paidChargeStatus(order, intent.id, charge);
    return applyOrderResult(order, { sellerFundsStatus, status: `paid`, sessionId: session.id, chargeId: charge.id, paymentIntentId: intent.id });
  }
  const failed = session.status === `complete` && (intent?.status === `canceled` || intent?.status === `requires_payment_method` || providerFailure && !intent);
  const status = session.status === `expired` ? `expired` : failed ? `failed` : `pending`;
  return applyOrderResult(order, { status, sessionId: session.id, paymentIntentId: intent?.id ?? null });
};

const recoverOrder = async (config: MarketplaceStripe, order: MarketplaceOrderRecord) => {
  if (!isPending(order) || !modeMatches(config, order)) return order;
  if (order.stripeCheckoutSessionId) return applyStripeSession(config, order, await fetchSession(config, order.stripeCheckoutSessionId));
  if (nowSeconds() < order.expiresAtSeconds + stripeUnboundRecoveryDelaySeconds) return order;
  const created = { gte: Math.floor(Date.parse(order.createdAt) / 1_000) - 60, lte: order.expiresAtSeconds };
  let after: string | undefined;
  for (let page = 0; page < 3; page += 1) {
    const sessions = await config.stripe.checkout.sessions.list({ created, limit: 100, starting_after: after });
    const match = sessions.data.find(session => session.metadata?.app === marketplaceStripeApp && session.metadata?.order_id === order.id);
    if (match) return applyStripeSession(config, order, await fetchSession(config, match.id));
    if (!sessions.has_more) return applyOrderResult(order, { status: `expired`, sessionId: null, paymentIntentId: null });
    after = sessions.data.at(-1)?.id;
    if (!after) break;
  }
  return order;
};

const createSession = async (config: MarketplaceStripe, order: MarketplaceOrderRecord) => {
  const metadata = { app: marketplaceStripeApp, order_id: order.id };
  const returnQuery = { marketplaceOrder: order.id };
  return config.stripe.checkout.sessions.create({
    mode: `payment`,
    client_reference_id: order.id,
    adaptive_pricing: { enabled: false },
    expires_at: order.expiresAtSeconds,
    integration_identifier: `marketplace_checkout_kbwemlqz`,
    success_url: marketplaceReturnUrl(returnQuery, order.returnOrigin),
    cancel_url: marketplaceReturnUrl({ ...returnQuery, marketplaceCheckout: `cancelled` }, order.returnOrigin),
    line_items: [{ quantity: 1, price_data: { currency: order.currency, unit_amount: order.amountCents, product_data: { name: order.domain } } }],
    payment_intent_data: { metadata, application_fee_amount: order.commissionCents, transfer_data: { destination: order.stripeAccountId } },
    metadata,
  }, { idempotencyKey: `marketplace-checkout-${order.id}` });
};

const continueOrder = async (config: MarketplaceStripe, order: MarketplaceOrderRecord, actor: BillingActor, offerId: string | null, recheckSeller = false): Promise<MarketplaceCheckout | null> => {
  if (!modeMatches(config, order)) throw reservedError();
  const owned = order.buyerId === actor.id && order.offerId === offerId;
  if (!owned || !order.stripeCheckoutSessionId && nowSeconds() > order.expiresAtSeconds - stripeSessionCreationLeadSeconds) {
    if (!owned && nowSeconds() < order.expiresAtSeconds) throw reservedError();
    const recovered = await recoverOrder(config, order);
    if (canRetryPurchase(recovered)) return null;
    if (!owned) throw reservedError();
    return { url: null, order: participantOrder(recovered, actor.id) };
  }
  const current = recheckSeller && !order.stripeCheckoutSessionId ? await confirmCheckoutRetry(actor, order) : order;
  if (!isPending(current)) return canRetryPurchase(current) ? null : { url: null, order: participantOrder(current, actor.id) };
  if (recheckSeller && !current.stripeCheckoutSessionId) {
    const seller = await getCheckoutSeller(actor, current.listingId, current.offerId, config.mode);
    if (seller.sellerId !== current.sellerId || seller.accountId !== current.stripeAccountId) throw reservedError();
    await assertStripeSellerReady(config, seller.accountId, seller.sellerId);
  }
  const session = current.stripeCheckoutSessionId ? await fetchSession(config, current.stripeCheckoutSessionId) : await createSession(config, current);
  const updated = await applyStripeSession(config, current, session);
  if (canRetryPurchase(updated)) return null;
  const url = isPending(updated) && session.status === `open` ? marketplaceStripeUrl(session.url, `checkout.stripe.com`) : null;
  return { url, order: participantOrder(updated, actor.id) };
};

export const startCheckout = async (actor: BillingActor, listingId: string, offerId: string | null, origin: string): Promise<MarketplaceCheckout> => {
  const config = requireMarketplaceStripe();
  const locked = await getLockedOrder(listingId);
  if (locked) {
    const existing = await continueOrder(config, locked, actor, offerId, true);
    if (existing) return existing;
  }
  const seller = await getCheckoutSeller(actor, listingId, offerId, config.mode);
  await assertStripeSellerReady(config, seller.accountId, seller.sellerId);
  const thread = await openMarketplaceThread(actor, listingId);
  const order = await reserveOrder(actor, listingId, offerId, thread.id, origin, config.mode, seller);
  const checkout = await continueOrder(config, order, actor, offerId);
  if (!checkout) throw new BillingError(409, `marketplace_checkout_ended`, `This Checkout Ended — Try Again`);
  return checkout;
};

export const getCheckoutOrder = async (actor: BillingActor, id: string) => {
  const order = await getParticipantOrder(actor, id);
  const config = getMarketplaceStripe();
  if (!config) return participantOrder(order, actor.id);
  if (isPending(order)) return participantOrder(await recoverOrder(config, order), actor.id);
  return participantOrder(actor.id === order.sellerId ? await refreshSellerFundsStatus(config, order) : order, actor.id);
};

export const cancelCheckout = async (actor: BillingActor, id: string) => {
  const config = requireMarketplaceStripe();
  const order = await getParticipantOrder(actor, id);
  if (order.buyerId !== actor.id) throw new BillingError(403, `marketplace_checkout_buyer_only`, `Only The Buyer Can Cancel Checkout`);
  if (!isPending(order) || !modeMatches(config, order) || !order.stripeCheckoutSessionId) return participantOrder(await recoverOrder(config, order), actor.id);
  const session = await fetchSession(config, order.stripeCheckoutSessionId);
  if (session.status === `open`) {
    await config.stripe.checkout.sessions.expire(session.id, {}, { idempotencyKey: `marketplace-cancel-${order.id}` }).catch((failure: unknown) => {
      if ((failure as { statusCode?: number })?.statusCode !== 400) throw failure;
    });
    return participantOrder(await applyStripeSession(config, order, await fetchSession(config, session.id)), actor.id);
  }
  return participantOrder(await applyStripeSession(config, order, session), actor.id);
};

export const reconcileCheckoutEvent = async (config: MarketplaceStripe, event: Stripe.Event) => {
  if (event.account) return;
  if (event.type === `charge.updated`) {
    const charge = event.data.object;
    if (charge.metadata?.app !== marketplaceStripeApp || !validOrderId(charge.metadata?.order_id)) return;
    const order = await getOrderRecord(charge.metadata.order_id);
    if (order?.stripeChargeId === charge.id) await refreshSellerFundsStatus(config, order);
    return;
  }
  if (!checkoutEvents.has(event.type)) return;
  const snapshot = event.data.object as Stripe.Checkout.Session;
  if (snapshot.metadata?.app !== marketplaceStripeApp) return;
  const id = snapshot.metadata?.order_id;
  if (!validOrderId(id) || !/^cs_(?:test|live)_[A-Za-z0-9_]{1,240}$/.test(snapshot.id)) throw providerError();
  const order = await getOrderRecord(id);
  if (!order) throw providerError();
  if (!isPending(order)) return;
  await applyStripeSession(config, order, await fetchSession(config, snapshot.id), event.type === `checkout.session.async_payment_failed`);
};
