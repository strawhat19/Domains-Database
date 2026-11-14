import './styles.scss';
import { Link } from 'expo-router';
import RouterAnchor from '../RouterAnchor';
import { useDomainParking } from './useDomainParking';
import type { DomainRecord } from '../../shared/types';
import { ChartNoAxesCombined, LoaderCircle, Network, Store, Tags } from 'lucide-react';
import { getParkingMetricsLabels } from '../../shared/domainParking/presentation';
import { getDnsDetailLabels, useGoDaddyDns } from '../../shared/registrarSync/useGoDaddyDns';
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
  const { status, details, appraisal, priceLabel, transferLabel, estimateLabel, showEstimateAction } = usePortfolioMarketplace(domain);
  const parking = useDomainParking(domain);
  const dns = useGoDaddyDns(domain);
  if (!status && !details.length && !showEstimateAction && !parking.available && !parking.result && !dns.available) return null;
  return <div id={id} className={`portfolio-marketplace`}>
    {status && <span id={`${id}-status`} className={`portfolio-marketplace-status`}>{status}</span>}
    {priceLabel && <span id={`${id}-price`} className={`portfolio-marketplace-price`}>{priceLabel}</span>}
    {transferLabel && <span id={`${id}-fast-transfer`} className={`portfolio-marketplace-price`}>{transferLabel}</span>}
    {estimateLabel && <span id={`${id}-estimate`} className={`portfolio-marketplace-estimate`}>{estimateLabel}</span>}
    {details.map(detail => <span key={detail.id} id={`${id}-${detail.id}`} className={`portfolio-marketplace-price`}>{detail.label}</span>)}
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
    {(parking.available || parking.result) && <div id={`${id}-parking`} className={`portfolio-marketplace-parking`} aria-busy={parking.busy}>
      {parking.available && <button type={`button`} id={`${id}-check-parking`} className={`portfolio-marketplace-estimate-button`} disabled={disabled || parking.busy}
        aria-label={`Check Parking Metrics For ${domain.name}`} onClick={() => void parking.lookup()}>
        {parking.busy ? <LoaderCircle size={13} aria-hidden className={`portfolio-marketplace-parking-spinner`} /> : <ChartNoAxesCombined size={13} aria-hidden />}
        {parking.busy ? `Checking Parking…` : `Check Parking Metrics`}
      </button>}
      {parking.accounts.length > 0 && <label id={`${id}-parking-selection`} className={`portfolio-marketplace-price`}>
        {`GoDaddy Connection`}
        <select id={`${id}-parking-account`} className={`portfolio-marketplace-parking-account`} value={``} disabled={disabled}
          onChange={event => void parking.lookup(event.currentTarget.value)}>
          <option value={``} disabled>{`Choose An Account`}</option>
          {parking.accounts.map(account => <option key={account.id} value={account.id}>{`Account ${account.number}`}</option>)}
        </select>
      </label>}
      {parking.error && <span id={`${id}-parking-error`} role={`status`} className={`portfolio-marketplace-error`}>{parking.error}</span>}
      {parking.notice && <span id={`${id}-parking-notice`} role={`status`} className={`portfolio-marketplace-price`}>{parking.notice}</span>}
      {parking.result && <div id={`${id}-parking-result`} className={`portfolio-marketplace-parking`} aria-live={`polite`}>
        {getParkingMetricsLabels(parking.result).map(detail => <span key={detail.id} id={`${id}-parking-${detail.id}`} className={`portfolio-marketplace-price`}>{detail.label}</span>)}
      </div>}
    </div>}
    {dns.available && <div id={`${id}-dns`} className={`portfolio-marketplace-dns`} aria-busy={dns.loading}>
      <button type={`button`} id={`${id}-check-dns`} className={`portfolio-marketplace-estimate-button`} disabled={disabled || dns.loading}
        aria-label={`Check GoDaddy DNS For ${domain.name}`} onClick={() => void dns.check()}>
        {dns.loading ? <LoaderCircle size={13} aria-hidden className={`portfolio-marketplace-parking-spinner`} /> : <Network size={13} aria-hidden />}
        {dns.loading ? `Checking GoDaddy DNS…` : `Check GoDaddy DNS`}
      </button>
      {dns.error && <span id={`${id}-dns-error`} role={`status`} className={`portfolio-marketplace-error`}>{dns.error}</span>}
      {dns.result && <div id={`${id}-dns-results`} className={`portfolio-marketplace-dns-results`}>
        {getDnsDetailLabels(dns.result).map(detail => <span key={detail.id} id={`${id}-dns-${detail.id}`} className={`portfolio-marketplace-price`}>{detail.label}</span>)}
      </div>}
    </div>}
  </div>;
};
