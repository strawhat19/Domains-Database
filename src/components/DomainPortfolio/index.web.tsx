import './styles.scss';
import { useMemo } from 'react';
import ColumnControls from '../ColumnControls';
import DomainEditor from '../DomainEditor';
import RegistrarSetup from '../RegistrarSetup/index.web';
import { PORTFOLIO_COLUMNS, getPortfolioColumnCounts } from '../../shared/portfolioColumns';
import { useColumns } from '../../shared/columnContext/useColumns';
import { REGISTRARS, useSampleData } from '../../shared/config';
import { formatCurrency } from '../../shared/domainUtils';
import GroupControls from '../GroupControls/index.web';
import PortfolioRecords from '../PortfolioRecords/index.web';
import PortfolioSelection from '../PortfolioSelection/index.web';
import { usePortfolio } from './usePortfolio';
import { useDomainSelection } from './useDomainSelection';
import { buildPortfolioGroups } from '../../shared/portfolioPreferences/groups';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { useStickyPortfolio } from './useStickyPortfolio';
import { X, Plus, Search, Link2, Upload, Download, Trash2, ArrowRight, ChevronDown, FlaskConical, ShieldCheck, LayoutGrid, List, ArrowDownAZ, GripVertical } from 'lucide-react';

const DomainPortfolio = ({ compact = false }: { compact?: boolean }) => {
  const portfolio = usePortfolio();
  const { visibleColumns, toggleColumn, resetColumns } = useColumns();
  const preferences = usePortfolioPreferences();
  const sticky = useStickyPortfolio(`${preferences.view}|${visibleColumns.join(`|`)}`);
  const columns = PORTFOLIO_COLUMNS.filter(column => visibleColumns.includes(column.field));
  const columnCounts = useMemo(() => getPortfolioColumnCounts(portfolio.domains), [portfolio.domains]);
  const showAnnualSpend = columns.some(column => column.price);
  const showMonthlySpend = visibleColumns.includes(`monthlyCost`);
  const visibleIds = useMemo(() => {
    const ordered = buildPortfolioGroups(portfolio.filteredDomains, portfolio.sortField
      ? { ...preferences, orders: {} }
      : preferences).flatMap(group => group.domains);
    return (compact ? ordered.slice(0, 4) : ordered).map(domain => domain.id);
  }, [portfolio.filteredDomains, preferences, compact, portfolio.sortField]);
  const selection = useDomainSelection(portfolio.domains, visibleIds);
  const ViewIcon = preferences.view === `table` ? LayoutGrid : List;
  const displayedError = portfolio.localError || portfolio.error;
  const hasFilters = portfolio.domains.length > 0 && Boolean(portfolio.query || portfolio.registrarFilter !== `All Registrars`);
  return (
    <section
      id={`domain-portfolio`}
      aria-labelledby={`portfolio-title`}
      className={`domain-portfolio${compact ? `` : ` domain-portfolio-full`}`}
    >
      <div id={`portfolio-heading-row`} className={`portfolio-heading-row`}>
        <div id={`portfolio-heading`} className={`portfolio-heading`}>
          <span id={`portfolio-eyebrow`} className={`portfolio-eyebrow`}>
            {`THE REGISTRY`}
          </span>
          <h2 id={`portfolio-title`} className={`portfolio-title`}>
            {`Domain portfolio`}
          </h2>
          <div id={`portfolio-summary`} className={`portfolio-summary`}>
            <span id={`portfolio-domain-total`} className={`portfolio-summary-item`}>
              <span id={`portfolio-domain-count`} className={`portfolio-summary-value`}>
                {portfolio.loading ? `—` : portfolio.summary.count}
              </span>
              {` ${portfolio.summary.count === 1 ? `domain` : `domains`}`}
            </span>
            <span id={`portfolio-summary-separator-one`} className={`portfolio-summary-separator`} aria-hidden={`true`}>
              {`·`}
            </span>
            <span id={`portfolio-attention`} className={`portfolio-summary-item ${portfolio.summary.attention ? `portfolio-summary-attention` : ``}`}>
              <span id={`portfolio-attention-dot`} className={`portfolio-attention-dot`} aria-hidden={`true`} />
              {`${portfolio.summary.attention} need attention`}
            </span>
            {showAnnualSpend && (
              <>
                <span id={`portfolio-summary-separator-two`} className={`portfolio-summary-separator`} aria-hidden={`true`}>
                  {`·`}
                </span>
                <span id={`portfolio-annual-spend`} className={`portfolio-summary-item`}>
                  {`${formatCurrency(portfolio.summary.annualCost)} / year`}
                </span>
                {showMonthlySpend && (
                  <>
                    <span id={`portfolio-summary-separator-monthly`} className={`portfolio-summary-separator`} aria-hidden={`true`}>
                      {`·`}
                    </span>
                    <span id={`portfolio-monthly-spend`} className={`portfolio-summary-item`}>
                      {`${formatCurrency(portfolio.summary.annualCost / 12)} / month`}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <div id={`portfolio-primary-actions`} className={`portfolio-primary-actions`}>
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
          </button>
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
      {displayedError && (
        <div role={`alert`} id={`portfolio-error`} className={`portfolio-message portfolio-message-error`}>
          <p id={`portfolio-error-text`} className={`portfolio-message-text`}>
            {displayedError}
          </p>
          {portfolio.localError && (
            <button type={`button`} id={`portfolio-error-dismiss`} className={`portfolio-message-dismiss`} onClick={portfolio.clearError} aria-label={`Dismiss Error`}>
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
          <PortfolioSelection
            total={visibleIds.length}
            allSelected={selection.allSelected}
            count={selection.visibleSelectedCount}
            disabled={portfolio.loading}
            onSelectAll={selection.selectAll}
          />
        </div>
        <div id={`portfolio-scroll-hint`} className={`portfolio-scroll-hint${preferences.view === `grid` ? ` portfolio-scroll-hint-hidden` : ``}`}>
          <span id={`portfolio-scroll-hint-text`} className={`portfolio-scroll-hint-text`}>
            {`Scroll to see all columns`}
          </span>
          <ArrowRight size={13} aria-hidden={`true`} id={`portfolio-scroll-hint-icon`} className={`portfolio-scroll-hint-icon`} />
        </div>
        <PortfolioRecords
          sticky={sticky}
          compact={compact}
          loading={portfolio.loading}
          hasFilters={hasFilters}
          onEdit={portfolio.openEditor}
          onDelete={portfolio.requestDelete}
          domains={portfolio.filteredDomains}
          allDomains={portfolio.sortedDomains}
          sortField={portfolio.sortField}
          selectedIds={selection.selectedIds}
          allSelected={selection.allSelected}
          someSelected={selection.someSelected}
          onSelect={selection.select}
          onSelectAll={selection.selectAll}
          visibleColumns={visibleColumns}
          sortDirection={portfolio.sortDirection}
          busy={Boolean(portfolio.pendingId)}
          onToggleAutoRenew={portfolio.toggleAutoRenew}
          onSort={portfolio.changeSort}
          onEmptyAction={() => {
            if (!hasFilters) portfolio.openSetup();
            else { portfolio.setQuery(``); portfolio.setRegistrarFilter(`All Registrars`); }
          }}
        />
        <div id={`portfolio-card-footer`} className={`portfolio-card-footer`}>
          <div id={`portfolio-storage-meta`} className={`portfolio-storage-meta`}>
            <ShieldCheck size={13} aria-hidden={`true`} id={`portfolio-storage-icon`} className={`portfolio-storage-icon`} />
            <span id={`portfolio-storage-text`} className={`portfolio-storage-text`}>
              {`Saved On This Device`}
            </span>
            <span id={`portfolio-count-separator`} className={`portfolio-count-separator`} aria-hidden={`true`}>
              {`·`}
            </span>
            <span id={`portfolio-visible-count`} className={`portfolio-visible-count`}>
              {`Showing ${visibleIds.length} Of ${portfolio.filteredDomains.length}`}
            </span>
          </div>
          <div id={`portfolio-secondary-actions`} className={`portfolio-secondary-actions`}>
            <button
              type={`button`}
              onClick={portfolio.requestImport}
              id={`portfolio-import-csv`}
              disabled={portfolio.loading || portfolio.importing}
              className={`portfolio-button portfolio-button-quiet`}
            >
              <Upload size={13} aria-hidden={`true`} id={`portfolio-import-icon`} className={`portfolio-button-icon`} />
              <span id={`portfolio-import-text`} className={`portfolio-button-text`}>
                {portfolio.importing ? `Importing…` : `Import CSV`}
              </span>
            </button>
            <button
              type={`button`}
              onClick={portfolio.exportDomains}
              id={`portfolio-export-csv`}
              disabled={portfolio.loading || portfolio.exporting || !portfolio.domains.length}
              className={`portfolio-button portfolio-button-quiet`}
            >
              <Download size={13} aria-hidden={`true`} id={`portfolio-export-icon`} className={`portfolio-button-icon`} />
              <span id={`portfolio-export-text`} className={`portfolio-button-text`}>
                {portfolio.exporting ? `Exporting…` : `Export CSV`}
              </span>
            </button>
          </div>
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
