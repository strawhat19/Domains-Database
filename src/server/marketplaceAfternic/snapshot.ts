import { randomUUID } from 'node:crypto';
import { genID } from '../../shared/common/ids';
import { getAfternicPortfolio } from './provider';
import type { BillingActor } from '../billing/types';
import { getBillingDatabase } from '../billing/firebase';
import { MarketplaceError } from '../marketplace/access';
import { confirmAfternicSyncBinding } from './connection';
import { hasAfternicInsights, needsAfternicInsights, retainAfternicInsights } from './retainedInsights';
import type { DocumentReference, Transaction } from 'firebase-admin/firestore';
import type { AfternicListing, AfternicSnapshotPage, AfternicSyncProgress } from '../../shared/marketplaceAfternic/types';

type Generation = { id: string; slot: 0 | 1; pages: number; count: number; skipped: number };
type Complete = Generation & { syncedAt: string; pageNamesIndexed?: boolean };
type Stage = Generation & { offset: number; startedAt: number; total: number | null; lastDomain: string | null; pageNamesIndexed?: boolean; searchesRejected?: boolean };
type SyncState = { id: string; number: number; type: `AfternicSyncState`; binding: string; active: Complete | null; stage: Stage | null };

const maximumRows = 10_000;
const maximumPages = 400;
const pageType = `AfternicSnapshotPage`;
const snapshotDate = new Date(`2026-11-11T18:00:00Z`);
const attemptLifetime = 10 * 60_000;
const previousLookupBatchSize = 30;
const generationPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const expired = (stage: Stage) => Date.now() - stage.startedAt > attemptLifetime;
const outdated = () => new MarketplaceError(409, `Afternic Sync Changed — Refresh And Try Again`);
const windowExceeded = () => new MarketplaceError(409, `Afternic Portfolio Exceeds The Supported Sync Window`);
const snapshotPage = (reference: DocumentReference, slot: Generation[`slot`], page: number) => {
  const number = slot * maximumPages + page + 1;
  const { id } = genID(pageType, number, `Portfolio`, snapshotDate, `0939f7de63004642b0f40b1aad073172`);
  return { id, number, reference: reference.collection(`pages`).doc(id) };
};
const progress = ({ id, count, skipped }: Generation, syncedAt: string | null = null): AfternicSyncProgress => ({ count, skipped, syncedAt, attemptId: id, done: syncedAt !== null });
const indexedName = (id: string, domain: string) => `${id}:${domain}`;

const readPreviousListings = async (transaction: Transaction, reference: DocumentReference, active: Complete, index: number) => {
  const page = await transaction.get(snapshotPage(reference, active.slot, index).reference);
  const rows = page.get(`listings`);
  if (page.get(`generationId`) !== active.id || !Array.isArray(rows)) throw outdated();
  return rows as AfternicListing[];
};

const withPreviousInsights = async (transaction: Transaction, reference: DocumentReference, state: SyncState, stage: Stage, listings: AfternicListing[]) => {
  const active = state.active;
  if (!active) return listings;
  const names = listings.filter(needsAfternicInsights).map(listing => listing.domain);
  if (!names.length) return listings;
  const wanted = new Set(names);
  const previous = new Map<string, AfternicListing>();
  if (active.pageNamesIndexed) {
    for (let offset = 0; offset < names.length; offset += previousLookupBatchSize) {
      const batch = names.slice(offset, offset + previousLookupBatchSize);
      const query = reference.collection(`pages`).where(`indexedNames`, `array-contains-any`, batch.map(domain => indexedName(active.id, domain))).limit(batch.length + 1);
      const pages = await transaction.get(query);
      if (pages.size > batch.length) throw outdated();
      for (const page of pages.docs) {
        const rows = page.get(`listings`);
        if (page.get(`generationId`) !== active.id || !Array.isArray(rows)) throw outdated();
        for (const row of rows as AfternicListing[]) if (wanted.has(row.domain)) previous.set(row.domain, row);
      }
    }
  } else {
    const indexes = [stage.pages, stage.pages - 1, stage.pages + 1].filter(index => index >= 0 && index < active.pages);
    const pages = await Promise.all(indexes.map(index => readPreviousListings(transaction, reference, active, index)));
    for (const rows of pages) for (const row of rows) if (wanted.has(row.domain)) previous.set(row.domain, row);
  }
  return listings.map(listing => {
    const saved = previous.get(listing.domain);
    return saved ? retainAfternicInsights(listing, saved, active.syncedAt) : listing;
  });
};

const readState = async (transaction: Transaction, reference: DocumentReference, binding: string): Promise<SyncState> => {
  const saved = (await transaction.get(reference)).data() as SyncState | undefined;
  return saved?.binding === binding ? saved : { binding, active: null, stage: null, id: reference.id, number: 1, type: `AfternicSyncState` };
};

