import { randomUUID } from 'node:crypto';
import { Resolver } from 'node:dns/promises';
import type { BillingActor } from '../billing/types';
import { getBillingDatabase } from '../billing/firebase';
import { sellerUsernamePattern } from '../../shared/marketplace/paths';
import type { DocumentData, Firestore, Query } from 'firebase-admin/firestore';
import { assertSellerEligible, assertPublicSellerProfile, confirmMarketplaceActor, MarketplaceError } from './access';
import { centsValue, conflict, counter, domainValue, invalid, marketId, notFound, safeHash, safePhoto, textValue, usernameValue } from './records';
import type { ListingInput, MarketplaceListing, MarketplacePage, MarketplaceSellerProfile, MarketplaceSellerTools, SellerListing } from '../../shared/marketplace/types';

export type ListingRecord = Omit<MarketplaceListing, `sellerUsername` | `sellerName` | `sellerPhotoURL`> & { sellerId: string; challenge: string; ownershipVerifiedAt: string | null; acceptedOfferId?: string | null; afternicHold?: boolean };
const listings = `marketplaceListings`;
const handles = `marketplaceSellerHandles`;
const sellerAccounts = `marketplaceSellerAccounts`;
const locks = `marketplaceCheckoutLocks`;
const pageSize = 24;
const sellerRef = (database: Firestore, id: string) => database.doc(`${sellerAccounts}/${id}`);
const handleRef = (database: Firestore, username: string) => database.doc(`${handles}/${username}`);
const listingRef = (database: Firestore, id: string) => database.doc(`${listings}/${id}`);
const claimRef = (database: Firestore, domain: string) => database.doc(`marketplaceDomainClaims/${safeHash(domain)}`);
const verificationHost = (domain: string) => `_domainsdatabase.${domain}`;
export const verifyListingDns = async (listing: Pick<ListingRecord, `domain` | `challenge`>) => {
  const resolver = new Resolver({ timeout: 2500, tries: 1 });
  const matches = await resolver.resolveTxt(verificationHost(listing.domain)).then(values => values.some(parts => parts.join(``) === listing.challenge), () => false);
  if (!matches) throw conflict(`The Verification TXT Record Was Not Found — Check DNS And Try Again`);
};
const activeQuery = (database: Firestore) => database.collection(listings).where(`status`, `==`, `active`);
const privacyOf = (user?: DocumentData) => user?.profilePrivacy === `public` ? `public` : `private`;
const profileName = (user?: DocumentData) => typeof user?.name === `string` && user.name.trim() ? user.name.trim().slice(0, 100) : `Seller`;

const listingInput = (value: Record<string, unknown>): ListingInput => {
  if (typeof value.acceptOffers !== `boolean`) throw invalid(`Choose Whether To Accept Offers`);
  const priceCents = value.priceCents === null ? null : centsValue(value.priceCents);
  if (!value.acceptOffers && priceCents === null) throw invalid(`Set A Buy Now Price Or Accept Offers`);
  return { priceCents, domain: domainValue(value.domain), acceptOffers: value.acceptOffers, description: textValue(value.description, `A Shorter Description`, 2000, true) };
};

const projectListing = (record: ListingRecord, username: string, user?: DocumentData): MarketplaceListing => ({
  id: record.id, number: record.number, domain: record.domain, status: record.status, currency: `usd`, createdAt: record.createdAt,
  description: record.description, acceptOffers: record.acceptOffers && !record.acceptedOfferId, priceCents: record.acceptedOfferId ? null : record.priceCents, sellerUsername: username,
  ...(privacyOf(user) === `public` ? { sellerName: profileName(user), sellerPhotoURL: safePhoto(user?.photoURL) } : {}),
});
const sellerListing = (record: ListingRecord, username: string): SellerListing => ({
  ...projectListing(record, username), acceptOffers: record.acceptOffers, priceCents: record.priceCents, ownershipVerifiedAt: record.ownershipVerifiedAt, afternicHold: record.afternicHold === true,
  verification: record.status === `sold` ? null : { host: verificationHost(record.domain), value: record.challenge },
});

