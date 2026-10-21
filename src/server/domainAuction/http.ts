import { Buffer } from 'node:buffer';
import { getAuctionInventory } from './feed';

const MAX_RESPONSE_BYTES = 3_500_000;
const ENVELOPE_RESERVE_BYTES = 2_048;
const headers = {
  'Referrer-Policy': `no-referrer`,
  'X-Content-Type-Options': `nosniff`,
  'Cache-Control': `no-store`,
};

export const handleAuctionInventory = async (request: Request): Promise<Response> => {
  if (request.method !== `GET`) return Response.json({ error: `Use GET To Load Auction Inventory` }, { status: 405, headers: { ...headers, Allow: `GET` } });
  if (new URL(request.url).search) return Response.json({ error: `Auction Inventory Does Not Accept Query Parameters` }, { status: 400, headers });
  try {
    const inventory = await getAuctionInventory();
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
    const nextEnding = activeRecords.reduce((nearest, record) => record.endsAt ? Math.min(nearest, Date.parse(record.endsAt)) : nearest, Infinity);
    const maxAge = Math.max(0, Math.min(60, Math.floor((Date.parse(inventory.refreshAfter) - now) / 1_000), Math.floor((nextEnding - now) / 1_000)));
    const body = JSON.stringify({
      ...inventory,
      records,
      endedCount: inventory.records.length - activeRecords.length,
      limitedCount: activeRecords.length - records.length,
    });
    if (Buffer.byteLength(body, `utf8`) > MAX_RESPONSE_BYTES) throw new Error(`Auction Inventory Response Size Limit`);
    return new Response(body, {
      headers: { ...headers, 'Content-Type': `application/json; charset=utf-8`, 'Cache-Control': `public, max-age=0, s-maxage=${maxAge}, must-revalidate` },
    });
  } catch {
    return Response.json({ error: `Free GoDaddy Auctions Are Temporarily Unavailable — Try Again Later Or Import Inventory` }, { status: 502, headers });
  }
};
