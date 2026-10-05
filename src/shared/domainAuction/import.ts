import type { AuctionType, AuctionRecord, AuctionInventoryMetrics } from './types';

export const MAX_AUCTION_IMPORT_BYTES = 8 * 1024 * 1024;
export const MAX_AUCTION_IMPORT_RECORDS = 10_000;

export type AuctionInventoryInput = Omit<AuctionRecord, `id` | `number`>;
export interface AuctionInventoryImport {
  records: AuctionInventoryInput[];
  skippedCount: number;
  sourceCheckedAt: string | null;
}

const objectValue = (value: unknown): Record<string, unknown> | null => value !== null
  && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : null;
const nonnegativeNumber = (value: unknown) => typeof value === `number`
  && Number.isFinite(value) && value >= 0 ? value : null;
const countValue = (value: unknown) => typeof value === `number`
  && Number.isSafeInteger(value) && value >= 0 ? value : null;
const scoreValue = (value: unknown) => {
  const number = countValue(value);
  return number !== null && number <= 100 ? number : null;
};

export const normalizeAuctionDomain = (value: unknown) => {
  if (typeof value !== `string`) return null;
  const domain = value.trim().toLowerCase();
  const labels = domain.split(`.`);
  return domain.length <= 253 && labels.length >= 2 && !/^\d+$/.test(labels.at(-1) ?? ``) && labels.every(label =>
    label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)) ? domain : null;
};

export const parseAuctionTimestamp = (value: unknown) => {
  if (typeof value !== `string` || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const hour = Number(value.slice(11, 13));
  const minute = Number(value.slice(14, 16));
  const second = Number(value.slice(17, 19));
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()
    || hour > 23 || minute > 59 || second > 59) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
};

export const getInventoryListingHref = (value: unknown) => {
  if (typeof value !== `string` || value.length > 2048) return undefined;
  try {
    const url = new URL(value);
    const allowedHosts = [`godaddy.com`, `www.godaddy.com`, `auctions.godaddy.com`];
    return url.protocol === `https:` && allowedHosts.includes(url.hostname)
      && !url.username && !url.password && (!url.port || url.port === `443`) ? url.href : undefined;
  } catch {
    return undefined;
  }
};

const usdAmount = (value: unknown) => {
  if (typeof value !== `string`) return null;
  const amount = value.trim();
  // GoDaddy inventory metadata defines these dollar strings as USD, unlike API micro-units.
  if (!/^(?:\$|USD\s+)(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(amount)) return null;
  return nonnegativeNumber(Number(amount.replace(/^(?:\$|USD\s+)/, ``).replaceAll(`,`, ``)));
};

const inventoryType = (value: unknown): AuctionType | null => {
  if (typeof value !== `string`) return null;
  const type = value.trim().toLowerCase().replace(/[\s_-]+/g, ``);
  const types: Record<string, AuctionType> = {
    bid: `bid`,
    offer: `offer`,
    buynow: `buy-now`,
    closeout: `closeout`,
    expiring: `expiring`,
  };
  return Object.prototype.hasOwnProperty.call(types, type) ? types[type] : null;
};

const inventoryMetrics = (row: Record<string, unknown>): AuctionInventoryMetrics => {
  const metrics: AuctionInventoryMetrics = {};
  const counts = [
    `pageviews`, `developedTlds`, `exactMatchTlds`, `semrushBacklinks`,
    `majesticBacklinks`, `keywordRegistrations`, `semrushSearchVolume`,
    `semrushIndexedPages`, `semrushReferringDomains`, `majesticReferringDomains`,
  ] as const;
  const scores = [`majesticTf`, `majesticCf`, `semrushAs`] as const;
  for (const key of counts) {
    const value = countValue(row[key]);
    if (value !== null) metrics[key] = value;
  }
  for (const key of scores) {
    const value = scoreValue(row[key]);
    if (value !== null) metrics[key] = value;
  }
  const valuation = usdAmount(row.valuation);
  const parkingRevenue = usdAmount(row.monthlyParkingRevenue);
  const cpc = nonnegativeNumber(row.semrushCpc);
  if (cpc !== null) metrics.semrushCpc = cpc;
  if (valuation !== null) metrics.valuationUsd = valuation;
  if (parkingRevenue !== null) metrics.monthlyParkingRevenueUsd = parkingRevenue;
  if (typeof row.isAdult === `boolean`) metrics.isAdult = row.isAdult;
  if (typeof row.semrushTopReferringDomains === `string`) {
    metrics.semrushTopReferringDomains = row.semrushTopReferringDomains.split(`,`)
      .map(normalizeAuctionDomain).filter((domain): domain is string => domain !== null).slice(0, 3);
  }
  return metrics;
};

const assertImportSize = (text: string) => {
  const message = `Inventory Exceeds 8 MB — Download A Smaller Feed From GoDaddy Auctions Inventory`;
  if (text.length > MAX_AUCTION_IMPORT_BYTES) throw new Error(message);
  let bytes = 0;
  for (const character of text) {
    const code = character.codePointAt(0) ?? 0;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
    if (bytes > MAX_AUCTION_IMPORT_BYTES) throw new Error(message);
  }
};

export const parseAuctionInventory = (text: string): AuctionInventoryImport => {
  assertImportSize(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.replace(/^\uFEFF/, ``));
  } catch {
    throw new Error(`Choose An Unzipped GoDaddy JSON Inventory File — ZIP And XML Files Are Not Supported`);
  }
  const root = objectValue(parsed);
  if (!root || !Array.isArray(root.data)) throw new Error(`Use GoDaddy JSON Inventory With A Data Array`);
  if (root.data.length > MAX_AUCTION_IMPORT_RECORDS) {
    throw new Error(`Inventory Exceeds 10,000 Listing(s) — Download A Smaller Feed Such As Most Active`);
  }
  const meta = objectValue(root.meta);
  const sourceCheckedAt = parseAuctionTimestamp(meta?.lastBuildDate);
  const records: AuctionInventoryInput[] = [];
  const domains = new Set<string>();
  let skippedCount = 0;
  for (const value of root.data) {
    const row = objectValue(value);
    const domain = normalizeAuctionDomain(row?.domainName);
    const type = inventoryType(row?.auctionType);
    if (!row || !domain || !type || domains.has(domain)) {
      skippedCount += 1;
      continue;
    }
    domains.add(domain);
    const listingHref = getInventoryListingHref(row.link);
    records.push({
      type,
      domain,
      preview: false,
      source: `godaddy`,
      dataSource: `inventory`,
      sourceHref: listingHref ?? `https://auctions.godaddy.com/`,
      bids: countValue(row.numberOfBids),
      priceUsd: usdAmount(row.price),
      ageYears: countValue(row.domainAge),
      endsAt: parseAuctionTimestamp(row.auctionEndTime),
      ...(listingHref ? { listingHref } : {}),
      ...(sourceCheckedAt ? { sourceCheckedAt } : {}),
      inventoryMetrics: inventoryMetrics(row),
    });
  }
  if (!records.length) throw new Error(`Inventory Contains No Supported Listing(s) — Choose A GoDaddy JSON Auction Feed`);
  return { records, skippedCount, sourceCheckedAt };
};
