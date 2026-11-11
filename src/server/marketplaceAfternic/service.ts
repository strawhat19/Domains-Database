import { randomUUID } from 'node:crypto';
import type { BillingActor } from '../billing/types';
import { getBillingDatabase } from '../billing/firebase';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { conflict, domainValue, marketId, notFound, safeHash } from '../marketplace/records';
import { saveMarketplaceListing, verifyListingDns, type ListingRecord } from '../marketplace/listings';
import { assertSellerEligible, assertPublicSellerProfile, confirmMarketplaceActor, MarketplaceError } from '../marketplace/access';
import type { AfternicActionResult, AfternicPublishReview } from '../../shared/marketplaceAfternic/types';
import { afternicMinimumOfferCents, createAfternicListing, getAfternicListing, type AfternicContext } from './provider';

type ConnectorListing = ListingRecord & { afternicLease?: { token: string; until: number } };
const listingRef = (database: Firestore, id: string) => database.doc(`marketplaceListings/${id}`);
const lockRef = (database: Firestore, id: string) => database.doc(`marketplaceCheckoutLocks/${id}`);
const claimRef = (database: Firestore, domain: string) => database.doc(`marketplaceDomainClaims/${safeHash(domain)}`);
const ownedListing = (value: ConnectorListing | undefined, actor: BillingActor) => {
  if (!value || value.sellerId !== actor.id) throw notFound();
  return value;
};

const assertOutboundListing = (listing: ListingRecord, locked: boolean) => {
  if (listing.status === `active`) throw conflict(`Pause The In-App Listing Before Sending It To Afternic`);
  if (listing.status === `sold` || listing.acceptedOfferId || locked) throw conflict(`This Domain Is Sold Or Has A Sale In Progress`);
  if (listing.status !== `draft` && listing.status !== `paused`) throw conflict(`Choose A Draft Or Paused Listing`);
};

const reviewPricing = ({ priceCents, acceptOffers }: ListingRecord) => {
  if (priceCents !== null && (!Number.isSafeInteger(priceCents) || priceCents < 100 || priceCents % 100 !== 0)) throw conflict(`Afternic Prices Must Be In Whole US Dollars — Update The Listing First`);
  if (acceptOffers && priceCents !== null && priceCents < afternicMinimumOfferCents) throw conflict(`The Buy Now Price Must Cover Afternic’s $20 Minimum Offer`);
  return { priceCents, acceptOffers, minimumOfferCents: acceptOffers ? afternicMinimumOfferCents : null };
};

const readOutboundListing = async (actor: BillingActor, id: string) => {
  const database = getBillingDatabase();
  const [saved, lock] = await database.getAll(listingRef(database, id), lockRef(database, id));
  const listing = ownedListing(saved.data() as ConnectorListing | undefined, actor);
  assertOutboundListing(listing, lock.exists);
  return listing;
};

export const importAfternicDraft = async (actor: BillingActor, context: AfternicContext, input: unknown) => {
  const domain = domainValue(input);
  const listing = await getAfternicListing(context, domain);
  if (!listing) throw notFound(`This Domain Is No Longer In Your Afternic Portfolio`);
  if (!listing.canImport) throw conflict(`This Afternic Listing Cannot Be Imported With Its Current Price Or Status`);
  return saveMarketplaceListing(actor, { domain, description: ``, acceptOffers: listing.acceptOffers, priceCents: listing.priceCents }, true);
};

export const reviewAfternicExport = async (actor: BillingActor, context: AfternicContext, input: unknown): Promise<AfternicPublishReview> => {
  const listingId = marketId(input, `MarketListing`);
  const listing = await readOutboundListing(actor, listingId);
  if (listing.afternicHold) throw conflict(`Check The Existing Afternic Status Before Creating A Listing`);
  const price = reviewPricing(listing);
  const providerListing = await getAfternicListing(context, listing.domain);
  return { ...price, listingId, domain: listing.domain, providerListing };
};

const startExport = async (actor: BillingActor, id: string, observed: ConnectorListing, operation: `create` | `check`) => {
  const database = getBillingDatabase();
  const token = randomUUID();
  const reference = listingRef(database, id);
  const claim = claimRef(database, observed.domain);
  await database.runTransaction(async transaction => {
    const user = await confirmMarketplaceActor(transaction, database, actor);
    if (operation === `create`) assertPublicSellerProfile(user.profilePrivacy);
    await assertSellerEligible(transaction, database, actor.id);
    const [saved, lock, claimed] = await transaction.getAll(reference, lockRef(database, id), claim);
    const listing = ownedListing(saved.data() as ConnectorListing | undefined, actor);
    assertOutboundListing(listing, lock.exists);
    const held = listing.afternicHold === true;
    if (listing.domain !== observed.domain || listing.challenge !== observed.challenge || listing.priceCents !== observed.priceCents || listing.acceptOffers !== observed.acceptOffers
      || held !== (operation === `check`)) throw conflict(`The Listing Changed — Refresh And Review It Again`);
    if (listing.afternicLease && listing.afternicLease.until > Date.now()) throw conflict(`An Afternic Request Is In Progress — Try Again Shortly`);
    const previous = claimed.data();
    if (claimed.exists && (previous?.listingId !== id || previous?.sellerId !== actor.id)) throw conflict(`This Domain Already Has A Marketplace Listing Or Sale In Progress`);
    transaction.set(claim, { listingId: id, sellerId: actor.id, domain: listing.domain, source: `afternic` });
    transaction.update(reference, { afternicHold: true, afternicLease: { token, until: Date.now() + 60_000 } });
  });
  return (keepHold: boolean) => database.runTransaction(async transaction => {
    const [listing, claimed] = await transaction.getAll(reference, claim);
    const saved = listing.data() as ConnectorListing | undefined;
    const current = claimed.data();
    if (saved?.afternicLease?.token !== token || current?.listingId !== id || current?.sellerId !== actor.id || current?.source !== `afternic`) {
      throw conflict(`The Afternic Listing State Changed — Check Status Again`);
    }
    transaction.update(reference, { afternicHold: keepHold, afternicLease: FieldValue.delete() });
    if (!keepHold) transaction.delete(claim);
  });
};

export const publishAfternicExport = async (actor: BillingActor, context: AfternicContext, body: Record<string, unknown>): Promise<AfternicActionResult> => {
  const id = marketId(body.listingId, `MarketListing`);
  const listing = await readOutboundListing(actor, id);
  const price = reviewPricing(listing);
  if (price.priceCents !== body.priceCents || price.acceptOffers !== body.acceptOffers) throw conflict(`The Listing Price Or Offer Settings Changed — Review It Again`);
  await verifyListingDns(listing);
  const finish = await startExport(actor, id, listing, `create`);
  let keepHold = false;
  try {
    const existing = await getAfternicListing(context, listing.domain);
    keepHold = true;
    if (existing) return { created: false, providerListing: existing };
    const created = await createAfternicListing(context, { ...price, domain: listing.domain });
    return { created: true, providerListing: created };
  } finally {
    await finish(keepHold);
  }
};

export const checkAfternicExport = async (actor: BillingActor, context: AfternicContext, input: unknown): Promise<AfternicActionResult> => {
  const id = marketId(input, `MarketListing`);
  const listing = await readOutboundListing(actor, id);
  const finish = await startExport(actor, id, listing, `check`);
  let keepHold = true;
  try {
    const providerListing = await getAfternicListing(context, listing.domain);
    keepHold = !!providerListing;
    return { created: false, providerListing };
  } finally {
    await finish(keepHold);
  }
};
