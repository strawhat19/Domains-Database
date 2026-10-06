import './styles.scss';
import { Link } from 'expo-router';
import Toast from '../Toast';
import AuctionRow from '../AuctionRow/index.web';
import { useDomainAuction } from './useDomainAuction';
import { routes } from '../../shared/routes';
import type { AuctionFilters } from '../../shared/domainAuction/types';
import { Gavel, Eye, X, Search, Upload, Trash2, Download, PlugZap, RotateCcw, RefreshCw, ChevronLeft, ChevronRight, ArrowUpRight, SlidersHorizontal } from 'lucide-react';
import { auctionSources, auctionSortOptions, auctionMatchOptions, auctionTextFields, auctionNumericFields } from '../../shared/domainAuction/values';
import { auctionSelectFields, auctionTableHeadings, auctionInventoryHref, auctionInventoryGuideHref } from './fields';

const DomainAuction = () => {
  const state = useDomainAuction();
  const disabled = state.loading || state.busy;
  const importFile = async (file?: File) => {
    if (!file || disabled) return;
    if (!/\.json$/i.test(file.name)) { state.reportError(`Choose An Unzipped .json Inventory File`); return; }
    if (file.size > 8 * 1024 * 1024) { state.reportError(`Choose A JSON File Up To 8 MB`); return; }
    try { await state.importInventory(await file.text()); }
    catch (reason) { state.reportError(reason instanceof Error ? reason.message : `Inventory File Could Not Be Read`); }
  };

  return (
    <section id={`domain-auction-page`} className={`auction-page`} aria-labelledby={`auction-title`}>
      <div id={`auction-heading`} className={`auction-heading`}>
        <div id={`auction-heading-copy`} className={`auction-heading-copy`}>
          <span id={`auction-eyebrow`} className={`auction-eyebrow`}>
            <Gavel size={14} aria-hidden={`true`} id={`auction-eyebrow-icon`} className={`auction-eyebrow-icon`} />
            <span id={`auction-eyebrow-text`} className={`auction-eyebrow-text`}>{`DOMAIN MARKETPLACE`}</span>
          </span>
          <h1 id={`auction-title`} className={`auction-title`}>{`Domain Auction`}</h1>
          <p id={`auction-description`} className={`auction-description`}>{`Explore auction sources, narrow your search, and research domains before buying.`}</p>
        </div>
        <div id={`auction-heading-actions`} className={`auction-heading-actions`}>
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
          <Link href={routes.connections.href} id={`auction-connections-link`} className={`auction-button auction-button-primary`}>
            <PlugZap size={15} aria-hidden={`true`} id={`auction-connections-icon`} className={`auction-button-icon`} />
            <span id={`auction-connections-text`} className={`auction-button-text`}>{`Connections`}</span>
          </Link>
        </div>
      </div>
      <div id={`auction-preview-notice`} className={`auction-notice`}>
        <p id={`auction-preview-notice-title`} className={`auction-notice-title`}>{state.preview ? `Frontend Preview` : `Local Auction Inventory`}</p>
        <p id={`auction-preview-notice-copy`} className={`auction-description`}>
          {`Import the free GoDaddy inventory JSON to browse a saved snapshot. Live syncing is not connected. Show Preview loads fictional domains, prices, bids, dates, and ages to try the filters; it is separate from your imported inventory and saved domains.`}
        </p>
        <p id={`auction-connection-description`} className={`auction-description`}>
          {`Browse provider auctions below or download free GoDaddy inventory. Account connection settings are available; live auction syncing needs a supported provider and backend connection. Bidding and purchases happen on the provider website.`}
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
          <h2 id={`auction-results-title`} className={`auction-results-title`}>{state.preview ? `Preview Auction Inventory` : `Auction Inventory`}</h2>
          <div id={`auction-results-tools`} className={`auction-results-tools`}>
            <span id={`auction-results-count`} className={`auction-results-count`} role={`status`}>{state.loading ? `Loading…` : `${state.matchingCount} of ${state.records.length} domain(s)`}</span>
            <button type={`button`} id={`auction-reload-snapshot`} className={`auction-text-button`} disabled={disabled} onClick={state.reloadListings} title={`Reload Saved Inventory`}>
              <RefreshCw size={13} aria-hidden={`true`} id={`auction-reload-icon`} className={`auction-button-icon`} />
              <span id={`auction-reload-text`} className={`auction-button-text`}>{`Reload Saved`}</span>
            </button>
            <button type={`button`} id={`auction-clear-inventory`} className={`auction-text-button auction-clear-inventory`} disabled={disabled || state.preview || (!state.records.length && !state.error)} onClick={() => void state.clearInventory()}>
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
            <Gavel size={25} aria-hidden={`true`} id={`auction-empty-icon`} className={`auction-empty-icon`} />
            <h3 id={`auction-empty-title`} className={`auction-empty-title`}>{state.error ? `Auction Data Could Not Be Loaded` : state.records.length ? `No Matching Domains` : `Choose An Auction Source`}</h3>
            <p id={`auction-empty-copy`} className={`auction-description auction-empty-copy`}>{state.error ? `Review the error above before trying again.` : state.records.length ? `Try fewer filters or reset them to view the inventory.` : `Import free GoDaddy inventory to fill the table, browse provider listings using the links above, or show the frontend preview to try the filters.`}</p>
            <button type={`button`} id={`auction-empty-action`} className={`auction-button auction-button-secondary`} onClick={state.records.length ? state.resetFilters : () => state.setPreview(!state.preview)}>
              {state.records.length ? <RotateCcw size={14} aria-hidden={`true`} id={`auction-empty-action-icon`} className={`auction-button-icon`} /> : <Eye size={14} aria-hidden={`true`} id={`auction-empty-action-icon`} className={`auction-button-icon`} />}
              <span id={`auction-empty-action-text`} className={`auction-button-text`}>{state.records.length ? `Reset Filters` : state.preview ? `Hide Preview` : `Show Preview`}</span>
            </button>
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
        <p id={`auction-data-footnote`} className={`auction-data-footnote`}>{state.preview ? `Preview values are fictional and do not represent domains offered for sale.` : `${state.storageMessage} Download and import a fresh file to update prices and metrics; Reload Saved opens the last imported snapshot.`} {`Source valuations are estimates. Verify current listing details, bid, eligibility, fees, renewal cost, and closing time with the provider.`}</p>
      </div>
    </section>
  );
};

export default DomainAuction;
