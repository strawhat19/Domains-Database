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
import { formatCurrency } from '../../shared/domainUtils';
import { useAuth } from '../../shared/authContext/useAuth';
import PortfolioRecords from '../PortfolioRecords/index.web';
import { useCollectionReorder } from './useCollectionReorder';
import { REGISTRARS, useSampleData, PORTFOLIO_PREVIEW_LIMIT } from '../../shared/config';
import PortfolioSelection from '../PortfolioSelection/index.web';
import { useColumns } from '../../shared/columnContext/useColumns';
import PortfolioCollection from '../PortfolioCollection/index.web';
import { buildPortfolioSections } from '../../shared/portfolioPreferences/groups';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { getOrderedPortfolioColumns, getPortfolioColumnCounts, getPortfolioColumnValue } from '../../shared/portfolioColumns';
import { X, Plus, Search, Link2, Trash2, ArrowRight, ChevronDown, FlaskConical, LayoutGrid, List, ArrowDownAZ, GripVertical, Gauge, RefreshCw, Columns3 } from 'lucide-react';

const DomainPortfolio = ({ compact = false }: { compact?: boolean }) => {
  const portfolio = usePortfolio();
  const portfolioRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { visibleColumns, columnWidths, toggleColumn, resetColumns, setColumnWidths } = useColumns();
  const preferences = usePortfolioPreferences();
  const sections = useMemo(() => buildPortfolioSections(portfolio.filteredDomains, preferences), [portfolio.filteredDomains, preferences]);
  const mainGroups = useMemo(() => portfolio.sortField
    ? buildPortfolioSections(portfolio.filteredDomains, { ...preferences, orders: {} }).mainGroups
    : sections.mainGroups, [portfolio.filteredDomains, portfolio.sortField, preferences, sections.mainGroups]);
  const tableVisible = preferences.view === `table` || (!portfolio.loading && !sections.mainDomains.length);
  const sticky = useStickyPortfolio(`${preferences.view}|${tableVisible}|${visibleColumns.join(`|`)}`);
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
  const collectionReorder = useCollectionReorder(!portfolio.loading && !portfolio.pendingId);
  const mainHandlers = collectionReorder.handlers(null);
  const ViewIcon = preferences.view === `table` ? LayoutGrid : List;
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
  const hasFilters = portfolio.domains.length > 0 && Boolean(portfolio.query || portfolio.registrarFilter !== `All Registrars`);
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
    onSelect: selection.select,
    onEdit: portfolio.openEditor,
    loading: portfolio.loading,
    onDelete: portfolio.requestDelete,
    allDomains: portfolio.sortedDomains,
    selectedIds: selection.selectedIds,
    onGrouped: selection.clearSelection,
    busy: Boolean(portfolio.pendingId),
    onToggleAutoRenew: portfolio.toggleAutoRenew,
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
          <div id={`portfolio-search-wrap`} className={`portfolio-search-wrap`}>
            <label id={`portfolio-search-label`} className={`portfolio-sr-only`} htmlFor={`portfolio-search`}>
              {`Search Domains, Owners, Or Registrars`}
            </label>
            <Search size={16} aria-hidden={`true`} id={`portfolio-search-icon`} className={`portfolio-search-icon`} />
            <input
              type={`search`}
              id={`portfolio-search`}
              autoComplete={`off`}
              value={portfolio.query}
              className={`portfolio-search`}
              placeholder={`Find a domain…`}
              onChange={event => portfolio.setQuery(event.target.value)}
            />
          </div>
          <div id={`portfolio-registrar-controls`} className={`portfolio-registrar-controls`}>
            <div id={`portfolio-registrar-filter-wrap`} className={`portfolio-registrar-filter-wrap`}>
              <label id={`portfolio-registrar-filter-label`} className={`portfolio-sr-only`} htmlFor={`portfolio-registrar-filter`}>
                {`Filter By Registrar`}
              </label>
              <select
                id={`portfolio-registrar-filter`}
                className={`portfolio-registrar-filter`}
                value={portfolio.registrarFilter}
                onChange={event => portfolio.setRegistrarFilter(event.target.value)}
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
              <ChevronDown size={13} aria-hidden={`true`} id={`portfolio-registrar-filter-icon`} className={`portfolio-registrar-filter-icon`} />
            </div>
            <PortfolioSelection
              totalCount={portfolio.domains.length}
              count={selection.selectedIds.size}
              visibleCount={selection.visibleSelectedCount}
            />
          </div>
          <div id={`portfolio-toolbar-meta`} className={`portfolio-toolbar-meta`}>
            {useSampleData && portfolio.summary.hasSampleData && (
              <span id={`portfolio-sample-label`} className={`portfolio-sample-label`} title={`Illustrative Records, Not Connected Accounts`}>
                <FlaskConical size={12} aria-hidden={`true`} id={`portfolio-sample-icon`} className={`portfolio-sample-icon`} />
                <span id={`portfolio-sample-text`} className={`portfolio-sample-text`}>
                  {`Sample Data`}
                </span>
              </span>
            )}
          </div>
          <ColumnControls
            onReset={resetColumns}
            onToggle={toggleColumn}
            columnCounts={columnCounts}
            visibleColumns={visibleColumns}
          />
          <button
            type={`button`}
            id={`portfolio-view-toggle`}
            className={`portfolio-button portfolio-button-secondary portfolio-view-toggle`}
            title={preferences.view === `table` ? `Switch to cards` : `Switch to table`}
            aria-label={preferences.view === `table` ? `Switch to cards` : `Switch to table`}
            aria-pressed={preferences.view === `grid`}
            onClick={() => preferences.setView(preferences.view === `table` ? `grid` : `table`)}
          >
            <ViewIcon size={16} aria-hidden={`true`} id={`portfolio-view-toggle-icon`} className={`portfolio-button-icon`} />
          </button>
          <GroupControls domains={portfolio.domains} />
          <button
            type={`button`}
            id={`portfolio-manual-order`}
            aria-pressed={!portfolio.sortField}
            onClick={portfolio.toggleManualOrder}
            className={`portfolio-button portfolio-button-secondary`}
            title={portfolio.sortField ? `Clear column sorting to reorder domains manually` : `Return to alphabetical sorting`}
          >
            {portfolio.sortField ? (
              <GripVertical size={15} aria-hidden={`true`} id={`portfolio-manual-order-icon`} className={`portfolio-button-icon`} />
            ) : (
              <ArrowDownAZ size={15} aria-hidden={`true`} id={`portfolio-manual-order-icon`} className={`portfolio-button-icon`} />
            )}
            <span id={`portfolio-manual-order-text`} className={`portfolio-button-text`}>
              {portfolio.sortField ? `Manual order` : `Sort A–Z`}
            </span>
          </button>
          <button
            type={`button`}
            id={`portfolio-fit-columns`}
            disabled={portfolio.loading}
            title={`Fit Each Column To Its Longest Value`}
            className={`portfolio-button portfolio-button-secondary`}
            onClick={() => setColumnWidths({ ...columnWidths, ...fitPortfolioColumns(portfolio.domains, columns, portfolioRef.current) })}
          >
            <Columns3 size={15} aria-hidden={`true`} id={`portfolio-fit-columns-icon`} className={`portfolio-button-icon`} />
            <span id={`portfolio-fit-columns-text`} className={`portfolio-button-text`}>{`Fit Columns`}</span>
          </button>
        </div>
        {sections.collections.map(section => (
          <PortfolioCollection
            {...recordProps}
            compact={compact}
            key={section.collection.id}
            domains={section.domains}
            collection={section.collection}
            {...collectionReorder.moves(section.collection.id)}
            {...collectionReorder.handlers(section.collection.id)}
            globalToolbarHeight={sticky.header.toolbarHeight}
            {...selectionFor(collectionVisibleIds.get(section.collection.id) ?? [])}
          />
        ))}
        {sections.collections.length > 0 && (
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
          sortDirection={portfolio.sortDirection}
          onSort={portfolio.changeSort}
        />
        <div id={`portfolio-card-footer`} className={`portfolio-card-footer`}>
          <span id={`portfolio-visible-count`} className={`portfolio-visible-count`}>
            {`Showing ${visibleIds.length} Of ${portfolio.filteredDomains.length}`}
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
