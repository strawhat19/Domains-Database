import './styles.scss';
import { useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, RotateCcw, Settings, GripVertical } from 'lucide-react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { useDomainReorder } from './useDomainReorder';
import PortfolioEmptyState from './EmptyState.web';
import type { DomainRecord } from '../../shared/types';
import DomainRow, { DomainRowSkeleton } from '../DomainRow';
import DomainGroupPicker from '../DomainGroupPicker/index.web';
import DomainContextMenu from '../DomainContextMenu/index.web';
import DomainGroupSettings from '../DomainGroupSettings/index.web';
import PortfolioTableHead from '../PortfolioTableHead/index.web';
import DomainGridCard, { DomainGridCardSkeleton } from '../DomainGridCard/index.web';
import type { useStickyPortfolio } from '../DomainPortfolio/useStickyPortfolio';
import type { PortfolioGroup, CustomPortfolioGroup } from '../../shared/portfolioPreferences/types';
import { buildPortfolioGroups } from '../../shared/portfolioPreferences/groups';
import { useDomainContextMenu } from '../DomainContextMenu/useDomainContextMenu';
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
  onGrouped: () => void;
  onEmptyAction: () => void;
  onSelectAll: (checked: boolean) => void;
  onSelect: (id: string, checked: boolean, extend?: boolean) => void;
  onSort: (field: PortfolioColumn) => void;
  onEdit: (domain: DomainRecord) => void;
  onDelete: (domain: DomainRecord) => void;
  onToggleAutoRenew: (domain: DomainRecord) => void;
}

