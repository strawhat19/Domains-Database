import './styles.scss';
import AfternicActivity from './Activity.web';
import { useLocalStorage } from '../../shared/config';
import MarketSkeleton from '../DomainMarket/MarketSkeleton';
import { useAuth } from '../../shared/authContext/useAuth';
import { afternicPortalUrl } from '../../shared/marketplaceAfternic/client';
import { afternicListingDetails, afternicStatusLabel } from '../../shared/marketplaceAfternic/display';
import { ChevronDown, Download, ExternalLink, Globe2, RefreshCw, Store, Upload } from 'lucide-react';
import { afternicMoney, isAfternicCandidate, useMarketplaceAfternic, type MarketplaceAfternicProps } from './useMarketplaceAfternic';

const AfternicPanel = ({ seller, onImport }: MarketplaceAfternicProps) => {
  const state = useMarketplaceAfternic(onImport);
  const disabled = !!state.busy;
  const canManage = seller?.eligible === true && !!seller.username;
  const candidates = canManage ? seller?.listings.filter(isAfternicCandidate) ?? [] : [];
  const loading = !state.portfolio && !state.error && (!state.status || state.busy === `portfolio`);
  if (state.status?.configured === false) return null;
  return (
    <section id={`marketplace-afternic`} className={`marketplace-afternic`} aria-labelledby={`marketplace-afternic-title`}>
      <h2 id={`marketplace-afternic-title`} className={`marketplace-afternic-title`}>
        <button
          type={`button`}
          onClick={state.toggle}
          aria-expanded={state.open}
          id={`marketplace-afternic-toggle`}
          className={`marketplace-afternic-toggle`}
          aria-controls={`marketplace-afternic-panel`}
        >
          <Store size={18} aria-hidden id={`marketplace-afternic-icon`} className={`marketplace-afternic-icon`} />
          <span id={`marketplace-afternic-toggle-label`} className={`marketplace-afternic-toggle-label`}>{`Your Afternic Listings`}</span>
          <ChevronDown size={15} aria-hidden id={`marketplace-afternic-chevron`} className={`marketplace-afternic-chevron`} />
        </button>
      </h2>
      <div id={`marketplace-afternic-panel`} className={`marketplace-afternic-panel`} hidden={!state.open} aria-busy={disabled}>
        {state.error && <p id={`marketplace-afternic-error`} className={`marketplace-afternic-error`} role={`alert`}>{state.error}</p>}
        {state.notice && <p id={`marketplace-afternic-notice`} className={`marketplace-afternic-note`} role={`status`}>{state.notice}</p>}
        {loading && <MarketSkeleton kind={`browse`} label={`Loading Afternic Listings`} />}
        {state.status?.configured ? (
          <>
            {!loading && <button
              type={`button`}
              disabled={disabled}
              id={`marketplace-afternic-load`}
              className={`marketplace-afternic-button`}
              onClick={() => void state.refresh()}
            ><RefreshCw size={15} aria-hidden id={`marketplace-afternic-load-icon`} className={`marketplace-afternic-icon`} />{state.error ? `Retry Afternic Listings` : `Refresh Afternic Listings`}</button>}
            {state.portfolio && (
              <div id={`marketplace-afternic-portfolio`} className={`marketplace-afternic-list`}>
                {state.portfolio.listings.length > 0 && (
                  <ul id={`marketplace-afternic-grid`} className={`marketplace-afternic-grid`} aria-label={`Afternic Listings`}>
                    {state.portfolio.listings.map(listing => {
                      const details = afternicListingDetails(listing);
                      return <li key={listing.domain} id={`marketplace-afternic-remote-${listing.domain}`} className={`marketplace-afternic-card`}>
                        <strong id={`marketplace-afternic-remote-domain-${listing.domain}`} className={`marketplace-afternic-domain marketplace-afternic-card-domain`}>
                          <Globe2 size={15} aria-hidden className={`marketplace-afternic-icon`} />{listing.domain}
                        </strong>
                        <span id={`marketplace-afternic-remote-meta-${listing.domain}`} className={`marketplace-afternic-note marketplace-afternic-meta`}>
                          <strong className={`marketplace-afternic-card-price`}>{afternicMoney(listing.priceCents)}</strong>
                          <span id={`marketplace-afternic-remote-status-${listing.domain}`} className={`marketplace-afternic-status`} data-active={listing.status === `ACTIVE`}>{afternicStatusLabel(listing.status)}</span>
                        </span>
                        {(!!details.length || !!listing.fastTransferStatus || listing.estimatedValueCents != null) && <details id={`marketplace-afternic-details-${listing.domain}`} className={`marketplace-afternic-note`}>
                          <summary id={`marketplace-afternic-summary-${listing.domain}`} className={`marketplace-afternic-details-label`}>{`Listing Details`}</summary>
                          {listing.fastTransferStatus && <div id={`marketplace-afternic-transfer-${listing.domain}`}>{`Fast Transfer · ${afternicStatusLabel(listing.fastTransferStatus)}`}</div>}
                          {listing.estimatedValueCents != null && <div id={`marketplace-afternic-estimate-${listing.domain}`}>{`Afternic Estimate ${afternicMoney(listing.estimatedValueCents)}`}</div>}
                          {details.map(detail => <div key={detail.id} id={`marketplace-afternic-${listing.domain}-${detail.id}`}>{detail.label}</div>)}
                        </details>}
                        {listing.canImport && canManage && (
                          <button
                            type={`button`}
                            aria-label={`Import ${listing.domain} As Draft`}
                            id={`marketplace-afternic-import-${listing.domain}`}
                            disabled={disabled || !!state.imported[listing.domain]}
                            onClick={() => void state.importDraft(listing.domain)}
                            className={`marketplace-afternic-button marketplace-afternic-card-action`}
                          ><Download size={14} aria-hidden id={`marketplace-afternic-import-icon-${listing.domain}`} className={`marketplace-afternic-icon`} />{state.imported[listing.domain] ? `Imported` : `Import Draft`}</button>
                        )}
                      </li>;
                    })}
                  </ul>
                )}
                {!state.portfolio.listings.length && !state.portfolio.skipped && state.portfolio.nextOffset === null && <p id={`marketplace-afternic-portfolio-empty`} className={`marketplace-afternic-note`}>{`No Listings In Your Afternic Portfolio`}</p>}
                {!!state.portfolio.skipped && <p id={`marketplace-afternic-portfolio-skipped`} className={`marketplace-afternic-note`}>{`${state.portfolio.skipped} Afternic Listing(s) Could Not Be Read`}</p>}
                {state.portfolio.nextOffset !== null && (
                  <button
                    type={`button`}
                    disabled={disabled}
                    id={`marketplace-afternic-next`}
                    className={`marketplace-afternic-button`}
                    onClick={() => { const next = state.portfolio?.nextOffset; if (next != null) void state.load(next); }}
                  >{`Load More Afternic Listings`}</button>
                )}
              </div>
            )}
            {canManage && <div id={`marketplace-afternic-exports`} className={`marketplace-afternic-list`}>
              <h3 id={`marketplace-afternic-exports-title`} className={`marketplace-afternic-subtitle`}>{`Send To Afternic`}</h3>
              {!candidates.length && <p id={`marketplace-afternic-exports-empty`} className={`marketplace-afternic-note`}>{`Create a draft or pause a listing to send it to Afternic.`}</p>}
              {candidates.map(listing => {
                const provider = state.results[listing.id]?.providerListing;
                const review = state.review?.listingId === listing.id ? state.review : null;
                const Icon = listing.afternicHold ? RefreshCw : Upload;
                return (
                  <div key={listing.id} id={`marketplace-afternic-export-${listing.id}`} className={`marketplace-afternic-list`}>
                    <div id={`marketplace-afternic-export-row-${listing.id}`} className={`marketplace-afternic-row`}>
                      <div id={`marketplace-afternic-export-copy-${listing.id}`} className={`marketplace-afternic-copy`}>
                        <strong id={`marketplace-afternic-export-domain-${listing.id}`} className={`marketplace-afternic-domain`}>{listing.domain}</strong>
                        {provider ? <span id={`marketplace-afternic-export-status-${listing.id}`} className={`marketplace-afternic-note`}>{`Afternic ${afternicStatusLabel(provider.status)}${provider.fastTransferStatus ? ` · Fast Transfer ${afternicStatusLabel(provider.fastTransferStatus)}` : ``}`}</span>
                          : listing.afternicHold && <span id={`marketplace-afternic-export-hold-${listing.id}`} className={`marketplace-afternic-note`}>{`In-App Publication Held · Check Afternic Status`}</span>}
                      </div>
                      <button
                        type={`button`}
                        disabled={disabled}
                        id={`marketplace-afternic-review-${listing.id}`}
                        className={`marketplace-afternic-button`}
                        onClick={() => void (listing.afternicHold ? state.check(listing.id) : state.reviewListing(listing.id))}
                      >
                        <Icon size={14} aria-hidden id={`marketplace-afternic-review-icon-${listing.id}`} className={`marketplace-afternic-icon`} />
                        {listing.afternicHold ? `Check Status` : `Review Listing`}
                      </button>
                    </div>
                    {review && (
                      <div id={`marketplace-afternic-review-panel-${listing.id}`} className={`marketplace-afternic-review`} aria-live={`polite`}>
                        {review.providerListing ? <p id={`marketplace-afternic-review-existing-${listing.id}`} className={`marketplace-afternic-note`}>{`This domain is already at Afternic (${afternicStatusLabel(review.providerListing.status)}). Manage it there or import the existing listing above.`}</p> : (
                          <>
                            <p id={`marketplace-afternic-review-price-${listing.id}`} className={`marketplace-afternic-note`}>{afternicMoney(review.priceCents)}{review.minimumOfferCents === null ? `` : ` · Offers From ${afternicMoney(review.minimumOfferCents)}`}</p>
                            <p id={`marketplace-afternic-review-verification-${listing.id}`} className={`marketplace-afternic-note`}>{`Add the verification TXT record shown for this draft. Afternic may need its own verification before it activates your listing.`}</p>
                          </>
                        )}
                        <div id={`marketplace-afternic-review-actions-${listing.id}`} className={`marketplace-afternic-actions`}>
                          {!review.providerListing && (
                            <button type={`button`} id={`marketplace-afternic-publish-${listing.id}`} className={`marketplace-afternic-button marketplace-afternic-primary`} disabled={disabled} onClick={() => void state.publish(review)}>
                              <Upload size={14} aria-hidden id={`marketplace-afternic-publish-icon-${listing.id}`} className={`marketplace-afternic-icon`} />{`List On Afternic`}
                            </button>
                          )}
                          <button type={`button`} id={`marketplace-afternic-cancel-${listing.id}`} className={`marketplace-afternic-button`} onClick={state.clearReview}>{`Close Review`}</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>}
          </>
        ) : state.error && (
          <button type={`button`} id={`marketplace-afternic-retry`} className={`marketplace-afternic-button`} disabled={disabled} onClick={() => void state.refresh()}><RefreshCw size={14} aria-hidden id={`marketplace-afternic-retry-icon`} className={`marketplace-afternic-icon`} />{`Retry Connection`}</button>
        )}
        {state.status?.configured && <AfternicActivity />}
        <a id={`marketplace-afternic-link`} className={`marketplace-afternic-button`} href={afternicPortalUrl} target={`_blank`} rel={`noreferrer`}>
          <ExternalLink size={15} aria-hidden id={`marketplace-afternic-link-icon`} className={`marketplace-afternic-icon`} />{`Open Afternic`}
        </a>
      </div>
    </section>
  );
};

const MarketplaceAfternic = (props: MarketplaceAfternicProps) => {
  const { user, loading, loginRevision } = useAuth();
  return !useLocalStorage && !loading && user?.active && !user.anonymous && user.role !== `Guest`
    ? <AfternicPanel key={`${user.id}:${loginRevision}`} {...props} /> : null;
};

export default MarketplaceAfternic;
