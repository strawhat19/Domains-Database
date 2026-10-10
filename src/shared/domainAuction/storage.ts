import type { AuctionRecord, AuctionInventoryMetrics } from './types';
import { authAPI } from '../../api/auth';
import { AUCTION_STORAGE_KEY } from '../accountData/keys';
import { useLocalStorage, persistenceEnabled } from '../config';
import { accountStorageKey } from '../authentication/userScope';
import { genID, getAppCollectionIDNumber } from '../common/ids';
import { readStorage, writeStorage, subscribeStorage, createOperationQueue } from '../common/storage';
import { parseAuctionInventory, normalizeAuctionDomain, parseAuctionTimestamp, getInventoryListingHref, MAX_AUCTION_IMPORT_RECORDS } from './import';

export { AUCTION_STORAGE_KEY } from '../accountData/keys';
const serialize = createOperationQueue(AUCTION_STORAGE_KEY);
type StoredAuctionRecord = AuctionRecord & { number: number };

interface AuctionSnapshot {
  version: 1;
  records: StoredAuctionRecord[];
  nextNumber: number;
}

const requireStorage = async () => {
  if (!persistenceEnabled) throw new Error(`Connect A Backend To Save Auction Inventory`);
  const userId = (await authAPI.restoreSession())?.user.id ?? null;
  return { userId, storageKey: userId && !useLocalStorage ? accountStorageKey(AUCTION_STORAGE_KEY, userId) : AUCTION_STORAGE_KEY };
};
const saveSnapshot = async (snapshot: AuctionSnapshot, scope: { storageKey: string; userId: string | null }) => {
  const actor = await requireStorage();
  if (actor.userId !== scope.userId || actor.storageKey !== scope.storageKey) throw new Error(`Your Account Changed — Try Again`);
  await writeStorage(scope.storageKey, JSON.stringify(snapshot));
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

const restoreSnapshot = (saved: string | null): AuctionSnapshot => {
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

const readSnapshot = async (): Promise<AuctionSnapshot & { storageKey: string; userId: string | null }> => {
  const scope = await requireStorage();
  return { ...restoreSnapshot(await readStorage(scope.storageKey)), ...scope };
};

export const subscribeAuctionListings = (
  userId: string | null,
  onValue: (records: AuctionRecord[]) => boolean | void,
  onError: (error: Error) => void,
) => {
  let active = true;
  let unsubscribe: (() => void) | undefined;
  void requireStorage().then(scope => {
    if (!active) return;
    if (scope.userId !== userId) throw new Error(`Your Account Changed — Try Again`);
    unsubscribe = subscribeStorage(scope.storageKey, saved => {
      try { return onValue(restoreSnapshot(saved).records); }
      catch (reason) {
        onError(reason instanceof Error ? reason : new Error(`Saved Auction Inventory Could Not Be Read`));
        return false;
      }
    }, onError);
  }).catch(reason => {
    if (active) onError(reason instanceof Error ? reason : new Error(`Could Not Load Auction Inventory`));
  });
  return () => { active = false; unsubscribe?.(); };
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
  await saveSnapshot({ version: 1, records, nextNumber: snapshot.nextNumber }, snapshot);
  return { records, importedCount: records.length, skippedCount: imported.skippedCount, sourceCheckedAt: imported.sourceCheckedAt };
});

export const clearAuctionInventory = (): Promise<void> => serialize(async () => {
  const scope = await requireStorage();
  let nextNumber = 1;
  try {
    nextNumber = (await readSnapshot()).nextNumber;
  } catch {
    // Explicit clearing also permits recovery from unreadable imported inventory.
  }
  await saveSnapshot({ version: 1, records: [], nextNumber }, scope);
});
