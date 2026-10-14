import '../DomainEditor/styles.scss';
import './styles.scss';
import ModalTabs from '../ModalTabs/index.web';
import MobileSheetHandle from '../MobileSheet/index.web';
import StackPillShape from '../StackPillShape/index.web';
import type { PortfolioFilterField } from '../DomainPortfolio/filters';
import PortfolioDestinationTree from '../PortfolioDestinationTree/index.web';
import { usePortfolioFilters, type PortfolioFiltersProps } from './usePortfolioFilters';
import { X, Tag, Star, Lock, Check, Globe, Gauge, Search, Filter, Shield, UserRound, CalendarDays, RefreshCw, RotateCcw, FolderTree, CircleCheck, ListTodo } from 'lucide-react';

const filterIcons: Record<PortfolioFilterField, typeof Filter> = {
  tags: Tag,
  dnssec: Shield,
  locked: Lock,
  starred: Star,
  country: Globe,
  currency: Globe,
  privacy: Shield,
  owner: UserRound,
  difficulty: Gauge,
  status: CircleCheck,
  source: FolderTree,
  expiry: CalendarDays,
  autoRenew: RefreshCw,
  projectStatus: ListTodo,
  providerStatus: CircleCheck,
};

const PortfolioFilters = ({ portfolio, onClose }: PortfolioFiltersProps) => {
  const filters = usePortfolioFilters({ portfolio, onClose });
  return (
    <div
      role={`presentation`}
      id={`portfolio-filters-backdrop`}
      {...filters.sheet.pressProps}
      style={filters.sheet.style}
      className={`domain-dialog-backdrop${filters.sheet.className}`}
      onClick={event => { if (filters.sheet.mobile && event.target === event.currentTarget) filters.close(); }}
      onMouseDown={event => { if (!filters.sheet.mobile && event.target === event.currentTarget) filters.close(); }}
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
        <MobileSheetHandle id={`portfolio-filters`} sheet={filters.sheet} />
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
            onClick={filters.close}
            id={`portfolio-filters-close`}
            aria-label={`Close Filters`}
            className={`domain-dialog-close portfolio-filters-close`}
          >
            <X size={19} aria-hidden={`true`} id={`portfolio-filters-close-icon`} className={`domain-dialog-close-icon`} />
          </button>
        </header>
        <div id={`portfolio-filters-toolbar`} className={`portfolio-filters-toolbar`}>
          <div id={`portfolio-filters-search-wrap`} className={`portfolio-filters-search-wrap`}>
            <Search size={15} aria-hidden id={`portfolio-filters-search-icon`} className={`portfolio-filters-search-icon`} />
            <input
              type={`search`}
              value={portfolio.query}
              autoComplete={`off`}
              aria-label={`Search Your Domains`}
              disabled={portfolio.loading}
              id={`portfolio-filters-search-input`}
              className={`portfolio-filters-search-input`}
              placeholder={`Search Your Domains`}
              onChange={event => portfolio.setQuery(event.target.value)}
            />
            {portfolio.query && (
              <button type={`button`} aria-label={`Clear Search`} disabled={portfolio.loading} id={`portfolio-filters-search-clear`} className={`portfolio-filters-search-clear`} onClick={() => portfolio.setQuery(``)}>
                <X size={14} aria-hidden id={`portfolio-filters-search-clear-icon`} className={`portfolio-filters-button-icon`} />
              </button>
            )}
          </div>
          <button
            type={`button`}
            id={`portfolio-attention`}
            disabled={portfolio.loading}
            aria-pressed={portfolio.attentionOnly}
            onClick={() => filters.applyFilter(portfolio.toggleAttentionFilter)}
            className={`portfolio-summary-item portfolio-summary-filter${portfolio.summary.attention ? ` portfolio-summary-attention` : ``}`}
          >
            <StackPillShape id={`portfolio-attention-shape`} />
            <span id={`portfolio-attention-dot`} className={`portfolio-attention-dot`} aria-hidden />
            <span id={`portfolio-attention-label`} className={`portfolio-attention-label`}>{`Needs Attention`}</span>
            <span id={`portfolio-attention-count`} className={`portfolio-summary-value`}>{portfolio.summary.attention}</span>
          </button>
          <p id={`portfolio-filters-summary`} className={`portfolio-filters-summary`} aria-live={`polite`}>
            <Filter size={14} aria-hidden id={`portfolio-filters-summary-icon`} className={`portfolio-filters-summary-icon`} />
            <span id={`portfolio-filters-summary-text`} className={`portfolio-filters-summary-text`}>{`${filters.filterCount} Active Filter(s)`}</span>
          </p>
          <p id={`portfolio-filters-matches`} className={`portfolio-filters-results`} role={`status`}>
            <span id={`portfolio-filters-matches-count`} className={`portfolio-filters-results-count`}>{portfolio.filteredDomains.length}</span>
            <span id={`portfolio-filters-matches-label`} className={`portfolio-filters-results-label`}>{`Matching Domain(s)`}</span>
          </p>
        </div>
        <ModalTabs id={`portfolio-filters`} value={filters.tab} options={filters.tabs} onChange={filters.setTab} label={`Advanced Filter Sections`} />
        <div id={`portfolio-filters-body`} className={`domain-dialog-body portfolio-filters-body`}>
          {filters.tabs.map(tab => (
            <div key={tab.id} role={`tabpanel`} tabIndex={0} hidden={filters.tab !== tab.id} id={`portfolio-filters-panel-${tab.id}`} className={`portfolio-filters-panel`} aria-labelledby={`portfolio-filters-tab-${tab.id}`}>
              {filters.tab === tab.id && <div id={`portfolio-filters-content-${tab.id}`} className={`portfolio-filters-content`}>
            <div id={`portfolio-filters-fields`} className={`portfolio-filters-fields`}>
              <section
                hidden={filters.tab !== `common`}
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
                        onClick={() => filters.applyFilter(() => portfolio.toggleExtensionFilter(extension))}
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
                hidden={filters.tab !== `common`}
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
                          onClick={() => filters.applyFilter(() => portfolio.toggleRegistrarFilter(registrar))}
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
              <section
                hidden={filters.tab !== `common`}
                id={`portfolio-filters-locations`}
                className={`portfolio-filters-section portfolio-filters-locations`}
                aria-labelledby={`portfolio-filters-locations-title`}
              >
                <div id={`portfolio-filters-locations-heading`} className={`portfolio-filters-section-heading`}>
                  <FolderTree size={15} aria-hidden id={`portfolio-filters-locations-icon`} className={`portfolio-filters-section-icon`} />
                  <h3 id={`portfolio-filters-locations-title`} className={`portfolio-filters-label`}>{`Collections & Groups`}</h3>
                  <button
                    type={`button`}
                    disabled={portfolio.loading}
                    onClick={() => filters.applyFilter(portfolio.clearLocationFilters)}
                    id={`portfolio-filters-locations-all`}
                    className={`portfolio-filters-all`}
                    aria-pressed={!portfolio.collectionFilters.length && !portfolio.groupFilters.length}
                  >
                    <Globe size={13} aria-hidden id={`portfolio-filters-locations-all-icon`} className={`portfolio-filters-button-icon`} />
                    <span id={`portfolio-filters-locations-all-text`} className={`portfolio-filters-button-text`}>{`All Domains`}</span>
                  </button>
                </div>
                <p id={`portfolio-filters-locations-help`} className={`portfolio-filters-message`}>
                  {`Select Collections Or Groups To Include Their Domains`}
                </p>
                <PortfolioDestinationTree
                  filterMode
                  value={``}
                  compact
                  disabled={portfolio.loading}
                  defaultCollapsed={filters.destinationBranches.length > 6}
                  id={`portfolio-filters-location-tree`}
                  branches={filters.destinationBranches}
                  onSelect={id => filters.applyFilter(() => portfolio.toggleGroupFilter(id))}
                  onSelectCollection={id => filters.applyFilter(() => portfolio.toggleCollectionFilter(id))}
                  selectedGroupIds={portfolio.groupFilters}
                  selectedCollectionIds={portfolio.collectionFilters}
                  labelId={`portfolio-filters-locations-title`}
                  describedBy={`portfolio-filters-locations-help`}
                />
                {!filters.destinationBranches.length && (
                  <p id={`portfolio-filters-locations-empty`} className={`portfolio-filters-message`}>{`No Domains To Filter`}</p>
                )}
              </section>
              <div id={`portfolio-filters-facets`} className={`portfolio-filters-facets`}>
                {filters.visibleSections.map(section => {
                  const selected = portfolio.facetFilters[section.id] ?? [];
                  const SectionIcon = filterIcons[section.id];
                  const sectionId = `portfolio-filters-facet-${section.id}`;
                  return (
                    <section key={section.id} id={sectionId} className={`portfolio-filters-facet${[`tags`, `expiry`, `projectStatus`].includes(section.id) ? ` portfolio-filters-facet-wide` : ``}`} aria-labelledby={`${sectionId}-label`}>
                      <div id={`${sectionId}-heading`} className={`portfolio-filters-facet-heading`}>
                        <SectionIcon size={15} aria-hidden id={`${sectionId}-icon`} className={`portfolio-filters-section-icon`} />
                        <h3 id={`${sectionId}-label`} className={`portfolio-filters-label`}>{section.label}</h3>
                        <span id={`${sectionId}-selected`} className={`portfolio-filters-facet-count`}>
                          {selected.length ? `${selected.length} Selected` : `${section.options.length} Options`}
                        </span>
                      </div>
                        <div id={`${sectionId}-options`} className={`portfolio-filters-facet-options`}>
                          {section.options.map(option => {
                            const optionId = `${sectionId}-${encodeURIComponent(option.value)}`;
                            const active = selected.includes(option.value);
                            return (
                              <button
                                type={`button`}
                                id={optionId}
                                key={option.value}
                                aria-pressed={active}
                                disabled={portfolio.loading}
                                className={`portfolio-filters-choice`}
                                aria-label={`${option.label}, ${option.count} Domain(s)`}
                                onClick={() => filters.applyFilter(() => portfolio.toggleFacetFilter(section.id, option.value))}
                              >
                                <Check size={12} aria-hidden id={`${optionId}-check`} className={`portfolio-filters-choice-check`} />
                                <span id={`${optionId}-label`} className={`portfolio-filters-choice-label`}>{option.label}</span>
                                <span id={`${optionId}-count`} className={`portfolio-filters-choice-count`}>{option.count}</span>
                              </button>
                            );
                          })}
                          {!section.options.length && (
                            <p id={`${sectionId}-empty`} className={`portfolio-filters-message`}>{`No Values Yet`}</p>
                          )}
                        </div>
                    </section>
                  );
                })}
              </div>
            </div>
            {filters.tab === `selected` && (
              <section id={`portfolio-filters-active`} className={`portfolio-filters-section portfolio-filters-active`} aria-labelledby={`portfolio-filters-active-title`}>
                <h3 id={`portfolio-filters-active-title`} className={`portfolio-filters-label`}>{`Selected Filters`}</h3>
                <div id={`portfolio-filters-active-choices`} className={`portfolio-filters-active-choices`}>
                  {filters.activeSelections.map(selection => {
                    const selectionId = `portfolio-filters-active-${encodeURIComponent(selection.id)}`;
                    return (
                      <button type={`button`} key={selection.id} id={selectionId} disabled={portfolio.loading} onClick={() => filters.applyFilter(selection.onRemove)} className={`portfolio-filters-active-choice`} aria-label={`Remove ${selection.label} Filter`}>
                        <span id={`${selectionId}-label`} className={`portfolio-filters-active-label`}>{selection.label}</span>
                        <X size={12} aria-hidden id={`${selectionId}-remove-icon`} className={`portfolio-filters-button-icon`} />
                      </button>
                    );
                  })}
                  {!filters.activeSelections.length && <p id={`portfolio-filters-active-empty`} className={`portfolio-filters-message`}>{`No Filters Selected`}</p>}
                </div>
              </section>
            )}
              </div>}
            </div>
          ))}
        </div>
        <footer id={`portfolio-filters-footer`} className={`domain-dialog-footer portfolio-filters-footer`}>
          <button
            type={`button`}
            onClick={() => filters.applyFilter(filters.clearFilters)}
            id={`portfolio-filters-clear`}
            disabled={portfolio.loading || !filters.filterCount}
            className={`portfolio-button portfolio-button-secondary portfolio-filters-footer-button`}
          >
            <RotateCcw size={15} aria-hidden={`true`} id={`portfolio-filters-clear-icon`} className={`portfolio-filters-button-icon`} />
            <span id={`portfolio-filters-clear-text`} className={`portfolio-filters-button-text`}>{`Clear Filters`}</span>
          </button>
          <button
            type={`button`}
            onClick={filters.close}
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
