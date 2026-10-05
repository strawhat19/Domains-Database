import './styles.scss';
import { Link } from 'expo-router';
import Toast from '../Toast';
import WatchingRow from '../WatchingRow/index.web';
import { useWatchingPage } from './useWatchingPage';
import { routes } from '../../shared/routes';
import { Eye, Search, RefreshCw } from 'lucide-react';

const headings = [
  { id: `domain`, label: `Domain` },
  { id: `availability`, label: `Availability` },
  { id: `registrars`, label: `Registrar Comparison` },
  { id: `checked`, label: `Last Checked` },
  { id: `added`, label: `Date Added` },
  { id: `actions`, label: `Actions` },
];

const Watching = () => {
  const state = useWatchingPage();
  const syncDisabled = state.disabled || !state.records.length;

  return (
    <section id={`watching-page`} className={`watching-page`} aria-labelledby={`watching-title`}>
      <div id={`watching-heading`} className={`watching-heading`}>
        <div id={`watching-heading-copy`} className={`watching-heading-copy`}>
          <span id={`watching-eyebrow`} className={`watching-eyebrow`}>
            <Eye size={14} aria-hidden={`true`} id={`watching-eyebrow-icon`} className={`watching-eyebrow-icon`} />
            <span id={`watching-eyebrow-text`} className={`watching-eyebrow-text`}>{`YOUR WATCH LIST`}</span>
          </span>
          <h1 id={`watching-title`} className={`watching-title`}>{`Watching`}</h1>
          <p id={`watching-summary`} className={`watching-summary`}>
            {state.loading ? `Loading your watch list…` : `${state.records.length} domain(s) · ${state.availableCount} available`}
          </p>
        </div>
        <div id={`watching-heading-actions`} className={`watching-heading-actions`}>
          <button
            type={`button`}
            id={`watching-sync`}
            disabled={syncDisabled}
            className={`watching-button watching-button-secondary`}
            aria-describedby={`watching-sync-description`}
            onClick={() => void state.syncManually().catch(() => undefined)}
          >
            <RefreshCw size={15} aria-hidden={`true`} id={`watching-sync-icon`} className={`watching-button-icon${state.syncing ? ` watching-syncing-icon` : ``}`} />
            <span id={`watching-sync-text`} className={`watching-button-text`}>{state.syncing ? `Syncing…` : `Sync`}</span>
          </button>
          <Link href={routes.search.href} id={`watching-search-link`} className={`watching-button watching-button-primary`}>
            <Search size={15} aria-hidden={`true`} id={`watching-search-link-icon`} className={`watching-button-icon`} />
            <span id={`watching-search-link-text`} className={`watching-button-text`}>{`Find Domains`}</span>
          </Link>
        </div>
      </div>
      <div id={`watching-data-description`} className={`watching-data-description`}>
        <p id={`watching-storage-description`} className={`watching-description`}>{state.storageMessage}</p>
        <p id={`watching-sync-description`} className={`watching-description`}>
          {`Sync refreshes mock registrar availability and prices until a backend is connected. Search snapshots keep the data from your search.`}
        </p>
      </div>
      {!!state.error && <Toast id={`watching-error`} message={state.error} onDismiss={state.clearError} />}
      {!!state.notice && <Toast kind={`success`} id={`watching-notice`} message={state.notice} onDismiss={state.clearNotice} />}
      <div id={`watching-card`} className={`watching-card`}>
        <div id={`watching-toolbar`} className={`watching-toolbar`}>
          <div id={`watching-search-wrap`} className={`watching-search-wrap`}>
            <label id={`watching-search-label`} className={`watching-sr-only`} htmlFor={`watching-filter`}>{`Filter Watching By Domain Or Registrar`}</label>
            <Search size={16} aria-hidden={`true`} id={`watching-filter-icon`} className={`watching-filter-icon`} />
            <input
              type={`search`}
              id={`watching-filter`}
              value={state.query}
              autoComplete={`off`}
              disabled={state.loading}
              className={`watching-filter`}
              placeholder={`Find a watched domain…`}
              onChange={event => state.setQuery(event.target.value)}
            />
          </div>
          <span id={`watching-list-label`} className={`watching-list-label`}>
            <Eye size={13} aria-hidden={`true`} id={`watching-list-icon`} className={`watching-list-icon`} />
            <span id={`watching-list-label-text`} className={`watching-list-label-text`}>{`Watching`}</span>
          </span>
        </div>
        {(state.loading || !!state.filteredRecords.length) && (
          <>
            <p id={`watching-scroll-hint`} className={`watching-scroll-hint`}>{`Scroll horizontally to compare registrars and prices.`}</p>
            <div id={`watching-table-scroll`} className={`watching-table-scroll`} tabIndex={0} role={`region`} aria-label={`Watched Domains And Registrar Prices`}>
              <table id={`watching-table`} className={`watching-table`} aria-busy={state.loading || state.syncing}>
                <caption id={`watching-table-caption`} className={`watching-sr-only`}>{`Watching — availability, registrar prices, dates, and actions`}</caption>
                <thead id={`watching-table-head`} className={`watching-table-head`}>
                  <tr id={`watching-table-heading-row`} className={`watching-table-heading-row`}>
                    {headings.map(heading => (
                      <th key={heading.id} scope={`col`} id={`watching-heading-${heading.id}`} className={`watching-table-heading watching-table-heading-${heading.id}`}>
                        {heading.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody id={`watching-table-body`} className={`watching-table-body`}>
                  {state.loading ? [0, 1, 2].map(index => (
                    <tr key={index} id={`watching-skeleton-row-${index}`} className={`watching-skeleton-row`}>
                      {headings.map(heading => (
                        <td key={heading.id} id={`watching-skeleton-cell-${index}-${heading.id}`} className={`watching-skeleton-cell`}>
                          <span id={`watching-skeleton-${index}-${heading.id}`} className={`watching-skeleton`} aria-hidden={`true`} />
                        </td>
                      ))}
                    </tr>
                  )) : state.filteredRecords.map(record => (
                    <WatchingRow key={record.id} record={record} busy={state.disabled} onRemove={state.removeWatch} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {!state.loading && !state.filteredRecords.length && (
          <div id={`watching-empty`} className={`watching-empty`}>
            <Eye size={24} aria-hidden={`true`} id={`watching-empty-icon`} className={`watching-empty-icon`} />
            <h2 id={`watching-empty-title`} className={`watching-empty-title`}>
              {state.records.length ? `No matching domains` : state.error ? `Watching could not be loaded` : `Your watch list is empty`}
            </h2>
            <p id={`watching-empty-description`} className={`watching-empty-description`}>
              {state.records.length ? `Try another domain or registrar.` : state.error ? `Review the error above before trying again.` : `Search for a domain and select Watch to save it here.`}
            </p>
            {state.records.length ? (
              <button type={`button`} id={`watching-clear-filter`} className={`watching-button watching-button-secondary`} onClick={() => state.setQuery(``)}>
                <Search size={14} aria-hidden={`true`} id={`watching-clear-filter-icon`} className={`watching-button-icon`} />
                <span id={`watching-clear-filter-text`} className={`watching-button-text`}>{`Clear Filter`}</span>
              </button>
            ) : !state.error && (
              <Link href={routes.search.href} id={`watching-empty-search`} className={`watching-button watching-button-secondary`}>
                <Search size={14} aria-hidden={`true`} id={`watching-empty-search-icon`} className={`watching-button-icon`} />
                <span id={`watching-empty-search-text`} className={`watching-button-text`}>{`Search Domains`}</span>
              </Link>
            )}
          </div>
        )}
        <p id={`watching-price-disclaimer`} className={`watching-price-disclaimer`}>
          {`Availability and prices can change. Confirm taxes, final totals, and renewal terms with the registrar before buying.`}
        </p>
      </div>
    </section>
  );
};

export default Watching;
