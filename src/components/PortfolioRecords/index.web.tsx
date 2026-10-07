import './styles.scss';
import { useMemo, useState } from 'react';
import PortfolioEmptyState from './EmptyState.web';
import { useDomainReorder } from './useDomainReorder';
import type { DomainRecord } from '../../shared/types';
import type { CSSProperties, KeyboardEvent } from 'react';
import DomainRow, { DomainRowSkeleton } from '../DomainRow';
import DomainGroupPicker from '../DomainGroupPicker/index.web';
import DomainContextMenu from '../DomainContextMenu/index.web';
import PortfolioTableHead from '../PortfolioTableHead/index.web';
import DomainGroupSettings from '../DomainGroupSettings/index.web';
import { useColumns } from '../../shared/columnContext/useColumns';
import { PORTFOLIO_PREVIEW_LIMIT } from '../../shared/config';
import { useStickyPortfolioGroup } from './useStickyPortfolioGroup';
import { getPortfolioColumnWidth } from '../DomainPortfolio/columnLayout.web';
import type { useStickyPortfolio } from '../DomainPortfolio/useStickyPortfolio';
import { useDomainContextMenu } from '../DomainContextMenu/useDomainContextMenu';
import { buildPortfolioSections } from '../../shared/portfolioPreferences/groups';
import { Eye, ArrowUp, ArrowDown, RotateCcw, Settings, GripVertical } from 'lucide-react';
import DomainGridCard, { DomainGridCardSkeleton } from '../DomainGridCard/index.web';
import { getOrderedPortfolioColumns, type PortfolioColumn } from '../../shared/portfolioColumns';
import type { PortfolioGroup, CustomPortfolioGroup } from '../../shared/portfolioPreferences/types';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

export interface PortfolioRecordsProps {
  busy: boolean;
  loading: boolean;
  compact: boolean;
  idPrefix?: string;
  searching?: boolean;
  forceTable?: boolean;
  searchGroups?: PortfolioGroup[];
  collectionId?: string | null;
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
  onToggleGroupSearch?: (key: string) => void;
  isGroupShowingAll?: (key: string) => boolean;
}

