import { counter } from '../marketplace/records';
import type { DocumentData } from 'firebase-admin/firestore';
import { getBillingDatabase } from '../billing/firebase';
import { verifyListingDns } from '../marketplace/listings';
import { BillingError, type BillingActor } from '../billing/types';
import { getAppCollectionIDNumber } from '../../shared/common/ids';
import { marketplaceSellerPath, validStripeAccountId } from './sellers';
import { assertSellerEligible, confirmMarketplaceActor } from '../marketplace/access';
import type { MarketplaceOrder, MarketplaceOrderSide, MarketplacePaymentMode } from '../../shared/marketplace/paymentTypes';

export interface MarketplaceOrderRecord extends MarketplaceOrder {
  returnOrigin: string;
  expiresAtSeconds: number;
  stripeAccountId: string;
  stripeChargeId: string | null;
  stripePaymentIntentId: string | null;
  stripeCheckoutSessionId: string | null;
}

const database = getBillingDatabase;
const orders = () => database().collection(`marketplaceOrders`);
const lock = (listingId: string) => database().doc(`marketplaceCheckoutLocks/${listingId}`);
const invalidOrder = () => new BillingError(503, `marketplace_order_unavailable`, `The Marketplace Order Could Not Be Confirmed`);
const missingListing = () => new BillingError(404, `marketplace_listing_unavailable`, `This Domain Listing Is Unavailable`);
const reservedListing = () => new BillingError(409, `marketplace_listing_reserved`, `This Domain Is Reserved For An Accepted Offer`);
const unavailableOffer = () => new BillingError(403, `marketplace_offer_unavailable`, `This Accepted Offer Is Unavailable`);

export const validOrderId = (value: unknown): value is string => typeof value === `string` && value.length <= 250 && !/[/\u0000-\u001f\u007f]/.test(value) && getAppCollectionIDNumber(value, `MarketOrder`) > 0;
export const readOrderRecord = (data: DocumentData | undefined, id: string) => {
  if (!data) return null;
  if (!validOrderId(id) || data.id !== id || getAppCollectionIDNumber(id, `MarketOrder`) !== data.number) throw invalidOrder();
  return data as MarketplaceOrderRecord;
};
export const participantOrder = (order: MarketplaceOrderRecord, actorId: string): MarketplaceOrder => ({
  id: order.id,
  mode: order.mode,
  number: order.number,
  domain: order.domain,
  paidAt: order.paidAt,
  status: order.status,
  offerId: order.offerId,
  buyerId: order.buyerId,
  sellerId: order.sellerId,
  threadId: order.threadId,
  currency: order.currency,
  listingId: order.listingId,
  createdAt: order.createdAt,
  amountCents: order.amountCents,
  sellerFundsStatus: actorId === order.sellerId ? order.sellerFundsStatus ?? null : null,
  transferStatus: order.transferStatus,
  commissionCents: order.commissionCents,
});
export const getOrderRecord = async (id: string) => readOrderRecord((await orders().doc(id).get()).data(), id);
export const getParticipantOrder = async (actor: BillingActor, id: string) => {
  const order = await getOrderRecord(id);
  if (!order || order.sellerId !== actor.id && order.buyerId !== actor.id) throw new BillingError(404, `marketplace_order_not_found`, `Marketplace Order Was Not Found`);
  return order;
};
export const listParticipantOrders = async (actor: BillingActor, side: MarketplaceOrderSide) => {
  const result = await orders().where(side === `selling` ? `sellerId` : `buyerId`, `==`, actor.id).orderBy(`number`, `desc`).limit(50).get();
  return result.docs.map(doc => participantOrder(readOrderRecord(doc.data(), doc.id) as MarketplaceOrderRecord, actor.id));
};
export const getLockedOrder = async (listingId: string) => {
  const reservation = (await lock(listingId).get()).data();
  if (!reservation) return null;
  if (!validOrderId(reservation.orderId)) throw invalidOrder();
  const order = await getOrderRecord(reservation.orderId);
  if (!order || order.listingId !== listingId) throw invalidOrder();
  return order;
};

const availableListing = (data: DocumentData | undefined, actor: BillingActor, offerId: string | null) => {
  if (data?.status !== `active` || data?.afternicHold || typeof data?.domain !== `string` || typeof data?.sellerId !== `string`
    || data?.currency !== `usd` || !Number.isFinite(Date.parse(data?.ownershipVerifiedAt ?? ``))) throw missingListing();
  if (data.sellerId === actor.id) throw new BillingError(400, `marketplace_own_listing`, `You Cannot Buy Your Own Domain Listing`);
  if (data.acceptedOfferId && data.acceptedOfferId !== offerId) throw reservedListing();
  if (offerId && data.acceptedOfferId !== offerId) throw unavailableOffer();
  return data;
};