export const syncAfternicSnapshot = async (actor: BillingActor, attemptId: unknown, signal: AbortSignal): Promise<AfternicSyncProgress> => {
  if (attemptId !== null && (typeof attemptId !== `string` || !generationPattern.test(attemptId))) throw new MarketplaceError(400, `Choose A Valid Afternic Sync Attempt`);
  const database = getBillingDatabase();
  const prepared = await database.runTransaction(async transaction => {
    const connection = await confirmAfternicSyncBinding(transaction, database, actor);
    const state = await readState(transaction, connection.reference, connection.binding);
    if (attemptId && state.active?.id === attemptId) return { kind: `complete` as const, active: state.active };
    if (state.stage && !expired(state.stage) && (!attemptId || state.stage.id === attemptId)) return { kind: `stage` as const, connection, stage: state.stage };
    if (attemptId) throw outdated();
    const stage: Stage = {
      id: randomUUID(), slot: state.active?.slot === 0 ? 1 : 0, pages: 0, count: 0, skipped: 0,
      offset: 0, startedAt: Date.now(), total: null, lastDomain: null, pageNamesIndexed: true,
    };
    transaction.set(connection.reference, { ...state, stage });
    return { kind: `stage` as const, connection, stage };
  });
  if (prepared.kind === `complete`) return progress(prepared.active, prepared.active.syncedAt);
  const { stage } = prepared;
  const page = await getAfternicPortfolio({ authorization: prepared.connection.authorization, signal }, stage.offset, {
    includeInsights: true, includeSearches: !stage.searchesRejected,
  });
  const result = await database.runTransaction(async transaction => {
    const { reference, binding } = await confirmAfternicSyncBinding(transaction, database, actor);
    if (binding !== prepared.connection.binding || expired(stage)) throw outdated();
    const state = await readState(transaction, reference, binding);
    if (state.active?.id === stage.id) return { kind: `progress` as const, value: progress(state.active, state.active.syncedAt) };
    if (state.stage?.id !== stage.id) throw outdated();
    if (state.stage.pages !== stage.pages) return { kind: `progress` as const, value: progress(state.stage) };
    if (signal.aborted) throw new MarketplaceError(504, `Afternic Sync Timed Out — Try Again`);

    const nextOffset = stage.offset + page.listings.length + page.skipped;
    const pages = stage.pages + 1;
    const total = stage.total ?? page.total;
    const names = new Set(page.listings.map(listing => listing.domain));
    const incomplete = stage.total !== null && page.total !== null && stage.total !== page.total
      || total !== null && (nextOffset > total || (page.nextOffset === null && nextOffset !== total))
      || page.nextOffset !== null && (page.nextOffset !== nextOffset || nextOffset <= stage.offset)
      || names.size !== page.listings.length || Boolean(stage.lastDomain && names.has(stage.lastDomain));
    const exceeded = nextOffset > maximumRows || (total !== null && total > maximumRows)
      || page.nextOffset !== null && (pages >= maximumPages || nextOffset >= maximumRows);
    const dropped = state.active?.skipped === 0 && (stage.skipped > 0 || page.skipped > 0);
    if (incomplete || exceeded || dropped) {
      transaction.set(reference, { ...state, stage: null });
      const error = dropped ? new MarketplaceError(502, `Some Afternic Listings Could Not Be Read — Showing The Last Complete Sync`) : outdated();
      return { kind: `error` as const, value: exceeded ? windowExceeded() : error };
    }

    const listings = await withPreviousInsights(transaction, reference, state, stage, page.listings);
    if (signal.aborted) throw new MarketplaceError(504, `Afternic Sync Timed Out — Try Again`);
    const generation = { id: stage.id, slot: stage.slot, pages, count: stage.count + page.listings.length, skipped: stage.skipped + page.skipped, pageNamesIndexed: stage.pageNamesIndexed ?? false };
    const target = snapshotPage(reference, stage.slot, stage.pages);
    transaction.set(target.reference, {
      id: target.id, number: target.number, type: pageType, listings, generationId: stage.id,
      indexedNames: listings.filter(hasAfternicInsights).map(listing => indexedName(stage.id, listing.domain)),
    });
    if (page.nextOffset === null) {
      const active = { ...generation, syncedAt: new Date().toISOString() };
      transaction.set(reference, { ...state, active, stage: null });
      return { kind: `progress` as const, value: progress(active, active.syncedAt) };
    }
    const next = {
      ...generation, total, offset: page.nextOffset, startedAt: stage.startedAt,
      searchesRejected: page.searchesRejected || stage.searchesRejected === true,
      lastDomain: listings.at(-1)?.domain ?? stage.lastDomain,
    };
    transaction.set(reference, { ...state, stage: next });
    return { kind: `progress` as const, value: progress(next) };
  });
  if (result.kind === `error`) throw result.value;
  return result.value;
};

export const readAfternicSnapshot = async (actor: BillingActor, input: Record<string, unknown>): Promise<AfternicSnapshotPage> => {
  const { offset, generationId } = input;
  if (typeof offset !== `number` || !Number.isSafeInteger(offset) || offset < 0 || offset >= maximumPages
    || generationId !== null && (typeof generationId !== `string` || !generationPattern.test(generationId))) throw new MarketplaceError(400, `Choose A Valid Afternic Snapshot Page`);
  const database = getBillingDatabase();
  return database.runTransaction(async transaction => {
    const { reference, binding } = await confirmAfternicSyncBinding(transaction, database, actor);
    const { active } = await readState(transaction, reference, binding);
    if ((generationId !== null && generationId !== active?.id) || (offset > 0 && (generationId === null || !active || offset >= active.pages))) throw outdated();
    if (!active) return { listings: [], nextOffset: null, syncedAt: null, generationId: null, skipped: 0 };
    const page = await transaction.get(snapshotPage(reference, active.slot, offset).reference);
    const listings = page.get(`listings`);
    if (page.get(`generationId`) !== active.id || !Array.isArray(listings)) throw outdated();
    return {
      listings: listings as AfternicListing[], generationId: active.id, syncedAt: active.syncedAt, skipped: active.skipped,
      nextOffset: offset + 1 < active.pages ? offset + 1 : null,
    };
  }, { readOnly: true });
};
