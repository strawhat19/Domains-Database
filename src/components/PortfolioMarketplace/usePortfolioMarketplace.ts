import { Roles } from '../../types/types';
import { routes } from '../../shared/routes';
import type { DomainRecord } from '../../shared/types';
import { useAuth } from '../../shared/authContext/useAuth';
import { useDomainAppraisal } from '../../shared/marketplaceAfternic/useDomainAppraisal';
import { useAfternicPortfolioSync } from '../../shared/marketplaceAfternic/PortfolioSyncContext';

const usd = new Intl.NumberFormat(`en-US`, { style: `currency`, currency: `USD`, maximumFractionDigits: 2, minimumFractionDigits: 0 });
const money = (cents: number) => usd.format(cents / 100);
const statusLabel = (status: string) => status.toLowerCase().replace(/_/g, ` `).replace(/\b\w/g, letter => letter.toUpperCase());

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
  const appraisal = useDomainAppraisal(domain, owned && afternicEstimate == null);
  const showEstimateAction = owned && appraisal.available && afternicEstimate == null && appraisal.estimateCents == null;
  let status = ``;
  if (owned && connected) {
    if (listing) status = `Afternic: ${statusLabel(listing.status)}${error ? ` (Last Sync)` : ``}`;
    else if (syncing) status = `Afternic: Syncing…`;
    else if (error) status = `Afternic: Unavailable`;
    else if (complete) status = `Afternic: Not Listed`;
    else status = syncedAt ? `Afternic: Sync Incomplete` : `Afternic: Awaiting Sync`;
  }
  const priceLabel = listing ? price == null ? `Buy Now Unset` : `Buy Now ${money(price)}` : ``;
  const estimateLabel = afternicEstimate != null ? `Afternic Estimate ${money(afternicEstimate)}`
    : owned && appraisal.estimateCents != null ? `GoValue Estimate ${money(appraisal.estimateCents)}` : ``;
  const suggestedPriceLabel = appraisal.suggestedPriceCents == null ? `` : `GoValue Suggested Afternic Price ${money(appraisal.suggestedPriceCents)}`;
  const transferLabel = listing?.fastTransferStatus ? `Fast Transfer: ${statusLabel(listing.fastTransferStatus)}` : ``;
  return { status, priceLabel, estimateLabel, suggestedPriceLabel, transferLabel, showEstimateAction, appraisal };
};
