import type { AuctionRecord } from '../../shared/domainAuction/types';
import { auctionTypes, auctionSources } from '../../shared/domainAuction/values';
import { liveAuctionMetrics, type LiveAuction } from '../../shared/domainAuction/live';

export type AuctionRowProps = { record: AuctionRecord };
const money = new Intl.NumberFormat(`en-US`, { style: `currency`, currency: `USD` });
const count = new Intl.NumberFormat(`en-US`);
const timestamp = new Intl.DateTimeFormat(undefined, { year: `numeric`, month: `short`, day: `numeric`, hour: `numeric`, minute: `2-digit` });
const auctionCodeLabel = (value: string) => value.toLowerCase().replaceAll(`_`, ` `).replace(/\b\w/g, letter => letter.toUpperCase());

export const getLiveAuctionLabels = (auction: LiveAuction) => {
  const labels = [`${auction.available ? `Available On GoDaddy` : `Unavailable On GoDaddy`} · ${timestamp.format(new Date(auction.checkedAt))}`];
  if (!auction.available) return labels;
  const { endsAt, beginsAt, expiresAt, createdAt, transfersAt, watching, extended, memberStatus, metrics, referers } = auction;
  const { listingId, listingType, characterPattern } = auction;
  if (listingId !== undefined) labels.push(`GoDaddy Listing ID · ${listingId}`);
  if (listingType) labels.push(`Listing Type · ${listingType === `EXPIRY_AUCTIONS` ? `Expiry Auction` : auctionCodeLabel(listingType)}`);
  if (characterPattern) labels.push(`Name Pattern · ${characterPattern.toUpperCase()} (Vowel/Consonant)`);
  for (const [label, date] of [[`Starts`, beginsAt], [`Ends`, endsAt], [`Domain Created`, createdAt], [`Domain Expires`, expiresAt], [`Estimated Transfer`, transfersAt]]) {
    if (date) labels.push(`${label} · ${timestamp.format(new Date(date))}`);
  }
  if (extended) labels.push(`Auction Extended`);
  if (watching !== undefined) labels.push(watching ? `On Your Watchlist` : `Off Your Watchlist`);
  if (memberStatus) labels.push(`Your Bid Status · ${auctionCodeLabel(memberStatus)}`);
  for (const key of Object.keys(liveAuctionMetrics) as (keyof typeof liveAuctionMetrics)[]) {
    const value = metrics[key];
    const [label, format] = liveAuctionMetrics[key];
    if (value !== undefined) labels.push(`${label} · ${(format === `money` ? money : count).format(value)}`);
  }
  for (const referer of referers ?? []) labels.push(`Semrush · ${referer.domain} · ${count.format(referer.links)} Backlink(s)`);
  return labels;
};

const safeSourceHref = (value: string | undefined, source: AuctionRecord[`source`]) => {
  if (!value) return ``;
  try {
    const url = new URL(value);
    const domain = `${source}.com`;
    return url.protocol === `https:` && !url.username && !url.password
      && (url.hostname === domain || url.hostname.endsWith(`.${domain}`)) ? url.href : ``;
  } catch {
    return ``;
  }
};

export const getAuctionRow = (record: AuctionRecord) => {
  const listingHref = record.preview ? `` : safeSourceHref(record.listingHref, record.source);
  const href = listingHref || safeSourceHref(record.sourceHref, record.source);
  const end = record.endsAt ? new Date(record.endsAt) : null;
  const ended = !record.preview && end && Number.isFinite(end.getTime()) && end.getTime() < Date.now();
  const sourceDate = record.sourceCheckedAt || record.importedAt;
  const formatPrice = (value: number) => new Intl.NumberFormat(`en-US`, { style: `currency`, currency: `USD` }).format(value);

  return {
    href,
    source: auctionSources.find(source => source.id === record.source)?.label ?? record.source,
    type: auctionTypes.find(type => type.id === record.type)?.label ?? record.type,
    linkLabel: listingHref ? `View Listing` : `Search Source`,
    status: record.preview ? `Preview` : ended ? `Snapshot · Ended` : `Snapshot`,
    statusState: ended ? `ended` : `unknown`,
    bids: record.bids === null ? `—` : record.bids.toLocaleString(),
    price: record.priceUsd === null ? `—` : formatPrice(record.priceUsd),
    valuation: record.inventoryMetrics?.valuationUsd === undefined ? `` : formatPrice(record.inventoryMetrics.valuationUsd),
    pageviews: record.inventoryMetrics?.pageviews === undefined ? `` : record.inventoryMetrics.pageviews.toLocaleString(),
    checked: sourceDate ? new Date(sourceDate).toLocaleString(undefined, { year: `numeric`, month: `short`, day: `numeric`, hour: `numeric`, minute: `2-digit` }) : ``,
    checkedLabel: record.sourceCheckedAt ? `Source Snapshot` : `Imported`,
    age: record.ageYears === null ? `Unknown` : `${record.ageYears} year(s)`,
    end: end && Number.isFinite(end.getTime()) ? end.toLocaleString(undefined, { year: `numeric`, month: `short`, day: `numeric`, hour: `numeric`, minute: `2-digit` }) : `Not Provided`,
  };
};
