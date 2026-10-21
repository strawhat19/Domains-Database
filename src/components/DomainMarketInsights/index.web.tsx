import './styles.scss';
import { Search, Link2, TrendingUp, ChevronDown, ArrowUpRight } from 'lucide-react';
import { MARKET_COUNTRIES } from '../../shared/domainMarket/values';
import { useDomainMarketInsights, formatMarketDate, formatMarketPointDate, type DomainMarketInsightsProps } from './useDomainMarketInsights';

const DomainMarketInsights = ({ domain, suffix }: DomainMarketInsightsProps) => {
  const state = useDomainMarketInsights(domain, suffix);
  const id = state.scope;
  const ratingResult = state.rating.result;
  const searchResult = state.search.result;

  return (
    <section id={id} className={`domain-market`} aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className={`domain-market-title`}>
        <TrendingUp id={`${id}-title-icon`} className={`domain-market-icon`} size={16} aria-hidden={`true`} />
        {`Market & Search Interest`}
      </h3>
      <p id={`${id}-description`} className={`domain-market-note`}>{`Free provider lookups run only when you request them. Recent results are reused to conserve the free allowance.`}</p>
      <div id={`${id}-rating`} className={`domain-market-panel`}>
        <div id={`${id}-rating-heading`} className={`domain-market-row`}>
          <h4 id={`${id}-rating-title`} className={`domain-market-subtitle`}>{`Backlink Strength`}</h4>
          <button id={`${id}-rating-load`} type={`button`} className={`domain-market-button`} disabled={state.rating.loading} onClick={() => void state.loadRating()}>
            <Link2 id={`${id}-rating-load-icon`} className={`domain-market-icon`} size={14} aria-hidden={`true`} />
            <span id={`${id}-rating-load-label`} className={`domain-market-button-label`}>{state.rating.loading ? `Loading Domain Rating…` : `Load Domain Rating`}</span>
          </button>
        </div>
        {ratingResult?.status === `ready` && typeof ratingResult.rating === `number` && (
          <div id={`${id}-rating-result`} className={`domain-market-result`}>
            <strong id={`${id}-rating-value`} className={`domain-market-score`}>{`${ratingResult.rating} / 100`}</strong>
            <a id={`${id}-rating-attribution`} className={`domain-market-link`} href={`https://ahrefs.com/`} target={`_blank`} rel={`noopener noreferrer`}>{`Domain Rating by Ahrefs`}</a>
          </div>
        )}
        {!ratingResult && !state.rating.loading && !state.rating.notice && !state.rating.error && <p id={`${id}-rating-empty`} className={`domain-market-note`}>{`Load a score for this domain when you need it.`}</p>}
        {!!state.rating.error && <p id={`${id}-rating-error`} role={`alert`} className={`domain-market-error`}>{state.rating.error}</p>}
        {!!state.ratingNotice && <p id={`${id}-rating-notice`} role={`status`} className={`domain-market-warning`}>{state.ratingNotice}</p>}
        <p id={`${id}-rating-note`} className={`domain-market-note`}>{`Domain Rating is Ahrefs’ logarithmic backlink-strength score. It does not measure visitor traffic or search demand.`}</p>
        {ratingResult && <p id={`${id}-rating-date`} className={`domain-market-note`}>{`Source: ${ratingResult.source} · Checked ${formatMarketDate(ratingResult.checkedAt)}${ratingResult.expiresAt ? ` · Cached until ${formatMarketDate(ratingResult.expiresAt)}` : ``}`}</p>}
      </div>
      <div id={`${id}-search`} className={`domain-market-panel`}>
        <h4 id={`${id}-search-title`} className={`domain-market-subtitle`}>{`Search Interest · Past 12 Months`}</h4>
        <p id={`${id}-keyword-note`} className={`domain-market-note`}>{`Choose the phrase people would search for. A domain name may need spaces or a different phrase.`}</p>
        <div id={`${id}-fields`} className={`domain-market-fields`}>
          <label id={`${id}-keyword-label`} className={`domain-market-field`} htmlFor={`${id}-keyword`}>
            <span id={`${id}-keyword-caption`} className={`domain-market-label`}>{`Search Phrase`}</span>
            <input id={`${id}-keyword`} type={`text`} maxLength={80} autoComplete={`off`} className={`domain-market-input`} value={state.keywordValue} onChange={event => state.setKeyword(event.target.value)} aria-describedby={`${id}-keyword-note${state.keywordError ? ` ${id}-keyword-error` : ``}`} aria-invalid={!!state.keywordError} />
          </label>
          <label id={`${id}-country-label`} className={`domain-market-field`} htmlFor={`${id}-country`}>
            <span id={`${id}-country-caption`} className={`domain-market-label`}>{`Location`}</span>
            <select id={`${id}-country`} className={`domain-market-input`} value={state.country} onChange={event => state.setCountry(event.target.value)}>
              {MARKET_COUNTRIES.map(country => <option key={country.value} id={`${id}-country-${country.value || `worldwide`}`} className={`domain-market-option`} value={country.value}>{country.label}</option>)}
            </select>
          </label>
        </div>
        {!!state.keywordError && <p id={`${id}-keyword-error`} className={`domain-market-warning`}>{state.keywordError}</p>}
        <div id={`${id}-search-actions`} className={`domain-market-actions`}>
          <button id={`${id}-search-load`} type={`button`} className={`domain-market-button`} disabled={state.search.loading || !!state.keywordError} onClick={() => void state.loadSearch()}>
            <Search id={`${id}-search-load-icon`} className={`domain-market-icon`} size={14} aria-hidden={`true`} />
            <span id={`${id}-search-load-label`} className={`domain-market-button-label`}>{state.search.loading ? `Analyzing Search Interest…` : `Analyze Search Interest`}</span>
          </button>
          <a id={`${id}-trends-link`} target={`_blank`} rel={`noopener noreferrer`} className={`domain-market-button`} href={!state.keywordError ? state.trendsUrl : undefined} aria-disabled={!!state.keywordError} aria-label={`Open Google Trends In A New Tab`}>
            <span id={`${id}-trends-label`} className={`domain-market-button-label`}>{`Open Google Trends`}</span>
            <ArrowUpRight id={`${id}-trends-icon`} className={`domain-market-icon`} size={14} aria-hidden={`true`} />
          </a>
        </div>
        {state.hasChart && (
          <figure id={`${id}-chart`} className={`domain-market-chart`}>
            <figcaption id={`${id}-chart-caption`} className={`domain-market-chart-caption`}>{`Latest Interest: ${state.latest?.value} / 100 · ${state.countryLabel}`}</figcaption>
            <svg id={`${id}-chart-svg`} className={`domain-market-svg`} viewBox={`0 0 360 112`} role={`img`} aria-labelledby={`${id}-chart-title`} aria-describedby={`${id}-chart-summary`}>
              <title id={`${id}-chart-title`}>{`Search Interest for ${state.keyword}, ${state.countryLabel}`}</title>
              <desc id={`${id}-chart-summary`}>{state.chartSummary}</desc>
              {[0, 50, 100].map(value => <line key={value} id={`${id}-chart-grid-${value}`} className={`domain-market-chart-grid`} x1={12} x2={348} y1={100 - value * .84} y2={100 - value * .84} />)}
              <path id={`${id}-chart-line`} className={`domain-market-chart-line`} d={state.chartPath} />
            </svg>
            <div id={`${id}-chart-dates`} className={`domain-market-chart-dates`}>
              <span id={`${id}-chart-first`} className={`domain-market-note`}>{state.firstDate}</span>
              <span id={`${id}-chart-last`} className={`domain-market-note`}>{state.latestDate}</span>
            </div>
            <details id={`${id}-data`} className={`domain-market-data`}>
              <summary id={`${id}-data-toggle`} className={`domain-market-data-toggle`}>
                <ChevronDown id={`${id}-data-toggle-icon`} className={`domain-market-icon`} size={13} aria-hidden={`true`} />
                <span id={`${id}-data-toggle-label`} className={`domain-market-data-toggle-label`}>{`View Interest Data`}</span>
              </summary>
              <div id={`${id}-data-scroll`} className={`domain-market-data-scroll`} tabIndex={0} role={`region`} aria-label={`Search Interest Data`}>
                <table id={`${id}-data-table`} className={`domain-market-data-table`}>
                  <caption id={`${id}-data-caption`} className={`domain-market-data-caption`}>{`Relative Search Interest · 0–100`}</caption>
                  <thead id={`${id}-data-head`} className={`domain-market-data-head`}>
                    <tr id={`${id}-data-header-row`} className={`domain-market-data-row`}>
                      <th id={`${id}-data-date-heading`} className={`domain-market-data-cell`} scope={`col`}>{`Date`}</th>
                      <th id={`${id}-data-value-heading`} className={`domain-market-data-cell`} scope={`col`}>{`Interest`}</th>
                    </tr>
                  </thead>
                  <tbody id={`${id}-data-body`} className={`domain-market-data-body`}>
                    {state.points.map((point, index) => (
                      <tr id={`${id}-data-row-${index}`} className={`domain-market-data-row`} key={`${point.timestamp}-${index}`}>
                        <td id={`${id}-data-date-${index}`} className={`domain-market-data-cell`}>{formatMarketPointDate(point.timestamp)}</td>
                        <td id={`${id}-data-value-${index}`} className={`domain-market-data-cell`}>{point.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </figure>
        )}
        {!!state.search.error && <p id={`${id}-search-error`} role={`alert`} className={`domain-market-error`}>{state.search.error}</p>}
        {!!state.searchNotice && <p id={`${id}-search-notice`} role={`status`} className={`domain-market-warning`}>{state.searchNotice}</p>}
        <p id={`${id}-search-note`} className={`domain-market-note`}>{`Google Trends scores show relative interest from 0–100. Each query is scaled independently; scores are not visits or monthly search counts. The Google Trends link works without a provider connection.`}</p>
        {searchResult && <p id={`${id}-search-date`} className={`domain-market-note`}>{`Source: ${searchResult.source} · Checked ${formatMarketDate(searchResult.checkedAt)}${searchResult.expiresAt ? ` · Cached until ${formatMarketDate(searchResult.expiresAt)}` : ``}`}</p>}
      </div>
    </section>
  );
};

export default DomainMarketInsights;
