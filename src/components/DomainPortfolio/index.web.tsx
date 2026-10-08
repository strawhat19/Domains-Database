import './styles.scss';
import { useMemo, useRef } from 'react';
import { useRouter } from 'expo-router';
import DomainEditor from '../DomainEditor';
import { usePortfolio } from './usePortfolio';
import ColumnControls from '../ColumnControls';
import GroupControls from '../GroupControls/index.web';
import RegistrarSetup from '../RegistrarSetup/index.web';
import { fitPortfolioColumns } from './columnLayout.web';
import { useDomainSelection } from './useDomainSelection';
import { useStickyPortfolio } from './useStickyPortfolio';
import { useRegistrarFilter } from './useRegistrarFilter';
import { usePortfolioToolbar } from './usePortfolioToolbar';
import { formatCurrency } from '../../shared/domainUtils';
import { useAuth } from '../../shared/authContext/useAuth';
import PortfolioRecords from '../PortfolioRecords/index.web';
import { useCollectionReorder } from './useCollectionReorder';
import { REGISTRARS, useSampleData, PORTFOLIO_PREVIEW_LIMIT } from '../../shared/config';
import PortfolioSelection from '../PortfolioSelection/index.web';
import { useColumns } from '../../shared/columnContext/useColumns';
import PortfolioCollection from '../PortfolioCollection/index.web';
import PortfolioCopyOptions from '../PortfolioCopyOptions/index.web';
import { buildPortfolioCopyText, type PortfolioCopyFormat } from './copyFormats';
import { buildPortfolioSections } from '../../shared/portfolioPreferences/groups';
import { usePortfolioSearch } from '../../shared/portfolioPreferences/usePortfolioSearch';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { getOrderedPortfolioColumns, getPortfolioColumnCounts, getPortfolioColumnValue } from '../../shared/portfolioColumns';
import { X, Copy, Plus, Lock, Check, Globe, Search, Link2, Filter, Trash2, Settings, ArrowRight, FlaskConical, LayoutGrid, List, ArrowDownAZ, GripVertical, Gauge, RefreshCw } from 'lucide-react';

