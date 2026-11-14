import type { AfternicListing, AfternicSearchCounts } from '../../shared/marketplaceAfternic/types';

const windows = [`30d`, `90d`, `365d`] as const;
const missingSearch = (counts: AfternicSearchCounts | null | undefined) => !counts || windows.some(window => counts[window] === null);
const usableSearch = (counts: AfternicSearchCounts | null | undefined) => counts && windows.some(window => counts[window] !== null);

export const needsAfternicInsights = (listing: AfternicListing) => listing.estimatedValueCents === null || listing.insights?.intakeViews == null
  || listing.insights?.intakeLeads == null || missingSearch(listing.insights?.searchTotals) || missingSearch(listing.insights?.uniqueSearchers);
export const hasAfternicInsights = (listing: AfternicListing) => listing.estimatedValueCents != null || listing.insights?.intakeViews != null
  || listing.insights?.intakeLeads != null || usableSearch(listing.insights?.searchTotals) || usableSearch(listing.insights?.uniqueSearchers);

export const retainAfternicInsights = (listing: AfternicListing, previous: AfternicListing, previousSync: string): AfternicListing => {
  const { insights } = listing;
  const saved = previous.insights;
  if (listing.domain !== previous.domain || insights?.listedAt && saved?.listedAt && insights.listedAt !== saved.listedAt) return listing;
  const estimate = listing.estimatedValueCents ?? previous.estimatedValueCents;
  let retained = estimate !== listing.estimatedValueCents;
  const retainedValue = (fresh: number | null, fallback: number | null | undefined) => {
    if (fresh !== null || fallback == null) return fresh;
    retained = true;
    return fallback;
  };
  const retainedSearch = (fresh: AfternicSearchCounts | null, fallback: AfternicSearchCounts | null | undefined) => {
    if (!fallback) return fresh;
    return {
      '30d': retainedValue(fresh?.[`30d`] ?? null, fallback[`30d`]),
      '90d': retainedValue(fresh?.[`90d`] ?? null, fallback[`90d`]),
      '365d': retainedValue(fresh?.[`365d`] ?? null, fallback[`365d`]),
    };
  };
  const combined = insights && saved ? {
    ...insights,
    intakeViews: retainedValue(insights.intakeViews, saved.intakeViews),
    intakeLeads: retainedValue(insights.intakeLeads, saved.intakeLeads),
    searchTotals: retainedSearch(insights.searchTotals, saved.searchTotals),
    uniqueSearchers: retainedSearch(insights.uniqueSearchers, saved.uniqueSearchers),
  } : insights;
  return retained ? {
    ...listing, estimatedValueCents: estimate,
    retainedInsightsAt: previous.retainedInsightsAt ?? previousSync,
    ...(combined ? { insights: combined } : {}),
  } : listing;
};
