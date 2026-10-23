import { Buffer } from 'node:buffer';
import { getAuctionInventory } from './feed';
import { FeatureAccessError, requireStarterFeatureAccess } from '../featureAccess/auth';

const MAX_RESPONSE_BYTES = 3_500_000;
const ENVELOPE_RESERVE_BYTES = 2_048;
const headers = {
  Vary: `Authorization`,
  'Referrer-Policy': `no-referrer`,
  'X-Content-Type-Options': `nosniff`,
  'Cache-Control': `no-store, private, max-age=0`,
};

export const handleAuctionInventory = async (request: Request): Promise<Response> => {
  if (request.method !== `GET`) return Response.json({ error: `Use GET To Load Auction Inventory` }, { status: 405, headers: { ...headers, Allow: `GET` } });
  if (new URL(request.url).search) return Response.json({ error: `Auction Inventory Does Not Accept Query Parameters` }, { status: 400, headers });
  const controller = new AbortController();
  const abort = () => controller.abort();
  request.signal.addEventListener(`abort`, abort, { once: true });
  if (request.signal.aborted) abort();
  const timeout = setTimeout(abort, 20_000);
  try {
    await requireStarterFeatureAccess(request, controller.signal);
    const inventory = await getAuctionInventory();
    if (controller.signal.aborted) throw new Error(`Auction Inventory Request Cancelled`);
    const now = Date.now();
    const activeRecords = inventory.records.filter(record => !record.endsAt || Date.parse(record.endsAt) > now);
    const records: typeof inventory.records = [];
    let recordBytes = 0;
    for (const record of activeRecords) {
      const bytes = Buffer.byteLength(JSON.stringify(record), `utf8`) + (records.length ? 1 : 0);
      if (recordBytes + bytes > MAX_RESPONSE_BYTES - ENVELOPE_RESERVE_BYTES) break;
      recordBytes += bytes;
      records.push(record);
    }
    const body = JSON.stringify({
      ...inventory,
      records,
      endedCount: inventory.records.length - activeRecords.length,
      limitedCount: activeRecords.length - records.length,
    });
    if (Buffer.byteLength(body, `utf8`) > MAX_RESPONSE_BYTES) throw new Error(`Auction Inventory Response Size Limit`);
    return new Response(body, {
      headers: { ...headers, 'Content-Type': `application/json; charset=utf-8` },
    });
  } catch (failure) {
    if (failure instanceof FeatureAccessError) return Response.json({ error: failure.message, code: failure.code }, { status: failure.status, headers });
    return Response.json({ error: `Free GoDaddy Auctions Are Temporarily Unavailable — Try Again Later Or Import Inventory` }, { status: 502, headers });
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener(`abort`, abort);
  }
};
