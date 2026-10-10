import './styles.scss';
import { useMemo, useRef } from 'react';
import { useRouter } from 'expo-router';
import DomainEditor from '../DomainEditor';
import ColumnControls from '../ColumnControls';
import GroupControls from '../GroupControls/index.web';
import TableSettings from '../TableSettings/index.web';
import StackPillShape from '../StackPillShape/index.web';
import RegistrarSetup from '../RegistrarSetup/index.web';
import { fitPortfolioColumns } from './columnLayout.web';
import { useDomainSelection } from './useDomainSelection';
import { useStickyPortfolio } from './useStickyPortfolio';
import { useRegistrarFilter } from './useRegistrarFilter';
import { formatCurrency } from '../../shared/domainUtils';
import { useAuth } from '../../shared/authContext/useAuth';
import { usePortfolioToolbar } from './usePortfolioToolbar';
import PortfolioRecords from '../PortfolioRecords/index.web';
import { usePortfolio, type SortField } from './usePortfolio';
import PortfolioSelection from '../PortfolioSelection/index.web';
import { useColumns } from '../../shared/columnContext/useColumns';
import PortfolioCopyOptions from '../PortfolioCopyOptions/index.web';
import PortfolioSyncOptions from '../PortfolioSyncOptions/index.web';
import { usePortfolioExpansion } from '../PortfolioRecords/usePortfolioExpansion';
import { buildPortfolioSections } from '../../shared/portfolioPreferences/groups';
import { REGISTRARS, useSampleData, PORTFOLIO_PREVIEW_LIMIT } from '../../shared/config';
import { usePortfolioSearch } from '../../shared/portfolioPreferences/usePortfolioSearch';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { buildPortfolioCopyText, excludeHiddenPortfolioSections, type PortfolioCopyFormat } from './copyFormats';
import { getOrderedPortfolioColumns, getPortfolioColumnCounts, getPortfolioColumnValue } from '../../shared/portfolioColumns';
import { X, Eye, Copy, Plus, Lock, Check, Globe, Search, Link2, Filter, EyeOff, Settings, ArrowRight, FlaskConical, LayoutGrid, List, ArrowDownAZ, GripVertical, Gauge, RefreshCw } from 'lucide-react';

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
  const expansion = usePortfolioExpansion();
  const fullSections = useMemo(() => buildPortfolioSections(portfolio.registrarDomains, preferences), [portfolio.registrarDomains, preferences]);
  const orderedSections = useMemo(() => portfolio.sortField ? {
    ...fullSections,
    mainGroups: buildPortfolioSections(portfolio.registrarDomains, { ...preferences, orders: {} }).mainGroups,
  } : fullSections, [fullSections, portfolio.registrarDomains, portfolio.sortField, preferences]);
  const summaryFiltering = portfolio.activeFilterCount > 0;
  const facetSections = useMemo(() => summaryFiltering ? {
    ...orderedSections,
    mainGroups: orderedSections.mainGroups.filter(group => group.domains.length),
    collections: orderedSections.collections.map(section => ({
      ...section,
      groups: section.groups.filter(group => group.domains.length),
    })).filter(section => section.groups.length),
  } : orderedSections, [orderedSections, summaryFiltering]);
  const search = usePortfolioSearch(facetSections, portfolio.query, portfolio.filteredDomains);
  const sections = search.sections;
  const showingFilteredRecords = search.searching || summaryFiltering;
  const mainGroups = sections.mainGroups;
  const showMainRecords = !showingFilteredRecords || mainGroups.length > 0 || !sections.collections.length;
  const tableVisible = preferences.view === `table` || (!portfolio.loading && !sections.mainDomains.length && !sections.collections.some(section => section.domains.length));
  const sticky = useStickyPortfolio(`${preferences.view}|${tableVisible}|${showMainRecords}|${visibleColumns.join(`|`)}`);
  const columns = getOrderedPortfolioColumns(visibleColumns);
  const columnCounts = useMemo(() => getPortfolioColumnCounts(portfolio.domains), [portfolio.domains]);
  const showAnnualSpend = visibleColumns.some(field => field === `renewalPrice` || field === `monthlyCost`)
    && (portfolio.loading || portfolio.summary.knownCostCount > 0);
  const showMonthlySpend = visibleColumns.includes(`monthlyCost`);
  const mainVisibleIds = useMemo(() => {
    const domains = mainGroups.flatMap(group => group.domains);
    const expandedIds = new Set(mainGroups.filter(group => !expansion.collapsedGroups.has(group.key)).flatMap(group => group.domains.map(domain => domain.id)));
    return (compact ? domains.slice(0, PORTFOLIO_PREVIEW_LIMIT) : domains).filter(domain => expandedIds.has(domain.id)).map(domain => domain.id);
  }, [mainGroups, compact, expansion.collapsedGroups]);
  const collectionVisibleIds = useMemo(() => new Map(sections.collections.map(section => {
    const expandedIds = new Set(section.groups.filter(group => !expansion.collapsedGroups.has(group.key)).flatMap(group => group.domains.map(domain => domain.id)));
    const domains = compact ? section.domains.slice(0, PORTFOLIO_PREVIEW_LIMIT) : section.domains;
    return [section.collection.id, expansion.collapsedCollections.has(section.collection.id)
      ? [] : domains.filter(domain => expandedIds.has(domain.id)).map(domain => domain.id)] as const;
  })), [sections.collections, compact, expansion.collapsedGroups, expansion.collapsedCollections]);
  const visibleIds = useMemo(() => {
    return [...collectionVisibleIds.values()].flat().concat(mainVisibleIds);
  }, [collectionVisibleIds, mainVisibleIds]);
  const copyIds = useMemo(() => {
    const mainDomains = mainGroups.flatMap(group => group.domains);
    const collectionDomains = sections.collections.flatMap(section => compact ? section.domains.slice(0, PORTFOLIO_PREVIEW_LIMIT) : section.domains);
    return [...new Set(collectionDomains.concat(compact ? mainDomains.slice(0, PORTFOLIO_PREVIEW_LIMIT) : mainDomains).map(domain => domain.id))];
  }, [compact, mainGroups, sections.collections]);
  const selection = useDomainSelection(portfolio.domains, visibleIds);
  const copyTreeAvailable = sections.collections.length > 0
    || mainGroups.some(group => group.key !== `all` && group.key !== `custom:ungrouped`);
  const showHiddenCopyOptions = preferences.showHiddenGroups || preferences.showHiddenDomains || preferences.showHiddenCollections;
  const copySections = useMemo(() => !showHiddenCopyOptions || toolbar.includeHidden ? sections : excludeHiddenPortfolioSections(sections, preferences),
    [sections, preferences, showHiddenCopyOptions, toolbar.includeHidden]);
  const includedCopyIds = useMemo(() => {
    const mainDomains = copySections.mainGroups.flatMap(group => group.domains);
    const collectionDomains = copySections.collections.flatMap(section => compact ? section.domains.slice(0, PORTFOLIO_PREVIEW_LIMIT) : section.domains);
    return [...new Set(collectionDomains.concat(compact ? mainDomains.slice(0, PORTFOLIO_PREVIEW_LIMIT) : mainDomains).map(domain => domain.id))];
  }, [compact, copySections]);
  const includedCopyTreeAvailable = copySections.collections.length > 0
    || copySections.mainGroups.some(group => group.key !== `all` && group.key !== `custom:ungrouped`);
  const copyDomains = (format: PortfolioCopyFormat) => {
    if (format !== `list` && !includedCopyTreeAvailable) return;
    const text = buildPortfolioCopyText(copySections, includedCopyIds, preferences.groupBy !== `none`, format);
    void toolbar.copyDomains(text, includedCopyIds.length);
  };
  const changeSort = (field: SortField) => {
    const current = portfolio.sortField === field;
    const nextField = current && portfolio.sortDirection === `desc` ? null : field;
    const direction = current && portfolio.sortDirection === `asc` ? `desc` : `asc`;
    portfolio.changeSort(field);
    preferences.collections.forEach(collection => preferences.setCollectionSort(collection.id, nextField, direction));
  };
  const toggleManualOrder = () => {
    const field = portfolio.sortField ? null : `name`;
    portfolio.toggleManualOrder();
    preferences.collections.forEach(collection => preferences.setCollectionSort(collection.id, field, `asc`));
  };
  const manualSyncBlocked = portfolio.loading || portfolio.syncing || portfolio.manualSyncWaitSeconds > 0;
  const AddRowsIcon = preferences.showAddRows ? Eye : EyeOff;
  const addRowsLabel = `${preferences.showAddRows ? `Hide` : `Show`} Add Rows`;
  const fitColumns = () => setColumnWidths({ ...columnWidths, ...fitPortfolioColumns(portfolio.domains, columns, portfolioRef.current, preferences.showCosts) });
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
  const hasFilters = summaryFiltering || (portfolio.domains.length > 0 && search.searching);
  const registrarOptions = [...new Set([...REGISTRARS, ...portfolio.summary.registrarCounts.map(item => item.registrar)])];
  const registrarTotals = useMemo(() => [
    ...portfolio.summary.registrarCounts,
    ...portfolio.connectedSyncRegistrars.filter(({ label }) => !portfolio.summary.registrarCounts.some(({ registrar }) => registrar === label))
      .map(({ label }) => ({ count: 0, registrar: label })),
  ], [portfolio.summary.registrarCounts, portfolio.connectedSyncRegistrars]);
  const filterDescription = `${portfolio.registrarFilters.join(`, `) || `All Registrars`}${portfolio.extensionFilters.length ? `; Extensions: ${portfolio.extensionFilters.join(`, `)}` : ``}${portfolio.attentionOnly ? `; Needs Attention` : ``}`;
  const selectionFor = (ids: string[]) => {
    const count = ids.filter(id => selection.selectedIds.has(id)).length;
    return {
      onSelectAll: (checked: boolean) => selection.selectMany(ids, checked),
      allSelected: ids.length > 0 && count === ids.length,
      someSelected: count > 0 && count < ids.length,
    };
  };
  const recordProps = {
    expansion,
    hasFilters,
    visibleColumns,
    searching: search.searching,
    onSelect: selection.select,
    onEdit: portfolio.openEditor,
    loading: portfolio.loading,
    allDomains: portfolio.sortedDomains,
    selectedIds: selection.selectedIds,
    onGrouped: selection.clearSelection,
    busy: Boolean(portfolio.pendingId),
    onToggleAutoRenew: portfolio.toggleAutoRenew,
    onChangeDescription: portfolio.changeDescription,
    onChangeProjectStatus: portfolio.changeProjectStatus,
    onEmptyAction: () => {
      if (!hasFilters) portfolio.openSetup();
      else { portfolio.setQuery(``); portfolio.clearSummaryFilters(); }
    },
  };
  return (
    <section
      ref={portfolioRef}
      id={`domain-portfolio`}
      aria-busy={portfolio.loading}
      aria-labelledby={`portfolio-title`}
      className={`domain-portfolio${compact ? `` : ` domain-portfolio-full`}`}
    >
      <p id={`portfolio-selection-help`} className={`portfolio-sr-only`}>
        {`Use Space to toggle a focused checkbox. Use Shift-click or Shift+Space to select or clear a range from your last selection. Use Shift+F10 or the Menu key in a table row to open actions for all selected domains.`}
      </p>
      {portfolio.loading && (
        <p role={`status`} id={`portfolio-loading-status`} className={`portfolio-sr-only`}>
          {`Loading Domains…`}
        </p>
      )}
      <div id={`portfolio-card`} className={`portfolio-card`}>
        <div ref={sticky.headingRef} id={`portfolio-heading-row`} className={`portfolio-heading-row`}>
          <div id={`portfolio-heading`} className={`portfolio-heading`}>
            <span id={`portfolio-eyebrow`} className={`portfolio-eyebrow`}>
              {`Table`}
            </span>
            <h2 id={`portfolio-title`} className={`portfolio-title`}>
              {`Domains`}
            </h2>
            <div id={`portfolio-summary-stack`} className={`portfolio-summary-stack`}>
              <div id={`portfolio-extension-summary`} className={`portfolio-summary portfolio-extension-summary`}>
                {!portfolio.loading && portfolio.summary.extensionCounts.map(({ extension, count }) => {
                  const extensionId = encodeURIComponent(extension);
                  return (
                    <span key={extension} id={`portfolio-extension-total-${extensionId}`} className={`portfolio-summary-item portfolio-extension-total`}>
                      <button
                        type={`button`}
                        disabled={portfolio.loading}
                        id={`portfolio-extension-filter-${extensionId}`}
                        className={`portfolio-summary-item portfolio-summary-filter`}
                        aria-pressed={portfolio.extensionFilters.includes(extension)}
                        onClick={() => portfolio.toggleExtensionFilter(extension)}
                      >
                        <StackPillShape id={`portfolio-extension-shape-${extensionId}`} />
                        <span id={`portfolio-extension-label-${extensionId}`} className={`portfolio-extension-label`}>{`${extension}:`}</span>
                        <span id={`portfolio-extension-count-${extensionId}`} className={`portfolio-summary-value`}>{count}</span>
                      </button>
                    </span>
                  );
                })}
              </div>
              <div id={`portfolio-summary`} className={`portfolio-summary`}>
                <button
                  type={`button`}
                  disabled={portfolio.loading}
                  id={`portfolio-domain-total`}
                  onClick={portfolio.clearSummaryFilters}
                  aria-pressed={portfolio.activeFilterCount === 0}
                  className={`portfolio-summary-item portfolio-summary-filter`}
                >
                  <StackPillShape id={`portfolio-domain-total-shape`} />
                  <span id={`portfolio-domain-count`} className={`portfolio-summary-value`}>
                    {portfolio.loading ? <span aria-hidden={`true`} id={`portfolio-domain-count-skeleton`} className={`portfolio-value-skeleton portfolio-value-skeleton-count`} /> : portfolio.summary.count}
                  </span>
                  <span id={`portfolio-domain-label`} className={`portfolio-domain-label`}>
                    {portfolio.summary.count === 1 ? `Domain` : `Domains`}
                  </span>
                </button>
                {!portfolio.loading && registrarTotals.map(({ count, registrar }) => {
                  const registrarId = registrar.toLowerCase().replace(/\s+/g, `-`);
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
                        className={`portfolio-summary-item portfolio-summary-filter portfolio-registrar-filter-toggle`}
                        aria-pressed={portfolio.registrarFilters.includes(registrar)}
                        onClick={() => portfolio.toggleRegistrarFilter(registrar)}
                      >
                        <span id={`portfolio-registrar-label-${registrarId}`} className={`portfolio-registrar-label`}>
                          {`${registrar}:`}
                        </span>
                        <span id={`portfolio-registrar-count-${registrarId}`} className={`portfolio-summary-value`}>
                          {count}
                        </span>
                      </button>
                      {connection && (
                        <button
                          type={`button`}
                          aria-label={syncLabel}
                          aria-busy={syncingRegistrar || undefined}
                          id={`portfolio-registrar-sync-${registrarId}`}
                          className={`portfolio-registrar-sync`}
                          disabled={manualSyncBlocked || !portfolio.canSyncManually}
                          title={portfolio.manualSyncWaitSeconds ? portfolio.manualSyncMessage : syncLabel}
                          aria-describedby={portfolio.manualSyncMessage ? `portfolio-manual-sync-message` : undefined}
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
                <button
                  type={`button`}
                  disabled={portfolio.loading}
                  id={`portfolio-attention`}
                  aria-pressed={portfolio.attentionOnly}
                  onClick={portfolio.toggleAttentionFilter}
                  className={`portfolio-summary-item portfolio-summary-filter${portfolio.summary.attention ? ` portfolio-summary-attention` : ``}`}
                >
                  <StackPillShape id={`portfolio-attention-shape`} />
                  <span id={`portfolio-attention-dot`} className={`portfolio-attention-dot`} aria-hidden={`true`} />
                  <span id={`portfolio-attention-label`} className={`portfolio-attention-label`}>
                    {portfolio.loading ? <><span aria-hidden={`true`} id={`portfolio-attention-skeleton`} className={`portfolio-value-skeleton portfolio-value-skeleton-count`} />{` need attention`}</> : `${portfolio.summary.attention} need attention`}
                  </span>
                </button>
                {showAnnualSpend && (
                  <>
                    <span id={`portfolio-summary-separator-two`} className={`portfolio-summary-separator`} aria-hidden={`true`}>
                      {`·`}
                    </span>
                    <span id={`portfolio-annual-spend`} className={`portfolio-summary-item`}>
                      {portfolio.loading ? <><span aria-hidden={`true`} id={`portfolio-annual-spend-skeleton`} className={`portfolio-value-skeleton portfolio-value-skeleton-spend`} />{` / year`}</> : `${formatCurrency(portfolio.summary.annualCost)} / year`}
                    </span>
                    {showMonthlySpend && (
                      <>
                        <span id={`portfolio-summary-separator-monthly`} className={`portfolio-summary-separator`} aria-hidden={`true`}>
                          {`·`}
                        </span>
                        <span id={`portfolio-monthly-spend`} className={`portfolio-summary-item`}>
                          {portfolio.loading ? <><span aria-hidden={`true`} id={`portfolio-monthly-spend-skeleton`} className={`portfolio-value-skeleton portfolio-value-skeleton-spend`} />{` / month`}</> : `${formatCurrency(portfolio.summary.annualCost / 12)} / month`}
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
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
            <div
              id={`portfolio-domain-actions`}
              ref={toolbar.primaryActionsRef}
              className={`portfolio-domain-actions`}
            >
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
        <div ref={sticky.toolbarRef} id={`portfolio-toolbar`} className={`portfolio-toolbar`}>
          <div id={`portfolio-controls-row`} className={`portfolio-controls-row`}>
            {!portfolio.loading && (
              <PortfolioSelection
                count={selection.selectedIds.size}
                visibleCount={selection.visibleSelectedCount}
              />
            )}
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
              open={toolbar.columnsOpen}
              onFit={fitColumns}
              onReset={resetColumns}
              onToggle={toggleColumn}
              fitDisabled={portfolio.loading}
              columnCounts={columnCounts}
              visibleColumns={visibleColumns}
              onOpenChange={toolbar.setColumnsOpen}
              settingsButtonRef={toolbar.settingsButtonRef}
            />
            <GroupControls domains={portfolio.domains} />
            <button
              type={`button`}
              id={`portfolio-manual-order`}
              aria-pressed={!portfolio.sortField}
              onClick={toggleManualOrder}
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
              <div
                role={`group`}
                aria-label={`Domain Actions`}
                aria-hidden={!toolbar.showCompactActions}
                id={`portfolio-toolbar-domain-actions`}
                data-visible={toolbar.showCompactActions}
                className={`portfolio-toolbar-domain-actions`}
                data-has-sync={Boolean(user && portfolio.canSyncManually)}
              >
                {user && portfolio.canSyncManually && (
                  <button
                    type={`button`}
                    aria-busy={portfolio.syncing}
                    tabIndex={toolbar.showCompactActions ? 0 : -1}
                    id={`portfolio-toolbar-sync-domains`}
                    onClick={() => void portfolio.syncManually()}
                    data-focus-fallback={`portfolio-sync-domains`}
                    disabled={!toolbar.showCompactActions || manualSyncBlocked}
                    aria-label={`Sync Domains From Connected Registrars, ${manualSyncLabel}`}
                    aria-describedby={portfolio.manualSyncMessage ? `portfolio-manual-sync-message` : undefined}
                    title={portfolio.manualSyncMessage || `Sync Domains From Connected Registrars`}
                    className={`portfolio-button portfolio-button-secondary portfolio-toolbar-icon-button`}
                  >
                    {portfolio.syncing ? (
                      <span
                        aria-hidden={`true`}
                        id={`portfolio-toolbar-sync-spinner`}
                        className={`portfolio-sync-spinner`}
                      />
                    ) : (
                      <RefreshCw
                        size={15}
                        aria-hidden={`true`}
                        id={`portfolio-toolbar-sync-domains-icon`}
                        className={`portfolio-button-icon`}
                      />
                    )}
                  </button>
                )}
                <button
                  type={`button`}
                  title={`Add Domain`}
                  aria-label={`Add Domain`}
                  onClick={portfolio.openSetup}
                  id={`portfolio-toolbar-add-domain`}
                  data-focus-fallback={`portfolio-add-domain`}
                  tabIndex={toolbar.showCompactActions ? 0 : -1}
                  disabled={!toolbar.showCompactActions || portfolio.loading}
                  className={`portfolio-button portfolio-button-secondary portfolio-toolbar-icon-button`}
                >
                  <Plus
                    size={16}
                    aria-hidden={`true`}
                    id={`portfolio-toolbar-add-domain-icon`}
                    className={`portfolio-button-icon`}
                  />
                </button>
              </div>
              <button
                type={`button`}
                aria-haspopup={`dialog`}
                id={`portfolio-copy-domains`}
                aria-busy={toolbar.copying}
                aria-expanded={toolbar.copyOpen}
                onClick={toolbar.openCopyOptions}
                aria-controls={`portfolio-copy-options-dialog`}
                title={toolbar.copied ? toolbar.copyMessage : `Copy Domains`}
                aria-label={toolbar.copied ? toolbar.copyMessage : copyIds.length ? `Choose Copy Format For ${copyIds.length} Domains` : `Choose Copy Format For Table Structure`}
                disabled={!copyIds.length && !copyTreeAvailable}
                className={`portfolio-button portfolio-button-secondary portfolio-toolbar-icon-button${toolbar.copied ? ` portfolio-toolbar-icon-button-active` : ``}`}
              >
                {toolbar.copied ? (
                  <Check size={16} aria-hidden={`true`} id={`portfolio-copy-domains-icon`} className={`portfolio-button-icon`} />
                ) : (
                  <Copy size={16} aria-hidden={`true`} id={`portfolio-copy-domains-icon`} className={`portfolio-button-icon`} />
                )}
              </button>
              <button
                type={`button`}
                title={addRowsLabel}
                aria-label={addRowsLabel}
                id={`portfolio-add-rows-toggle`}
                aria-pressed={preferences.showAddRows}
                disabled={portfolio.loading || preferences.loading}
                onClick={() => preferences.setShowAddRows(!preferences.showAddRows)}
                className={`portfolio-button portfolio-button-secondary portfolio-toolbar-icon-button${preferences.showAddRows ? ` portfolio-toolbar-icon-button-active` : ``}`}
              >
                <span aria-hidden={`true`} id={`portfolio-add-rows-icon`} className={`portfolio-add-rows-icon`}>
                  <AddRowsIcon size={16} id={`portfolio-add-rows-eye-icon`} className={`portfolio-button-icon`} />
                  <Plus size={9} id={`portfolio-add-rows-plus-icon`} className={`portfolio-add-rows-plus-icon`} />
                </span>
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
                  disabled={portfolio.loading}
                  title={`Filter By Registrar: ${filterDescription}`}
                  onClick={() => registrarFilter.setOpen(current => !current)}
                  aria-label={`Filter By Registrar, ${portfolio.activeFilterCount} Active Filter(s), ${filterDescription}`}
                  className={`portfolio-button portfolio-button-secondary portfolio-registrar-filter-button${registrarFilter.open || portfolio.activeFilterCount ? ` portfolio-registrar-filter-button-active` : ``}`}
                >
                  <Filter size={16} aria-hidden={`true`} id={`portfolio-registrar-filter-icon`} className={`portfolio-button-icon`} />
                  <span aria-hidden={`true`} id={`portfolio-registrar-filter-badge`} className={`portfolio-registrar-filter-badge`}>
                    {portfolio.activeFilterCount}
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
                      disabled={portfolio.loading}
                      id={`portfolio-registrar-filter`}
                      className={`portfolio-registrar-filter`}
                      value={portfolio.registrarFilter}
                      onChange={event => { portfolio.setRegistrarFilter(event.target.value); registrarFilter.close(); }}
                    >
                      <option id={`portfolio-registrar-option-all`} className={`portfolio-registrar-option`} value={`All Registrars`}>
                        {`All Registrars`}
                      </option>
                      {portfolio.registrarFilters.length > 1 && (
                        <option disabled id={`portfolio-registrar-option-multiple`} className={`portfolio-registrar-option`} value={`Multiple Registrars`}>
                          {`Multiple Registrars`}
                        </option>
                      )}
                      {registrarOptions.map(registrar => (
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
                aria-haspopup={`dialog`}
                aria-label={`Table Settings`}
                ref={toolbar.settingsButtonRef}
                id={`portfolio-table-settings`}
                aria-expanded={toolbar.settingsOpen}
                onClick={toolbar.openSettings}
                aria-controls={`table-settings-dialog`}
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
            aria-label={`Search Domains`}
            onSubmit={event => {
              event.preventDefault();
              portfolio.setQuery(searchInputRef.current?.value ?? portfolio.query);
              searchInputRef.current?.focus({ preventScroll: true });
            }}
          >
            <div id={`portfolio-search-wrap`} className={`portfolio-search-wrap`}>
              <label id={`portfolio-search-label`} className={`portfolio-sr-only`} htmlFor={`portfolio-search`}>
                {`Search Domain Names, Titles, Or Descriptions`}
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
        <PortfolioRecords
          {...recordProps}
          sticky={sticky}
          compact={compact}
          {...selectionFor(visibleIds)}
          showMainRecords={showMainRecords}
          domains={sections.mainDomains}
          sortField={portfolio.sortField}
          onSort={changeSort}
          sortDirection={portfolio.sortDirection}
          collectionSections={sections.collections}
          searchGroups={showingFilteredRecords ? mainGroups : undefined}
          onToggleCollectionSearch={search.toggleCollection}
          isCollectionShowingAll={id => search.showAllCollections.has(id)}
          isGroupShowingAll={(key, collectionId) => search.isGroupShowingAll(collectionId, key)}
          onToggleGroupSearch={(key, collectionId) => search.toggleGroup(collectionId, key)}
        />
        <div id={`portfolio-card-footer`} className={`portfolio-card-footer`}>
          <span id={`portfolio-visible-count`} className={`portfolio-visible-count`}>
            {portfolio.loading ? <span aria-hidden={`true`} id={`portfolio-visible-count-skeleton`} className={`portfolio-value-skeleton portfolio-value-skeleton-footer`} /> : `Showing ${visibleIds.length} Of ${search.searching ? portfolio.registrarDomains.length : portfolio.filteredDomains.length}`}
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
      {portfolio.editorOpen && !portfolio.loading && (
        <DomainEditor domain={portfolio.editingDomain} onClose={() => portfolio.setEditorOpen(false)} />
      )}
      {portfolio.setupOpen && !portfolio.loading && (
        <RegistrarSetup onClose={portfolio.closeSetup} onManual={() => portfolio.openEditor()} />
      )}
      {portfolio.manualSyncChoices.length > 0 && !portfolio.loading && (
        <PortfolioSyncOptions
          busy={portfolio.syncing}
          onClose={portfolio.closeManualSync}
          choices={portfolio.manualSyncChoices}
          onSyncAll={() => void portfolio.syncAllManually()}
          onSync={connectionId => void portfolio.syncManually(connectionId)}
        />
      )}
      {toolbar.settingsOpen && (
        <TableSettings
          onFit={fitColumns}
          onReset={resetColumns}
          onToggle={toggleColumn}
          columnCounts={columnCounts}
          fitDisabled={portfolio.loading}
          sortField={portfolio.sortField}
          visibleColumns={visibleColumns}
          onClose={() => toolbar.setSettingsOpen(false)}
          onToggleManualOrder={toggleManualOrder}
        />
      )}
      {toolbar.copyOpen && (
        <PortfolioCopyOptions
          allowEmptyTree
          busy={toolbar.copying}
          onCopy={copyDomains}
          count={includedCopyIds.length}
          treeAvailable={includedCopyTreeAvailable}
          onClose={toolbar.closeCopyOptions}
          error={toolbar.copyError ? toolbar.copyMessage : undefined}
          hiddenOptions={showHiddenCopyOptions ? { included: toolbar.includeHidden, onChange: toolbar.changeIncludeHidden } : undefined}
        />
      )}
    </section>
  );
};

export default DomainPortfolio;
