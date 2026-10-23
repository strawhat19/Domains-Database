import { Platform } from 'react-native';
import { absoluteSiteUrl } from '../seo';
import { getFirebaseAuth } from '../firebase/client';
import { requireAuctionPreviewAccess } from '../planAccess/service';
import type { AuctionType, AuctionRecord, AuctionFeedSnapshot, AuctionInventoryMetrics } from './types';
import { normalizeAuctionDomain, parseAuctionTimestamp, getInventoryListingHref, MAX_AUCTION_IMPORT_BYTES, MAX_AUCTION_IMPORT_RECORDS } from './import';

const FEED_REFRESH_MS = 15 * 60 * 1000;
const invalid = () => new Error(`Auction Feed Returned An Invalid Response`);
const objectValue = (value: unknown): Record<string, unknown> | null => value !== null
  && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : null;
const isCount = (value: unknown): value is number => typeof value === `number`
  && Number.isSafeInteger(value) && value >= 0;
const isAmount = (value: unknown): value is number => typeof value === `number`
  && Number.isFinite(value) && value >= 0;

const readTimestamp = (value: unknown) => {
  const timestamp = parseAuctionTimestamp(value);
  if (!timestamp) throw invalid();
  return timestamp;
};

const readMetrics = (value: unknown): AuctionInventoryMetrics | undefined => {
  if (value === undefined) return undefined;
  const input = objectValue(value);
  if (!input) throw invalid();
  const metrics: AuctionInventoryMetrics = {};
  const counts = [
    `pageviews`, `developedTlds`, `exactMatchTlds`, `semrushBacklinks`,
    `majesticBacklinks`, `keywordRegistrations`, `semrushSearchVolume`,
    `semrushIndexedPages`, `semrushReferringDomains`, `majesticReferringDomains`,
  ] as const;
  for (const key of counts) {
    if (input[key] === undefined) continue;
    if (!isCount(input[key])) throw invalid();
    metrics[key] = input[key];
  }
  for (const key of [`majesticTf`, `majesticCf`, `semrushAs`] as const) {
    if (input[key] === undefined) continue;
    if (!isCount(input[key]) || input[key] > 100) throw invalid();
    metrics[key] = input[key];
  }
  for (const key of [`semrushCpc`, `valuationUsd`, `monthlyParkingRevenueUsd`] as const) {
    if (input[key] === undefined) continue;
    if (!isAmount(input[key])) throw invalid();
    metrics[key] = input[key];
  }
  if (input.isAdult !== undefined) {
    if (typeof input.isAdult !== `boolean`) throw invalid();
    metrics.isAdult = input.isAdult;
  }
  if (input.semrushTopReferringDomains !== undefined) {
    const domains = input.semrushTopReferringDomains;
    if (!Array.isArray(domains) || domains.length > 3
      || domains.some(domain => typeof domain !== `string` || normalizeAuctionDomain(domain) !== domain)) throw invalid();
    metrics.semrushTopReferringDomains = domains as string[];
  }
  return metrics;
};

const readRecords = (value: unknown, sourceCheckedAt: string | null): AuctionRecord[] => {
  if (!Array.isArray(value) || value.length > MAX_AUCTION_IMPORT_RECORDS) throw invalid();
  const ids = new Set<string>();
  const types: AuctionType[] = [`bid`, `offer`, `public`, `buy-now`, `closeout`, `expiring`];
  return value.map(item => {
    const record = objectValue(item);
    const domain = normalizeAuctionDomain(record?.domain);
    if (!record || !domain || domain !== record.domain || typeof record.id !== `string`
      || record.id !== `godaddy:${domain}` || ids.has(record.id)
      || record.preview !== false || record.source !== `godaddy` || record.dataSource !== `feed`
      || !types.includes(record.type as AuctionType)
      || (record.bids !== null && !isCount(record.bids))
      || (record.ageYears !== null && !isCount(record.ageYears))
      || (record.priceUsd !== null && !isAmount(record.priceUsd))) throw invalid();
    const sourceHref = getInventoryListingHref(record.sourceHref);
    const listingHref = record.listingHref === undefined ? undefined : getInventoryListingHref(record.listingHref);
    if (!sourceHref || (record.listingHref !== undefined && !listingHref)) throw invalid();
    const endsAt = record.endsAt === null ? null : readTimestamp(record.endsAt);
    if (record.sourceCheckedAt !== undefined && readTimestamp(record.sourceCheckedAt) !== sourceCheckedAt) throw invalid();
    ids.add(record.id);
    const inventoryMetrics = readMetrics(record.inventoryMetrics);
    return {
      domain,
      endsAt,
      sourceHref,
      id: record.id,
      preview: false,
      source: `godaddy`,
      dataSource: `feed`,
      bids: record.bids as number | null,
      type: record.type as AuctionType,
      priceUsd: record.priceUsd as number | null,
      ageYears: record.ageYears as number | null,
      ...(listingHref ? { listingHref } : {}),
      ...(inventoryMetrics ? { inventoryMetrics } : {}),
      ...(sourceCheckedAt ? { sourceCheckedAt } : {}),
    };
  });
};

