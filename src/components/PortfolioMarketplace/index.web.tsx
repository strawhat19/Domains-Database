import './styles.scss';
import { Link } from 'expo-router';
import RouterAnchor from '../RouterAnchor';
import { Store, Tags } from 'lucide-react';
import type { DomainRecord } from '../../shared/types';
import { getPortfolioSellHref, useOwnedMarketplaceDomain, usePortfolioMarketplace } from './usePortfolioMarketplace';

export const PortfolioSellLink = ({ id, domain, className, disabled }: { id: string; domain: DomainRecord; className: string; disabled?: boolean }) => {
  const owned = useOwnedMarketplaceDomain(domain);
  if (!owned || disabled) return null;
  return <Link asChild href={getPortfolioSellHref(domain)}>
    <RouterAnchor id={id} draggable={false} title={`List For Sale`} aria-label={`List ${domain.name} For Sale`} className={`${className} portfolio-sell-link`}>
      <Store id={`${id}-icon`} size={14} aria-hidden />
    </RouterAnchor>
  </Link>;
};

export const PortfolioMarketplace = ({ id, domain, disabled }: { id: string; domain: DomainRecord; disabled?: boolean }) => {
  const { status, appraisal, priceLabel, transferLabel, estimateLabel, suggestedPriceLabel, showEstimateAction } = usePortfolioMarketplace(domain);
  if (!status && !estimateLabel && !showEstimateAction) return null;
  return <div id={id} className={`portfolio-marketplace`}>
    {status && <span id={`${id}-status`} className={`portfolio-marketplace-status`}>{status}</span>}
    {priceLabel && <span id={`${id}-price`} className={`portfolio-marketplace-price`}>{priceLabel}</span>}
    {transferLabel && <span id={`${id}-fast-transfer`} className={`portfolio-marketplace-price`}>{transferLabel}</span>}
    {estimateLabel && <span id={`${id}-estimate`} className={`portfolio-marketplace-estimate`}>{estimateLabel}</span>}
    {suggestedPriceLabel && <span id={`${id}-suggested-price`} className={`portfolio-marketplace-estimate`}>{suggestedPriceLabel}</span>}
    {showEstimateAction && <button
      type={`button`}
      id={`${id}-get-estimate`}
      className={`portfolio-marketplace-estimate-button`}
      aria-busy={appraisal.estimating}
      disabled={disabled || appraisal.estimating}
      onClick={() => void appraisal.estimate()}
      aria-label={`Get GoValue Estimate For ${domain.name}`}
    >
      <Tags id={`${id}-estimate-icon`} size={12} aria-hidden />
      {appraisal.estimating ? `Estimating…` : `Get GoValue Estimate`}
    </button>}
    {showEstimateAction && appraisal.error && <span id={`${id}-error`} role={`status`} className={`portfolio-marketplace-error`}>{appraisal.error}</span>}
  </div>;
};
