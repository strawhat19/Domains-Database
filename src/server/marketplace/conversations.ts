import { getBillingDatabase } from '../billing/firebase';
import type { BillingActor } from '../billing/types';
import type { Firestore, Transaction, DocumentData } from 'firebase-admin/firestore';
import { assertSellerEligible, confirmMarketplaceActor, MarketplaceError } from './access';
import { centsValue, conflict, counter, invalid, marketId, notFound, requestId, safeHash, safePhoto, textValue } from './records';
import type { MarketplaceMessage, MarketplaceOffer, MarketplaceThread } from '../../shared/marketplace/types';

type ThreadRecord = Omit<MarketplaceThread, `otherName` | `otherPhotoURL` | `offer` | `hasUnread`> & {
  participantIds: string[];
  offerId: string | null;
  lastBuyerMessage?: number;
  lastSellerMessage?: number;
};
const threadPath = (id: string) => `marketplaceThreads/${id}`;
const offerPath = (id: string) => `marketplaceOffers/${id}`;
const listingPath = (id: string) => `marketplaceListings/${id}`;
const lockPath = (id: string) => `marketplaceCheckoutLocks/${id}`;
const chatLimit = 30;
const participant = (thread: ThreadRecord | undefined, actor: BillingActor): thread is ThreadRecord => !!thread && [thread.sellerId, thread.buyerId].includes(actor.id);
const noThread = () => notFound(`This Marketplace Conversation Is Unavailable`);
const publicIdentity = (user: DocumentData | undefined, fallback: string) => {
  if (user?.active !== true || user?.profilePrivacy !== `public`) return { otherName: fallback };
  return { otherName: typeof user.name === `string` ? user.name.slice(0, 100) || fallback : fallback, otherPhotoURL: safePhoto(user.photoURL) };
};
const projectThread = (thread: ThreadRecord, actor: BillingActor, other?: DocumentData, offer?: MarketplaceOffer, readNumber?: number): MarketplaceThread => ({
  id: thread.id, number: thread.number, domain: thread.domain, buyerId: thread.buyerId, sellerId: thread.sellerId,
  listingId: thread.listingId, updatedAt: thread.updatedAt, offer: offer ?? null, ...publicIdentity(other, thread.buyerId === actor.id ? `Seller` : `Buyer`),
  ...(readNumber === undefined ? {} : { hasUnread: (thread.buyerId === actor.id ? thread.lastSellerMessage ?? 0 : thread.lastBuyerMessage ?? 0) > readNumber }),
});
const rate = async (transaction: Transaction, database: Firestore, actorId: string, action: string, limit: number) => {
  const window = Math.floor(Date.now() / 60_000);
  const reference = database.doc(`marketplaceRate/${safeHash(actorId, action)}`);
  const saved = (await transaction.get(reference)).data();
  const count = saved?.window === window ? Number(saved.count) : 0;
  if (!Number.isSafeInteger(count) || count >= limit) throw new MarketplaceError(429, `Too Many Marketplace Actions — Try Again In A Minute`);
  return () => transaction.set(reference, { window, count: count + 1 });
};

export const listMarketplaceThreads = async (actor: BillingActor, cursor: unknown) => {
  const database = getBillingDatabase();
  let query = database.collection(`marketplaceThreads`).where(`participantIds`, `array-contains`, actor.id).orderBy(`updatedAt`, `desc`);
  if (cursor) {
    const previous = await database.doc(threadPath(marketId(cursor, `MarketThread`))).get();
    if (!participant(previous.data() as ThreadRecord | undefined, actor)) throw noThread();
    query = query.startAfter(previous);
  }
  const snapshot = await query.limit(chatLimit + 1).get();
  const rows = snapshot.docs.slice(0, chatLimit).map(row => row.data() as ThreadRecord);
  const otherId = (thread: ThreadRecord) => thread.buyerId === actor.id ? thread.sellerId : thread.buyerId;
  const accounts = [...new Set(rows.map(otherId))];
  const ids = rows.flatMap(row => row.offerId ? [row.offerId] : []);
  const [users, offers, reads] = await Promise.all([
    accounts.length ? database.getAll(...accounts.map(id => database.doc(`users/${id}`))) : [],
    ids.length ? database.getAll(...ids.map(id => database.doc(offerPath(id)))) : [],
    rows.length ? database.getAll(...rows.map(row => database.doc(`${threadPath(row.id)}/readStates/${actor.id}`))) : [],
  ]);
  const identities = new Map(users.map(user => [user.id, user.data()]));
  const byOffer = new Map(offers.map(offer => [offer.id, offer.data() as MarketplaceOffer | undefined]));
  return { threads: rows.map((thread, index) => projectThread(thread, actor, identities.get(otherId(thread)), byOffer.get(thread.offerId ?? ``), reads[index]?.data()?.number ?? 0)), nextCursor: snapshot.size > chatLimit ? rows.at(-1)?.id ?? null : null };
};