const readPage = async (database: Firestore, base: Query, cursor: unknown, options: { publicOnly?: boolean; sellerId?: string; prefix?: string } = {}) => {
  const orderedBy = options.prefix ? `domain` : `number`;
  let query = base.orderBy(orderedBy, orderedBy === `domain` ? `asc` : `desc`);
  if (cursor) {
    const previous = await listingRef(database, marketId(cursor, `MarketListing`)).get();
    const listing = previous.data() as ListingRecord | undefined;
    if (!listing || (options.publicOnly && listing.status !== `active`) || (options.sellerId && listing.sellerId !== options.sellerId)
      || (options.prefix && !listing.domain.startsWith(options.prefix))) throw invalid(`Reload The Listings To Continue`);
    query = query.startAfter(previous);
  }
  const snapshot = await query.limit(pageSize + 1).get();
  const rows = snapshot.docs.slice(0, pageSize);
  return { rows, nextCursor: snapshot.size > pageSize ? rows.at(-1)?.id ?? null : null };
};

const projectPublicListings = async (database: Firestore, records: ListingRecord[]) => {
  const ids = [...new Set(records.map(record => record.sellerId))];
  if (!ids.length) return [];
  const [sellers, users] = await Promise.all([database.getAll(...ids.map(id => sellerRef(database, id))), database.getAll(...ids.map(id => database.doc(`users/${id}`)))]);
  const bySeller = new Map(ids.map((id, index) => [id, { seller: sellers[index]?.data(), user: users[index]?.data() }]));
  return records.flatMap(record => {
    const identity = bySeller.get(record.sellerId);
    return identity?.user?.active === true && typeof identity.seller?.username === `string` && record.ownershipVerifiedAt
      ? [projectListing(record, identity.seller.username, identity.user)] : [];
  });
};

export const listMarketplace = async (search: string, cursor: unknown): Promise<MarketplacePage> => {
  const database = getBillingDatabase();
  const prefix = textValue(search, `A Shorter Domain Search`, 253, true).toLowerCase();
  if (prefix && !/^[a-z0-9.-]+$/.test(prefix)) throw invalid(`Search By Domain Name Or Prefix`);
  const base = activeQuery(database);
  const page = await readPage(database, prefix ? base.where(`domain`, `>=`, prefix).where(`domain`, `<=`, `${prefix}\uf8ff`) : base, cursor, { publicOnly: true, prefix });
  return { listings: await projectPublicListings(database, page.rows.map(row => row.data() as ListingRecord)), nextCursor: page.nextCursor };
};

export const getMarketplaceListing = async (input: unknown) => {
  const database = getBillingDatabase();
  const data = (await listingRef(database, marketId(input, `MarketListing`)).get()).data() as ListingRecord | undefined;
  if (data?.status !== `active`) throw notFound();
  const [listing] = await projectPublicListings(database, [data]);
  if (!listing) throw notFound();
  return listing;
};

export const getSellerTools = async (actor: BillingActor, cursor: unknown): Promise<MarketplaceSellerTools> => {
  const database = getBillingDatabase();
  const eligibility = await database.runTransaction(async transaction => {
    const user = await confirmMarketplaceActor(transaction, database, actor);
    const profilePrivacy = privacyOf(user);
    try {
      assertPublicSellerProfile(profilePrivacy);
      await assertSellerEligible(transaction, database, actor.id);
      return { eligible: true, reason: ``, profilePrivacy };
    } catch (failure) {
      if (failure instanceof MarketplaceError && failure.status === 403) return { eligible: false, reason: failure.message, profilePrivacy };
      throw failure;
    }
  });
  const [profile, page] = await Promise.all([sellerRef(database, actor.id).get(), readPage(database, database.collection(listings).where(`sellerId`, `==`, actor.id), cursor, { sellerId: actor.id })]);
  const username = profile.data()?.username as string | undefined;
  return { ...eligibility, username: username ?? null, listings: page.rows.map(row => sellerListing(row.data() as ListingRecord, username ?? ``)), nextCursor: page.nextCursor };
};

export const getPublicProfileHandle = async (input: unknown): Promise<{ username: string | null }> => {
  const id = marketId(input, `User`);
  const database = getBillingDatabase();
  const [account, seller] = await database.getAll(database.doc(`users/${id}`), sellerRef(database, id), { fieldMask: [`id`, `active`, `profilePrivacy`, `username`] });
  const user = account.data();
  const username = seller.get(`username`);
  if (user?.id !== id || user.active !== true || privacyOf(user) !== `public`
    || typeof username !== `string` || !sellerUsernamePattern.test(username)) return { username: null };
  return { username };
};

