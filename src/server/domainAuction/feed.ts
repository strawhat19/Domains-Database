import type { AuctionFeedSnapshot } from '../../shared/domainAuction/types';
import { parseAuctionInventory } from '../../shared/domainAuction/import';
import { readAuctionInventoryZip, MAX_AUCTION_ARCHIVE_BYTES } from './zip';

const CACHE_DURATION = 15 * 60_000;
const FEED_URL = `https://inventory.auctions.godaddy.com/most_active_feed_all.json.zip`;
let cached: AuctionFeedSnapshot | undefined;
let pending: Promise<AuctionFeedSnapshot> | undefined;

const readArchive = async (response: Response, signal: AbortSignal) => {
  const length = response.headers.get(`content-length`);
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_AUCTION_ARCHIVE_BYTES)) {
    void response.body?.cancel().catch(() => undefined);
    throw new Error(`Auction Inventory Size Limit`);
  }
  if (!response.body) throw new Error(`Auction Inventory Is Empty`);
  let size = 0;
  let complete = false;
  const chunks: Uint8Array[] = [];
  const reader = response.body.getReader();
  const abort = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener(`abort`, abort, { once: true });
  if (signal.aborted) abort();
  try {
    while (true) {
      if (signal.aborted) throw new Error(`Auction Inventory Request Timed Out`);
      const chunk = await reader.read();
      if (signal.aborted) throw new Error(`Auction Inventory Request Timed Out`);
      if (chunk.done) {
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const value of chunks) { bytes.set(value, offset); offset += value.byteLength; }
        complete = true;
        return bytes;
      }
      size += chunk.value.byteLength;
      if (size > MAX_AUCTION_ARCHIVE_BYTES) throw new Error(`Auction Inventory Size Limit`);
      chunks.push(chunk.value);
    }
  } finally {
    signal.removeEventListener(`abort`, abort);
    if (!complete) void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
};

const loadInventory = async (): Promise<AuctionFeedSnapshot> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(FEED_URL, {
      method: `GET`,
      cache: `no-store`,
      redirect: `error`,
      credentials: `omit`,
      signal: controller.signal,
      headers: { Accept: `application/zip, application/octet-stream`, 'Accept-Encoding': `identity` },
    });
    const encoding = response.headers.get(`content-encoding`);
    const contentType = response.headers.get(`content-type`)?.split(`;`)[0]?.trim()?.toLowerCase();
    if (!response.ok || ![`application/zip`, `application/x-zip-compressed`, `application/octet-stream`, `binary/octet-stream`].includes(contentType ?? ``)
      || encoding && encoding.toLowerCase() !== `identity`) {
      void response.body?.cancel().catch(() => undefined);
      throw new Error(`Auction Inventory Source Is Unavailable`);
    }
    const inventory = parseAuctionInventory(readAuctionInventoryZip(await readArchive(response, controller.signal)), { allowEmpty: true });
    if (controller.signal.aborted) throw new Error(`Auction Inventory Request Timed Out`);
    const fetchedAt = new Date().toISOString();
    const value: AuctionFeedSnapshot = {
      feed: `most-active`,
      source: `godaddy`,
      fetchedAt,
      endedCount: 0,
      limitedCount: 0,
      skippedCount: inventory.skippedCount,
      sourceCheckedAt: inventory.sourceCheckedAt,
      totalCount: inventory.records.length + inventory.skippedCount,
      refreshAfter: new Date(Date.parse(fetchedAt) + CACHE_DURATION).toISOString(),
      records: inventory.records.map(record => ({ ...record, dataSource: `feed`, id: `godaddy:${record.domain}` })),
    };
    cached = value;
    return value;
  } finally { clearTimeout(timeout); }
};

export const getAuctionInventory = (): Promise<AuctionFeedSnapshot> => {
  if (cached && Date.parse(cached.refreshAfter) > Date.now()) return Promise.resolve(cached);
  if (!pending) pending = loadInventory().finally(() => { pending = undefined; });
  return pending;
};
