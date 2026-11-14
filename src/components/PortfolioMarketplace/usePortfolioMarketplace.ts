import { Roles } from '../../types/types';
import { routes } from '../../shared/routes';
import type { DomainRecord } from '../../shared/types';
import { useAuth } from '../../shared/authContext/useAuth';
import { useDomainAppraisal } from '../../shared/marketplaceAfternic/useDomainAppraisal';
import { useAfternicPortfolioSync } from '../../shared/marketplaceAfternic/PortfolioSyncContext';
import { afternicListingDetails, afternicStatusLabel } from '../../shared/marketplaceAfternic/display';

const usd = new Intl.NumberFormat(`en-US`, { style: `currency`, currency: `USD`, maximumFractionDigits: 2, minimumFractionDigits: 0 });
const percent = new Intl.NumberFormat(`en-US`, { style: `percent`, maximumSignificantDigits: 2 });
const integer = new Intl.NumberFormat(`en-US`);
const money = (cents: number) => usd.format(cents / 100);

export const getPortfolioSellHref = (domain: DomainRecord) => ({ pathname: routes.market.href, params: { sellDomain: domain.name } });

export const useOwnedMarketplaceDomain = (domain?: DomainRecord | null) => {
  const { user, loading } = useAuth();
  return !loading && Boolean(domain && !domain.isSample && user?.active && !user.anonymous && user.role !== Roles.Guest && domain.uid === user.id);
};

export const usePortfolioMarketplace = (domain: DomainRecord) => {
  const owned = useOwnedMarketplaceDomain(domain);
  const { connected, listings, complete, syncing, error, syncedAt } = useAfternicPortfolioSync(owned);
  const listing = owned && connected ? listings.get(domain.name.trim().toLowerCase().replace(/\.$/, ``)) : undefined;
  const price = listing?.priceCents;
  const afternicEstimate = listing?.estimatedValueCents;
  const appraisal = useDomainAppraisal(domain, owned);
  const goValue = appraisal.appraisal;
  const showEstimateAction = owned && appraisal.available && !goValue;
  let status = ``;
  if (owned && connected) {
    if (listing) status = `Afternic: ${afternicStatusLabel(listing.status)}${error ? ` (Last Sync)` : ``}`;
    else if (syncing) status = `Afternic: Syncing…`;
    else if (error) status = `Afternic: Unavailable`;
    else if (complete) status = `Afternic: Not Listed`;
    else status = syncedAt ? `Afternic: Sync Incomplete` : `Afternic: Awaiting Sync`;
  }
  const priceLabel = listing ? price == null ? `Buy Now Unset` : `Buy Now ${money(price)}` : ``;
  const estimateLabel = afternicEstimate != null ? `Afternic Estimate ${money(afternicEstimate)}` : ``;
  const transferLabel = listing?.fastTransferStatus ? `Fast Transfer: ${afternicStatusLabel(listing.fastTransferStatus)}` : ``;
  const details = afternicListingDetails(listing);
  if (goValue) {
    const { amount, minPrice, maxPrice, wholesalePrice, listPrice, salesProbability, salesProbability500, salesProbabilityWholesale } = goValue;
    details.push({ id: `go-value`, label: `GoValue Estimate ${usd.format(amount)}` });
    if (minPrice != null && maxPrice != null) details.push({ id: `go-value-range`, label: `GoValue Range ${usd.format(minPrice)}–${usd.format(maxPrice)}` });
    if (listPrice != null) details.push({ id: `go-value-list`, label: `GoValue Suggested Afternic Price ${usd.format(listPrice)}` });
    if (wholesalePrice != null) details.push({ id: `go-value-wholesale`, label: `GoValue Wholesale ${usd.format(wholesalePrice)}` });
    if (salesProbability != null) details.push({ id: `go-value-sale`, label: `Estimated 1-Year Sale at GoValue · ${percent.format(salesProbability)}` });
    if (salesProbability500 != null) details.push({ id: `go-value-sale-500`, label: `Estimated 1-Year Sale at $500 · ${percent.format(salesProbability500)}` });
    if (salesProbabilityWholesale != null) details.push({ id: `go-value-sale-wholesale`, label: `Estimated 1-Year Sale at Wholesale · ${percent.format(salesProbabilityWholesale)}` });
    if (goValue.dailyUsage != null && goValue.maxDailyUsage != null) details.push({
      id: `go-value-usage`, label: `Daily GoValue Usage at Lookup · ${integer.format(goValue.dailyUsage)} / ${integer.format(goValue.maxDailyUsage)}`,
    });
  }
  return { status, details, appraisal, priceLabel, transferLabel, estimateLabel, showEstimateAction };
};
