import MarketSkeleton from './MarketSkeleton';
import { ExternalLink, Globe2 } from 'lucide-react';
import { registrarPurchaseUrl } from '../../shared/domainSearch/types';
import { externalMarketPrice } from '../../shared/marketplace/externalListings';
import type { useExternalMarketListings } from './useExternalMarketListings';

const ExternalMarketListings = ({ query, discovery }: { query: string; discovery: ReturnType<typeof useExternalMarketListings> }) => (
  <section id={`market-external-listings`} className={`market-public market-external-listings`} aria-labelledby={`market-external-title`}>
    <div id={`market-external-heading`} className={`market-public-heading`}>
      <h2 id={`market-external-title`}>{`Afternic Premium`}</h2>
      <p id={`market-external-description`} className={`market-muted`}>{`Available through GoDaddy. Confirm the price and purchase there.`}</p>
    </div>
    {discovery.status === `loading` ? <MarketSkeleton kind={`browse`} label={`Loading Afternic Premium Domains`} /> : null}
    {discovery.status !== `loading` && !discovery.listings.length ? (
      <div id={`market-external-state`} className={`market-state market-external-state`} role={`status`}>
        <p>{discovery.message || (discovery.status === `ready`
          ? query ? `No additional Afternic Premium domains found for this search.` : `No additional Afternic Premium domains to show right now.`
          : `Afternic Premium is currently unavailable.`)}</p>
        {discovery.status === `rate-limited` || discovery.status === `unavailable` ? (
          <button id={`market-external-retry`} type={`button`} className={`market-button`} onClick={discovery.retry}>{`Retry`}</button>
        ) : null}
      </div>
    ) : null}
    {discovery.listings.length ? <ul id={`market-external-results`} className={`market-listings`}>
      {discovery.listings.map(listing => {
        const id = `market-afternic-${listing.domain}`;
        const price = externalMarketPrice(listing);
        const href = registrarPurchaseUrl(`godaddy`, listing.domain);
        return <li key={listing.domain} id={id} className={`market-listing market-external-listing`}>
          <span className={`market-domain-icon`} aria-hidden><Globe2 size={19} /></span>
          <div className={`market-listing-identity`}>
            <a id={`${id}-domain`} className={`market-domain-name`} href={href} target={`_blank`} rel={`noopener noreferrer`}>{listing.domain}</a>
            <span className={`market-muted`}>{`GoDaddy`}</span>
          </div>
          <div id={`${id}-price`} className={`market-listing-price`}>
            <strong>{price ?? `Check Price`}</strong>
            {price ? <small>{`Estimated total`}</small> : null}
          </div>
          <a id={`${id}-open`} className={`market-button market-icon-button`} href={href} target={`_blank`} rel={`noopener noreferrer`} aria-label={`View ${listing.domain} on GoDaddy`} title={`View on GoDaddy`}>
            <ExternalLink size={17} aria-hidden />
          </a>
        </li>;
      })}
    </ul> : null}
  </section>
);

export default ExternalMarketListings;
