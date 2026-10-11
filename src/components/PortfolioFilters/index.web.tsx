import './styles.scss';
import '../DomainEditor/styles.scss';
import StackPillShape from '../StackPillShape/index.web';
import { X, Check, Search, Filter, RefreshCw, RotateCcw } from 'lucide-react';
import { usePortfolioFilters, type PortfolioFiltersProps } from './usePortfolioFilters';

const PortfolioFilters = ({ portfolio, onClose }: PortfolioFiltersProps) => {
  const filters = usePortfolioFilters({ portfolio, onClose });
  return (
    <div
      role={`presentation`}
      id={`portfolio-filters-backdrop`}
      className={`domain-dialog-backdrop`}
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        tabIndex={-1}
        role={`dialog`}
        aria-modal={`true`}
        ref={filters.modalRef}
        id={`portfolio-filters-dialog`}
        className={`domain-dialog portfolio-filters`}
        aria-labelledby={`portfolio-filters-title`}
      >
        <header id={`portfolio-filters-header`} className={`domain-dialog-header portfolio-filters-header`}>
          <div id={`portfolio-filters-heading`} className={`domain-dialog-heading`}>
            <span id={`portfolio-filters-eyebrow`} className={`domain-dialog-eyebrow`}>
              {`DOMAIN FILTERS`}
            </span>
            <h2 id={`portfolio-filters-title`} className={`domain-dialog-title portfolio-filters-title`}>
              {`Advanced Filters`}
            </h2>
          </div>
          <button
            type={`button`}
            onClick={onClose}
            id={`portfolio-filters-close`}
            aria-label={`Close Filters`}
            className={`domain-dialog-close portfolio-filters-close`}
          >
            <X size={19} aria-hidden={`true`} id={`portfolio-filters-close-icon`} className={`domain-dialog-close-icon`} />
          </button>
        </header>
        <div id={`portfolio-filters-body`} className={`domain-dialog-body portfolio-filters-body`}>
          <div id={`portfolio-filters-content`} className={`portfolio-filters-content`}>
            <div id={`portfolio-filters-fields`} className={`portfolio-filters-fields`}>
              <section
                id={`portfolio-filters-extensions`}
                className={`portfolio-filters-section`}
                aria-labelledby={`portfolio-filters-extensions-title`}
              >
                <h3 id={`portfolio-filters-extensions-title`} className={`portfolio-filters-label`}>
                  {`Extensions`}
                </h3>
                <div id={`portfolio-filters-extension-choices`} className={`portfolio-filters-choices`}>
                  {portfolio.summary.extensionCounts.map(({ extension, count }) => {
                    const extensionId = encodeURIComponent(extension);
                    return (
                      <button
                        key={extension}
                        type={`button`}
                        disabled={portfolio.loading}
                        id={`portfolio-extension-filter-${extensionId}`}
                        className={`portfolio-summary-item portfolio-summary-filter`}
                        aria-pressed={portfolio.extensionFilters.includes(extension)}
                        onClick={() => portfolio.toggleExtensionFilter(extension)}
                        aria-label={`${extension}, ${count} Domain(s)`}
                      >
                        <StackPillShape id={`portfolio-extension-shape-${extensionId}`} />
                        <span id={`portfolio-extension-label-${extensionId}`} className={`portfolio-extension-label`}>{extension}</span>
                        <span id={`portfolio-extension-count-${extensionId}`} className={`portfolio-summary-value`}>{count}</span>
                      </button>
                    );
                  })}
                  {!portfolio.summary.extensionCounts.length && (
                    <p id={`portfolio-filters-extensions-empty`} className={`portfolio-filters-message`}>{`No Extensions Yet`}</p>
                  )}
                </div>
              </section>
              <section
                id={`portfolio-filters-registrars`}
                className={`portfolio-filters-section`}
                aria-labelledby={`portfolio-filters-registrars-title`}
              >
                <h3 id={`portfolio-filters-registrars-title`} className={`portfolio-filters-label`}>
                  {`Registrars`}
                </h3>
                <div id={`portfolio-filters-registrar-choices`} className={`portfolio-filters-choices`}>
                  {filters.registrarTotals.map(({ count, registrar }) => {
                    const registrarId = encodeURIComponent(registrar);
                    const connection = portfolio.connectedSyncRegistrars.find(({ label }) => label === registrar);
                    const syncingRegistrar = connection && portfolio.connectionStatuses[connection.provider]?.state === `checking`;
                    const syncLabel = `Sync Domains From ${registrar}`;
                    return (
                      <span
                        role={`group`}
                        key={registrar}
                        aria-label={`${registrar} Domains`}
                        id={`portfolio-registrar-total-${registrarId}`}
                        data-active={portfolio.registrarFilters.includes(registrar)}
                        className={`portfolio-summary-item portfolio-registrar-total portfolio-registrar-pill${connection ? ` portfolio-registrar-pill-connected` : ``}`}
                      >
                        <StackPillShape id={`portfolio-registrar-shape-${registrarId}`} />
                        <button
                          type={`button`}
                          disabled={portfolio.loading}
                          id={`portfolio-registrar-filter-${registrarId}`}
                          aria-label={`${registrar}, ${count} Domain(s)`}
                          aria-pressed={portfolio.registrarFilters.includes(registrar)}
                          onClick={() => portfolio.toggleRegistrarFilter(registrar)}
                          className={`portfolio-summary-item portfolio-summary-filter portfolio-registrar-filter-toggle`}
                        >
                          <span id={`portfolio-registrar-label-${registrarId}`} className={`portfolio-registrar-label`}>{registrar}</span>
                          <span id={`portfolio-registrar-count-${registrarId}`} className={`portfolio-summary-value`}>{count}</span>
                        </button>
                        {connection && (
                          <button
                            type={`button`}
                            aria-label={syncLabel}
                            aria-busy={syncingRegistrar || undefined}
                            id={`portfolio-registrar-sync-${registrarId}`}
                            className={`portfolio-registrar-sync`}
                            disabled={filters.manualSyncBlocked || !portfolio.canSyncManually}
                            title={portfolio.manualSyncWaitSeconds ? portfolio.manualSyncMessage : syncLabel}
                            aria-describedby={portfolio.manualSyncMessage ? `portfolio-filters-sync-message` : undefined}
                            onClick={() => void portfolio.syncRegistrarDomains(connection.provider)}
                          >
                            <RefreshCw
                              size={13}
                              aria-hidden={`true`}
                              id={`portfolio-registrar-sync-icon-${registrarId}`}
                              className={`portfolio-registrar-sync-icon${syncingRegistrar ? ` portfolio-registrar-sync-icon-syncing` : ``}`}
                            />
                          </button>
                        )}
                      </span>
                    );
                  })}
                  {!filters.registrarTotals.length && (
                    <p id={`portfolio-filters-registrars-empty`} className={`portfolio-filters-message`}>{`No Registrars Yet`}</p>
                  )}
                </div>
                {portfolio.manualSyncMessage && (
                  <p role={`status`} id={`portfolio-filters-sync-message`} className={`portfolio-filters-message`}>
                    {portfolio.manualSyncMessage}
                  </p>
                )}
              </section>
            </div>
            <aside
              id={`portfolio-filters-sidebar`}
              className={`portfolio-filters-sidebar`}
              aria-labelledby={`portfolio-filters-search-label`}
            >
              <div id={`portfolio-filters-search-field`} className={`portfolio-filters-section`}>
                <label id={`portfolio-filters-search-label`} htmlFor={`portfolio-filters-search-input`} className={`portfolio-filters-label`}>
                  {`Search`}
                </label>
                <div id={`portfolio-filters-search-wrap`} className={`portfolio-filters-search-wrap`}>
                  <Search size={15} aria-hidden={`true`} id={`portfolio-filters-search-icon`} className={`portfolio-filters-search-icon`} />
                  <input
                    type={`search`}
                    value={portfolio.query}
                    autoComplete={`off`}
                    disabled={portfolio.loading}
                    id={`portfolio-filters-search-input`}
                    className={`portfolio-filters-search-input`}
                    placeholder={`Search Your Domains`}
                    onChange={event => portfolio.setQuery(event.target.value)}
                  />
                  {portfolio.query && (
                    <button
                      type={`button`}
                      aria-label={`Clear Search`}
                      disabled={portfolio.loading}
                      id={`portfolio-filters-search-clear`}
                      className={`portfolio-filters-search-clear`}
                      onClick={() => portfolio.setQuery(``)}
                    >
                      <X size={14} aria-hidden={`true`} id={`portfolio-filters-search-clear-icon`} className={`portfolio-filters-search-clear-icon`} />
                    </button>
                  )}
                </div>
              </div>
              <div id={`portfolio-filters-attention-field`} className={`portfolio-filters-section`}>
                <span id={`portfolio-filters-attention-heading`} className={`portfolio-filters-label`}>{`Status`}</span>
                <button
                  type={`button`}
                  id={`portfolio-attention`}
                  disabled={portfolio.loading}
                  aria-pressed={portfolio.attentionOnly}
                  onClick={portfolio.toggleAttentionFilter}
                  className={`portfolio-summary-item portfolio-summary-filter${portfolio.summary.attention ? ` portfolio-summary-attention` : ``}`}
                >
                  <StackPillShape id={`portfolio-attention-shape`} />
                  <span id={`portfolio-attention-dot`} className={`portfolio-attention-dot`} aria-hidden={`true`} />
                  <span id={`portfolio-attention-label`} className={`portfolio-attention-label`}>{`Needs Attention`}</span>
                  <span id={`portfolio-attention-count`} className={`portfolio-summary-value`}>{portfolio.summary.attention}</span>
                </button>
              </div>
              <p id={`portfolio-filters-summary`} className={`portfolio-filters-summary`} aria-live={`polite`}>
                <Filter size={14} aria-hidden={`true`} id={`portfolio-filters-summary-icon`} className={`portfolio-filters-summary-icon`} />
                <span id={`portfolio-filters-summary-text`} className={`portfolio-filters-summary-text`}>{`${filters.filterCount} Active Filter(s)`}</span>
              </p>
            </aside>
          </div>
        </div>
        <footer id={`portfolio-filters-footer`} className={`domain-dialog-footer portfolio-filters-footer`}>
          <button
            type={`button`}
            onClick={filters.clearFilters}
            id={`portfolio-filters-clear`}
            disabled={portfolio.loading || !filters.filterCount}
            className={`portfolio-button portfolio-button-secondary portfolio-filters-footer-button`}
          >
            <RotateCcw size={15} aria-hidden={`true`} id={`portfolio-filters-clear-icon`} className={`portfolio-filters-button-icon`} />
            <span id={`portfolio-filters-clear-text`} className={`portfolio-filters-button-text`}>{`Clear Filters`}</span>
          </button>
          <button
            type={`button`}
            onClick={onClose}
            id={`portfolio-filters-done`}
            className={`portfolio-button portfolio-button-primary portfolio-filters-footer-button`}
          >
            <Check size={15} aria-hidden={`true`} id={`portfolio-filters-done-icon`} className={`portfolio-filters-button-icon`} />
            <span id={`portfolio-filters-done-text`} className={`portfolio-filters-button-text`}>{`Done`}</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PortfolioFilters;
