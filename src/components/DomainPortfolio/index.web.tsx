import './styles.scss';
import Connections from '../Connections';
import DomainEditor from '../DomainEditor';
import { REGISTRARS } from '../../shared/config';
import { formatCurrency } from '../../shared/domainUtils';
import DomainRow, { DomainRowSkeleton } from '../DomainRow';
import { usePortfolio, type SortField } from './usePortfolio';
import { X, Plus, Search, Link2, Upload, Download, Trash2, ArrowUp, ArrowDown, ArrowRight, ArrowUpDown, ChevronDown, FlaskConical, ShieldCheck, RotateCcw } from 'lucide-react';

const columns: { field: SortField; label: string }[] = [
  { field: `name`, label: `Domain` },
  { field: `registrar`, label: `Registrar` },
  { field: `expiresAt`, label: `Renewal date` },
  { field: `autoRenew`, label: `Auto-renew` },
  { field: `renewalPrice`, label: `Annual cost` },
];

const DomainPortfolio = ({ compact = false }: { compact?: boolean }) => {
  const portfolio = usePortfolio();
  const visibleDomains = compact ? portfolio.filteredDomains.slice(0, 4) : portfolio.filteredDomains;
  const displayedError = portfolio.localError || portfolio.error;
  const hasFilters = Boolean(portfolio.query || portfolio.registrarFilter !== `All Registrars`);
  return (
    <section id={`domain-portfolio`} className={`domain-portfolio`} aria-labelledby={`portfolio-title`}>
      <div id={`portfolio-heading-row`} className={`portfolio-heading-row`}>
        <div id={`portfolio-heading`} className={`portfolio-heading`}>
          <h2 id={`portfolio-title`} className={`portfolio-title`}>
            {`Your domain portfolio`}
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
            <span id={`portfolio-summary-separator-two`} className={`portfolio-summary-separator`} aria-hidden={`true`}>
              {`·`}
            </span>
            <span id={`portfolio-annual-spend`} className={`portfolio-summary-item`}>
              {`${formatCurrency(portfolio.summary.annualCost)} / year`}
            </span>
          </div>
        </div>
        <div id={`portfolio-primary-actions`} className={`portfolio-primary-actions`}>
          <button
            type={`button`}
            id={`portfolio-connections`}
            className={`portfolio-button portfolio-button-secondary`}
            onClick={() => portfolio.setConnectionsOpen(true)}
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
            onClick={() => portfolio.openEditor()}
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
        <div id={`portfolio-toolbar`} className={`portfolio-toolbar`}>
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
            {portfolio.summary.hasSampleData && (
              <span id={`portfolio-sample-label`} className={`portfolio-sample-label`} title={`Illustrative Records, Not Connected Accounts`}>
                <FlaskConical size={12} aria-hidden={`true`} id={`portfolio-sample-icon`} className={`portfolio-sample-icon`} />
                <span id={`portfolio-sample-text`} className={`portfolio-sample-text`}>
                  {`Sample Data`}
                </span>
              </span>
            )}
          </div>
        </div>
        <div id={`portfolio-table-scroll`} className={`portfolio-table-scroll`}>
          <table id={`portfolio-table`} className={`portfolio-table`} aria-busy={portfolio.loading}>
            <caption id={`portfolio-table-caption`} className={`portfolio-sr-only`}>
              {`Your saved domain records. Renewal costs are recorded in US dollars. Auto-renew settings are a record only and don't change registrar settings.`}
            </caption>
            <thead id={`portfolio-table-head`} className={`portfolio-table-head`}>
              <tr id={`portfolio-table-heading-row`} className={`portfolio-table-heading-row`}>
                {columns.map(column => (
                  <th
                    scope={`col`}
                    key={column.field}
                    id={`portfolio-heading-${column.field}`}
                    className={`portfolio-table-heading portfolio-table-heading-${column.field}`}
                    aria-sort={portfolio.sortField === column.field ? portfolio.sortDirection === `asc` ? `ascending` : `descending` : `none`}
                  >
                    <button
                      type={`button`}
                      id={`portfolio-sort-${column.field}`}
                      className={`portfolio-sort-button`}
                      onClick={() => portfolio.changeSort(column.field)}
                      aria-label={`Sort By ${column.label}`}
                    >
                      <span id={`portfolio-sort-label-${column.field}`} className={`portfolio-sort-label`}>
                        {column.label}
                      </span>
                      {portfolio.sortField === column.field
                        ? portfolio.sortDirection === `asc`
                          ? <ArrowUp size={11} aria-hidden={`true`} id={`portfolio-sort-icon-${column.field}`} className={`portfolio-sort-icon portfolio-sort-icon-active`} />
                          : <ArrowDown size={11} aria-hidden={`true`} id={`portfolio-sort-icon-${column.field}`} className={`portfolio-sort-icon portfolio-sort-icon-active`} />
                        : <ArrowUpDown size={11} aria-hidden={`true`} id={`portfolio-sort-icon-${column.field}`} className={`portfolio-sort-icon`} />}
                    </button>
                  </th>
                ))}
                <th scope={`col`} id={`portfolio-heading-actions`} className={`portfolio-table-heading portfolio-table-heading-actions`}>
                  <span id={`portfolio-actions-label`} className={`portfolio-sr-only`}>
                    {`Actions`}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody id={`portfolio-table-body`} className={`portfolio-table-body`}>
              {portfolio.loading ? [0, 1, 2, 3].map(index => <DomainRowSkeleton key={index} index={index} />) : visibleDomains.map(domain => (
                <DomainRow
                  key={domain.id}
                  domain={domain}
                  busy={Boolean(portfolio.pendingId)}
                  onEdit={portfolio.openEditor}
                  onDelete={portfolio.requestDelete}
                  onToggleAutoRenew={portfolio.toggleAutoRenew}
                />
              ))}
              {!portfolio.loading && !visibleDomains.length && (
                <tr id={`portfolio-empty-row`} className={`portfolio-empty-row`}>
                  <td colSpan={6} id={`portfolio-empty-cell`} className={`portfolio-empty-cell`}>
                    <div id={`portfolio-empty-content`} className={`portfolio-empty-content`}>
                      <Search size={23} strokeWidth={1.4} aria-hidden={`true`} id={`portfolio-empty-icon`} className={`portfolio-empty-icon`} />
                      <h3 id={`portfolio-empty-title`} className={`portfolio-empty-title`}>
                        {hasFilters ? `No domains found` : `A place for your next idea`}
                      </h3>
                      <p id={`portfolio-empty-description`} className={`portfolio-empty-description`}>
                        {hasFilters ? `Try another name or a different registrar.` : `Add your first domain, or import a CSV to get started.`}
                      </p>
                      <button
                        type={`button`}
                        id={`portfolio-empty-action`}
                        className={`portfolio-button portfolio-button-secondary`}
                        onClick={() => {
                          if (!hasFilters) portfolio.openEditor();
                          else { portfolio.setQuery(``); portfolio.setRegistrarFilter(`All Registrars`); }
                        }}
                      >
                        {hasFilters
                          ? <RotateCcw size={14} aria-hidden={`true`} id={`portfolio-empty-action-icon`} className={`portfolio-button-icon`} />
                          : <Plus size={14} aria-hidden={`true`} id={`portfolio-empty-action-icon`} className={`portfolio-button-icon`} />}
                        <span id={`portfolio-empty-action-text`} className={`portfolio-button-text`}>
                          {hasFilters ? `Clear Filters` : `Add Domain`}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
              {`Showing ${visibleDomains.length} Of ${portfolio.filteredDomains.length}`}
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
              disabled={portfolio.loading || !portfolio.domains.length}
              className={`portfolio-button portfolio-button-quiet`}
            >
              <Download size={13} aria-hidden={`true`} id={`portfolio-export-icon`} className={`portfolio-button-icon`} />
              <span id={`portfolio-export-text`} className={`portfolio-button-text`}>
                {`Export CSV`}
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
      {portfolio.connectionsOpen && (
        <Connections
          onImport={portfolio.requestImport}
          onDownloadTemplate={portfolio.downloadTemplate}
          onClose={() => portfolio.setConnectionsOpen(false)}
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
