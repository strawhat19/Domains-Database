import './styles.scss';
import { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useDomainReorder } from './useDomainReorder';
import PortfolioEmptyState from './EmptyState.web';
import type { DomainRecord } from '../../shared/types';
import DomainRow, { DomainRowSkeleton } from '../DomainRow';
import PortfolioTableHead from '../PortfolioTableHead/index.web';
import DomainGridCard, { DomainGridCardSkeleton } from '../DomainGridCard/index.web';
import type { useStickyPortfolio } from '../DomainPortfolio/useStickyPortfolio';
import { buildPortfolioGroups } from '../../shared/portfolioPreferences/groups';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { PORTFOLIO_COLUMNS, type PortfolioColumn } from '../../shared/portfolioColumns';

interface PortfolioRecordsProps {
  busy: boolean;
  loading: boolean;
  compact: boolean;
  hasFilters: boolean;
  domains: DomainRecord[];
  allDomains: DomainRecord[];
  sortField: PortfolioColumn | null;
  visibleColumns: PortfolioColumn[];
  sortDirection: `asc` | `desc`;
  allSelected: boolean;
  someSelected: boolean;
  selectedIds: Set<string>;
  sticky: ReturnType<typeof useStickyPortfolio>;
  onEmptyAction: () => void;
  onSelectAll: (checked: boolean) => void;
  onSelect: (id: string, checked: boolean) => void;
  onSort: (field: PortfolioColumn) => void;
  onEdit: (domain: DomainRecord) => void;
  onDelete: (domain: DomainRecord) => void;
  onToggleAutoRenew: (domain: DomainRecord) => void;
}