const PortfolioRecords = ({
  busy, sticky, compact, loading, domains, allDomains, hasFilters,
  selectedIds, allSelected, someSelected, onSelect, onGrouped, onSelectAll,
  sortField, sortDirection, visibleColumns, onEdit, onSort, onDelete, onEmptyAction, onToggleAutoRenew,
  searchGroups, isGroupShowingAll, onToggleGroupSearch,
  idPrefix = `portfolio`, searching = false, forceTable = false, collectionId = null,
}: PortfolioRecordsProps) => {
  const [groupingIds, setGroupingIds] = useState<Set<string> | null>(null);
  const [editingGroup, setEditingGroup] = useState<CustomPortfolioGroup | null>(null);
  const contextMenu = useDomainContextMenu((action, targets) => {
    if (action === `group`) setGroupingIds(new Set(targets.map(domain => domain.id)));
  });
  const preferences = usePortfolioPreferences();
  const { columnWidths, flexibleColumns } = useColumns();
  const orderingPreferences = useMemo(() => !collectionId && sortField
    ? { ...preferences, orders: {} }
    : preferences, [preferences, collectionId, sortField]);
  const columns = getOrderedPortfolioColumns(visibleColumns);
  const fullGroups = useMemo(() => {
    const sections = buildPortfolioSections(allDomains, orderingPreferences);
    return collectionId
      ? sections.collections.find(section => section.collection.id === collectionId)?.groups ?? []
      : sections.mainGroups;
  }, [allDomains, orderingPreferences, collectionId]);
  const groups = useMemo(() => {
    const sections = searchGroups ? undefined : buildPortfolioSections(domains, orderingPreferences);
    const items = searchGroups ?? (collectionId
      ? sections?.collections.find(section => section.collection.id === collectionId)?.groups ?? []
      : sections?.mainGroups ?? []);
    if (!compact) return items;
    const visibleIds = new Set(items.flatMap(group => group.domains).slice(0, PORTFOLIO_PREVIEW_LIMIT).map(domain => domain.id));
    return items.map(group => ({ ...group, domains: group.domains.filter(domain => visibleIds.has(domain.id)) }))
      .filter((group, index) => group.domains.length || (searching && !items[index]?.domains.length));
  }, [domains, orderingPreferences, collectionId, compact, searching, searchGroups]);
  const positions = new Map(groups.flatMap(group => group.domains).map((domain, index) => [domain.id, index + 1]));
  const reorder = useDomainReorder(fullGroups, !sortField && !loading && !busy && !compact, {
    onGrouped,
    selectedIds,
    availableIds: allDomains.map(domain => domain.id),
    groupEnabled: (Boolean(collectionId) || preferences.groupBy === `custom`) && !loading && !busy,
  });
  const baseWidths = columns.map(column => getPortfolioColumnWidth(column.field, columnWidths));
  const flexibleCount = columns.filter(column => flexibleColumns.includes(column.field)).length;
  const unusedWidth = Math.max(0, sticky.header.width - baseWidths.reduce((total, width) => total + width, 190));
  const dataWidths = columns.map((column, index) => (baseWidths[index] ?? 72)
    + (flexibleColumns.includes(column.field) && flexibleCount ? unusedWidth / flexibleCount : 0));
  const widths = [38, 36, ...dataWidths, flexibleCount ? 0 : unusedWidth, 116];
  const tableWidth = widths.reduce((total, width) => total + width, 0);
  const tableStyle: CSSProperties = { width: tableWidth, minWidth: tableWidth, tableLayout: `fixed` };
  const stickyHeaderReady = sticky.header.headHeight > 0 && sticky.header.columnWidths.length === columns.length + 4;
  const grouped = Boolean(collectionId) || preferences.groupBy !== `none`;
  const empty = !loading && !groups.some(group => group.domains.length);
  const showGroupHeadings = grouped && groups.length > 0;
  const stickyGroup = useStickyPortfolioGroup(
    sticky,
    groups.map(group => `${group.key}:${group.domains.length}`).join(`|`),
    stickyHeaderReady && showGroupHeadings && !loading && (forceTable || preferences.view === `table` || empty),
    idPrefix,
  );
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
  const groupHeading = (group: PortfolioGroup, grid = false, mirrored = false) => {
    const { key, label, description } = group;
    const scope = `${idPrefix}${mirrored ? `-sticky` : ``}-group-${encodeURIComponent(key)}`;
    const customGroup = preferences.customGroups.find(item => item.id === group.customGroupId);
    const moves = customGroup ? reorder.groupMoves(customGroup.id) : undefined;
    const showingAll = Boolean(isGroupShowingAll?.(key));
    const searchLabel = showingAll ? `Show only search matches in ${label}` : `Show all domains in ${label}`;
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
            aria-describedby={`${idPrefix}-group-interaction-help`}
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
          {searching && onToggleGroupSearch && (
            <button
              type={`button`}
              draggable={false}
              title={searchLabel}
              aria-label={searchLabel}
              aria-pressed={showingAll}
              id={`${scope}-search-toggle`}
              className={`portfolio-group-search-toggle`}
              onClick={() => onToggleGroupSearch(key)}
            >
              <Eye size={14} aria-hidden={`true`} id={`${scope}-search-toggle-icon`} className={`portfolio-group-search-toggle-icon`} />
            </button>
          )}
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
    <p id={`${idPrefix}-group-interaction-help`} className={`portfolio-sr-only`}>
      {`Drag a custom group heading to reorder groups, or use its up and down buttons. Drop domain rows on a group heading to move them into that group. Use the Group context menu action as a keyboard alternative.`}
    </p>
  );

  if (!forceTable && preferences.view === `grid` && !empty) return (
    <div id={`${idPrefix}-grid-view`} className={`portfolio-grid-view`} aria-busy={loading}>
      {groupHelp}
      {loading ? (
        <div id={`${idPrefix}-grid-loading`} className={`portfolio-domain-grid`}>
          {[0, 1, 2, 3].map(index => <DomainGridCardSkeleton key={index} index={index} visibleColumns={visibleColumns} />)}
        </div>
      ) : empty ? <PortfolioEmptyState idPrefix={idPrefix} hasFilters={hasFilters} onAction={onEmptyAction} /> : groups.map(group => (
        <section key={group.key} id={`${idPrefix}-grid-group-${encodeURIComponent(group.key)}`} className={`portfolio-grid-group`}>
          {grouped && groupHeading(group, true)}
          <div id={`${idPrefix}-grid-group-${encodeURIComponent(group.key)}-domains`} className={`portfolio-domain-grid`}>
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
            <p id={`${idPrefix}-grid-group-${encodeURIComponent(group.key)}-empty`} className={`portfolio-group-empty`}>
              {searching ? `No matching domains in this group` : `No domains in this group`}
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
      id={`${idPrefix}-records-table`}
      className={`portfolio-records-table`}
      onKeyDown={openContextMenuFromKeyboard}
    >
      {groupHelp}
      <div
        ref={stickyGroup.headerRef}
        hidden={!stickyHeaderReady}
        id={`${idPrefix}-sticky-head`}
        className={`portfolio-sticky-head`}
        style={{ height: sticky.header.headHeight || undefined, top: `calc(var(--site-header-offset, 0px) + var(--portfolio-sticky-gap, 12px) + ${sticky.header.toolbarHeight}px)` }}
      >
        <div id={`${idPrefix}-sticky-head-clip`} className={`portfolio-sticky-head-clip`}>
          <table
            role={`presentation`}
            ref={sticky.mirrorTableRef}
            id={`${idPrefix}-sticky-table`}
            className={`portfolio-table portfolio-sticky-table`}
            style={tableStyle}
          >
            <PortfolioTableHead
              mirrored
              columns={columns}
              onSort={onSort}
              sortField={sortField}
              idPrefix={`${idPrefix}-sticky`}
              sortDirection={sortDirection}
              columnWidths={widths}
              allSelected={allSelected}
              someSelected={someSelected}
              onSelectAll={onSelectAll}
            />
          </table>
        </div>
        <div
          ref={stickyGroup.anchorRef}
          id={`${idPrefix}-sticky-group`}
          className={`portfolio-sticky-group`}
        >
          <div
            hidden
            ref={stickyGroup.clipRef}
            id={`${idPrefix}-sticky-group-clip`}
            className={`portfolio-sticky-group-clip`}
          >
            <table
              role={`presentation`}
              ref={stickyGroup.mirrorRef}
              id={`${idPrefix}-sticky-group-table`}
              className={`portfolio-table portfolio-sticky-group-table`}
            >
              <tbody id={`${idPrefix}-sticky-group-body`} className={`portfolio-sticky-group-body`}>
                {grouped && groups.map(group => (
                  <tr
                    hidden
                    key={group.key}
                    aria-hidden={`true`}
                    {...reorder.groupHandlers(group)}
                    data-portfolio-sticky-group-key={group.key}
                    id={`${idPrefix}-sticky-group-${encodeURIComponent(group.key)}-row`}
                    className={`portfolio-group-heading-row${reorder.draggingGroupId === group.customGroupId ? ` portfolio-group-heading-row-dragging` : ``}${reorder.targetGroupKey === group.key ? ` portfolio-group-heading-row-drop-target` : ``}`}
                  >
                    <td id={`${idPrefix}-sticky-group-${encodeURIComponent(group.key)}-cell`} className={`portfolio-group-heading-cell`}>
                      {groupHeading(group, false, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div
        ref={sticky.scrollRef}
        id={`${idPrefix}-table-scroll`}
        data-loading={loading || undefined}
        className={`portfolio-table-scroll`}
        style={{ marginTop: stickyHeaderReady ? -sticky.header.headHeight : 0 }}
      >
        <table ref={sticky.tableRef} style={tableStyle} id={`${idPrefix}-table`} className={`portfolio-table`} aria-busy={loading}>
          <caption id={`${idPrefix}-table-caption`} className={`portfolio-sr-only`}>
            {`Your saved domain records. Monthly costs are annual costs divided by twelve. Auto-renew settings are a record only.`}
          </caption>
          <colgroup id={`${idPrefix}-table-columns`}>
            <col id={`${idPrefix}-column-position`} style={{ width: widths[0] }} />
            <col id={`${idPrefix}-column-selection`} style={{ width: widths[1] }} />
            {columns.map((column, index) => (
              <col key={column.field} id={`${idPrefix}-column-${column.field}`} style={{ width: widths[index + 2] }} />
            ))}
            <col id={`${idPrefix}-column-space`} style={{ width: widths[columns.length + 2] }} />
            <col id={`${idPrefix}-column-actions`} style={{ width: 116 }} />
          </colgroup>
          <PortfolioTableHead
            columns={columns}
            onSort={onSort}
            sortField={sortField}
            sortDirection={sortDirection}
            idPrefix={idPrefix}
            headRef={sticky.tableHeadRef}
            inactive={stickyHeaderReady}
            allSelected={allSelected}
            someSelected={someSelected}
            onSelectAll={onSelectAll}
            columnWidths={widths}
          />
          {loading || (empty && !showGroupHeadings) ? (
            <tbody id={`${idPrefix}-table-body`} className={`portfolio-table-body`}>
              {loading && [0, 1, 2, 3].map(index => <DomainRowSkeleton key={index} index={index} idPrefix={`${idPrefix}-domain`} visibleColumns={visibleColumns} />)}
            </tbody>
          ) : groups.map(group => (
            <tbody key={group.key} data-portfolio-group-key={grouped ? group.key : undefined} id={`${idPrefix}-table-group-${encodeURIComponent(group.key)}`} className={`portfolio-table-body`}>
              {grouped && (
                <tr
                  {...reorder.groupHandlers(group)}
                  id={`${idPrefix}-table-group-${encodeURIComponent(group.key)}-heading-row`}
                  className={`portfolio-group-heading-row${reorder.draggingGroupId && reorder.draggingGroupId === group.customGroupId ? ` portfolio-group-heading-row-dragging` : ``}${reorder.targetGroupKey === group.key ? ` portfolio-group-heading-row-drop-target` : ``}`}
                >
                  <th colSpan={columns.length + 4} scope={`rowgroup`} id={`${idPrefix}-table-group-${encodeURIComponent(group.key)}-heading-cell`} className={`portfolio-group-heading-cell`}>
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
                <tr id={`${idPrefix}-table-group-${encodeURIComponent(group.key)}-empty-row`} className={`portfolio-group-empty-row`}>
                  <td colSpan={columns.length + 4} id={`${idPrefix}-table-group-${encodeURIComponent(group.key)}-empty-cell`} className={`portfolio-group-empty`}>
                    {searching ? `No matching domains in this group` : `No domains in this group`}
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
      {empty && !showGroupHeadings && (
        <div id={`${idPrefix}-records-empty`} className={`portfolio-records-empty`}>
          {collectionId ? (
            <p id={`${idPrefix}-empty-description`} className={`portfolio-group-empty`}>
              {hasFilters
                ? `No domains match the current filters in this collection`
                : `Drop a group here or choose this collection in group settings`}
            </p>
          ) : (
            <PortfolioEmptyState idPrefix={idPrefix} hasFilters={hasFilters} onAction={onEmptyAction} />
          )}
        </div>
      )}
    </div>
  );
};

export default PortfolioRecords;
