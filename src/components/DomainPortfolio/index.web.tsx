import './styles.scss';
import { useMemo, useRef } from 'react';
import { useRouter } from 'expo-router';
import DomainEditor from '../DomainEditor';
import TableSettings from '../TableSettings/index.web';
import StackPillShape from '../StackPillShape/index.web';
import RegistrarSetup from '../RegistrarSetup/index.web';
import PortfolioFilters from '../PortfolioFilters/index.web';
import { fitPortfolioColumns } from './columnLayout.web';
import { useDomainSelection } from './useDomainSelection';
import { useStickyPortfolio } from './useStickyPortfolio';
import { formatCurrency } from '../../shared/domainUtils';
import { useAuth } from '../../shared/authContext/useAuth';
import { usePortfolioToolbar } from './usePortfolioToolbar';
import PortfolioRecords from '../PortfolioRecords/index.web';
import MobilePortfolioBoard from '../MobilePortfolioBoard/index.web';
import { usePortfolio, type SortField } from './usePortfolio';
import PortfolioSelection from '../PortfolioSelection/index.web';
import { useColumns } from '../../shared/columnContext/useColumns';
import PortfolioCopyOptions from '../PortfolioCopyOptions/index.web';
import PortfolioSyncOptions from '../PortfolioSyncOptions/index.web';
import { usePortfolioExpansion } from '../PortfolioRecords/usePortfolioExpansion';
import { useMobilePortfolio } from '../MobilePortfolioBoard/useMobilePortfolio.web';
import { buildPortfolioSections } from '../../shared/portfolioPreferences/groups';
import { countPortfolioStarMatches, filterPortfolioSectionsByStar } from '../../shared/portfolioPreferences/starFilters';
import { useSampleData, PORTFOLIO_PREVIEW_LIMIT } from '../../shared/config';
import { usePortfolioSearch } from '../../shared/portfolioPreferences/usePortfolioSearch';
import { buildPortfolioDestinationTree } from '../../shared/portfolioPreferences/destinationTree';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { buildPortfolioCopyText, excludeHiddenPortfolioSections, type PortfolioCopyFormat } from './copyFormats';
import { getOrderedPortfolioColumns, getPortfolioColumnCounts, getPortfolioColumnValue } from '../../shared/portfolioColumns';
import { X, Eye, Copy, Plus, Star, Check, Gauge, Search, Link2, Filter, EyeOff, Settings, RefreshCw, ArrowRight, TriangleAlert, FlaskConical, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';

const DomainPortfolio = ({ compact = false }: { compact?: boolean }) => {
  const portfolio = usePortfolio();
  const toolbar = usePortfolioToolbar();
  const portfolioRef = useRef<HTMLElement>(null);
  const mobileBoardRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { visibleColumns, columnWidths, toggleColumn, resetColumns, setColumnWidths } = useColumns();
  const preferences = usePortfolioPreferences();
  const expansion = usePortfolioExpansion();
  const groupKeys = useMemo(() => preferences.customGroups.map(group => `custom:${group.id}`), [preferences.customGroups]);
  const allGroupsCollapsed = groupKeys.length > 0 && groupKeys.every(key => expansion.collapsedGroups.has(key));
  const GroupExpansionIcon = allGroupsCollapsed ? ChevronsUpDown : ChevronsDownUp;
  const groupExpansionLabel = `${allGroupsCollapsed ? `Expand` : `Collapse`} All Groups / Apps`;
  const mobile = useMobilePortfolio();
  const starFilter = portfolio.facetFilters.starred?.[0];
  const fullSections = useMemo(() => buildPortfolioSections(portfolio.sectionDomains, {
    ...preferences,
    groupBy: starFilter ? `custom` : preferences.groupBy,
  }), [portfolio.sectionDomains, preferences, starFilter]);
  const orderedSections = useMemo(() => {
    if (!portfolio.sortField) return fullSections;
    const mainGroups = buildPortfolioSections(portfolio.sectionDomains, { ...preferences, orders: {}, groupBy: starFilter ? `custom` : preferences.groupBy }).mainGroups;
    return { ...fullSections, mainGroups };
  }, [fullSections, portfolio.sectionDomains, portfolio.sortField, preferences, starFilter]);
  const summaryFiltering = portfolio.activeFilterCount > 0;
  const otherSummaryFiltering = portfolio.activeFilterCount > Number(Boolean(starFilter));
  const emptyPortfolio = !portfolio.loading && !portfolio.domains.length && !preferences.customGroups.length && !preferences.collections.length;
  const showHeadingSummary = !emptyPortfolio;
  const facetSections = useMemo(() => starFilter
    ? filterPortfolioSectionsByStar(orderedSections, portfolio.starState, starFilter, !otherSummaryFiltering)
    : summaryFiltering ? {
    ...orderedSections,
    mainGroups: orderedSections.mainGroups.filter(group => group.domains.length),
    collections: orderedSections.collections.map(section => ({
      ...section,
      groups: section.groups.filter(group => group.domains.length),
    })).filter(section => section.groups.length),
  } : orderedSections, [orderedSections, portfolio.starState, starFilter, summaryFiltering, otherSummaryFiltering]);
  const search = usePortfolioSearch(facetSections, portfolio.query, portfolio.filteredDomains);
  const sections = search.sections;
  const matchingItemCount = useMemo(() => starFilter ? countPortfolioStarMatches(sections, portfolio.starState, starFilter) : undefined,
    [sections, portfolio.starState, starFilter]);
  const showingFilteredRecords = search.searching || summaryFiltering;
  const mainGroups = sections.mainGroups;
  const showMainRecords = !showingFilteredRecords || mainGroups.length > 0 || !sections.collections.length;
  const tableVisible = preferences.view === `table` || (!portfolio.loading && !sections.mainDomains.length && !sections.collections.some(section => section.domains.length));
  const sticky = useStickyPortfolio(`${mobile}|${preferences.view}|${tableVisible}|${showMainRecords}|${visibleColumns.join(`|`)}`);
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
    const collectionIds = [...collectionVisibleIds.values()].flat();
    return mobile ? mainVisibleIds.concat(collectionIds) : collectionIds.concat(mainVisibleIds);
  }, [mobile, collectionVisibleIds, mainVisibleIds]);
  const organizationSummary = useMemo(() => {
    const apps = preferences.customGroups.filter(group => group.isApp).length;
    const { ungroupedCount } = buildPortfolioDestinationTree(portfolio.domains, preferences.customGroups, preferences.collections);
    return `Collections: ${preferences.collections.length} · Groups: ${preferences.customGroups.length - apps} · Apps: ${apps} · Ungrouped: ${ungroupedCount}`;
  }, [portfolio.domains, preferences.customGroups, preferences.collections]);
  const footerTotal = search.searching ? portfolio.registrarDomains.length : portfolio.filteredDomains.length;
  const footerSummary = `Showing ${visibleIds.length} Of ${footerTotal} · ${organizationSummary}`;
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
    if ((format === `tree` || format === `detail-tree`) && !includedCopyTreeAvailable) return;
    void toolbar.copyDomains(() => buildPortfolioCopyText(copySections, includedCopyIds, preferences.groupBy !== `none`, format), includedCopyIds.length);
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
  const starFilters = portfolio.filterSections.find(section => section.id === `starred`)?.options ?? [];
  const registrarTotals = useMemo(() => [
    ...portfolio.summary.registrarCounts,
    ...portfolio.connectedSyncRegistrars.filter(({ label }) => !portfolio.summary.registrarCounts.some(({ registrar }) => registrar === label))
      .map(({ label }) => ({ count: 0, registrar: label })),
  ], [portfolio.summary.registrarCounts, portfolio.connectedSyncRegistrars]);
  const activeFilterCount = portfolio.activeFilterCount + Number(Boolean(portfolio.query.trim()));
  const filterDescription = [
    ...portfolio.registrarFilters,
    ...portfolio.extensionFilters,
    ...portfolio.destinationBranches.filter(branch => portfolio.collectionFilters.includes(branch.id)).map(branch => branch.name),
    ...portfolio.destinationBranches.flatMap(branch => branch.groups.filter(group => portfolio.groupFilters.includes(group.id)).map(group => `${branch.name} / ${group.name}`)),
    ...portfolio.filterSections.flatMap(section => (portfolio.facetFilters[section.id] ?? []).map(value => `${section.label}: ${section.options.find(option => option.value === value)?.label ?? value}`)),
    ...(portfolio.attentionOnly ? [`Needs Attention`] : []),
    ...(portfolio.query.trim() ? [`Search: ${portfolio.query.trim()}`] : []),
  ].join(`; `) || `All Domains`;
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
      data-compact={toolbar.showCompactActions}
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
      <div ref={mobileBoardRef} id={`portfolio-card`} className={`portfolio-card`}>
        <div ref={sticky.headingRef} id={`portfolio-heading-row`} className={`portfolio-heading-row`}>
          <div id={`portfolio-heading`} className={`portfolio-heading`} data-has-summary={showHeadingSummary}>
            {showHeadingSummary && <button
              type={`button`}
              id={`portfolio-heading-eyebrow`}
              disabled={portfolio.loading}
              className={`portfolio-heading-count`}
              title={`Clear All Domain Filters`}
              onClick={() => { portfolio.clearSummaryFilters(); portfolio.setQuery(``); }}
              aria-pressed={activeFilterCount === 0}
              aria-label={`Show All ${portfolio.summary.count} Domains`}
            >
              <span id={`portfolio-heading-domain-count`} className={`portfolio-summary-value`}>
                {portfolio.loading ? <span aria-hidden={`true`} id={`portfolio-heading-domain-count-skeleton`} className={`portfolio-value-skeleton portfolio-value-skeleton-count`} /> : portfolio.summary.count}
              </span>
            </button>}
            <h2 id={`portfolio-title`} className={`portfolio-title`}>
              {`Domains`}
            </h2>
            {showHeadingSummary && <div id={`portfolio-heading-summary-stack`} className={`portfolio-summary-stack`}>
              <div id={`portfolio-heading-extension-summary`} className={`portfolio-summary portfolio-extension-summary portfolio-heading-filters`}>
                {!portfolio.loading && portfolio.summary.extensionCounts.map(({ extension, count }) => {
                  const extensionId = encodeURIComponent(extension);
                  return (
                    <span key={extension} id={`portfolio-heading-extension-total-${extensionId}`} className={`portfolio-summary-item portfolio-extension-total`}>
                      <button
                        type={`button`}
                        disabled={portfolio.loading}
                        id={`portfolio-heading-extension-filter-${extensionId}`}
                        className={`portfolio-summary-item portfolio-summary-filter`}
                        aria-pressed={portfolio.extensionFilters.includes(extension)}
                        onClick={() => portfolio.toggleExtensionFilter(extension)}
                      >
                        <StackPillShape id={`portfolio-heading-extension-shape-${extensionId}`} />
                        <span id={`portfolio-heading-extension-label-${extensionId}`} className={`portfolio-extension-label`}>{`${extension}:`}</span>
                        <span id={`portfolio-heading-extension-count-${extensionId}`} className={`portfolio-summary-value`}>{count}</span>
                      </button>
                    </span>
                  );
                })}
              </div>
              <div id={`portfolio-heading-summary`} className={`portfolio-summary`}>
                {!portfolio.loading && <div id={`portfolio-heading-star-filters`} role={`group`} aria-label={`Filter Portfolio Items By Star`} className={`portfolio-heading-filters portfolio-star-filters`}>
                  {starFilters.map(option => {
                    const filterId = `portfolio-heading-star-filter-${option.value}`;
                    return (
                      <button
                        type={`button`}
                        id={filterId}
                        key={option.value}
                        title={`${option.label}: ${option.count} Item(s)`}
                        disabled={portfolio.loading}
                        className={`portfolio-summary-item portfolio-summary-filter`}
                        aria-pressed={portfolio.facetFilters.starred?.includes(option.value) ?? false}
                        aria-label={`${option.label}, ${option.count} Item(s)`}
                        onClick={() => portfolio.toggleFacetFilter(`starred`, option.value)}
                      >
                        <StackPillShape id={`${filterId}-shape`} />
                        <Star size={13} aria-hidden={`true`} id={`${filterId}-icon`} fill={option.value === `true` ? `currentColor` : `none`} className={`portfolio-star-filter-icon`} />
                        <span id={`${filterId}-count`} className={`portfolio-summary-value`}>{option.count}</span>
                      </button>
                    );
                  })}
                </div>}
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
                      id={`portfolio-heading-registrar-total-${registrarId}`}
                      data-active={portfolio.registrarFilters.includes(registrar)}
                      className={`portfolio-summary-item portfolio-registrar-total portfolio-heading-filter portfolio-registrar-pill${connection ? ` portfolio-registrar-pill-connected` : ``}`}
                    >
                      <StackPillShape id={`portfolio-heading-registrar-shape-${registrarId}`} />
                      <button
                        type={`button`}
                        disabled={portfolio.loading}
                        id={`portfolio-heading-registrar-filter-${registrarId}`}
                        className={`portfolio-summary-item portfolio-summary-filter portfolio-registrar-filter-toggle`}
                        aria-pressed={portfolio.registrarFilters.includes(registrar)}
                        onClick={() => portfolio.toggleRegistrarFilter(registrar)}
                      >
                        <span id={`portfolio-heading-registrar-label-${registrarId}`} className={`portfolio-registrar-label`}>
                          {`${registrar}:`}
                        </span>
                        <span id={`portfolio-heading-registrar-count-${registrarId}`} className={`portfolio-summary-value`}>
                          {count}
                        </span>
                      </button>
                      {connection && (
                        <button
                          type={`button`}
                          aria-label={syncLabel}
                          aria-busy={syncingRegistrar || undefined}
                          id={`portfolio-heading-registrar-sync-${registrarId}`}
                          className={`portfolio-registrar-sync`}
                          disabled={manualSyncBlocked || !portfolio.canSyncManually}
                          title={portfolio.manualSyncWaitSeconds ? portfolio.manualSyncMessage : syncLabel}
                          aria-describedby={portfolio.manualSyncMessage ? `portfolio-manual-sync-message` : undefined}
                          onClick={() => void portfolio.syncRegistrarDomains(connection.provider)}
                        >
                          <RefreshCw
                            size={13}
                            aria-hidden={`true`}
                            id={`portfolio-heading-registrar-sync-icon-${registrarId}`}
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
                  id={`portfolio-heading-attention`}
                  aria-pressed={portfolio.attentionOnly}
                  onClick={portfolio.toggleAttentionFilter}
                  title={portfolio.loading ? `Needs Attention` : `Needs Attention: ${portfolio.summary.attention} Domain(s)`}
                  aria-label={portfolio.loading ? `Needs Attention, Loading Domain Count` : `Needs Attention, ${portfolio.summary.attention} Domain(s)`}
                  className={`portfolio-summary-item portfolio-summary-filter portfolio-heading-filter${portfolio.summary.attention ? ` portfolio-summary-attention` : ``}`}
                >
                  <StackPillShape id={`portfolio-heading-attention-shape`} />
                  <TriangleAlert size={13} aria-hidden={`true`} id={`portfolio-heading-attention-icon`} className={`portfolio-attention-icon`} />
                  <span id={`portfolio-heading-attention-label`} className={`portfolio-summary-value portfolio-attention-label`}>
                    {portfolio.loading ? <span aria-hidden={`true`} id={`portfolio-heading-attention-skeleton`} className={`portfolio-value-skeleton portfolio-value-skeleton-count`} /> : portfolio.summary.attention}
                  </span>
                </button>
                {showAnnualSpend && (
                  <>
                    <span id={`portfolio-heading-summary-separator-two`} className={`portfolio-summary-separator portfolio-heading-filter`} aria-hidden={`true`}>
                      {`·`}
                    </span>
                    <span id={`portfolio-heading-annual-spend`} className={`portfolio-summary-item`}>
                      {portfolio.loading ? <><span aria-hidden={`true`} id={`portfolio-heading-annual-spend-skeleton`} className={`portfolio-value-skeleton portfolio-value-skeleton-spend`} />{` / year`}</> : `${formatCurrency(portfolio.summary.annualCost)} / year`}
                    </span>
                    {showMonthlySpend && (
                      <>
                        <span id={`portfolio-heading-summary-separator-monthly`} className={`portfolio-summary-separator`} aria-hidden={`true`}>
                          {`·`}
                        </span>
                        <span id={`portfolio-heading-monthly-spend`} className={`portfolio-summary-item`}>
                          {portfolio.loading ? <><span aria-hidden={`true`} id={`portfolio-heading-monthly-spend-skeleton`} className={`portfolio-value-skeleton portfolio-value-skeleton-spend`} />{` / month`}</> : `${formatCurrency(portfolio.summary.annualCost / 12)} / month`}
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>}
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
          {((!portfolio.loading && selection.selectedIds.size > 0) || (useSampleData && portfolio.summary.hasSampleData)) && (
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
            </div>
          )}
          <form
            role={`search`}
            id={`portfolio-search-row`}
            className={`portfolio-search-row`}
            aria-label={`Search Domains`}
            onSubmit={event => {
              event.preventDefault();
              if (portfolio.loading || emptyPortfolio) return;
              portfolio.setQuery(searchInputRef.current?.value ?? portfolio.query);
              searchInputRef.current?.focus({ preventScroll: true });
            }}
          >
            <div id={`portfolio-search-tools`} className={`portfolio-search-tools`}>
              <button
                type={`button`}
                id={`portfolio-eyebrow`}
                disabled={portfolio.loading || emptyPortfolio}
                className={`portfolio-search-count`}
                title={`Clear All Domain Filters`}
                aria-pressed={activeFilterCount === 0}
                aria-label={`Show All ${portfolio.summary.count} Domains`}
                onClick={() => { portfolio.clearSummaryFilters(); portfolio.setQuery(``); }}
              >
                <span id={`portfolio-domain-count`} className={`portfolio-summary-value`}>
                  {portfolio.loading ? <span aria-hidden={`true`} id={`portfolio-domain-count-skeleton`} className={`portfolio-value-skeleton portfolio-value-skeleton-count`} /> : portfolio.summary.count}
                </span>
                <span id={`portfolio-search-count-label`} className={`portfolio-search-count-label`}>{`Domains`}</span>
              </button>
              <div id={`portfolio-search-wrap`} className={`portfolio-search-wrap`} data-disabled={portfolio.loading || emptyPortfolio}>
                <label id={`portfolio-search-label`} className={`portfolio-sr-only`} htmlFor={`portfolio-search`}>
                  {emptyPortfolio ? `Add Domains To Search` : `Search Domain Names, Titles, Or Descriptions`}
                </label>
                <Search size={16} aria-hidden={`true`} id={`portfolio-search-icon`} className={`portfolio-search-icon`} />
                <input
                  type={`search`}
                  id={`portfolio-search`}
                  ref={searchInputRef}
                  autoComplete={`off`}
                  value={emptyPortfolio ? `` : portfolio.query}
                  className={`portfolio-search`}
                  disabled={portfolio.loading || emptyPortfolio}
                  placeholder={emptyPortfolio ? `Add domains to search` : `Search`}
                  onChange={event => portfolio.setQuery(event.target.value)}
                />
                {!emptyPortfolio && Boolean(portfolio.query) && (
                  <button
                    type={`button`}
                    title={`Clear Search`}
                    aria-label={`Clear Search`}
                    id={`portfolio-search-clear`}
                    className={`portfolio-button portfolio-button-quiet portfolio-search-clear`}
                    onClick={() => { portfolio.setQuery(``); searchInputRef.current?.focus({ preventScroll: true }); }}
                  >
                    <X size={15} aria-hidden={`true`} id={`portfolio-search-clear-icon`} className={`portfolio-button-icon`} />
                  </button>
                )}
              </div>
            </div>
            {!emptyPortfolio && <div id={`portfolio-toolbar-actions`} className={`portfolio-toolbar-actions`}>
              <div
                role={`group`}
                aria-label={`Domain Actions`}
                aria-hidden={!toolbar.showCompactActions}
                id={`portfolio-toolbar-domain-actions`}
                data-visible={toolbar.showCompactActions}
                className={`portfolio-toolbar-domain-actions`}
                data-has-sync={Boolean(user && portfolio.canSyncManually)}
              >
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
              <button
                type={`button`}
                aria-haspopup={`dialog`}
                disabled={portfolio.loading}
                id={`portfolio-filters-button`}
                aria-expanded={toolbar.filtersOpen}
                aria-controls={`portfolio-filters-dialog`}
                title={`Advanced Filters: ${filterDescription}`}
                onClick={toolbar.openFilters}
                aria-label={`Advanced Filters, ${activeFilterCount} Active Filter(s), ${filterDescription}`}
                className={`portfolio-button portfolio-button-secondary portfolio-filters-button${toolbar.filtersOpen || activeFilterCount ? ` portfolio-filters-button-active` : ``}`}
              >
                <Filter size={16} aria-hidden={`true`} id={`portfolio-filters-icon`} className={`portfolio-button-icon`} />
                <span aria-hidden={`true`} id={`portfolio-filters-badge`} className={`portfolio-filters-badge`}>
                  {activeFilterCount}
                </span>
              </button>
              <div id={`portfolio-table-controls`} className={`portfolio-table-controls`}>
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
                <button
                  type={`button`}
                  title={groupExpansionLabel}
                  aria-label={groupExpansionLabel}
                  id={`portfolio-groups-expansion-toggle`}
                  aria-pressed={allGroupsCollapsed}
                  disabled={portfolio.loading || preferences.loading || !groupKeys.length}
                  onClick={() => preferences.setGroupsCollapsed(groupKeys, !allGroupsCollapsed)}
                  className={`portfolio-button portfolio-button-secondary portfolio-toolbar-icon-button${allGroupsCollapsed ? ` portfolio-toolbar-icon-button-active` : ``}`}
                >
                  <GroupExpansionIcon
                    size={16}
                    aria-hidden={`true`}
                    className={`portfolio-button-icon`}
                    id={`portfolio-groups-expansion-toggle-icon`}
                  />
                </button>
              </div>
            </div>}
          </form>
          <p
            aria-atomic={`true`}
            id={`portfolio-copy-status`}
            role={toolbar.copyError && !toolbar.copyOpen ? `alert` : `status`}
            className={toolbar.copyError && !toolbar.copyOpen ? `portfolio-copy-error` : `portfolio-sr-only`}
          >
            {toolbar.copyOpen ? `` : toolbar.copyMessage}
          </p>
        </div>
        {(!mobile || showMainRecords || portfolio.loading) && <PortfolioRecords
          {...recordProps}
          sticky={sticky}
          compact={compact}
          mobileBoard={mobile}
          showAddCollection={!mobile}
          showMainRecords={showMainRecords}
          domains={sections.mainDomains}
          sortField={portfolio.sortField}
          sortDirection={portfolio.sortDirection}
          {...selectionFor(mobile ? mainVisibleIds : visibleIds)}
          collectionSections={mobile ? [] : sections.collections}
          showDatabaseHeading={mobile && sections.collections.length > 0}
          onSort={mobile ? portfolio.changeSort : changeSort}
          searchGroups={showingFilteredRecords ? mainGroups : undefined}
          onToggleCollectionSearch={search.toggleCollection}
          isCollectionShowingAll={id => search.showAllCollections.has(id)}
          isGroupShowingAll={(key, collectionId) => search.isGroupShowingAll(collectionId, key)}
          onToggleGroupSearch={(key, collectionId) => search.toggleGroup(collectionId, key)}
        />}
        {mobile && <MobilePortfolioBoard
          {...recordProps}
          compact={compact}
          sections={sections}
          surfaceRef={mobileBoardRef}
          mainSortField={portfolio.sortField}
          mainSortDirection={portfolio.sortDirection}
          onManualOrder={() => { if (portfolio.sortField) portfolio.toggleManualOrder(); }}
        />}
        <div id={`portfolio-card-footer`} className={`portfolio-card-footer`}>
          <span id={`portfolio-visible-count`} className={`portfolio-visible-count`} title={portfolio.loading ? undefined : footerSummary} aria-label={portfolio.loading ? undefined : footerSummary}>
            {portfolio.loading ? <span aria-hidden={`true`} id={`portfolio-visible-count-skeleton`} className={`portfolio-value-skeleton portfolio-value-skeleton-footer`} /> : mobile ? `${visibleIds.length} / ${footerTotal} Domains` : footerSummary}
          </span>
          <button type={`button`} disabled={portfolio.loading} onClick={portfolio.openSetup} aria-label={`Connect Registrar`} id={`portfolio-connect-registrar`} className={`portfolio-button portfolio-button-quiet`}>
            <Link2 size={13} aria-hidden={`true`} id={`portfolio-connect-registrar-icon`} className={`portfolio-button-icon`} />
            <span id={`portfolio-connect-registrar-text`} className={`portfolio-button-text`}>{mobile ? `Connect` : `Connect Registrar`}</span>
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
          domains={portfolio.domains}
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
      {toolbar.filtersOpen && (
        <PortfolioFilters portfolio={portfolio} onClose={toolbar.closeFilters} matchingItemCount={matchingItemCount} />
      )}
      {toolbar.copyOpen && (
        <PortfolioCopyOptions
          allowEmptyTree
          busy={toolbar.copying}
          onCopy={copyDomains}
          count={includedCopyIds.length}
          allowEmptyJson={includedCopyTreeAvailable}
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