export const getSellerProfile = async (input: unknown, cursor: unknown, actor: BillingActor | null): Promise<MarketplaceSellerProfile> => {
  const database = getBillingDatabase();
  const username = usernameValue(input);
  const alias = (await handleRef(database, username).get()).data();
  const missing = { state: `not-found`, canEdit: false, listings: [], nextCursor: null } as const;
  if (!alias?.sellerId) return { ...missing, listings: [] };
  const [seller, account] = await database.getAll(sellerRef(database, alias.sellerId), database.doc(`users/${alias.sellerId}`));
  const user = account.data();
  const canonicalUsername = seller.data()?.username as string | undefined;
  if (!canonicalUsername || user?.active !== true) return { ...missing, listings: [] };
  const state = privacyOf(user);
  const isOwner = actor !== null && actor.id === alias.sellerId && user.firebase_uid === actor.firebaseUid;
  const canEdit = isOwner && state === `public`;
  if (state === `private` && !isOwner) return { state, canEdit, canonicalUsername, listings: [], nextCursor: null };
  const page = await readPage(database, activeQuery(database).where(`sellerId`, `==`, alias.sellerId), cursor, { publicOnly: true, sellerId: alias.sellerId });
  return {
    state, canEdit, canonicalUsername, nextCursor: page.nextCursor,
    profile: { name: profileName(user), username: canonicalUsername, photoURL: safePhoto(user.photoURL), profilePrivacy: state, ...(state === `public` ? { id: account.id } : {}),
      description: typeof user.description === `string` ? user.description.slice(0, 2000) : undefined, joinedAt: typeof user.creationTime === `string` ? user.creationTime : undefined },
    listings: page.rows.map(row => projectListing(row.data() as ListingRecord, canonicalUsername, user)),
  };
};

export const saveSellerUsername = async (actor: BillingActor, previous: unknown, input: unknown) => {
  const database = getBillingDatabase();
  const username = usernameValue(input);
  return database.runTransaction(async transaction => {
    const user = await confirmMarketplaceActor(transaction, database, actor);
    assertPublicSellerProfile(user.profilePrivacy);
    const profile = sellerRef(database, actor.id);
    const target = handleRef(database, username);
    const [seller, alias] = await transaction.getAll(profile, target);
    if (!seller.exists) await assertSellerEligible(transaction, database, actor.id);
    if (alias.exists && alias.data()?.sellerId !== actor.id) throw conflict(`This Seller URL Is Already Taken`);
    if (seller.data()?.username === username) return { username };
    if ((seller.data()?.username ?? null) !== previous) throw conflict(`Your Seller URL Changed — Reload And Try Again`);
    if (Number(seller.data()?.handleCount ?? 0) >= 20 && !alias.exists) throw conflict(`You Have Reached The Seller URL Change Limit`);
    transaction.set(profile, { username, handleCount: Number(seller.data()?.handleCount ?? 0) + (alias.exists ? 0 : 1) }, { merge: true });
    if (!alias.exists) transaction.create(target, { sellerId: actor.id });
    return { username };
  });
};

