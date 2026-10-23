import type Stripe from 'stripe';
import { requireBillingActor } from './firebase';
import { BillingError, type CheckoutInput } from './types';
import { getBillingOrigin, getBillingStripe, getWebhookSecret } from './config';
import { beginBillingEvent, finishBillingEvent, getCustomerBillingAccount } from './store';
import { getBillingStatus, createBillingPortal, createBillingCheckout, reconcileBillingCheckout, syncBillingAccount } from './service';

const headers = { Vary: `Authorization`, 'Cache-Control': `private, no-store`, 'X-Content-Type-Options': `nosniff` };
const errorResponse = (failure: unknown, webhook = false) => {
  const error = failure instanceof BillingError ? failure : new BillingError(503, `billing_provider_unavailable`, `Billing Is Temporarily Unavailable — Try Again`);
  return Response.json({ code: error.code, error: error.message }, { headers, status: webhook && error.status === 409 ? 503 : error.status });
};
const checkAccountRequest = (request: Request, requireJson: boolean) => {
  const requestOrigin = new URL(request.url).origin;
  const canonical = getBillingOrigin();
  const local = process.env.NODE_ENV !== `production` && [`localhost`, `127.0.0.1`, `[::1]`].includes(new URL(request.url).hostname);
  const site = request.headers.get(`sec-fetch-site`);
  if ((!local && requestOrigin !== canonical) || (request.headers.get(`origin`) && request.headers.get(`origin`) !== requestOrigin)
    || (site && ![`same-origin`, `none`].includes(site))) throw new BillingError(403, `billing_origin_forbidden`, `Use The Domains Database Site To Manage Billing`);
  if (requireJson && request.headers.get(`content-type`)?.split(`;`)?.[0]?.trim() !== `application/json`) throw new BillingError(415, `billing_json_required`, `Send Billing Requests As JSON`);
};
const readInput = async (request: Request, fields: readonly string[]) => {
  const size = request.headers.get(`content-length`);
  if (size && (!/^\d+$/.test(size) || Number(size) > 4096)) throw new BillingError(413, `billing_request_too_large`, `Billing Request Is Too Large`);
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 4096) throw new BillingError(413, `billing_request_too_large`, `Billing Request Is Too Large`);
  let input: unknown;
  try { input = JSON.parse(raw); } catch { throw new BillingError(400, `billing_input_invalid`, `Send A Valid Billing Request`); }
  if (!input || typeof input !== `object` || Array.isArray(input) || Object.keys(input).some(key => !fields.includes(key))) throw new BillingError(400, `billing_input_invalid`, `Send A Valid Billing Request`);
  return input as Record<string, unknown>;
};
export const handleBillingStatus = async (request: Request) => {
  try { checkAccountRequest(request, false); return Response.json(await getBillingStatus(await requireBillingActor(request)), { headers }); }
  catch (failure) { return errorResponse(failure); }
};
export const handleBillingCheckout = async (request: Request) => {
  try {
    checkAccountRequest(request, true);
    const input = await readInput(request, [`planId`, `currency`, `priceCents`, `billingInterval`]);
    const result = await createBillingCheckout(await requireBillingActor(request), input as unknown as CheckoutInput);
    return Response.json(result, { headers });
  } catch (failure) { return errorResponse(failure); }
};
export const handleBillingPortal = async (request: Request) => {
  try { checkAccountRequest(request, true); await readInput(request, []); return Response.json(await createBillingPortal(await requireBillingActor(request)), { headers }); }
  catch (failure) { return errorResponse(failure); }
};
export const handleBillingReconcile = async (request: Request) => {
  try {
    checkAccountRequest(request, true);
    const input = await readInput(request, [`sessionId`]);
    if (typeof input.sessionId !== `string`) throw new BillingError(400, `billing_session_invalid`, `Choose A Valid Checkout Session`);
    return Response.json(await reconcileBillingCheckout(await requireBillingActor(request), input.sessionId), { headers });
  } catch (failure) { return errorResponse(failure); }
};

const supportedEvents = new Set([
  `invoice.paid`, `invoice.voided`, `invoice.payment_failed`, `invoice.marked_uncollectible`, `invoice.payment_action_required`,
  `checkout.session.expired`, `checkout.session.completed`, `checkout.session.async_payment_failed`, `checkout.session.async_payment_succeeded`,
  `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`,
]);
export const handleBillingWebhook = async (request: Request) => {
  let event: Stripe.Event | undefined;
  let eventToken: string | null = null;
  try {
    const size = request.headers.get(`content-length`);
    const signature = request.headers.get(`stripe-signature`);
    if (!signature || signature.length > 2048) throw new BillingError(400, `billing_signature_invalid`, `Stripe Signature Is Required`);
    if (size && (!/^\d+$/.test(size) || Number(size) > 1_000_000)) throw new BillingError(413, `billing_event_too_large`, `Stripe Event Is Too Large`);
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 1_000_000) throw new BillingError(413, `billing_event_too_large`, `Stripe Event Is Too Large`);
    const stripe = getBillingStripe();
    const secret = getWebhookSecret();
    try { event = stripe.webhooks.constructEvent(raw, signature, secret); }
    catch { throw new BillingError(400, `billing_signature_invalid`, `Stripe Signature Could Not Be Verified`); }
    if (!event.livemode) throw new BillingError(400, `billing_mode_mismatch`, `Live Stripe Events Are Required`);
    if (!supportedEvents.has(event.type)) return Response.json({ received: true }, { headers });
    eventToken = await beginBillingEvent(event.id, event.type);
    if (!eventToken) return Response.json({ received: true }, { headers });
    const object = event.data.object as { customer?: string | { id?: string } | null };
    const customerId = typeof object.customer === `string` ? object.customer : object.customer?.id;
    const account = customerId ? await getCustomerBillingAccount(customerId) : null;
    if (account) await syncBillingAccount(account, false);
    await finishBillingEvent(event.id, eventToken, true);
    return Response.json({ received: true }, { headers });
  } catch (failure) {
    if (event && eventToken) await finishBillingEvent(event.id, eventToken, false).catch(() => undefined);
    return errorResponse(failure, true);
  }
};