const PortfolioRecords = ({
  busy, sticky, compact, loading, domains, allDomains, hasFilters,
  selectedIds, allSelected, someSelected, onSelect, onGrouped, onSelectAll,
  sortField, sortDirection, visibleColumns, onEdit, onSort, onDelete, onEmptyAction, onToggleAutoRenew,
}: PortfolioRecordsProps) => {
  const [groupingIds, setGroupingIds] = useState<Set<string> | null>(null);
  const [editingGroup, setEditingGroup] = useState<CustomPortfolioGroup | null>(null);
  const contextMenu = useDomainContextMenu((action, targets) => {
    if (action === `group`) setGroupingIds(new Set(targets.map(domain => domain.id)));
  });
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
  const reorder = useDomainReorder(fullGroups, !sortField && !loading && !busy && !compact, {
    onGrouped,
    selectedIds,
    groupEnabled: preferences.groupBy === `custom` && !loading && !busy,
  });
  const tableStyle = { [`--portfolio-table-width`]: `${Math.max(380, columns.length * 140 + 160)}px` } as CSSProperties;
  const stickyHeaderReady = sticky.header.headHeight > 0 && sticky.header.columnWidths.length === columns.length + 3;
  const grouped = preferences.groupBy !== `none`;
  const empty = !loading && !domains.length;
  const selectedDomains = allDomains.filter(domain => selectedIds.has(domain.id));
  const groupingDomains = allDomains.filter(domain => groupingIds?.has(domain.id));
  const menuDomains = (domain: DomainRecord) => selectedDomains.length ? selectedDomains : [domain];
  const groupPicker = groupingIds && (
    <DomainGroupPicker
      onGrouped={onGrouped}
      domains={groupingDomains}
      onClose={() => setGroupingIds(null)}
    />
  );
  const groupSettings = editingGroup && (
    <DomainGroupSettings group={editingGroup} onClose={() => setEditingGroup(null)} />
  );
  const openContextMenuFromKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || !(event.key === `ContextMenu` || (event.shiftKey && event.key === `F10`))) return;
    const row = event.target instanceof Element ? event.target.closest<HTMLTableRowElement>(`tr.domain-row`) : null;
    const domain = row ? allDomains.find(item => row.id === `domain-row-${item.id}`) : undefined;
    if (!row || !domain) return;
    event.preventDefault();
    event.stopPropagation();
    contextMenu.openFromKeyboard(row, domain, menuDomains(domain));
  };
  const groupHeading = (group: PortfolioGroup, grid = false) => {
    const { key, label, description } = group;
    const scope = `portfolio-group-${encodeURIComponent(key)}`;
    const customGroup = preferences.customGroups.find(item => item.id === group.customGroupId);
    const moves = customGroup ? reorder.groupMoves(customGroup.id) : undefined;
    return (
      <div
        id={`${scope}-heading`}
        {...(grid ? reorder.groupHandlers(group) : {})}
        className={`portfolio-group-heading${grid && reorder.draggingGroupId && reorder.draggingGroupId === group.customGroupId ? ` portfolio-group-heading-dragging` : ``}${grid && reorder.targetGroupKey === key ? ` portfolio-group-heading-drop-target` : ``}`}
      >
        {customGroup && (
          <div
            role={`group`}
            id={`${scope}-reorder`}
            className={`portfolio-group-reorder`}
            aria-label={`Reorder ${label}`}
            aria-describedby={`portfolio-group-interaction-help`}
          >
            <span id={`${scope}-drag-handle`} className={`portfolio-group-drag-handle`} title={`Drag to reorder ${label}`} aria-hidden={`true`}>
              <GripVertical size={14} id={`${scope}-drag-handle-icon`} className={`portfolio-group-drag-handle-icon`} />
            </span>
            <div id={`${scope}-move-actions`} className={`portfolio-group-move-actions`}>
              <button
                type={`button`}
                draggable={false}
                disabled={!moves?.onMoveUp}
                id={`${scope}-move-up`}
                onClick={moves?.onMoveUp}
                title={`Move ${label} up`}
                aria-label={`Move ${label} up`}
                className={`portfolio-group-move-action`}
              >
                <ArrowUp size={11} aria-hidden={`true`} id={`${scope}-move-up-icon`} className={`portfolio-group-move-action-icon`} />
              </button>
              <button
                type={`button`}
                draggable={false}
                disabled={!moves?.onMoveDown}
                id={`${scope}-move-down`}
                onClick={moves?.onMoveDown}
                title={`Move ${label} down`}
                aria-label={`Move ${label} down`}
                className={`portfolio-group-move-action`}
              >
                <ArrowDown size={11} aria-hidden={`true`} id={`${scope}-move-down-icon`} className={`portfolio-group-move-action-icon`} />
              </button>
            </div>
          </div>
        )}
        <div id={`${scope}-copy`} className={`portfolio-group-copy`}>
          <span id={`${scope}-label`} className={`portfolio-group-label`}>
            {label}
          </span>
          {description && (
            <span id={`${scope}-description`} className={`portfolio-group-description`}>
              {description}
            </span>
          )}
          <span id={`${scope}-count`} className={`portfolio-group-count`}>
            {group.domains.length}
          </span>
        </div>
        <div id={`${scope}-actions`} className={`portfolio-group-actions`}>
          {!sortField && preferences.orders[key]?.length > 0 && (
            <button
              type={`button`}
              draggable={false}
              title={`Reset group order`}
              id={`${scope}-reset`}
              className={`portfolio-group-reset`}
              aria-label={`Reset order for ${label}`}
              onClick={() => preferences.resetOrder(key)}
            >
              <RotateCcw size={13} aria-hidden={`true`} id={`${scope}-reset-icon`} className={`portfolio-group-reset-icon`} />
            </button>
          )}
          {customGroup && (
            <button
              type={`button`}
              draggable={false}
              id={`${scope}-settings`}
              title={`Edit ${label}`}
              aria-haspopup={`dialog`}
              aria-label={`Edit ${label}`}
              className={`portfolio-group-settings`}
              onClick={() => setEditingGroup(customGroup)}
            >
              <Settings size={14} aria-hidden={`true`} id={`${scope}-settings-icon`} className={`portfolio-group-settings-icon`} />
            </button>
          )}
        </div>
      </div>
    );
  };
  const groupHelp = (
    <p id={`portfolio-group-interaction-help`} className={`portfolio-sr-only`}>
      {`Drag a custom group heading to reorder groups, or use its up and down buttons. Drop domain rows on a group heading to move them into that group. Use the Group context menu action as a keyboard alternative.`}
    </p>
  );

  if (preferences.view === `grid` && !empty) return (
    <div id={`portfolio-grid-view`} className={`portfolio-grid-view`} aria-busy={loading}>
      {groupHelp}
      {loading ? (
        <div id={`portfolio-grid-loading`} className={`portfolio-domain-grid`}>
          {[0, 1, 2, 3].map(index => <DomainGridCardSkeleton key={index} index={index} visibleColumns={visibleColumns} />)}
        </div>
      ) : empty ? <PortfolioEmptyState hasFilters={hasFilters} onAction={onEmptyAction} /> : groups.map(group => (
        <section key={group.key} id={`portfolio-grid-group-${encodeURIComponent(group.key)}`} className={`portfolio-grid-group`}>
          {grouped && groupHeading(group, true)}
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
                selectionDescriptionId={`portfolio-selection-help`}
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
      {groupPicker}
      {groupSettings}
    </div>
  );

  return (
    <div
      id={`portfolio-records-table`}
      className={`portfolio-records-table`}
      onKeyDown={openContextMenuFromKeyboard}
    >
      {groupHelp}
      <div
        hidden={!stickyHeaderReady}
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
      <div ref={sticky.scrollRef} id={`portfolio-table-scroll`} className={`portfolio-table-scroll`} style={{ marginTop: stickyHeaderReady ? -sticky.header.headHeight : 0 }}>
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
            inactive={stickyHeaderReady}
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
                <tr
                  {...reorder.groupHandlers(group)}
                  id={`portfolio-table-group-${encodeURIComponent(group.key)}-heading-row`}
                  className={`portfolio-group-heading-row${reorder.draggingGroupId && reorder.draggingGroupId === group.customGroupId ? ` portfolio-group-heading-row-dragging` : ``}${reorder.targetGroupKey === group.key ? ` portfolio-group-heading-row-drop-target` : ``}`}
                >
                  <th colSpan={columns.length + 3} scope={`rowgroup`} id={`portfolio-table-group-${encodeURIComponent(group.key)}-heading-cell`} className={`portfolio-group-heading-cell`}>
                    {groupHeading(group)}
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
                  selectionDescriptionId={`portfolio-selection-help`}
                  onContextMenu={event => contextMenu.open(event, domain, menuDomains(domain))}
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
      <DomainContextMenu {...contextMenu} />
      {groupPicker}
      {groupSettings}
      {empty && (
        <div id={`portfolio-records-empty`} className={`portfolio-records-empty`}>
          <PortfolioEmptyState hasFilters={hasFilters} onAction={onEmptyAction} />
        </div>
      )}
    </div>
  );
};

export default PortfolioRecords;