export const saveMarketplaceListing = async (actor: BillingActor, body: Record<string, unknown>, fromAfternic = false) => {
  const database = getBillingDatabase();
  const input = listingInput(body);
  const listingId = body.id === undefined ? null : marketId(body.id, `MarketListing`);
  const now = new Date().toISOString();
  const attempt = !listingId ? safeHash(actor.id, input.domain) : null;
  return database.runTransaction(async transaction => {
    const user = await confirmMarketplaceActor(transaction, database, actor);
    assertPublicSellerProfile(user.profilePrivacy);
    await assertSellerEligible(transaction, database, actor.id);
    const seller = (await transaction.get(sellerRef(database, actor.id))).data();
    if (typeof seller?.username !== `string`) throw conflict(`Choose A Seller Profile URL First`);
    if (listingId) {
      const reference = listingRef(database, listingId);
      const [saved, lock] = await transaction.getAll(reference, database.doc(`${locks}/${listingId}`));
      const listing = saved.data() as ListingRecord | undefined;
      if (listing?.sellerId !== actor.id) throw notFound();
      if (listing.status === `sold` || listing.acceptedOfferId || lock.exists) throw conflict(`This Listing Has A Sale In Progress Or Is Sold`);
      if (listing.afternicHold) throw conflict(`Resolve The Afternic Listing Before Making Changes Here`);
      if (listing.domain !== input.domain) throw conflict(`Create A Separate Listing For A Different Domain`);
      transaction.update(reference, { ...input, updatedAt: now });
      return sellerListing({ ...listing, ...input }, seller.username);
    }
    const deduplication = database.doc(`marketplaceSellerDomains/${attempt}`);
    const existingId = (await transaction.get(deduplication)).data()?.listingId;
    const claim = fromAfternic ? claimRef(database, input.domain) : null;
    const claimed = claim ? (await transaction.get(claim)).data() : null;
    if (claimed && claimed.listingId !== existingId) throw conflict(`This Domain Already Has An Active Or Sold Listing`);
    if (typeof existingId === `string`) {
      const existing = (await transaction.get(listingRef(database, existingId))).data() as ListingRecord | undefined;
      if (existing?.sellerId !== actor.id) throw conflict(`This Domain Already Has A Listing`);
      if (!fromAfternic) return sellerListing(existing, seller.username);
      const lock = await transaction.get(database.doc(`${locks}/${existingId}`));
      if (existing.status === `sold` || existing.status === `active` || existing.acceptedOfferId || lock.exists) throw conflict(`Pause The Existing Marketplace Listing Before Importing`);
      if (!existing.afternicHold) transaction.update(listingRef(database, existingId), { afternicHold: true });
      if (claim && !claimed) transaction.create(claim, { listingId: existingId, sellerId: actor.id, domain: input.domain, source: `afternic` });
      return sellerListing({ ...existing, afternicHold: true }, seller.username);
    }
    const identity = await counter(transaction, database, `marketplaceListings`, `MarketListing`, input.domain, now);
    const listing: ListingRecord = { ...input, id: identity.id, number: identity.number, currency: `usd`, status: `draft`, sellerId: actor.id, createdAt: now, challenge: `domainsdatabase=${randomUUID()}`, ownershipVerifiedAt: null, afternicHold: fromAfternic };
    transaction.create(listingRef(database, listing.id), { ...listing, updatedAt: now });
    transaction.create(deduplication, { listingId: listing.id });
    if (claim) transaction.create(claim, { listingId: listing.id, sellerId: actor.id, domain: input.domain, source: `afternic` });
    identity.commit();
    return sellerListing(listing, seller.username);
  });
};

export const setMarketplacePublication = async (actor: BillingActor, input: unknown, publish: boolean) => {
  const database = getBillingDatabase();
  const id = marketId(input, `MarketListing`);
  const reference = listingRef(database, id);
  const now = new Date().toISOString();
  const observed = (await reference.get()).data() as ListingRecord | undefined;
  if (observed?.sellerId !== actor.id) throw notFound();
  if (publish) await verifyListingDns(observed);
  return database.runTransaction(async transaction => {
    const user = await confirmMarketplaceActor(transaction, database, actor);
    if (publish) {
      assertPublicSellerProfile(user.profilePrivacy);
      await assertSellerEligible(transaction, database, actor.id);
    }
    const claim = claimRef(database, observed.domain);
    const [saved, lock, currentClaim, seller] = await transaction.getAll(reference, database.doc(`${locks}/${id}`), claim, sellerRef(database, actor.id));
    const listing = saved.data() as ListingRecord | undefined;
    if (listing?.sellerId !== actor.id || listing.domain !== observed.domain || listing.challenge !== observed.challenge) throw notFound();
    if (listing.status === `sold` || listing.acceptedOfferId || lock.exists) throw conflict(`This Listing Has A Sale In Progress Or Is Sold`);
    if (listing.afternicHold) throw conflict(`Resolve The Afternic Listing Before Making Changes Here`);
    if (publish && currentClaim.exists && currentClaim.data()?.listingId !== id) throw conflict(`This Domain Already Has An Active Or Sold Marketplace Listing`);
    const status = publish ? `active` : `paused`;
    const ownershipVerifiedAt = publish ? now : listing.ownershipVerifiedAt;
    if (publish) transaction.set(claim, { listingId: id, sellerId: actor.id, domain: listing.domain, source: `marketplace` });
    else if (currentClaim.data()?.listingId === id && currentClaim.data()?.source !== `afternic`) transaction.delete(claim);
    transaction.update(reference, { status, ownershipVerifiedAt, updatedAt: now });
    return sellerListing({ ...listing, status, ownershipVerifiedAt }, seller.data()?.username ?? ``);
  });
};