export const getCheckoutSeller = async (actor: BillingActor, listingId: string, offerId: string | null, mode: MarketplacePaymentMode) => {
  const firestore = database();
  const listing = availableListing((await firestore.doc(`marketplaceListings/${listingId}`).get()).data(), actor, offerId);
  const sellerId = listing.sellerId as string;
  const challenge = listing.challenge;
  if (typeof challenge !== `string` || !challenge) throw missingListing();
  const accountId = (await firestore.doc(marketplaceSellerPath(sellerId, mode)).get()).data()?.stripeAccountId;
  if (!validStripeAccountId(accountId)) throw new BillingError(409, `marketplace_seller_payouts_required`, `The Seller Needs To Set Up Stripe Before You Can Buy This Domain`);
  await verifyListingDns({ domain: listing.domain, challenge });
  return { sellerId, accountId, challenge };
};

export const reserveOrder = async (actor: BillingActor, listingId: string, offerId: string | null, threadId: string, origin: string, mode: MarketplacePaymentMode, seller: Awaited<ReturnType<typeof getCheckoutSeller>>) => {
  const firestore = database();
  const lockRef = lock(listingId);
  const listingRef = firestore.doc(`marketplaceListings/${listingId}`);
  const order = await firestore.runTransaction(async transaction => {
    await confirmMarketplaceActor(transaction, firestore, actor);
    const [listingSnapshot, lockSnapshot] = await transaction.getAll(listingRef, lockRef);
    if (lockSnapshot.exists) {
      const orderId = lockSnapshot.get(`orderId`);
      if (!validOrderId(orderId)) throw invalidOrder();
      const existing = readOrderRecord((await transaction.get(orders().doc(orderId))).data(), orderId);
      if (!existing || existing.listingId !== listingId) throw invalidOrder();
      return existing;
    }
    const listing = availableListing(listingSnapshot.data(), actor, offerId);
    if (listing.sellerId !== seller.sellerId || listing.challenge !== seller.challenge) throw missingListing();
    await assertSellerEligible(transaction, firestore, seller.sellerId);
    const bindingRef = firestore.doc(marketplaceSellerPath(seller.sellerId, mode));
    const [binding, threadSnapshot] = await transaction.getAll(bindingRef, firestore.doc(`marketplaceThreads/${threadId}`));
    if (binding.get(`stripeAccountId`) !== seller.accountId) throw new BillingError(409, `marketplace_seller_payouts_changed`, `The Seller’s Stripe Setup Changed — Try Again`);
    const thread = threadSnapshot.data();
    if (!thread || thread.id !== threadId || thread.listingId !== listingId || thread.sellerId !== seller.sellerId || thread.buyerId !== actor.id) throw invalidOrder();
    const offer = offerId ? (await transaction.get(firestore.doc(`marketplaceOffers/${offerId}`))).data() : null;
    if (offerId && (offer?.status !== `accepted` || offer?.listingId !== listingId || offer?.buyerId !== actor.id
      || offer?.sellerId !== seller.sellerId || offer?.currency !== `usd` || offer?.threadId !== threadId || thread.offerId !== offerId)) throw unavailableOffer();
    const amountCents = offerId ? offer?.amountCents : listing.priceCents;
    if (typeof amountCents !== `number` || !Number.isSafeInteger(amountCents) || amountCents < 100 || amountCents > 99_999_999) {
      throw new BillingError(409, `marketplace_price_unavailable`, `There Is No Available USD Price For This Domain`);
    }
    const created = new Date();
    const createdAt = created.toISOString();
    const { id, number, commit } = await counter(transaction, firestore, `marketplaceOrders`, `MarketOrder`, listing.domain, createdAt);
    const record: MarketplaceOrderRecord = {
      id, mode, number, offerId, threadId, listingId, createdAt, amountCents,
      paidAt: null,
      currency: `usd`,
      buyerId: actor.id,
      status: `pending`,
      domain: listing.domain,
      returnOrigin: origin,
      transferStatus: null,
      stripeChargeId: null,
      sellerFundsStatus: null,
      sellerId: seller.sellerId,
      stripePaymentIntentId: null,
      stripeCheckoutSessionId: null,
      stripeAccountId: seller.accountId,
      commissionCents: Math.round(amountCents * 3 / 100),
      expiresAtSeconds: Math.floor(created.valueOf() / 1000) + 7_200,
    };
    commit();
    transaction.create(lockRef, { orderId: id, listingId, mode });
    transaction.create(orders().doc(id), record);
    return record;
  });
  return order;
};

