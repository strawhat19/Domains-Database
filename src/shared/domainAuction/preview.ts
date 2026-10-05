import { auctionSources } from './values';
import type { AuctionRecord } from './types';

// These illustrative records are only returned after explicitly opening the preview.
const examples: Omit<AuctionRecord, `preview` | `endsAt` | `sourceHref`>[] = [
  { id: `preview-1`, domain: `harboratlas.com`, source: `godaddy`, type: `expiring`, bids: 8, priceUsd: 275, ageYears: 11 },
  { id: `preview-2`, domain: `cloudparcel.net`, source: `dynadot`, type: `public`, bids: 3, priceUsd: 90, ageYears: 6 },
  { id: `preview-3`, domain: `studioledger.com`, source: `namecheap`, type: `expiring`, bids: 14, priceUsd: 460, ageYears: 9 },
  { id: `preview-4`, domain: `bright-harbor.org`, source: `godaddy`, type: `closeout`, bids: null, priceUsd: 40, ageYears: 4 },
  { id: `preview-5`, domain: `atlas247.io`, source: `dynadot`, type: `buy-now`, bids: null, priceUsd: 850, ageYears: null },
  { id: `preview-6`, domain: `parcelstudio.net`, source: `namecheap`, type: `public`, bids: 0, priceUsd: 25, ageYears: 2 },
];

export const getAuctionPreview = (now = Date.now()): AuctionRecord[] => examples.map((record, index) => ({
  ...record,
  preview: true,
  sourceHref: auctionSources.find(source => source.id === record.source)?.href ?? ``,
  endsAt: record.type === `buy-now` ? null : new Date(now + [6, 18, 30, 60, 100, 144][index] * 3_600_000).toISOString(),
}));
