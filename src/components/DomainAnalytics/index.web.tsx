import './styles.scss';
import { createPortal } from 'react-dom';
import { useDomainAnalyticsDialog } from './useDomainAnalyticsDialog';
import { X, Globe, Search, RefreshCw, ChartNoAxesCombined, ArrowUpRight } from 'lucide-react';
import { useDomainAnalytics, formatAnalyticsDate, type DomainAnalyticsProps } from './useDomainAnalytics';

const DomainAnalytics = ({ domain, suffix, onClose }: DomainAnalyticsProps) => {
  const state = useDomainAnalytics(domain, suffix);
  const modalRef = useDomainAnalyticsDialog();
  const scope = `domain-analytics-${state.scope}`;
  if (typeof document === `undefined`) return null;

  return createPortal(
      <dialog
        id={scope}
        tabIndex={-1}
        ref={modalRef}
        role={`dialog`}
        aria-modal={`true`}
        className={`domain-analytics-dialog`}
        aria-labelledby={`${scope}-title`}
        aria-describedby={`${scope}-description`}
        onClick={event => event.stopPropagation()}
        onKeyDown={event => event.stopPropagation()}
        onCancel={event => { event.preventDefault(); onClose(); }}
        onMouseDown={event => {
          event.stopPropagation();
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
            event.preventDefault();
            onClose();
          }
        }}
      >
        <header id={`${scope}-header`} className={`domain-analytics-header`}>
          <div id={`${scope}-heading`} className={`domain-analytics-heading`}>
            <span id={`${scope}-eyebrow`} className={`domain-analytics-eyebrow`}>
              <ChartNoAxesCombined id={`${scope}-icon`} className={`domain-analytics-icon`} size={16} aria-hidden={`true`} />
              {`DOMAIN ANALYTICS`}
            </span>
            <h2 id={`${scope}-title`} className={`domain-analytics-title`}>{domain}</h2>
          </div>
          <button
            type={`button`}
            onClick={onClose}
            id={`${scope}-close`}
            aria-label={`Close Domain Analytics`}
            className={`domain-analytics-close`}
          >
            <X id={`${scope}-close-icon`} className={`domain-analytics-close-icon`} size={19} aria-hidden={`true`} />
          </button>
        </header>
        <div id={`${scope}-body`} className={`domain-analytics-body`}>
          <p id={`${scope}-description`} className={`domain-analytics-description`}>
            {`Public registration and DNS checks, domain name statistics, and keyword research.`}
          </p>
          {state.loading && (
            <div id={`${scope}-loading`} role={`status`} aria-live={`polite`} className={`domain-analytics-loading`}>
              <RefreshCw id={`${scope}-loading-icon`} className={`domain-analytics-loading-icon`} size={18} aria-hidden={`true`} />
              <span id={`${scope}-loading-text`} className={`domain-analytics-loading-text`}>{`Checking public domain data…`}</span>
              <div id={`${scope}-skeleton`} className={`domain-analytics-skeleton`} aria-hidden={`true`} />
            </div>
          )}
          {!!state.error && <p id={`${scope}-error`} role={`alert`} className={`domain-analytics-error`}>{state.error}</p>}
          {state.snapshot && (
            <>
              <section id={`${scope}-registration`} className={`domain-analytics-section`}>
                <h3 id={`${scope}-registration-title`} className={`domain-analytics-section-title`}>
                  <Globe id={`${scope}-registration-icon`} className={`domain-analytics-section-icon`} size={16} aria-hidden={`true`} />
                  {`Registration`}
                </h3>
                <div id={`${scope}-registration-status-cell`} className={`actionsCell`}>
                  <span id={`${scope}-registration-status`} className={`rowStatus domain-analytics-status-${state.registrationTone}`}>
                    <span id={`${scope}-registration-status-dot-wrap`} className={`statusDotWrap`}>
                      <span id={`${scope}-registration-status-dot`} className={`statusDot`} />
                    </span>
                    <span id={`${scope}-registration-status-text`} className={`statusText`}>{state.registrationLabel}</span>
                  </span>
                </div>
                <dl id={`${scope}-registration-fields`} className={`domain-analytics-fields`}>
                  {state.registrationFields.map(field => (
                    <div id={`${scope}-registration-${field.key}`} key={field.key} className={`domain-analytics-field`}>
                      <dt id={`${scope}-registration-${field.key}-label`} className={`domain-analytics-field-label`}>{field.label}</dt>
                      <dd id={`${scope}-registration-${field.key}-value`} className={`domain-analytics-field-value`}>{field.value}</dd>
                    </div>
                  ))}
                </dl>
                {!!state.snapshot.registration.error && <p id={`${scope}-registration-error`} className={`domain-analytics-warning`}>{state.snapshot.registration.error}</p>}
                <p id={`${scope}-registration-note`} className={`domain-analytics-note`}>{`Registration data does not confirm purchase availability. Check the registrar for current availability and pricing.`}</p>
              </section>
              {state.snapshot.inventory && (
                <section id={`${scope}-inventory`} className={`domain-analytics-section`}>
                  <h3 id={`${scope}-inventory-title`} className={`domain-analytics-section-title`}>{`Inventory Statistics`}</h3>
                  <p id={`${scope}-inventory-source`} className={`domain-analytics-note`}>{state.snapshot.inventory.sourceLabel}</p>
                  <dl id={`${scope}-inventory-fields`} className={`domain-analytics-fields`}>
                    {state.snapshot.inventory.metrics?.map((metric, index) => (
                      <div id={`${scope}-inventory-${index}`} key={`${metric.key}-${index}`} className={`domain-analytics-field`}>
                        <dt id={`${scope}-inventory-${index}-label`} className={`domain-analytics-field-label`}>{metric.label}</dt>
                        <dd id={`${scope}-inventory-${index}-value`} className={`domain-analytics-field-value`}>{metric.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {!state.snapshot.inventory.metrics?.length && <p id={`${scope}-inventory-empty`} className={`domain-analytics-note`}>{`No inventory metrics imported for this domain.`}</p>}
                  <p id={`${scope}-inventory-date`} className={`domain-analytics-note`}>{state.inventoryTimestamp}</p>
                  <p id={`${scope}-inventory-note`} className={`domain-analytics-note`}>{`Provider metrics reflect the imported inventory snapshot.`}</p>
                </section>
              )}
              <section id={`${scope}-name`} className={`domain-analytics-section`}>
                <h3 id={`${scope}-name-title`} className={`domain-analytics-section-title`}>{`Name Statistics`}</h3>
                <dl id={`${scope}-name-fields`} className={`domain-analytics-fields domain-analytics-name-fields`}>
                  {state.metrics.map(metric => (
                    <div id={`${scope}-metric-${metric.key}`} key={metric.key} className={`domain-analytics-field`}>
                      <dt id={`${scope}-metric-${metric.key}-label`} className={`domain-analytics-field-label`}>{metric.label}</dt>
                      <dd id={`${scope}-metric-${metric.key}-value`} className={`domain-analytics-field-value`}>{metric.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
              <section id={`${scope}-dns`} className={`domain-analytics-section`}>
                <h3 id={`${scope}-dns-title`} className={`domain-analytics-section-title`}>{`DNS Records`}</h3>
                {!!state.snapshot.dns.error && <p id={`${scope}-dns-error`} className={`domain-analytics-warning`}>{state.snapshot.dns.error}</p>}
                {!!state.snapshot.dns.records?.length && (
                  <ul id={`${scope}-dns-records`} className={`domain-analytics-dns-records`}>
                    {state.snapshot.dns.records.map((record, index) => (
                      <li id={`${scope}-dns-${index}`} key={`${record.type}-${index}`} className={`domain-analytics-dns-record`}>
                        <span id={`${scope}-dns-${index}-type`} className={`domain-analytics-dns-type`}>{record.type}</span>
                        <span id={`${scope}-dns-${index}-value`} className={`domain-analytics-dns-value`}>{record.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {!state.snapshot.dns.records?.length && !state.snapshot.dns.error && <p id={`${scope}-dns-empty`} className={`domain-analytics-note`}>{`No DNS records returned.`}</p>}
              </section>
              <section id={`${scope}-research`} className={`domain-analytics-section`}>
                <h3 id={`${scope}-research-title`} className={`domain-analytics-section-title`}>
                  <Search id={`${scope}-research-icon`} className={`domain-analytics-section-icon`} size={16} aria-hidden={`true`} />
                  {`Keyword Research`}
                </h3>
                <p id={`${scope}-keywords-note`} className={`domain-analytics-note`}>{`Keyword suggestions come from the domain name. Research tools can help assess interest.`}</p>
                <div id={`${scope}-keywords`} className={`domain-analytics-keywords`}>
                  {state.snapshot.name.keywords?.map((keyword, index) => <span id={`${scope}-keyword-${index}`} key={`${keyword}-${index}`} className={`domain-analytics-keyword`}>{keyword}</span>)}
                </div>
                <div id={`${scope}-research-links`} className={`domain-analytics-research-links`}>
                  {state.researchLinks.map((link, index) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target={`_blank`}
                      rel={`noopener noreferrer`}
                      id={`${scope}-research-link-${index}`}
                      className={`domain-analytics-research-link`}
                      aria-label={`${link.label} — Opens In A New Tab`}
                    >
                      <span id={`${scope}-research-link-${index}-text`} className={`domain-analytics-research-link-text`}>{link.label}</span>
                      <ArrowUpRight id={`${scope}-research-link-${index}-icon`} className={`domain-analytics-research-link-icon`} size={14} aria-hidden={`true`} />
                    </a>
                  ))}
                </div>
                <p id={`${scope}-provider-note`} className={`domain-analytics-provider-note`}>{`Live search volume, CPC, authority, and valuation need a provider connection. Imported inventory metrics, when present, retain their source date.`}</p>
              </section>
              {!!state.snapshot.errors?.length && <p id={`${scope}-partial-errors`} role={`status`} className={`domain-analytics-warning`}>{state.snapshot.errors.join(` · `)}</p>}
            </>
          )}
        </div>
        <footer id={`${scope}-footer`} className={`domain-analytics-footer`}>
          <span id={`${scope}-checked-at`} className={`domain-analytics-note`}>
            {state.snapshot ? `Public Check: ${formatAnalyticsDate(state.snapshot.checkedAt)}` : `Public data · No API key required`}
          </span>
          <button
            type={`button`}
            disabled={state.loading}
            onClick={state.refresh}
            id={`${scope}-refresh`}
            className={`domain-analytics-refresh`}
          >
            <RefreshCw id={`${scope}-refresh-icon`} className={`domain-analytics-refresh-icon`} size={14} aria-hidden={`true`} />
            <span id={`${scope}-refresh-text`} className={`domain-analytics-refresh-text`}>{state.retry ? `Retry` : `Refresh`}</span>
          </button>
        </footer>
      </dialog>,
    document.body,
  );
};

export default DomainAnalytics;
