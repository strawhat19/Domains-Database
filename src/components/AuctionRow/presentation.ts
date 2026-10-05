import { auctionTypes, auctionSources } from '../../shared/domainAuction/values';
import type { AuctionRecord } from '../../shared/domainAuction/types';

export type AuctionRowProps = { record: AuctionRecord };

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