export const getMarketplaceThread = async (actor: BillingActor, input: unknown) => {
  const database = getBillingDatabase();
  const id = marketId(input, `MarketThread`);
  const thread = (await database.doc(threadPath(id)).get()).data() as ThreadRecord | undefined;
  if (!participant(thread, actor)) throw noThread();
  const otherId = thread.buyerId === actor.id ? thread.sellerId : thread.buyerId;
  const [other, offer] = await Promise.all([
    database.doc(`users/${otherId}`).get(), thread.offerId ? database.doc(offerPath(thread.offerId)).get() : null,
  ]);
  return projectThread(thread, actor, other.data(), offer?.data() as MarketplaceOffer | undefined);
};

export const openMarketplaceThread = async (actor: BillingActor, input: unknown, inputAmount?: unknown) => {
  const database = getBillingDatabase();
  const listingId = marketId(input, `MarketListing`);
  const amountCents = inputAmount === undefined ? undefined : centsValue(inputAmount);
  const now = new Date().toISOString();
  return database.runTransaction(async transaction => {
    await confirmMarketplaceActor(transaction, database, actor);
    const [saved, lock] = await transaction.getAll(database.doc(listingPath(listingId)), database.doc(lockPath(listingId)));
    const listing = saved.data();
    if (listing?.status !== `active` || !listing.ownershipVerifiedAt) throw notFound();
    if (listing.sellerId === actor.id) throw invalid(`Choose A Domain From Another Seller`);
    const seller = (await transaction.get(database.doc(`users/${listing.sellerId}`))).data();
    if (seller?.active !== true) throw notFound();
    const pair = database.doc(`marketplaceThreadPairs/${safeHash(listingId, actor.id)}`);
    const threadId = (await transaction.get(pair)).data()?.threadId;
    const thread = typeof threadId === `string` ? (await transaction.get(database.doc(threadPath(threadId)))).data() as ThreadRecord | undefined : undefined;
    if (threadId && !participant(thread, actor)) throw noThread();
    const offer = thread?.offerId ? (await transaction.get(database.doc(offerPath(thread.offerId)))).data() as MarketplaceOffer | undefined : undefined;
    if (amountCents === undefined && thread) return projectThread(thread, actor, seller, offer);
    if (amountCents !== undefined) {
      if (offer?.status === `pending` && offer.amountCents === amountCents && thread) return projectThread(thread, actor, seller, offer);
      if (!listing.acceptOffers || listing.acceptedOfferId || lock.exists || offer?.status === `pending` || offer?.status === `accepted`) throw conflict(`This Listing Already Has An Offer Or Is Unavailable For New Offers`);
      await assertSellerEligible(transaction, database, listing.sellerId);
    }
    const writeRate = await rate(transaction, database, actor.id, `inquiry`, 10);
    const identity = thread ? null : await counter(transaction, database, `marketplaceThreads`, `MarketThread`, listing.domain, now);
    const offerIdentity = amountCents !== undefined ? await counter(transaction, database, `marketplaceOffers`, `MarketOffer`, listing.domain, now) : null;
    const nextThread: ThreadRecord = thread ? { ...thread, updatedAt: now } : {
      id: identity!.id, number: identity!.number, offerId: null, listingId, updatedAt: now, domain: listing.domain, buyerId: actor.id, sellerId: listing.sellerId, participantIds: [actor.id, listing.sellerId],
    };
    const nextOffer: MarketplaceOffer | undefined = offerIdentity && amountCents !== undefined ? {
      id: offerIdentity.id, number: offerIdentity.number, threadId: nextThread.id, buyerId: actor.id, listingId, sellerId: listing.sellerId, status: `pending`, currency: `usd`, amountCents, createdAt: now,
    } : offer;
    if (offerIdentity && nextOffer) {
      nextThread.offerId = nextOffer.id;
      transaction.create(database.doc(offerPath(nextOffer.id)), nextOffer);
      offerIdentity.commit();
    }
    if (identity) {
      transaction.create(database.doc(threadPath(nextThread.id)), nextThread);
      transaction.create(pair, { threadId: nextThread.id });
      identity.commit();
    } else transaction.update(database.doc(threadPath(nextThread.id)), { offerId: nextThread.offerId, updatedAt: now });
    writeRate();
    return projectThread(nextThread, actor, seller, nextOffer);
  });
};

