import { getAuctionListings } from '../domainAuction/storage';
import type { DomainAnalyticsSnapshot } from './types';
import type { AuctionInventoryMetrics } from '../domainAuction/types';

const metricLabels: Partial<Record<keyof AuctionInventoryMetrics, string>> = {
  isAdult: `Adult Listing`,
  pageviews: `Listing Page Views`,
  majesticTf: `Majestic Trust Flow`,
  semrushAs: `SEMrush Authority Score`,
  majesticCf: `Majestic Citation Flow`,
  developedTlds: `Developed Extensions`,
  exactMatchTlds: `Exact Match Extensions`,
  valuationUsd: `GoDaddy Valuation (USD)`,
  semrushCpc: `SEMrush Keyword CPC (USD)`,
  majesticBacklinks: `Majestic Backlinks`,
  semrushBacklinks: `SEMrush Backlinks`,
  semrushIndexedPages: `SEMrush Indexed Pages`,
  keywordRegistrations: `Keyword Registrations`,
  semrushSearchVolume: `SEMrush Search Volume`,
  semrushReferringDomains: `SEMrush Referring Domains`,
  majesticReferringDomains: `Majestic Referring Domains`,
  monthlyParkingRevenueUsd: `Monthly Parking Revenue (USD)`,
  semrushTopReferringDomains: `SEMrush Top Referring Domains`,
};
const moneyKeys = [`semrushCpc`, `valuationUsd`, `monthlyParkingRevenueUsd`];

export const getImportedDomainAnalytics = async (domain: string): Promise<DomainAnalyticsSnapshot['inventory']> => {
  const record = (await getAuctionListings()).find(listing => listing.domain === domain);
  if (!record?.inventoryMetrics) return undefined;
  const metrics = Object.entries(record.inventoryMetrics).flatMap(([key, value]) => {
    const label = metricLabels[key as keyof AuctionInventoryMetrics];
    if (!label) return [];
    const formatted = typeof value === `boolean` ? value ? `Yes` : `No`
      : Array.isArray(value) ? value.join(`, `)
        : typeof value === `number` ? moneyKeys.includes(key)
          ? new Intl.NumberFormat(`en-US`, { style: `currency`, currency: `USD` }).format(value)
          : value.toLocaleString(`en-US`) : ``;
    return formatted ? [{ key, label, value: formatted }] : [];
  });
  return metrics.length ? {
    metrics,
    sourceLabel: `GoDaddy Auction Inventory`,
    importedAt: record.importedAt,
    sourceCheckedAt: record.sourceCheckedAt,
  } : undefined;
};