const readSnapshot = (value: unknown): AuctionFeedSnapshot => {
  const input = objectValue(value);
  if (!input || input.source !== `godaddy` || input.feed !== `most-active`
    || !isCount(input.totalCount) || input.totalCount > MAX_AUCTION_IMPORT_RECORDS
    || !isCount(input.endedCount) || !isCount(input.limitedCount) || !isCount(input.skippedCount)) throw invalid();
  const fetchedAt = readTimestamp(input.fetchedAt);
  const refreshAfter = readTimestamp(input.refreshAfter);
  const sourceCheckedAt = input.sourceCheckedAt === null ? null : readTimestamp(input.sourceCheckedAt);
  if (Date.parse(refreshAfter) - Date.parse(fetchedAt) !== FEED_REFRESH_MS) throw invalid();
  const records = readRecords(input.records, sourceCheckedAt);
  if (input.totalCount !== records.length + input.skippedCount + input.endedCount + input.limitedCount) throw invalid();
  return {
    records,
    fetchedAt,
    refreshAfter,
    sourceCheckedAt,
    source: `godaddy`,
    feed: `most-active`,
    totalCount: input.totalCount,
    endedCount: input.endedCount,
    limitedCount: input.limitedCount,
    skippedCount: input.skippedCount,
  };
};

const readResponseText = async (response: Response) => {
  const tooLarge = () => new Error(`Auction Feed Exceeds 8 MB`);
  const length = response.headers.get(`content-length`);
  if (length && Number(length) > MAX_AUCTION_IMPORT_BYTES) throw tooLarge();
  const reader = typeof response.body?.getReader === `function` ? response.body.getReader() : null;
  if (!reader) {
    const text = await response.text();
    let bytes = 0;
    for (const character of text) {
      const code = character.codePointAt(0) ?? 0;
      bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
      if (bytes > MAX_AUCTION_IMPORT_BYTES) throw tooLarge();
    }
    return text;
  }
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_AUCTION_IMPORT_BYTES) throw tooLarge();
      chunks.push(value);
    }
  } catch (failure) {
    await reader.cancel().catch(() => undefined);
    throw failure;
  } finally {
    reader.releaseLock();
  }
  const combined = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(combined);
};

export const getFreeAuctionFeed = async (signal?: AbortSignal): Promise<AuctionFeedSnapshot> => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener(`abort`, abort, { once: true });
  if (signal?.aborted) abort();
  const timeout = setTimeout(abort, 20_000);
  try {
    const actor = await requireAuctionPreviewAccess();
    const identity = getFirebaseAuth().currentUser;
    if (!identity || identity.uid !== actor.firebase_uid) throw new Error(`Sign In To Unlock Auctions`);
    const token = await identity.getIdToken();
    if (controller.signal.aborted) throw new Error(`Auction Feed Request Cancelled`);
    const response = await fetch(Platform.OS === `web` ? `/api/auction-inventory` : absoluteSiteUrl(`/api/auction-inventory`), {
      method: `GET`,
      credentials: `omit`,
      signal: controller.signal,
      headers: { Accept: `application/json`, Authorization: `Bearer ${token}` },
    });
    const text = await readResponseText(response);
    let input: unknown;
    try { input = JSON.parse(text); } catch { input = null; }
    if (!response.ok) {
      const error = objectValue(input)?.error;
      throw new Error(typeof error === `string` && error.trim() && error.length <= 280
        ? error : `Auction Feed Is Temporarily Unavailable`);
    }
    if (controller.signal.aborted) throw new Error(`Auction Feed Request Cancelled`);
    if (getFirebaseAuth().currentUser?.uid !== actor.firebase_uid) throw new Error(`Your Account Changed — Try Again`);
    return readSnapshot(input);
  } catch (failure) {
    if (controller.signal.aborted) throw new Error(signal?.aborted ? `Auction Feed Request Cancelled` : `Auction Feed Timed Out`);
    if (failure instanceof TypeError) throw new Error(`Could Not Reach Auction Feed`);
    throw failure;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener(`abort`, abort);
    controller.abort();
  }
};