export const confirmCheckoutRetry = async (actor: BillingActor, order: MarketplaceOrderRecord) => {
  const firestore = database();
  return firestore.runTransaction(async transaction => {
    await confirmMarketplaceActor(transaction, firestore, actor);
    const [snapshot, reservation] = await transaction.getAll(orders().doc(order.id), lock(order.listingId));
    const current = readOrderRecord(snapshot.data(), order.id);
    if (!current || current.buyerId !== actor.id) throw invalidOrder();
    if (current.status === `pending` && !current.stripeCheckoutSessionId) {
      if (reservation.get(`orderId`) !== current.id) throw invalidOrder();
      await assertSellerEligible(transaction, firestore, current.sellerId);
    }
    return current;
  });
};

type ProviderResult = {
  status: MarketplaceOrder[`status`];
  sessionId: string | null;
  paymentIntentId: string | null;
  chargeId?: string;
  sellerFundsStatus?: MarketplaceOrder[`sellerFundsStatus`];
};
export const applyOrderResult = async (order: MarketplaceOrderRecord, result: ProviderResult) => {
  const firestore = database();
  return firestore.runTransaction(async transaction => {
    const reference = orders().doc(order.id);
    const lockReference = lock(order.listingId);
    const [snapshot, reservation] = await transaction.getAll(reference, lockReference);
    const current = readOrderRecord(snapshot.data(), order.id);
    if (!current) throw invalidOrder();
    if (current.status !== `pending`) return current;
    if (current.stripeCheckoutSessionId && !result.sessionId) return current;
    if (current.stripeCheckoutSessionId && current.stripeCheckoutSessionId !== result.sessionId || reservation.get(`orderId`) !== order.id) throw invalidOrder();
    if (current.stripePaymentIntentId && result.paymentIntentId && current.stripePaymentIntentId !== result.paymentIntentId) throw invalidOrder();
    const paid = result.status === `paid`;
    if (paid && (!result.chargeId || !result.sellerFundsStatus)) throw invalidOrder();
    if (paid && current.mode === `live`) {
      const listingReference = firestore.doc(`marketplaceListings/${current.listingId}`);
      const offerReference = current.offerId ? firestore.doc(`marketplaceOffers/${current.offerId}`) : null;
      const threadReference = firestore.doc(`marketplaceThreads/${current.threadId}`);
      const listing = (await transaction.get(listingReference)).data();
      const offer = offerReference ? (await transaction.get(offerReference)).data() : null;
      const thread = (await transaction.get(threadReference)).data();
      if (listing?.status !== `active` || listing.sellerId !== current.sellerId || listing.domain !== current.domain
        || offerReference && (offer?.status !== `accepted` || offer?.buyerId !== current.buyerId || offer?.amountCents !== current.amountCents)
        || thread?.sellerId !== current.sellerId || thread?.buyerId !== current.buyerId) throw invalidOrder();
      const updatedAt = new Date().toISOString();
      transaction.update(listingReference, { status: `sold`, updatedAt, acceptedOfferId: null });
      if (offerReference) transaction.update(offerReference, { status: `paid`, updatedAt });
      transaction.update(threadReference, { updatedAt });
    }
    const fields = {
      status: result.status,
      paidAt: paid ? new Date().toISOString() : null,
      stripeChargeId: result.chargeId ?? null,
      sellerFundsStatus: result.sellerFundsStatus ?? null,
      transferStatus: paid && current.mode === `live` ? `awaiting_transfer` as const : null,
      stripeCheckoutSessionId: result.sessionId,
      stripePaymentIntentId: result.paymentIntentId ?? current.stripePaymentIntentId,
    };
    if (current.status !== fields.status || current.stripeCheckoutSessionId !== fields.stripeCheckoutSessionId || current.stripePaymentIntentId !== fields.stripePaymentIntentId) transaction.update(reference, fields);
    if (result.status !== `pending`) transaction.delete(lockReference);
    return { ...current, ...fields };
  });
};

export const recordSellerFundsStatus = async (orderId: string, chargeId: string, sellerFundsStatus: MarketplaceOrder[`sellerFundsStatus`]) => {
  const firestore = database();
  await firestore.runTransaction(async transaction => {
    const reference = orders().doc(orderId);
    const order = readOrderRecord((await transaction.get(reference)).data(), orderId);
    if (order?.status === `paid` && order.stripeChargeId === chargeId && order.sellerFundsStatus !== sellerFundsStatus) {
      transaction.update(reference, { sellerFundsStatus });
    }
  });
};
