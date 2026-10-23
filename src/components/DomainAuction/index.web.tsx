import './styles.scss';
import { useState } from 'react';
import { Link } from 'expo-router';
import Toast from '../Toast';
import StatePanel from '../StatePanel';
import AuctionRow from '../AuctionRow/index.web';
import FeatureLoadingSkeleton from '../FeatureLoadingSkeleton';
import { useDomainAuction } from './useDomainAuction';
import { routes } from '../../shared/routes';
import type { AuctionFilters } from '../../shared/domainAuction/types';
import { Gavel, Eye, X, Search, Upload, Trash2, Download, PlugZap, RotateCcw, RefreshCw, ChevronLeft, ChevronRight, ArrowUpRight, SlidersHorizontal } from 'lucide-react';
import { auctionSources, auctionSortOptions, auctionMatchOptions, auctionTextFields, auctionNumericFields } from '../../shared/domainAuction/values';
import { auctionSelectFields, auctionTableHeadings, auctionInventoryHref, auctionInventoryGuideHref } from './fields';

const DomainAuction = () => {
  const state = useDomainAuction();
  const [readingFile, setReadingFile] = useState(false);
  if (state.loading) return <FeatureLoadingSkeleton feature={`auction`} />;
  const feedDisabled = state.busy || state.feedLoading || readingFile;
  const disabled = state.loading || state.busy || state.feedLoading || readingFile;
  const formatTimestamp = (value?: string | null) => value ? new Date(value).toLocaleString() : `Not Provided`;
  const importFile = async (file?: File) => {
    if (!file || disabled) return;
    if (!/\.json$/i.test(file.name)) { state.reportError(`Choose An Unzipped .json Inventory File`); return; }
    if (file.size > 8 * 1024 * 1024) { state.reportError(`Choose A JSON File Up To 8 MB`); return; }
    setReadingFile(true);
    try { await state.importInventory(await file.text()); }
    catch (reason) { state.reportError(reason instanceof Error ? reason.message : `Inventory File Could Not Be Read`); }
    finally { setReadingFile(false); }
  };

  return (
    <section id={`domain-auction-page`} className={`auction-page`} aria-labelledby={`auction-title`}>
      <div id={`auction-heading`} className={`auction-heading`}>
        <div id={`auction-heading-copy`} className={`auction-heading-copy`}>
          <span id={`auction-eyebrow`} className={`auction-eyebrow`}>
            <Gavel size={14} aria-hidden={`true`} id={`auction-eyebrow-icon`} className={`auction-eyebrow-icon`} />
            <span id={`auction-eyebrow-text`} className={`auction-eyebrow-text`}>{`DOMAIN MARKETPLACE`}</span>
          </span>
          <div id={`auction-title-row`} className={`auction-title-row`}>
            <h1 id={`auction-title`} className={`auction-title`}>{`Domain Auction`}</h1>
            {routes.auction.beta && <span id={`auction-title-beta`} className={`auction-title-beta`}>{`Beta`}</span>}
          </div>
          <p id={`auction-description`} className={`auction-description`}>{`Explore auction sources, narrow your search, and research domains before buying.`}</p>
        </div>
        <div id={`auction-heading-actions`} className={`auction-heading-actions`}>
          <button
            type={`button`}
            id={`auction-load-free`}
            disabled={feedDisabled}
            className={`auction-button auction-button-primary`}
            onClick={() => void state.loadFreeAuctions()}
            aria-busy={state.feedLoading}
          >
            <span id={`auction-load-free-status`} className={`auction-button-status${state.feedLoading ? ` auction-loading-icon` : ``}`} aria-hidden={`true`}>
              <RefreshCw size={15} id={`auction-load-free-icon`} className={`auction-button-icon`} />
            </span>
            <span id={`auction-load-free-text`} className={`auction-button-text`}>{state.feedLoading ? `Loading Free Auctions…` : state.feed ? `Refresh Free Auctions` : `Load Free Auctions`}</span>
          </button>
          <button
            type={`button`}
            id={`auction-saved-toggle`}
            disabled={disabled}
            aria-pressed={!state.preview && !state.feedMode}
            className={`auction-button auction-button-secondary`}
            onClick={state.showSavedInventory}
          >
            <Download size={15} aria-hidden={`true`} id={`auction-saved-icon`} className={`auction-button-icon`} />
            <span id={`auction-saved-text`} className={`auction-button-text`}>{`Saved Inventory`}</span>
          </button>
          <button
            type={`button`}
            id={`auction-preview-toggle`}
            aria-pressed={state.preview}
            disabled={disabled}
            className={`auction-button auction-button-secondary`}
            onClick={() => state.setPreview(!state.preview)}
          >
            <Eye size={15} aria-hidden={`true`} id={`auction-preview-icon`} className={`auction-button-icon`} />
            <span id={`auction-preview-text`} className={`auction-button-text`}>{state.preview ? `Hide Preview` : `Show Preview`}</span>
          </button>
          <button type={`button`} id={`auction-import-toggle`} className={`auction-button auction-button-secondary`} disabled={disabled} onClick={() => state.setImportOpen(!state.importOpen)} aria-expanded={state.importOpen} aria-controls={`auction-import-panel`}>
            <Upload size={15} aria-hidden={`true`} id={`auction-import-icon`} className={`auction-button-icon`} />
            <span id={`auction-import-text`} className={`auction-button-text`}>{`Import Inventory`}</span>
          </button>
          <Link href={routes.connections.href} id={`auction-connections-link`} className={`auction-button auction-button-secondary`}>
            <PlugZap size={15} aria-hidden={`true`} id={`auction-connections-icon`} className={`auction-button-icon`} />
            <span id={`auction-connections-text`} className={`auction-button-text`}>{`Connections`}</span>
          </Link>
        </div>
      </div>
      <div id={`auction-preview-notice`} className={`auction-notice`}>
        <p id={`auction-preview-notice-title`} className={`auction-notice-title`}>{state.preview ? `Frontend Preview` : state.feedMode ? `Free GoDaddy Most Active Feed` : `Saved Auction Inventory`}</p>
        <p id={`auction-preview-notice-copy`} className={`auction-description`}>
          {state.preview ? `These fictional domains, prices, bids, dates, and ages let you try the filters. Preview is separate from the public feed, imported inventory, and saved domains.` : state.feedMode ? `Browse a cached snapshot from GoDaddy’s free Most Active auction inventory. Prices, bids, and closing times reflect the snapshot and do not update in real time. This public feed does not replace or save over your imported inventory.` : `Load Free Auctions to browse GoDaddy’s Most Active listings without an account or API key. You can also import inventory JSON to browse your own saved snapshot, or choose Show Preview to try the filters with fictional records.`}
        </p>
        {state.feedMode && state.feed && (
          <p id={`auction-feed-coverage`} className={`auction-description`}>
            {`${state.records.length} current listing(s) shown · ${state.feed.endedCount} ended listing(s) omitted at fetch · ${state.feed.skippedCount} unsupported record(s) omitted${state.feed.limitedCount ? ` · ${state.feed.limitedCount} listing(s) omitted by the snapshot size limit` : ``}. Ended listings leave this view as the snapshot ages.`}
          </p>
        )}
        {state.feedMode && state.feed && state.feedRefreshFailed && (
          <p id={`auction-feed-refresh-error`} className={`auction-feed-refresh-error`} role={`status`}>{`Refresh failed; showing snapshot fetched ${formatTimestamp(state.feed.fetchedAt)}.`}</p>
        )}
        {state.feedMode && state.feed && (
          <dl id={`auction-feed-details`} className={`auction-feed-details`}>
            {[
              { id: `source-built`, label: `Source Updated`, value: formatTimestamp(state.feed.sourceCheckedAt) },
              { id: `fetched`, label: `Fetched`, value: formatTimestamp(state.feed.fetchedAt) },
              { id: `refresh`, label: `Next Source Check After`, value: formatTimestamp(state.feed.refreshAfter) },
            ].map(detail => (
              <div key={detail.id} id={`auction-feed-detail-${detail.id}`} className={`auction-feed-detail`}>
                <dt id={`auction-feed-label-${detail.id}`} className={`auction-feed-label`}>{detail.label}</dt>
                <dd id={`auction-feed-value-${detail.id}`} className={`auction-feed-value`}>{detail.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <p id={`auction-connection-description`} className={`auction-description`}>
          {state.feedMode ? `Refresh checks the latest cached snapshot; the source is checked again after the time above. Bidding and purchases happen on the provider website. Verify the current listing there before acting.` : `Browse provider auctions below or download free GoDaddy inventory. Bidding and purchases happen on the provider website.`}
        </p>
      </div>
      {!!state.error && <Toast id={`auction-error`} message={state.error} onDismiss={state.clearError} />}
      {!!state.notice && <Toast kind={`success`} id={`auction-notice`} message={state.notice} onDismiss={state.clearNotice} />}
      {state.importOpen && (
        <form id={`auction-import-panel`} className={`auction-import-panel`} onSubmit={event => { event.preventDefault(); void state.importInventory(); }}>
          <div id={`auction-import-heading`} className={`auction-import-heading`}>
            <h2 id={`auction-import-title`} className={`auction-results-title`}>{`Import GoDaddy Inventory`}</h2>
            <button type={`button`} id={`auction-import-close`} className={`auction-text-button`} disabled={state.busy} onClick={() => state.setImportOpen(false)} aria-label={`Close Inventory Import`}>
              <X size={16} aria-hidden={`true`} id={`auction-import-close-icon`} className={`auction-button-icon`} />
              <span id={`auction-import-close-text`} className={`auction-button-text`}>{`Close`}</span>
            </button>
          </div>
          <p id={`auction-import-description`} className={`auction-description`}>{`Download a JSON inventory ZIP from Free GoDaddy Inventory, unzip it, then choose the .json file or paste its contents below. Each import replaces the saved snapshot. JSON files up to 8 MB and 10,000 records are supported.`}</p>
          <label id={`auction-file-label`} className={`auction-field-label`} htmlFor={`auction-file-input`}>{`Choose An Unzipped JSON File`}</label>
          <input type={`file`} accept={`.json,application/json`} id={`auction-file-input`} className={`auction-file-input`} disabled={disabled} onChange={event => { const file = event.target.files?.[0]; event.target.value = ``; void importFile(file); }} />
          <label id={`auction-import-paste-label`} className={`auction-field-label`} htmlFor={`auction-import-paste`}>{`Or Paste Inventory JSON`}</label>
          <textarea id={`auction-import-paste`} className={`auction-import-paste`} value={state.importText} disabled={disabled} spellCheck={false} placeholder={`{ "meta": { ... }, "data": [ ... ] }`} onChange={event => state.setImportText(event.target.value)} />
          <div id={`auction-import-submit-row`} className={`auction-import-submit-row`}>
            <button type={`submit`} id={`auction-import-submit`} className={`auction-button auction-button-primary`} disabled={disabled || !state.importText.trim()}>
              <Upload size={14} aria-hidden={`true`} id={`auction-import-submit-icon`} className={`auction-button-icon`} />
              <span id={`auction-import-submit-text`} className={`auction-button-text`}>{state.busy ? `Importing…` : `Import JSON`}</span>
            </button>
            <span id={`auction-import-storage`} className={`auction-filter-hint`}>{state.storageMessage}</span>
          </div>
        </form>
      )}
      <div id={`auction-filters`} className={`auction-filters`}>
        <div id={`auction-search-row`} className={`auction-search-row`}>
          <div id={`auction-query-field`} className={`auction-query-field`}>
            <label id={`auction-query-label`} className={`auction-field-label`} htmlFor={`auction-query`}>{`Domain Search`}</label>
            <div id={`auction-query-wrap`} className={`auction-query-wrap`}>
              <Search size={16} aria-hidden={`true`} id={`auction-query-icon`} className={`auction-query-icon`} />
              <input
                type={`search`}
                id={`auction-query`}
                autoComplete={`off`}
                value={state.filters.query}
                className={`auction-query`}
                placeholder={`Search domain names…`}
                onChange={event => state.updateFilter(`query`, event.target.value)}
              />
            </div>
          </div>
          <div id={`auction-match-field`} className={`auction-field auction-match-field`}>
            <label id={`auction-match-label`} className={`auction-field-label`} htmlFor={`auction-match`}>{`Name Match`}</label>
            <select id={`auction-match`} className={`auction-field-input`} value={state.filters.match} onChange={event => state.updateFilter(`match`, event.target.value as AuctionFilters[`match`])}>
              {auctionMatchOptions.map(option => <option key={option.id} id={`auction-match-${option.id}`} value={option.id}>{option.label}</option>)}
            </select>
          </div>
          <div id={`auction-sort-field`} className={`auction-field auction-sort-field`}>
            <label id={`auction-sort-label`} className={`auction-field-label`} htmlFor={`auction-sort`}>{`Sort By`}</label>
            <select id={`auction-sort`} className={`auction-field-input`} value={state.filters.sort} onChange={event => state.updateFilter(`sort`, event.target.value as AuctionFilters[`sort`])}>
              {auctionSortOptions.map(option => <option key={option.id} id={`auction-sort-${option.id}`} value={option.id}>{option.label}</option>)}
            </select>
          </div>
        </div>
        <div id={`auction-filter-actions`} className={`auction-filter-actions`}>
          <button
            type={`button`}
            id={`auction-advanced-toggle`}
            aria-expanded={state.advanced}
            aria-controls={`auction-advanced-filters`}
            className={`auction-text-button`}
            onClick={() => state.setAdvanced(!state.advanced)}
          >
            <SlidersHorizontal size={14} aria-hidden={`true`} id={`auction-advanced-icon`} className={`auction-button-icon`} />
            <span id={`auction-advanced-text`} className={`auction-button-text`}>{`Advanced Filters${state.filterCount ? ` (${state.filterCount})` : ``}`}</span>
          </button>
          <button type={`button`} id={`auction-reset-filters`} className={`auction-text-button`} disabled={!state.filterCount && state.filters.sort === `ending` && state.filters.match === `contains`} onClick={state.resetFilters}>
            <RotateCcw size={13} aria-hidden={`true`} id={`auction-reset-icon`} className={`auction-button-icon`} />
            <span id={`auction-reset-text`} className={`auction-button-text`}>{`Reset Filters`}</span>
          </button>
        </div>
        {state.advanced && (
          <div id={`auction-advanced-filters`} className={`auction-advanced-filters`}>
            {auctionSelectFields.map(field => (
              <div key={field.key} id={`auction-field-${field.key}`} className={`auction-field`}>
                <label id={`auction-label-${field.key}`} className={`auction-field-label`} htmlFor={`auction-input-${field.key}`}>{field.label}</label>
                <select
                  id={`auction-input-${field.key}`}
                  className={`auction-field-input`}
                  value={state.filters[field.key]}
                  onChange={event => state.updateFilter(field.key, event.target.value as AuctionFilters[typeof field.key])}
                >
                  <option id={`auction-option-${field.key}-all`} value={`all`}>{field.allLabel}</option>
                  {field.options.map(option => <option key={option.id} id={`auction-option-${field.key}-${option.id}`} value={option.id}>{option.label}</option>)}
                </select>
              </div>
            ))}
            {auctionTextFields.map(field => (
              <div key={field.key} id={`auction-field-${field.key}`} className={`auction-field`}>
                <label id={`auction-label-${field.key}`} className={`auction-field-label`} htmlFor={`auction-input-${field.key}`}>{field.label}</label>
                <input
                  type={`text`}
                  autoComplete={`off`}
                  id={`auction-input-${field.key}`}
                  placeholder={field.placeholder}
                  className={`auction-field-input`}
                  value={state.filters[field.key]}
                  onChange={event => state.updateFilter(field.key, event.target.value)}
                />
              </div>
            ))}
            {auctionNumericFields.map(field => {
              const usd = field.key === `minPrice` || field.key === `maxPrice`;
              const input = (
                <input
                  min={0}
                  type={`number`}
                  placeholder={`Any`}
                  id={`auction-input-${field.key}`}
                  className={`auction-field-input${usd ? ` auction-price-input` : ``}`}
                  value={state.filters[field.key]}
                  step={field.key.includes(`Price`) ? `0.01` : `1`}
                  onChange={event => state.updateFilter(field.key, event.target.value)}
                />
              );
              return (
                <div key={field.key} id={`auction-field-${field.key}`} className={`auction-field`}>
                  <label id={`auction-label-${field.key}`} className={`auction-field-label`} htmlFor={`auction-input-${field.key}`}>{field.label}</label>
                  {usd ? (
                    <div id={`auction-price-wrap-${field.key}`} className={`auction-price-wrap`}>
                      <span
                        aria-hidden
                        id={`auction-price-prefix-${field.key}`}
                        className={`auction-price-prefix`}
                      >
                        {`$`}
                      </span>
                      {input}
                    </div>
                  ) : input}
                </div>
              );
            })}
            <div id={`auction-name-options`} className={`auction-name-options`}>
              {[
                { key: `noDigits`, label: `No Numbers` },
                { key: `noHyphens`, label: `No Hyphens` },
              ].map(option => (
                <label key={option.key} id={`auction-option-label-${option.key}`} className={`auction-checkbox-label`} htmlFor={`auction-option-${option.key}`}>
                  <input type={`checkbox`} id={`auction-option-${option.key}`} className={`auction-checkbox`} checked={state.filters[option.key as `noDigits` | `noHyphens`]} onChange={event => state.updateFilter(option.key as `noDigits` | `noHyphens`, event.target.checked)} />
                  <span id={`auction-option-text-${option.key}`} className={`auction-checkbox-text`}>{option.label}</span>
                </label>
              ))}
            </div>
            <p id={`auction-filter-hint`} className={`auction-filter-hint`}>{`Name length excludes the extension. Filters for age, bids, price, and ending time omit records whose values are unknown. Separate extensions and excluded words with commas.`}</p>
          </div>
        )}
      </div>
      <div id={`auction-sources`} className={`auction-sources`}>
        <span id={`auction-sources-label`} className={`auction-sources-label`}>{`Browse Sources`}</span>
        {auctionSources.map(source => (
          <a key={source.id} href={source.href} target={`_blank`} rel={`noopener noreferrer`} id={`auction-provider-${source.id}`} className={`auction-source-action`}>
            <span id={`auction-provider-text-${source.id}`} className={`auction-source-action-text`}>{source.label}</span>
            <ArrowUpRight size={13} aria-hidden={`true`} id={`auction-provider-icon-${source.id}`} className={`auction-source-action-icon`} />
          </a>
        ))}
        <a href={auctionInventoryHref} target={`_blank`} rel={`noopener noreferrer`} id={`auction-inventory-download`} className={`auction-source-action`}>
          <Download size={13} aria-hidden={`true`} id={`auction-inventory-icon`} className={`auction-source-action-icon`} />
          <span id={`auction-inventory-text`} className={`auction-source-action-text`}>{`Free GoDaddy Inventory`}</span>
        </a>
        <a href={auctionInventoryGuideHref} target={`_blank`} rel={`noopener noreferrer`} id={`auction-inventory-guide`} className={`auction-source-action auction-inventory-guide`}>
          <span id={`auction-inventory-guide-text`} className={`auction-source-action-text`}>{`Download Guide`}</span>
          <ArrowUpRight size={13} aria-hidden={`true`} id={`auction-inventory-guide-icon`} className={`auction-source-action-icon`} />
        </a>
      </div>
      <div id={`auction-records-card`} className={`auction-records-card`}>
        <div id={`auction-results-heading`} className={`auction-results-heading`}>
          <h2 id={`auction-results-title`} className={`auction-results-title`}>{state.preview ? `Preview Auction Inventory` : state.feedMode ? `GoDaddy Most Active Auctions` : `Saved Auction Inventory`}</h2>
          <div id={`auction-results-tools`} className={`auction-results-tools`}>
            <span id={`auction-results-count`} className={`auction-results-count`} role={`status`}>{state.feedLoading ? `Refreshing…` : state.loading ? `Loading…` : `${state.matchingCount} of ${state.records.length} domain(s)`}</span>
            <button type={`button`} id={`auction-reload-snapshot`} className={`auction-text-button`} disabled={disabled} onClick={state.reloadListings} title={`Reload Saved Inventory`}>
              <RefreshCw size={13} aria-hidden={`true`} id={`auction-reload-icon`} className={`auction-button-icon`} />
              <span id={`auction-reload-text`} className={`auction-button-text`}>{`Reload Saved`}</span>
            </button>
            <button type={`button`} id={`auction-clear-inventory`} className={`auction-text-button auction-clear-inventory`} disabled={disabled || state.preview || state.feedMode || (!state.records.length && !state.error)} onClick={() => void state.clearInventory()}>
              <Trash2 size={13} aria-hidden={`true`} id={`auction-clear-icon`} className={`auction-button-icon`} />
              <span id={`auction-clear-text`} className={`auction-button-text`}>{`Clear Imported`}</span>
            </button>
          </div>
        </div>
        {(state.loading || !!state.visibleRecords.length) && (
          <div id={`auction-table-scroll`} className={`auction-table-scroll`} tabIndex={0} role={`region`} aria-label={`Domain Auction Inventory`}>
            <table id={`auction-table`} className={`auction-table`} aria-busy={state.loading}>
              <caption id={`auction-table-caption`} className={`auction-sr-only`}>{`Auction domains, source, price in USD, bids, ending time, age, and research actions. Preview values are fictional.`}</caption>
              <thead id={`auction-table-head`} className={`auction-table-head`}>
                <tr id={`auction-table-heading-row`} className={`auction-table-heading-row`}>
                  {auctionTableHeadings.map(heading => <th key={heading.id} scope={`col`} id={`auction-heading-${heading.id}`} className={`auction-table-heading auction-table-heading-${heading.id}`}>{heading.label}</th>)}
                </tr>
              </thead>
              <tbody id={`auction-table-body`} className={`auction-table-body`}>
                {state.loading ? [0, 1, 2].map(index => (
                  <tr key={index} id={`auction-skeleton-row-${index}`} className={`auction-skeleton-row`}>
                    {auctionTableHeadings.map(heading => <td key={heading.id} id={`auction-skeleton-cell-${index}-${heading.id}`} className={`auction-skeleton-cell`}><span id={`auction-skeleton-${index}-${heading.id}`} className={`auction-skeleton`} /></td>)}
                  </tr>
                )) : state.visibleRecords.map(record => <AuctionRow key={record.id} record={record} />)}
              </tbody>
            </table>
          </div>
        )}
        {!state.loading && !state.visibleRecords.length && (
          <div id={`auction-empty`} className={`auction-empty`}>
            <StatePanel
              id={`auction-empty`}
              variant={`inline`}
              alert={!!state.error}
              eyebrow={`AUCTION INVENTORY`}
              icon={state.error ? `error` : state.records.length ? `search` : `auction`}
              title={state.error ? `Auction listings couldn’t load` : state.records.length ? `No domains match your filters` : state.feedMode ? `No listings in this snapshot` : `Choose an auction source`}
              description={state.error ? `Review the error above, then retry loading free auctions or choose saved inventory.` : state.records.length ? `Reset your filters to see the full inventory, or try a broader search.` : state.feedMode ? `Refresh later or browse the provider website for current listings.` : `Load free GoDaddy auctions, import your inventory, or try Show Preview with fictional listings.`}
            >
              <button type={`button`} id={`auction-empty-action`} className={`auction-button auction-button-primary`} disabled={state.records.length ? disabled : feedDisabled} onClick={state.records.length ? state.resetFilters : () => void state.loadFreeAuctions()}>
                {state.records.length ? <RotateCcw size={14} aria-hidden={`true`} id={`auction-empty-action-icon`} className={`auction-button-icon`} /> : <RefreshCw size={14} aria-hidden={`true`} id={`auction-empty-action-icon`} className={`auction-button-icon`} />}
                <span id={`auction-empty-action-text`} className={`auction-button-text`}>{state.records.length ? `Reset Filters` : state.feed ? `Refresh Free Auctions` : `Load Free Auctions`}</span>
              </button>
            </StatePanel>
          </div>
        )}
        {!!state.matchingCount && !state.loading && (
          <nav id={`auction-pagination`} className={`auction-pagination`} aria-label={`Auction Inventory Pages`}>
            <span id={`auction-page-range`} className={`auction-results-count`}>{`${state.resultStart}–${state.resultEnd} of ${state.matchingCount} · Page ${state.currentPage} of ${state.pageCount}`}</span>
            <div id={`auction-page-actions`} className={`auction-page-actions`}>
              <button type={`button`} id={`auction-previous-page`} className={`auction-button auction-button-secondary`} disabled={state.currentPage <= 1} onClick={state.previousPage}>
                <ChevronLeft size={14} aria-hidden={`true`} id={`auction-previous-icon`} className={`auction-button-icon`} />
                <span id={`auction-previous-text`} className={`auction-button-text`}>{`Previous`}</span>
              </button>
              <button type={`button`} id={`auction-next-page`} className={`auction-button auction-button-secondary`} disabled={state.currentPage >= state.pageCount} onClick={state.nextPage}>
                <span id={`auction-next-text`} className={`auction-button-text`}>{`Next`}</span>
                <ChevronRight size={14} aria-hidden={`true`} id={`auction-next-icon`} className={`auction-button-icon`} />
              </button>
            </div>
          </nav>
        )}
        <p id={`auction-data-footnote`} className={`auction-data-footnote`}>{state.preview ? `Preview values are fictional and do not represent domains offered for sale.` : state.feedMode ? `Free GoDaddy Most Active feed. Refresh checks the latest cached snapshot; listings are not a real-time bidding service.` : `${state.storageMessage} Import a fresh file to update prices and metrics; Reload Saved opens the last imported snapshot.`} {`Source valuations are estimates. Verify current listing details, bid, eligibility, fees, renewal cost, and closing time with the provider.`}</p>
      </div>
    </section>
  );
};

export default DomainAuction;