const PortfolioRecords = ({
  busy, sticky, compact, loading, domains, allDomains, hasFilters,
  selectedIds, allSelected, someSelected, onSelect, onSelectAll,
  sortField, sortDirection, visibleColumns, onEdit, onSort, onDelete, onEmptyAction, onToggleAutoRenew,
}: PortfolioRecordsProps) => {
  const preferences = usePortfolioPreferences();
  const orderingPreferences = useMemo(() => sortField
    ? { ...preferences, orders: {} }
    : preferences, [preferences, sortField]);
  const columns = PORTFOLIO_COLUMNS.filter(column => visibleColumns.includes(column.field));
  const fullGroups = useMemo(() => buildPortfolioGroups(allDomains, orderingPreferences), [allDomains, orderingPreferences]);
  const groups = useMemo(() => {
    const items = buildPortfolioGroups(domains, orderingPreferences);
    if (!compact) return items;
    const visibleIds = new Set(items.flatMap(group => group.domains).slice(0, 4).map(domain => domain.id));
    return items.map(group => ({ ...group, domains: group.domains.filter(domain => visibleIds.has(domain.id)) }))
      .filter(group => group.domains.length);
  }, [domains, orderingPreferences, compact]);
  const positions = new Map(groups.flatMap(group => group.domains).map((domain, index) => [domain.id, index + 1]));
  const reorder = useDomainReorder(fullGroups, !sortField && !loading && !busy && !compact);
  const tableStyle = { [`--portfolio-table-width`]: `${Math.max(380, columns.length * 140 + 160)}px` } as CSSProperties;
  const grouped = preferences.groupBy !== `none`;
  const empty = !loading && !domains.length;
  const groupHeading = (key: string, label: string, count: number) => (
    <div id={`portfolio-group-${encodeURIComponent(key)}-heading`} className={`portfolio-group-heading`}>
      <span id={`portfolio-group-${encodeURIComponent(key)}-label`} className={`portfolio-group-label`}>
        {label}
      </span>
      <span id={`portfolio-group-${encodeURIComponent(key)}-count`} className={`portfolio-group-count`}>
        {count}
      </span>
      {!sortField && preferences.orders[key]?.length > 0 && (
        <button
          type={`button`}
          title={`Reset group order`}
          aria-label={`Reset order for ${label}`}
          className={`portfolio-group-reset`}
          id={`portfolio-group-${encodeURIComponent(key)}-reset`}
          onClick={() => preferences.resetOrder(key)}
        >
          <RotateCcw size={13} aria-hidden={`true`} id={`portfolio-group-${encodeURIComponent(key)}-reset-icon`} className={`portfolio-group-reset-icon`} />
        </button>
      )}
    </div>
  );

  if (preferences.view === `grid` && !empty) return (
    <div id={`portfolio-grid-view`} className={`portfolio-grid-view`} aria-busy={loading}>
      {loading ? (
        <div id={`portfolio-grid-loading`} className={`portfolio-domain-grid`}>
          {[0, 1, 2, 3].map(index => <DomainGridCardSkeleton key={index} index={index} visibleColumns={visibleColumns} />)}
        </div>
      ) : empty ? <PortfolioEmptyState hasFilters={hasFilters} onAction={onEmptyAction} /> : groups.map(group => (
        <section key={group.key} id={`portfolio-grid-group-${encodeURIComponent(group.key)}`} className={`portfolio-grid-group`}>
          {grouped && groupHeading(group.key, group.label, group.domains.length)}
          <div id={`portfolio-grid-group-${encodeURIComponent(group.key)}-domains`} className={`portfolio-domain-grid`}>
            {group.domains.map(domain => (
              <DomainGridCard
                busy={busy}
                key={domain.id}
                domain={domain}
                onEdit={onEdit}
                onDelete={onDelete}
                onSelect={onSelect}
                selected={selectedIds.has(domain.id)}
                position={positions.get(domain.id) ?? 1}
                visibleColumns={visibleColumns}
                onToggleAutoRenew={onToggleAutoRenew}
                {...reorder.handlers(group.key, domain.id, group.domains.map(item => item.id))}
              />
            ))}
          </div>
          {!group.domains.length && (
            <p id={`portfolio-grid-group-${encodeURIComponent(group.key)}-empty`} className={`portfolio-group-empty`}>
              {`No domains in this group`}
            </p>
          )}
        </section>
      ))}
    </div>
  );

  return (
    <div id={`portfolio-records-table`} className={`portfolio-records-table`}>
      <div
        id={`portfolio-sticky-head`}
        className={`portfolio-sticky-head`}
        style={{ height: sticky.header.headHeight || undefined, top: `calc(var(--site-header-offset, 0px) + ${sticky.header.toolbarHeight}px)` }}
      >
        <div id={`portfolio-sticky-head-clip`} className={`portfolio-sticky-head-clip`}>
          <table
            role={`presentation`}
            ref={sticky.mirrorTableRef}
            id={`portfolio-sticky-table`}
            className={`portfolio-table portfolio-sticky-table`}
            style={{ width: sticky.header.columnWidths.length === columns.length + 3
              ? sticky.header.columnWidths.reduce((total, width) => total + width, 0) : undefined }}
          >
            <PortfolioTableHead
              mirrored
              columns={columns}
              onSort={onSort}
              sortField={sortField}
              idPrefix={`portfolio-sticky`}
              sortDirection={sortDirection}
              columnWidths={sticky.header.columnWidths.length === columns.length + 3 ? sticky.header.columnWidths : undefined}
              allSelected={allSelected}
              someSelected={someSelected}
              onSelectAll={onSelectAll}
            />
          </table>
        </div>
      </div>
      <div ref={sticky.scrollRef} id={`portfolio-table-scroll`} className={`portfolio-table-scroll`} style={{ marginTop: -sticky.header.headHeight }}>
        <table ref={sticky.tableRef} style={tableStyle} id={`portfolio-table`} className={`portfolio-table`} aria-busy={loading}>
          <caption id={`portfolio-table-caption`} className={`portfolio-sr-only`}>
            {`Your saved domain records. Monthly costs are annual costs divided by twelve. Auto-renew settings are a record only.`}
          </caption>
          <PortfolioTableHead
            columns={columns}
            onSort={onSort}
            sortField={sortField}
            sortDirection={sortDirection}
            headRef={sticky.tableHeadRef}
            inactive
            allSelected={allSelected}
            someSelected={someSelected}
            onSelectAll={onSelectAll}
          />
          {loading || empty ? (
            <tbody id={`portfolio-table-body`} className={`portfolio-table-body`}>
              {loading && [0, 1, 2, 3].map(index => <DomainRowSkeleton key={index} index={index} visibleColumns={visibleColumns} />)}
            </tbody>
          ) : groups.map(group => (
            <tbody key={group.key} id={`portfolio-table-group-${encodeURIComponent(group.key)}`} className={`portfolio-table-body`}>
              {grouped && (
                <tr id={`portfolio-table-group-${encodeURIComponent(group.key)}-heading-row`} className={`portfolio-group-heading-row`}>
                  <th colSpan={columns.length + 3} scope={`rowgroup`} id={`portfolio-table-group-${encodeURIComponent(group.key)}-heading-cell`} className={`portfolio-group-heading-cell`}>
                    {groupHeading(group.key, group.label, group.domains.length)}
                  </th>
                </tr>
              )}
              {group.domains.map(domain => (
                <DomainRow
                  busy={busy}
                  key={domain.id}
                  domain={domain}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSelect={onSelect}
                  selected={selectedIds.has(domain.id)}
                  position={positions.get(domain.id) ?? 1}
                  visibleColumns={visibleColumns}
                  onToggleAutoRenew={onToggleAutoRenew}
                  {...reorder.handlers(group.key, domain.id, group.domains.map(item => item.id))}
                />
              ))}
              {!group.domains.length && (
                <tr id={`portfolio-table-group-${encodeURIComponent(group.key)}-empty-row`} className={`portfolio-group-empty-row`}>
                  <td colSpan={columns.length + 3} id={`portfolio-table-group-${encodeURIComponent(group.key)}-empty-cell`} className={`portfolio-group-empty`}>
                    {`No domains in this group`}
                  </td>
                </tr>
              )}
            </tbody>
          ))}
        </table>
      </div>
      {empty && (
        <div id={`portfolio-records-empty`} className={`portfolio-records-empty`}>
          <PortfolioEmptyState hasFilters={hasFilters} onAction={onEmptyAction} />
        </div>
      )}
    </div>
  );
};

export default PortfolioRecords;