const DomainPortfolio = ({ compact = false }: { compact?: boolean }) => {
  const portfolio = usePortfolio();
  const toolbar = usePortfolioToolbar();
  const registrarFilter = useRegistrarFilter();
  const portfolioRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { visibleColumns, columnWidths, toggleColumn, resetColumns, setColumnWidths } = useColumns();
  const preferences = usePortfolioPreferences();
  const fullSections = useMemo(() => buildPortfolioSections(portfolio.registrarDomains, preferences), [portfolio.registrarDomains, preferences]);
  const orderedSections = useMemo(() => portfolio.sortField ? {
    ...fullSections,
    mainGroups: buildPortfolioSections(portfolio.registrarDomains, { ...preferences, orders: {} }).mainGroups,
  } : fullSections, [fullSections, portfolio.registrarDomains, portfolio.sortField, preferences]);
  const search = usePortfolioSearch(orderedSections, portfolio.query, portfolio.filteredDomains);
  const sections = search.sections;
  const mainGroups = sections.mainGroups;
  const showMainRecords = !search.searching || mainGroups.length > 0 || !sections.collections.length;
  const tableVisible = preferences.view === `table` || (!portfolio.loading && !sections.mainDomains.length);
  const sticky = useStickyPortfolio(`${preferences.view}|${tableVisible}|${showMainRecords}|${visibleColumns.join(`|`)}`);
  const columns = getOrderedPortfolioColumns(visibleColumns);
  const columnCounts = useMemo(() => getPortfolioColumnCounts(portfolio.domains), [portfolio.domains]);
  const showAnnualSpend = columns.some(column => column.price);
  const showMonthlySpend = visibleColumns.includes(`monthlyCost`);
  const mainVisibleIds = useMemo(() => {
    const domains = mainGroups.flatMap(group => group.domains);
    return (compact ? domains.slice(0, PORTFOLIO_PREVIEW_LIMIT) : domains).map(domain => domain.id);
  }, [mainGroups, compact]);
  const collectionVisibleIds = useMemo(() => new Map(sections.collections.map(section => [
    section.collection.id,
    (compact ? section.domains.slice(0, PORTFOLIO_PREVIEW_LIMIT) : section.domains).map(domain => domain.id),
  ])), [sections.collections, compact]);
  const visibleIds = useMemo(() => {
    return [...collectionVisibleIds.values()].flat().concat(mainVisibleIds);
  }, [collectionVisibleIds, mainVisibleIds]);
  const selection = useDomainSelection(portfolio.domains, visibleIds);
  const copyTreeAvailable = sections.collections.length > 0
    || mainGroups.some(group => group.key !== `all` && group.key !== `custom:ungrouped`);
  const copyDomains = (format: PortfolioCopyFormat) => {
    if (format !== `list` && !copyTreeAvailable) return;
    const text = buildPortfolioCopyText(sections, visibleIds, preferences.groupBy !== `none`, format);
    void toolbar.copyDomains(text, visibleIds.length);
  };
  const collectionReorder = useCollectionReorder(!portfolio.loading && !portfolio.pendingId);
  const mainHandlers = collectionReorder.handlers(null);
  const manualSyncBlocked = portfolio.loading || portfolio.syncing || portfolio.manualSyncWaitSeconds > 0;
  const manualSyncLabel = portfolio.syncing ? `Syncing…` : portfolio.manualSyncWaitSeconds > 0
    ? `Wait ${Math.floor(portfolio.manualSyncWaitSeconds / 60)}:${String(portfolio.manualSyncWaitSeconds % 60).padStart(2, `0`)}` : `Sync`;
  const displayedError = portfolio.localError || portfolio.insightError || portfolio.error;
  const insightDomains = selection.selectedIds.size
    ? portfolio.domains.filter(domain => selection.selectedIds.has(domain.id)) : portfolio.filteredDomains;
  const refreshWebsiteInfo = () => {
    if (!user) { router.push(`/signin`); return; }
    const records = [...insightDomains];
    records.sort((first, second) => String(getPortfolioColumnValue(first, `websiteInsightsCheckedAt`) ?? ``).localeCompare(String(getPortfolioColumnValue(second, `websiteInsightsCheckedAt`) ?? ``)));
    void portfolio.refreshWebsiteInsights(records);
  };
  const hasFilters = portfolio.domains.length > 0 && (search.searching || portfolio.registrarFilter !== `All Registrars`);
  const registrarFilterCount = portfolio.registrarFilter === `All Registrars` ? 0 : 1;
  const selectionFor = (ids: string[]) => {
    const count = ids.filter(id => selection.selectedIds.has(id)).length;
    return {
      onSelectAll: (checked: boolean) => selection.selectMany(ids, checked),
      allSelected: ids.length > 0 && count === ids.length,
      someSelected: count > 0 && count < ids.length,
    };
  };
  const recordProps = {
    hasFilters,
    visibleColumns,
    searching: search.searching,
    onSelect: selection.select,
    onEdit: portfolio.openEditor,
    loading: portfolio.loading,
    onDelete: portfolio.requestDelete,
    allDomains: portfolio.sortedDomains,
    selectedIds: selection.selectedIds,
    onGrouped: selection.clearSelection,
    busy: Boolean(portfolio.pendingId),
    onToggleAutoRenew: portfolio.toggleAutoRenew,
    onChangeDescription: portfolio.changeDescription,
    onChangeProjectStatus: portfolio.changeProjectStatus,
    onEmptyAction: () => {
      if (!hasFilters) portfolio.openSetup();
      else { portfolio.setQuery(``); portfolio.setRegistrarFilter(`All Registrars`); }
    },
  };
  return (
    <section
      ref={portfolioRef}
      id={`domain-portfolio`}
      aria-labelledby={`portfolio-title`}
      className={`domain-portfolio${compact ? `` : ` domain-portfolio-full`}`}
    >
      <p id={`portfolio-selection-help`} className={`portfolio-sr-only`}>
        {`Use Space to toggle a focused checkbox. Use Shift-click or Shift+Space to select or clear a range from your last selection. Use Shift+F10 or the Menu key in a table row to open actions for all selected domains.`}
      </p>
      <div id={`portfolio-heading-row`} className={`portfolio-heading-row`}>
        <div id={`portfolio-heading`} className={`portfolio-heading`}>
          <span id={`portfolio-eyebrow`} className={`portfolio-eyebrow`}>
            {`THE REGISTRY`}
          </span>
          <h2 id={`portfolio-title`} className={`portfolio-title`}>
            {`Domain Portfolio`}
          </h2>
          <div id={`portfolio-summary`} className={`portfolio-summary`}>
            <span id={`portfolio-domain-total`} className={`portfolio-summary-item`}>
              <span id={`portfolio-domain-count`} className={`portfolio-summary-value`}>
                {portfolio.loading ? `—` : portfolio.summary.count}
              </span>
              {` ${portfolio.summary.count === 1 ? `domain` : `domains`}`}
            </span>
            {!portfolio.loading && portfolio.summary.registrarCounts.map(({ count, registrar }) => {
              const registrarId = registrar.toLowerCase().replace(/\s+/g, `-`);
              return (
                <span
                  key={registrar}
                  id={`portfolio-registrar-total-${registrarId}`}
                  className={`portfolio-summary-item portfolio-registrar-total`}
                >
                  <span
                    aria-hidden={`true`}
                    id={`portfolio-registrar-separator-${registrarId}`}
                    className={`portfolio-summary-separator portfolio-registrar-separator`}
                  >
                    {`·`}
                  </span>
                  <span id={`portfolio-registrar-label-${registrarId}`} className={`portfolio-registrar-label`}>
                    {`${registrar}:`}
                  </span>
                  <span id={`portfolio-registrar-count-${registrarId}`} className={`portfolio-summary-value`}>
                    {count}
                  </span>
                </span>
              );
            })}
            <span id={`portfolio-summary-separator-one`} className={`portfolio-summary-separator`} aria-hidden={`true`}>
              {`·`}
            </span>
            <span id={`portfolio-attention`} className={`portfolio-summary-item ${portfolio.summary.attention ? `portfolio-summary-attention` : ``}`}>
              <span id={`portfolio-attention-dot`} className={`portfolio-attention-dot`} aria-hidden={`true`} />
              {portfolio.loading ? `— need attention` : `${portfolio.summary.attention} need attention`}
            </span>
            {showAnnualSpend && (
              <>
                <span id={`portfolio-summary-separator-two`} className={`portfolio-summary-separator`} aria-hidden={`true`}>
                  {`·`}
                </span>
                <span id={`portfolio-annual-spend`} className={`portfolio-summary-item`}>
                  {portfolio.loading ? `— / year` : portfolio.domains.length && !portfolio.summary.knownCostCount ? `Cost Not Set` : `${formatCurrency(portfolio.summary.annualCost)} / year`}
                </span>
                {showMonthlySpend && (
                  <>
                    <span id={`portfolio-summary-separator-monthly`} className={`portfolio-summary-separator`} aria-hidden={`true`}>
                      {`·`}
                    </span>
                    <span id={`portfolio-monthly-spend`} className={`portfolio-summary-item`}>
                      {portfolio.loading ? `— / month` : portfolio.domains.length && !portfolio.summary.knownCostCount ? `Cost Not Set` : `${formatCurrency(portfolio.summary.annualCost / 12)} / month`}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <div id={`portfolio-primary-actions`} className={`portfolio-primary-actions`}>
          {/* <button
            type={`button`}
            id={`portfolio-refresh-website-info`}
            onClick={refreshWebsiteInfo}
            className={`portfolio-button portfolio-button-secondary`}
            disabled={portfolio.loading || portfolio.refreshing || !insightDomains.length}
            title={`Check Up To 10 Selected Or Filtered Domains, Oldest First — Performance And Rank Are Not Visitor Counts`}
          >
            <Gauge size={15} aria-hidden={`true`} id={`portfolio-website-info-icon`} className={`portfolio-button-icon`} />
            <span id={`portfolio-website-info-text`} className={`portfolio-button-text`}>
              {portfolio.refreshing ? `Checking Websites…` : user ? `Refresh Website Info` : `Sign In For Website Info`}
            </span>
          </button>
          <button
            type={`button`}
            id={`portfolio-connections`}
            className={`portfolio-button portfolio-button-secondary`}
            onClick={portfolio.openSetup}
          >
            <Link2 size={15} aria-hidden={`true`} id={`portfolio-connections-icon`} className={`portfolio-button-icon`} />
            <span id={`portfolio-connections-text`} className={`portfolio-button-text`}>
              {`Registrars`}
            </span>
          </button> */}
          <div id={`portfolio-domain-actions`} className={`portfolio-domain-actions`}>
            {user && portfolio.canSyncManually && (
              <button
                type={`button`}
                id={`portfolio-sync-domains`}
                disabled={manualSyncBlocked}
                onClick={() => void portfolio.syncManually()}
                className={`portfolio-button portfolio-button-secondary`}
                aria-label={`Sync Domains From Connected Registrars, ${manualSyncLabel}`}
                aria-describedby={portfolio.manualSyncMessage ? `portfolio-manual-sync-message` : undefined}
                title={portfolio.manualSyncMessage || `Sync Domains From Connected Registrars`}
              >
                {portfolio.syncing ? <span aria-hidden={`true`} id={`portfolio-sync-button-spinner`} className={`portfolio-sync-spinner`} /> : <RefreshCw size={15} aria-hidden={`true`} id={`portfolio-sync-domains-icon`} className={`portfolio-button-icon`} />}
                <span id={`portfolio-sync-domains-text`} className={`portfolio-button-text`}>
                  {manualSyncLabel}
                </span>
              </button>
            )}
            <button
              type={`button`}
              id={`portfolio-add-domain`}
              disabled={portfolio.loading}
              onClick={portfolio.openSetup}
              className={`portfolio-button portfolio-button-primary`}
            >
              <Plus size={16} aria-hidden={`true`} id={`portfolio-add-domain-icon`} className={`portfolio-button-icon`} />
              <span id={`portfolio-add-domain-text`} className={`portfolio-button-text`}>
                {`Add Domain`}
              </span>
            </button>
          </div>
        </div>
      </div>
      {user && portfolio.manualSyncMessage && (
        <p role={`status`} aria-live={`polite`} id={`portfolio-manual-sync-message`} className={`portfolio-manual-sync-message`}>
          {portfolio.manualSyncMessage}
        </p>
      )}
      {portfolio.syncing && (
        <div role={`status`} aria-live={`polite`} id={`portfolio-sync-status`} className={`portfolio-sync-status`}>
          <span aria-hidden={`true`} id={`portfolio-sync-spinner`} className={`portfolio-sync-spinner`} />
          <span id={`portfolio-sync-text`} className={`portfolio-sync-text`}>
            {`Syncing Domains…`}
          </span>
        </div>
      )}
      {(portfolio.refreshing || portfolio.insightNotice) && (
        <div role={`status`} aria-live={`polite`} id={`portfolio-website-info-status`} className={`portfolio-message portfolio-message-success`}>
          <p id={`portfolio-website-info-status-text`} className={`portfolio-message-text`}>
            {portfolio.refreshing ? `Checking Website Performance And Rank — Up To 10 Domains Per Refresh` : portfolio.insightNotice}
          </p>
          {!portfolio.refreshing && (
            <button
              type={`button`}
              id={`portfolio-website-info-dismiss`}
              onClick={portfolio.clearInsightNotice}
              aria-label={`Dismiss Website Info Notice`}
              className={`portfolio-message-dismiss`}
            >
              <X size={15} aria-hidden={`true`} id={`portfolio-website-info-dismiss-icon`} className={`portfolio-message-dismiss-icon`} />
            </button>
          )}
        </div>
      )}
      {displayedError && (
        <div role={`alert`} id={`portfolio-error`} className={`portfolio-message portfolio-message-error`}>
          <p id={`portfolio-error-text`} className={`portfolio-message-text`}>
            {displayedError}
          </p>
          {(portfolio.localError || portfolio.insightError) && (
            <button type={`button`} id={`portfolio-error-dismiss`} className={`portfolio-message-dismiss`} onClick={() => { portfolio.clearError(); portfolio.clearInsightError(); }} aria-label={`Dismiss Error`}>
              <X size={15} aria-hidden={`true`} id={`portfolio-error-dismiss-icon`} className={`portfolio-message-dismiss-icon`} />
            </button>
          )}
        </div>
      )}
      {portfolio.notice && (
        <div role={`status`} aria-live={`polite`} id={`portfolio-notice`} className={`portfolio-message portfolio-message-success`}>
          <p id={`portfolio-notice-text`} className={`portfolio-message-text`}>
            {portfolio.notice}
          </p>
          <button type={`button`} id={`portfolio-notice-dismiss`} className={`portfolio-message-dismiss`} onClick={portfolio.clearNotice} aria-label={`Dismiss Notice`}>
            <X size={15} aria-hidden={`true`} id={`portfolio-notice-dismiss-icon`} className={`portfolio-message-dismiss-icon`} />
          </button>
        </div>
      )}
      <div id={`portfolio-card`} className={`portfolio-card`}>
        <div ref={sticky.toolbarRef} id={`portfolio-toolbar`} className={`portfolio-toolbar`}>
          <div id={`portfolio-controls-row`} className={`portfolio-controls-row`}>
            <PortfolioSelection
              totalCount={portfolio.domains.length}
              count={selection.selectedIds.size}
              visibleCount={selection.visibleSelectedCount}
            />
            {useSampleData && portfolio.summary.hasSampleData && (
              <div id={`portfolio-toolbar-meta`} className={`portfolio-toolbar-meta`}>
                <span id={`portfolio-sample-label`} className={`portfolio-sample-label`} title={`Illustrative Records, Not Connected Accounts`}>
                  <FlaskConical size={12} aria-hidden={`true`} id={`portfolio-sample-icon`} className={`portfolio-sample-icon`} />
                  <span id={`portfolio-sample-text`} className={`portfolio-sample-text`}>
                    {`Sample Data`}
                  </span>
                </span>
              </div>
            )}
            <ColumnControls
              open={toolbar.settingsOpen}
              onReset={resetColumns}
              onToggle={toggleColumn}
              fitDisabled={portfolio.loading}
              columnCounts={columnCounts}
              visibleColumns={visibleColumns}
              onOpenChange={toolbar.setSettingsOpen}
              settingsButtonRef={toolbar.settingsButtonRef}
              onFit={() => setColumnWidths({ ...columnWidths, ...fitPortfolioColumns(portfolio.domains, columns, portfolioRef.current) })}
            />
            <GroupControls domains={portfolio.domains} />
            <button
              type={`button`}
              id={`portfolio-manual-order`}
              aria-pressed={!portfolio.sortField}
              onClick={portfolio.toggleManualOrder}
              className={`portfolio-button portfolio-button-secondary`}
              aria-label={portfolio.sortField ? `Manual` : `Sort A–Z`}
              title={portfolio.sortField ? `Switch to manual sorting` : `Return to alphabetical sorting`}
            >
              {portfolio.sortField ? (
                <GripVertical size={15} aria-hidden={`true`} id={`portfolio-manual-order-icon`} className={`portfolio-button-icon`} />
              ) : (
                <ArrowDownAZ size={15} aria-hidden={`true`} id={`portfolio-manual-order-icon`} className={`portfolio-button-icon`} />
              )}
              <span id={`portfolio-manual-order-text`} className={`portfolio-button-text`}>
                {portfolio.sortField ? `Manual` : `Sort A–Z`}
              </span>
            </button>
            <div
              role={`group`}
              id={`portfolio-view-toggle`}
              className={`portfolio-view-toggle`}
              aria-label={`Portfolio View`}
            >
              <button
                type={`button`}
                title={`Show cards`}
                id={`portfolio-view-cards`}
                aria-label={`Cards view`}
                aria-pressed={preferences.view === `grid`}
                onClick={() => preferences.setView(`grid`)}
                className={`portfolio-view-option${preferences.view === `grid` ? ` portfolio-view-option-active` : ``}`}
              >
                <LayoutGrid size={15} aria-hidden={`true`} id={`portfolio-view-cards-icon`} className={`portfolio-button-icon`} />
                <span id={`portfolio-view-cards-text`} className={`portfolio-view-option-text`}>{`Cards`}</span>
              </button>
              <button
                type={`button`}
                title={`Show table`}
                id={`portfolio-view-table`}
                aria-label={`Table view`}
                aria-pressed={preferences.view === `table`}
                onClick={() => preferences.setView(`table`)}
                className={`portfolio-view-option${preferences.view === `table` ? ` portfolio-view-option-active` : ``}`}
              >
                <List size={15} aria-hidden={`true`} id={`portfolio-view-table-icon`} className={`portfolio-button-icon`} />
                <span id={`portfolio-view-table-text`} className={`portfolio-view-option-text`}>{`Table`}</span>
              </button>
            </div>
            <div
              role={`group`}
              id={`portfolio-visibility-toggle`}
              aria-label={`Portfolio Visibility`}
              className={`portfolio-view-toggle portfolio-visibility-toggle`}
            >
              <button
                disabled
                type={`button`}
                title={`Public View`}
                aria-pressed={false}
                aria-label={`Public View`}
                id={`portfolio-visibility-public`}
                className={`portfolio-view-option portfolio-visibility-option`}
              >
                <Globe size={15} aria-hidden={`true`} id={`portfolio-visibility-public-icon`} className={`portfolio-button-icon`} />
                <span id={`portfolio-visibility-public-text`} className={`portfolio-view-option-text`}>{`Public`}</span>
              </button>
              <button
                disabled
                type={`button`}
                title={`Private View`}
                aria-pressed={true}
                aria-label={`Private View`}
                id={`portfolio-visibility-private`}
                className={`portfolio-view-option portfolio-visibility-option portfolio-view-option-active`}
              >
                <Lock size={15} aria-hidden={`true`} id={`portfolio-visibility-private-icon`} className={`portfolio-button-icon`} />
                <span id={`portfolio-visibility-private-text`} className={`portfolio-view-option-text`}>{`Private`}</span>
              </button>
            </div>
            <div id={`portfolio-toolbar-actions`} className={`portfolio-toolbar-actions`}>
              <button
                type={`button`}
                aria-haspopup={`dialog`}
                id={`portfolio-copy-domains`}
                aria-busy={toolbar.copying}
                aria-expanded={toolbar.copyOpen}
                onClick={toolbar.openCopyOptions}
                aria-controls={`portfolio-copy-options-dialog`}
                title={toolbar.copied ? toolbar.copyMessage : `Copy Domains`}
                aria-label={toolbar.copied ? toolbar.copyMessage : `Choose Copy Format For ${visibleIds.length} Domains`}
                disabled={portfolio.loading || toolbar.copying || !visibleIds.length}
                className={`portfolio-button portfolio-button-secondary portfolio-toolbar-icon-button${toolbar.copied ? ` portfolio-toolbar-icon-button-active` : ``}`}
              >
                {toolbar.copied ? (
                  <Check size={16} aria-hidden={`true`} id={`portfolio-copy-domains-icon`} className={`portfolio-button-icon`} />
                ) : (
                  <Copy size={16} aria-hidden={`true`} id={`portfolio-copy-domains-icon`} className={`portfolio-button-icon`} />
                )}
              </button>
              <div
                ref={registrarFilter.rootRef}
                id={`portfolio-registrar-filter-wrap`}
                className={`portfolio-registrar-filter-wrap`}
              >
                <button
                  type={`button`}
                  ref={registrarFilter.buttonRef}
                  aria-haspopup={`dialog`}
                  id={`portfolio-registrar-filter-button`}
                  aria-expanded={registrarFilter.open}
                  aria-controls={`portfolio-registrar-filter-panel`}
                  title={`Filter By Registrar: ${portfolio.registrarFilter}`}
                  onClick={() => registrarFilter.setOpen(current => !current)}
                  aria-label={`Filter By Registrar, ${registrarFilterCount} Active Filters, ${portfolio.registrarFilter}`}
                  className={`portfolio-button portfolio-button-secondary portfolio-registrar-filter-button${registrarFilter.open || registrarFilterCount ? ` portfolio-registrar-filter-button-active` : ``}`}
                >
                  <Filter size={16} aria-hidden={`true`} id={`portfolio-registrar-filter-icon`} className={`portfolio-button-icon`} />
                  <span aria-hidden={`true`} id={`portfolio-registrar-filter-badge`} className={`portfolio-registrar-filter-badge`}>
                    {registrarFilterCount}
                  </span>
                </button>
                {registrarFilter.open && (
                  <div
                    role={`dialog`}
                    id={`portfolio-registrar-filter-panel`}
                    className={`portfolio-registrar-filter-panel`}
                    aria-labelledby={`portfolio-registrar-filter-label`}
                  >
                    <label id={`portfolio-registrar-filter-label`} className={`portfolio-registrar-filter-label`} htmlFor={`portfolio-registrar-filter`}>
                      {`Filter By Registrar`}
                    </label>
                    <select
                      ref={registrarFilter.selectRef}
                      id={`portfolio-registrar-filter`}
                      className={`portfolio-registrar-filter`}
                      value={portfolio.registrarFilter}
                      onChange={event => { portfolio.setRegistrarFilter(event.target.value); registrarFilter.close(); }}
                    >
                      <option id={`portfolio-registrar-option-all`} className={`portfolio-registrar-option`} value={`All Registrars`}>
                        {`All Registrars`}
                      </option>
                      {REGISTRARS.map(registrar => (
                        <option
                          key={registrar}
                          value={registrar}
                          className={`portfolio-registrar-option`}
                          id={`portfolio-registrar-option-${registrar.toLowerCase().replaceAll(` `, `-`)}`}
                        >
                          {registrar}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <button
                type={`button`}
                title={`Table Settings`}
                aria-label={`Table Settings`}
                ref={toolbar.settingsButtonRef}
                id={`portfolio-table-settings`}
                aria-expanded={toolbar.settingsOpen}
                aria-controls={`portfolio-column-panel`}
                onClick={() => toolbar.setSettingsOpen(current => !current)}
                className={`portfolio-button portfolio-button-secondary portfolio-toolbar-icon-button${toolbar.settingsOpen ? ` portfolio-toolbar-icon-button-active` : ``}`}
              >
                <Settings size={16} aria-hidden={`true`} id={`portfolio-table-settings-icon`} className={`portfolio-button-icon`} />
              </button>
            </div>
            <p
              aria-atomic={`true`}
              id={`portfolio-copy-status`}
              role={toolbar.copyError && !toolbar.copyOpen ? `alert` : `status`}
              className={toolbar.copyError && !toolbar.copyOpen ? `portfolio-copy-error` : `portfolio-sr-only`}
            >
              {toolbar.copyOpen ? `` : toolbar.copyMessage}
            </p>
          </div>
          <form
            role={`search`}
            id={`portfolio-search-row`}
            className={`portfolio-search-row`}
            aria-label={`Search Domain Portfolio`}
            onSubmit={event => {
              event.preventDefault();
              portfolio.setQuery(searchInputRef.current?.value ?? portfolio.query);
              searchInputRef.current?.focus({ preventScroll: true });
            }}
          >
            <div id={`portfolio-search-wrap`} className={`portfolio-search-wrap`}>
              <label id={`portfolio-search-label`} className={`portfolio-sr-only`} htmlFor={`portfolio-search`}>
                {`Search Domains, Owners, Or Registrars`}
              </label>
              <Search size={16} aria-hidden={`true`} id={`portfolio-search-icon`} className={`portfolio-search-icon`} />
              <input
                type={`search`}
                id={`portfolio-search`}
                ref={searchInputRef}
                autoComplete={`off`}
                value={portfolio.query}
                className={`portfolio-search`}
                placeholder={`Find a domain…`}
                onChange={event => portfolio.setQuery(event.target.value)}
              />
              <button
                type={`button`}
                title={`Clear Search`}
                aria-label={`Clear Search`}
                id={`portfolio-search-clear`}
                disabled={!portfolio.query}
                className={`portfolio-button portfolio-button-quiet portfolio-search-clear`}
                onClick={() => { portfolio.setQuery(``); searchInputRef.current?.focus({ preventScroll: true }); }}
              >
                <X size={16} aria-hidden={`true`} id={`portfolio-search-clear-icon`} className={`portfolio-button-icon`} />
              </button>
            </div>
            <button
              type={`submit`}
              title={`Search Domains`}
              id={`portfolio-search-submit`}
              className={`portfolio-button portfolio-button-secondary portfolio-search-submit`}
            >
              <Search size={16} aria-hidden={`true`} id={`portfolio-search-submit-icon`} className={`portfolio-button-icon`} />
              <span id={`portfolio-search-submit-text`} className={`portfolio-button-text`}>{`Search`}</span>
            </button>
          </form>
        </div>
        {sections.collections.map(section => (
          <PortfolioCollection
            {...recordProps}
            compact={compact}
            key={section.collection.id}
            domains={section.domains}
            collection={section.collection}
            searchGroups={search.searching ? section.groups : undefined}
            onToggleSearch={() => search.toggleCollection(section.collection.id)}
            showAllDomains={search.showAllCollections.has(section.collection.id)}
            onToggleGroupSearch={key => search.toggleGroup(section.collection.id, key)}
            isGroupShowingAll={key => search.isGroupShowingAll(section.collection.id, key)}
            {...collectionReorder.moves(section.collection.id)}
            {...collectionReorder.handlers(section.collection.id)}
            globalToolbarHeight={sticky.header.toolbarHeight}
            {...selectionFor(collectionVisibleIds.get(section.collection.id) ?? [])}
          />
        ))}
        {showMainRecords && sections.collections.length > 0 && (
          <div
            onDrop={mainHandlers.onDrop}
            onDragOver={mainHandlers.onDragOver}
            onDragLeave={mainHandlers.onDragLeave}
            id={`portfolio-main-database-heading`}
            aria-describedby={`portfolio-main-database-help`}
            className={`portfolio-main-database-heading${mainHandlers.dropTarget ? ` portfolio-main-database-drop-target` : ``}`}
          >
            <h3 id={`portfolio-main-database-title`} className={`portfolio-main-database-title`}>
              {`Domains Database`}
            </h3>
            <p id={`portfolio-main-database-help`} className={`portfolio-main-database-help`}>
              {`Drop a group here to move it back to the main database`}
            </p>
          </div>
        )}
        {showMainRecords && (
          <>
            <div id={`portfolio-scroll-hint`} className={`portfolio-scroll-hint${preferences.view === `grid` ? ` portfolio-scroll-hint-hidden` : ``}`}>
              <span id={`portfolio-scroll-hint-text`} className={`portfolio-scroll-hint-text`}>
                {`Scroll to see all columns`}
              </span>
              <ArrowRight size={13} aria-hidden={`true`} id={`portfolio-scroll-hint-icon`} className={`portfolio-scroll-hint-icon`} />
            </div>
            <PortfolioRecords
              {...recordProps}
              sticky={sticky}
              compact={compact}
              domains={sections.mainDomains}
              {...selectionFor(mainVisibleIds)}
              sortField={portfolio.sortField}
              onSort={portfolio.changeSort}
              sortDirection={portfolio.sortDirection}
              searchGroups={search.searching ? mainGroups : undefined}
              isGroupShowingAll={key => search.isGroupShowingAll(null, key)}
              onToggleGroupSearch={key => search.toggleGroup(null, key)}
            />
          </>
        )}
        <div id={`portfolio-card-footer`} className={`portfolio-card-footer`}>
          <span id={`portfolio-visible-count`} className={`portfolio-visible-count`}>
            {`Showing ${visibleIds.length} Of ${search.searching ? portfolio.registrarDomains.length : portfolio.filteredDomains.length}`}
          </span>
          <button type={`button`} disabled={portfolio.loading} onClick={portfolio.openSetup} id={`portfolio-connect-registrar`} className={`portfolio-button portfolio-button-quiet`}>
            <Link2 size={13} aria-hidden={`true`} id={`portfolio-connect-registrar-icon`} className={`portfolio-button-icon`} />
            <span id={`portfolio-connect-registrar-text`} className={`portfolio-button-text`}>{`Connect Registrar`}</span>
          </button>
        </div>
      </div>
      {compact && (
        <a id={`portfolio-view-all`} className={`portfolio-view-all`} href={`/domains`}>
          <span id={`portfolio-view-all-text`} className={`portfolio-view-all-text`}>
            {`View All Domains`}
          </span>
          <ArrowRight size={14} aria-hidden={`true`} id={`portfolio-view-all-icon`} className={`portfolio-view-all-icon`} />
        </a>
      )}
      <input
        hidden
        type={`file`}
        accept={`.csv,text/csv`}
        id={`portfolio-csv-input`}
        ref={portfolio.importInputRef}
        className={`portfolio-csv-input`}
        onChange={portfolio.handleImport}
        aria-label={`Import Domain CSV`}
      />
      {portfolio.editorOpen && (
        <DomainEditor domain={portfolio.editingDomain} onClose={() => portfolio.setEditorOpen(false)} />
      )}
      {portfolio.setupOpen && (
        <RegistrarSetup onClose={portfolio.closeSetup} onManual={() => portfolio.openEditor()} />
      )}
      {toolbar.copyOpen && (
        <PortfolioCopyOptions
          busy={toolbar.copying}
          onCopy={copyDomains}
          count={visibleIds.length}
          treeAvailable={copyTreeAvailable}
          onClose={toolbar.closeCopyOptions}
          error={toolbar.copyError ? toolbar.copyMessage : undefined}
        />
      )}
      {portfolio.deletingDomain && (
        <div
          role={`presentation`}
          id={`domain-delete-backdrop`}
          className={`domain-dialog-backdrop`}
          onMouseDown={event => { if (event.target === event.currentTarget) portfolio.closeDelete(); }}
        >
          <div
            tabIndex={-1}
            role={`alertdialog`}
            aria-modal={`true`}
            id={`domain-delete-dialog`}
            ref={portfolio.deleteModalRef}
            aria-labelledby={`domain-delete-title`}
            aria-describedby={`domain-delete-description`}
            className={`domain-dialog domain-delete-dialog`}
          >
            <header id={`domain-delete-header`} className={`domain-dialog-header`}>
              <div id={`domain-delete-heading`} className={`domain-dialog-heading`}>
                <span id={`domain-delete-eyebrow`} className={`domain-dialog-eyebrow`}>
                  {`YOUR PORTFOLIO`}
                </span>
                <h2 id={`domain-delete-title`} className={`domain-dialog-title`}>
                  {`Remove this domain?`}
                </h2>
              </div>
              <button
                type={`button`}
                id={`domain-delete-close`}
                onClick={portfolio.closeDelete}
                disabled={Boolean(portfolio.pendingId)}
                className={`domain-dialog-close`}
                aria-label={`Close Remove Domain Dialog`}
              >
                <X size={19} aria-hidden={`true`} id={`domain-delete-close-icon`} className={`domain-dialog-close-icon`} />
              </button>
            </header>
            <p id={`domain-delete-name`} className={`domain-delete-name`}>
              {portfolio.deletingDomain.name}
            </p>
            <p id={`domain-delete-description`} className={`domain-dialog-description`}>
              {`This removes the entry from this device. It doesn't cancel your domain registration.`}
            </p>
            {portfolio.localError && (
              <p role={`alert`} id={`domain-delete-error`} className={`domain-dialog-error`}>
                {portfolio.localError}
              </p>
            )}
            <footer id={`domain-delete-footer`} className={`domain-dialog-footer domain-delete-footer`}>
              <button
                data-autofocus
                type={`button`}
                id={`domain-delete-cancel`}
                onClick={portfolio.closeDelete}
                disabled={Boolean(portfolio.pendingId)}
                className={`portfolio-button portfolio-button-secondary`}
              >
                <X size={15} aria-hidden={`true`} id={`domain-delete-cancel-icon`} className={`portfolio-button-icon`} />
                <span id={`domain-delete-cancel-text`} className={`portfolio-button-text`}>
                  {`Keep Domain`}
                </span>
              </button>
              <button
                type={`button`}
                id={`domain-delete-confirm`}
                onClick={portfolio.confirmDelete}
                disabled={Boolean(portfolio.pendingId)}
                className={`portfolio-button portfolio-button-danger`}
              >
                <Trash2 size={15} aria-hidden={`true`} id={`domain-delete-confirm-icon`} className={`portfolio-button-icon`} />
                <span id={`domain-delete-confirm-text`} className={`portfolio-button-text`}>
                  {portfolio.pendingId ? `Removing…` : `Remove Domain`}
                </span>
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
};

export default DomainPortfolio;
