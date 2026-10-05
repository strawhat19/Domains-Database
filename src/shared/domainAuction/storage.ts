import type { AuctionRecord, AuctionInventoryMetrics } from './types';
import { useLocalStorage } from '../config';
import { genID, getAppCollectionIDNumber } from '../common/ids';
import { readStorage, writeStorage, createOperationQueue } from '../common/storage';
import { parseAuctionInventory, normalizeAuctionDomain, parseAuctionTimestamp, getInventoryListingHref, MAX_AUCTION_IMPORT_RECORDS } from './import';

export const AUCTION_STORAGE_KEY = `domains-database:auction-inventory:v1`;
const serialize = createOperationQueue(AUCTION_STORAGE_KEY);
type StoredAuctionRecord = AuctionRecord & { number: number };

interface AuctionSnapshot {
  version: 1;
  records: StoredAuctionRecord[];
  nextNumber: number;
}

const requireStorage = () => {
  if (!useLocalStorage) throw new Error(`Connect A Backend To Save Auction Inventory`);
};
const isNullableNumber = (value: unknown, integer = false) => value === null
  || (typeof value === `number` && Number.isFinite(value) && value >= 0 && (!integer || Number.isSafeInteger(value)));
const validateMetrics = (value: unknown): value is AuctionInventoryMetrics => {
  if (!value || typeof value !== `object` || Array.isArray(value)) return false;
  const metrics = value as Record<string, unknown>;
  const moneyKeys = [`semrushCpc`, `valuationUsd`, `monthlyParkingRevenueUsd`];
  const countKeys = [
    `pageviews`, `majesticTf`, `majesticCf`, `semrushAs`, `developedTlds`,
    `exactMatchTlds`, `majesticBacklinks`, `semrushBacklinks`, `semrushSearchVolume`,
    `semrushIndexedPages`, `keywordRegistrations`, `semrushReferringDomains`, `majesticReferringDomains`,
  ];
  return Object.entries(metrics).every(([key, field]) => {
    if (key === `isAdult`) return typeof field === `boolean`;
    if (key === `semrushTopReferringDomains`) return Array.isArray(field) && field.length <= 3
      && field.every(domain => typeof domain === `string` && normalizeAuctionDomain(domain) === domain);
    if (moneyKeys.includes(key)) return field !== null && isNullableNumber(field);
    if (!countKeys.includes(key) || field === null || !isNullableNumber(field, true)) return false;
    return ![`majesticTf`, `majesticCf`, `semrushAs`].includes(key) || Number(field) <= 100;
  });
};

const readSnapshot = async (): Promise<AuctionSnapshot> => {
  requireStorage();
  const saved = await readStorage(AUCTION_STORAGE_KEY);
  if (saved === null) return { version: 1, records: [], nextNumber: 1 };
  try {
    const snapshot = JSON.parse(saved) as AuctionSnapshot;
    if (snapshot?.version !== 1 || !Array.isArray(snapshot.records)
      || snapshot.records.length > MAX_AUCTION_IMPORT_RECORDS
      || !Number.isSafeInteger(snapshot.nextNumber) || snapshot.nextNumber < 1) throw new Error();
    const ids = new Set<string>();
    const domains = new Set<string>();
    const numbers = new Set<number>();
    for (const record of snapshot.records) {
      if (!record || record.preview !== false || record.source !== `godaddy`
        || record.dataSource !== `inventory` || typeof record.domain !== `string` || normalizeAuctionDomain(record.domain) !== record.domain
        || !Number.isSafeInteger(record.number) || record.number < 1
        || getAppCollectionIDNumber(record.id, `Auction`) !== record.number
        || ids.has(record.id) || domains.has(record.domain) || numbers.has(record.number)
        || ![`bid`, `offer`, `buy-now`, `closeout`, `expiring`].includes(record.type)
        || !isNullableNumber(record.bids, true) || !isNullableNumber(record.ageYears, true)
        || !isNullableNumber(record.priceUsd)
        || (record.endsAt !== null && parseAuctionTimestamp(record.endsAt) !== record.endsAt)
        || typeof record.sourceHref !== `string`
        || (record.sourceHref !== `` && getInventoryListingHref(record.sourceHref) !== record.sourceHref)
        || (record.listingHref !== undefined && getInventoryListingHref(record.listingHref) !== record.listingHref)
        || (record.sourceCheckedAt !== undefined && (typeof record.sourceCheckedAt !== `string` || parseAuctionTimestamp(record.sourceCheckedAt) !== record.sourceCheckedAt))
        || !record.importedAt || parseAuctionTimestamp(record.importedAt) !== record.importedAt
        || (record.inventoryMetrics !== undefined && !validateMetrics(record.inventoryMetrics))) throw new Error();
      ids.add(record.id);
      domains.add(record.domain);
      numbers.add(record.number);
    }
    return {
      ...snapshot,
      nextNumber: Math.max(snapshot.nextNumber, ...snapshot.records.map(record => record.number + 1)),
    };
  } catch {
    throw new Error(`Saved Auction Inventory Could Not Be Read — Clear Imported Inventory To Start Again`);
  }
};

export const getAuctionListings = (): Promise<AuctionRecord[]> => serialize(async () => (await readSnapshot()).records);

export const importAuctionInventory = (text: string) => serialize(async () => {
  const imported = parseAuctionInventory(text);
  const snapshot = await readSnapshot();
  const previous = new Map(snapshot.records.map(record => [record.domain, record]));
  const importedAt = new Date().toISOString();
  const records: StoredAuctionRecord[] = imported.records.map(input => {
    const existing = previous.get(input.domain);
    const number = existing?.number ?? snapshot.nextNumber++;
    const id = existing?.id ?? genID(`Auction`, number, input.domain, new Date(importedAt)).id;
    return { ...input, id, number, importedAt };
  });
  await writeStorage(AUCTION_STORAGE_KEY, JSON.stringify({ version: 1, records, nextNumber: snapshot.nextNumber }));
  return { records, importedCount: records.length, skippedCount: imported.skippedCount, sourceCheckedAt: imported.sourceCheckedAt };
});

export const clearAuctionInventory = (): Promise<void> => serialize(async () => {
  requireStorage();
  let nextNumber = 1;
  try {
    nextNumber = (await readSnapshot()).nextNumber;
  } catch {
    // Explicit clearing also permits recovery from unreadable imported inventory.
  }
  await writeStorage(AUCTION_STORAGE_KEY, JSON.stringify({ version: 1, records: [], nextNumber }));
});