export const updateMarketplaceOffer = async (actor: BillingActor, input: unknown, action: unknown) => {
  const database = getBillingDatabase();
  const id = marketId(input, `MarketOffer`);
  if (action !== `accepted` && action !== `declined` && action !== `withdrawn`) throw invalid();
  return database.runTransaction(async transaction => {
    await confirmMarketplaceActor(transaction, database, actor);
    const ref = database.doc(offerPath(id));
    const offer = (await transaction.get(ref)).data() as MarketplaceOffer | undefined;
    if (!offer || (action === `withdrawn` ? offer.buyerId !== actor.id : offer.sellerId !== actor.id)) throw noThread();
    if (offer.status === action) return offer;
    const listing = database.doc(listingPath(offer.listingId));
    const thread = database.doc(threadPath(offer.threadId));
    const [saved, lock, chat] = await transaction.getAll(listing, database.doc(lockPath(offer.listingId)), thread);
    const data = saved.data();
    if (lock.exists || data?.status === `sold` || chat.data()?.offerId !== id || ![`pending`, `accepted`].includes(offer.status)) throw conflict(`This Offer Is No Longer Available`);
    if (action === `accepted`) {
      await assertSellerEligible(transaction, database, actor.id);
      if (data?.status !== `active` || data?.acceptedOfferId || !data?.acceptOffers) throw conflict(`This Listing Is Not Available For Acceptance`);
      if ((await transaction.get(database.doc(`users/${offer.buyerId}`))).data()?.active !== true) throw conflict(`The Buyer Is No Longer Available`);
      transaction.update(listing, { acceptedOfferId: id });
    } else if (data?.acceptedOfferId === id) transaction.update(listing, { acceptedOfferId: null });
    transaction.update(ref, { status: action });
    transaction.update(thread, { updatedAt: new Date().toISOString() });
    return { ...offer, status: action };
  });
};

export const sendMarketplaceMessage = async (actor: BillingActor, body: Record<string, unknown>) => {
  const database = getBillingDatabase();
  const threadId = marketId(body.threadId, `MarketThread`);
  const text = textValue(body.text, `A Message Between 1 And 2,000 Characters`, 2000);
  const attempt = requestId(body.attemptId);
  const now = new Date().toISOString();
  const thread = database.doc(threadPath(threadId));
  return database.runTransaction(async transaction => {
    await confirmMarketplaceActor(transaction, database, actor);
    const saved = (await transaction.get(thread)).data() as ThreadRecord | undefined;
    if (!participant(saved, actor)) throw noThread();
    const receipt = thread.collection(`receipts`).doc(safeHash(actor.id, attempt));
    const prior = (await transaction.get(receipt)).data();
    if (prior) {
      if (prior.fingerprint !== safeHash(text)) throw conflict(`This Send Attempt Already Contains Another Message`);
      const message = (await transaction.get(thread.collection(`messages`).doc(prior.messageId))).data();
      if (!message) throw noThread();
      return message as MarketplaceMessage;
    }
    const writeRate = await rate(transaction, database, actor.id, `message`, 30);
    const identity = await counter(transaction, database, ``, `MarketMessage`, `Message`, now, `${threadPath(threadId)}/counters/messages`);
    const message = { id: identity.id, text, number: identity.number, senderId: actor.id, createdAt: now };
    transaction.create(thread.collection(`messages`).doc(identity.id), message);
    transaction.create(receipt, { fingerprint: safeHash(text), messageId: identity.id });
    transaction.update(thread, { updatedAt: now, [saved.buyerId === actor.id ? `lastBuyerMessage` : `lastSellerMessage`]: message.number });
    identity.commit();
    writeRate();
    return message;
  });
};

export const markMarketplaceThreadRead = async (actor: BillingActor, body: Record<string, unknown>) => {
  const database = getBillingDatabase();
  const threadId = marketId(body.threadId, `MarketThread`);
  const messageId = marketId(body.messageId, `MarketMessage`);
  const thread = database.doc(threadPath(threadId));
  const receipt = thread.collection(`readStates`).doc(actor.id);
  return database.runTransaction(async transaction => {
    await confirmMarketplaceActor(transaction, database, actor);
    const [saved, message, prior] = await transaction.getAll(thread, thread.collection(`messages`).doc(messageId), receipt);
    if (!participant(saved.data() as ThreadRecord | undefined, actor)) throw noThread();
    const number = message.data()?.number;
    if (!Number.isSafeInteger(number) || number < 1 || message.data()?.id !== messageId) throw notFound(`Message Not Found`);
    const current = prior.data()?.number ?? 0;
    if (number > current) transaction.set(receipt, { number, messageId });
    return { number: Math.max(current, number) };
  });
};
