import type Stripe from 'stripe';
import { BillingError } from '../billing/types';
import { marketId } from '../marketplace/records';
import { MarketplaceError, requireMarketplaceActor } from '../marketplace/access';
import { checkMarketplacePaymentOrigin, requireMarketplaceStripe } from './config';
import { listParticipantOrders, validOrderId } from './orders';
import { createSellerDashboard, createSellerOnboarding, getSellerPayoutStatus } from './sellers';
import { cancelCheckout, getCheckoutOrder, reconcileCheckoutEvent, startCheckout } from './checkout';

const headers = { Vary: `Authorization`, 'Cache-Control': `private, no-store`, 'Referrer-Policy': `no-referrer`, 'X-Content-Type-Options': `nosniff` };
const badRequest = () => new BillingError(400, `marketplace_invalid_request`, `Send A Valid Marketplace Payment Request`);
const paymentError = (failure: unknown, webhook = false) => {
  const error = failure instanceof BillingError || failure instanceof MarketplaceError ? failure
    : new BillingError(503, `marketplace_payment_unavailable`, `Marketplace Payments Are Temporarily Unavailable — Try Again`);
  return Response.json({ error: error.message, ...(error instanceof BillingError ? { code: error.code } : {}) }, { headers, status: webhook && error.status === 409 ? 503 : error.status });
};

const readBody = async (request: Request, maxBytes: number) => {
  const tooLarge = () => new BillingError(413, `marketplace_request_too_large`, `Marketplace Payment Request Is Too Large`);
  const length = request.headers.get(`content-length`);
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) throw tooLarge();
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  let size = 0;
  const parts: Uint8Array[] = [];
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw tooLarge(); }
      parts.push(part.value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(parts, size);
};
const readJson = async (request: Request, fields: readonly string[]) => {
  if (request.headers.get(`content-type`)?.split(`;`)?.[0]?.trim() !== `application/json`) throw new BillingError(415, `marketplace_json_required`, `Send Marketplace Payment Requests As JSON`);
  const body = await readBody(request, 4_096);
  let input: unknown;
  try { input = JSON.parse(body.toString(`utf8`)); } catch { throw badRequest(); }
  if (!input || typeof input !== `object` || Array.isArray(input) || Object.keys(input).some(field => !fields.includes(field))) throw badRequest();
  return input as Record<string, unknown>;
};

export const handleSellerPayments = async (request: Request) => {
  try {
    const origin = checkMarketplacePaymentOrigin(request);
    const actor = await requireMarketplaceActor(request);
    if (request.method === `GET`) return Response.json(await getSellerPayoutStatus(actor), { headers });
    const input = await readJson(request, [`action`]);
    if (input.action !== `setup` && input.action !== `dashboard`) throw badRequest();
    const link = input.action === `setup` ? await createSellerOnboarding(actor, origin) : await createSellerDashboard(actor);
    return Response.json(link, { headers });
  } catch (failure) { return paymentError(failure); }
};

export const handleMarketplaceCheckout = async (request: Request) => {
  try {
    const origin = checkMarketplacePaymentOrigin(request);
    const actor = await requireMarketplaceActor(request);
    if (request.method === `GET`) {
      const query = new URL(request.url).searchParams;
      const side = query.get(`side`);
      const id = query.get(`orderId`);
      if (query.size !== 1) throw badRequest();
      if (validOrderId(id)) return Response.json(await getCheckoutOrder(actor, id), { headers });
      if (side === `buying` || side === `selling`) return Response.json(await listParticipantOrders(actor, side), { headers });
      throw badRequest();
    }
    const input = await readJson(request, [`listingId`, `offerId`, `cancelOrderId`]);
    if (`cancelOrderId` in input) {
      if (!validOrderId(input.cancelOrderId) || Object.keys(input).length !== 1) throw badRequest();
      return Response.json(await cancelCheckout(actor, input.cancelOrderId), { headers });
    }
    const listingId = marketId(input.listingId, `MarketListing`);
    const offerId = input.offerId === undefined ? null : marketId(input.offerId, `MarketOffer`);
    return Response.json(await startCheckout(actor, listingId, offerId, origin), { headers });
  } catch (failure) { return paymentError(failure); }
};

export const handleMarketplaceWebhook = async (request: Request) => {
  try {
    const signature = request.headers.get(`stripe-signature`);
    if (!signature || signature.length > 2_048) throw new BillingError(400, `marketplace_signature_invalid`, `Stripe Signature Is Required`);
    const body = await readBody(request, 1_000_000);
    const config = requireMarketplaceStripe();
    let event: Stripe.Event;
    try { event = config.stripe.webhooks.constructEvent(body, signature, config.secret); }
    catch { throw new BillingError(400, `marketplace_signature_invalid`, `Stripe Signature Could Not Be Verified`); }
    if (event.livemode !== (config.mode === `live`)) throw new BillingError(400, `marketplace_mode_mismatch`, `This Stripe Event Is For A Different Payment Mode`);
    await reconcileCheckoutEvent(config, event);
    return Response.json({ received: true }, { headers });
  } catch (failure) { return paymentError(failure, true); }
};
