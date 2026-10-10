import './styles.scss';
import StarButton from '../StarButton/index.web';
import PortfolioEmptyState from './EmptyState.web';
import { Fragment, useMemo, useState } from 'react';
import { useDomainReorder } from './useDomainReorder';
import type { DomainRecord } from '../../shared/types';
import DomainSiteIcon from '../DomainSiteIcon/index.web';
import type { CSSProperties, KeyboardEvent } from 'react';
import DomainRow, { DomainRowSkeleton } from '../DomainRow';
import { PORTFOLIO_PREVIEW_LIMIT } from '../../shared/config';
import PortfolioAddGroup from '../PortfolioAddGroup/index.web';
import PortfolioCollapse from '../PortfolioCollapse/index.web';
import DomainDescription from '../DomainDescription/index.web';
import DomainGroupPicker from '../DomainGroupPicker/index.web';
import DomainContextMenu from '../DomainContextMenu/index.web';
import DomainProjectBadge from '../DomainProjectBadge/index.web';
import PortfolioTableHead from '../PortfolioTableHead/index.web';
import PortfolioGroupLinks from '../PortfolioGroupLinks/index.web';
import PortfolioCollection from '../PortfolioCollection/index.web';
import DomainGroupSettings from '../DomainGroupSettings/index.web';
import { useColumns } from '../../shared/columnContext/useColumns';
import { useStickyPortfolioGroup } from './useStickyPortfolioGroup';
import type { usePortfolioExpansion } from './usePortfolioExpansion';
import { getPortfolioColumnWidth } from '../DomainPortfolio/columnLayout.web';
import { useCollectionReorder } from '../DomainPortfolio/useCollectionReorder';
import type { useStickyPortfolio } from '../DomainPortfolio/useStickyPortfolio';
import { useDomainContextMenu } from '../DomainContextMenu/useDomainContextMenu';
import { buildPortfolioSections } from '../../shared/portfolioPreferences/groups';
import DomainGridCard, { DomainGridCardSkeleton } from '../DomainGridCard/index.web';
import { getOrderedPortfolioColumns, type PortfolioColumn } from '../../shared/portfolioColumns';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { Eye, EyeOff, ArrowUp, Settings, AppWindow, ArrowDown, RotateCcw, ChevronDown, GripVertical } from 'lucide-react';
import type { PortfolioGroup, CustomPortfolioGroup, PortfolioCollectionSection } from '../../shared/portfolioPreferences/types';

export interface PortfolioRecordsProps {
  busy: boolean;
  loading: boolean;
  compact: boolean;
  idPrefix?: string;
  searching?: boolean;
  showMainRecords?: boolean;
  searchGroups?: PortfolioGroup[];
  collectionSections?: PortfolioCollectionSection[];
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
  expansion: ReturnType<typeof usePortfolioExpansion>;
  onGrouped: () => void;
  onEmptyAction: () => void;
  onSelectAll: (checked: boolean) => void;
  onSelect: (id: string, checked: boolean, extend?: boolean) => void;
  onSort: (field: PortfolioColumn) => void;
  onEdit: (domain: DomainRecord) => void;
  onToggleAutoRenew: (domain: DomainRecord) => void;
  onToggleCollectionSearch?: (id: string) => void;
  isCollectionShowingAll?: (id: string) => boolean;
  onToggleGroupSearch?: (key: string, collectionId: string | null) => void;
  isGroupShowingAll?: (key: string, collectionId: string | null) => boolean;
  onChangeDescription: (domain: DomainRecord, description: string) => Promise<boolean>;
  onChangeProjectStatus: (domain: DomainRecord, projectStatus: DomainRecord[`projectStatus`]) => void;
}

const EMPTY_COLLECTIONS: PortfolioCollectionSection[] = [];

const PortfolioRecords = ({
  busy, sticky, compact, loading, domains, expansion, allDomains, hasFilters,
  selectedIds, allSelected, someSelected, onSelect, onGrouped, onSelectAll,
  sortField, sortDirection, visibleColumns, onEdit, onSort, onEmptyAction, onToggleAutoRenew,
  searchGroups, isGroupShowingAll, onToggleGroupSearch, onChangeDescription, onChangeProjectStatus,
  onToggleCollectionSearch, isCollectionShowingAll, collectionSections = EMPTY_COLLECTIONS,
  idPrefix = `portfolio`, searching = false, showMainRecords = true,
}: PortfolioRecordsProps) => {
  const [groupingIds, setGroupingIds] = useState<Set<string> | null>(null);
  const [editingGroup, setEditingGroup] = useState<CustomPortfolioGroup | null>(null);
  const contextMenu = useDomainContextMenu((action, targets) => {
    if (action === `group`) setGroupingIds(new Set(targets.map(domain => domain.id)));
  });
  const preferences = usePortfolioPreferences();
  const customGroupsById = useMemo(() => new Map(preferences.customGroups.map(group => [group.id, group])), [preferences.customGroups]);
  const appDomainIds = useMemo(() => new Set(preferences.customGroups
    .filter(group => group.isApp)
    .flatMap(group => group.domainIds)), [preferences.customGroups]);
  const { columnWidths, flexibleColumns } = useColumns();
  const orderingPreferences = useMemo(() => sortField
    ? { ...preferences, orders: {} }
    : preferences, [preferences, sortField]);
  const columns = getOrderedPortfolioColumns(visibleColumns);
  const fullGroups = useMemo(() => {
    const sections = buildPortfolioSections(allDomains, { ...preferences, showHiddenGroups: true, showHiddenDomains: true });
    return sections.collections.flatMap(section => section.groups).concat(sections.mainGroups);
  }, [allDomains, preferences]);
  const mainGroups = useMemo(() => {
    if (!showMainRecords) return [];
    const sections = searchGroups ? undefined : buildPortfolioSections(domains, orderingPreferences);
    const items = searchGroups ?? sections?.mainGroups ?? [];
    if (!compact) return items;
    const visibleIds = new Set(items.flatMap(group => group.domains).slice(0, PORTFOLIO_PREVIEW_LIMIT).map(domain => domain.id));
    return items.map(group => ({ ...group, domains: group.domains.filter(domain => visibleIds.has(domain.id)) }))
      .filter((group, index) => group.domains.length || (searching && !items[index]?.domains.length));
  }, [domains, orderingPreferences, compact, searching, searchGroups, showMainRecords]);
  const collections = useMemo(() => collectionSections.map(section => {
    if (!compact) return section;
    const visibleIds = new Set(section.domains.slice(0, PORTFOLIO_PREVIEW_LIMIT).map(domain => domain.id));
    const groups = section.groups.map(group => ({ ...group, domains: group.domains.filter(domain => visibleIds.has(domain.id)) }))
      .filter((group, index) => group.domains.length || (searching && !section.groups[index]?.domains.length));
    return { ...section, groups };
  }), [collectionSections, compact, searching]);
  const groups = useMemo(() => collections.flatMap(section => section.groups).concat(mainGroups), [collections, mainGroups]);
  const groupCollections = useMemo(() => new Map(preferences.customGroups.map(group => [
    `custom:${group.id}`, preferences.collections.find(collection => collection.id === group.collectionId),
  ])), [preferences.customGroups, preferences.collections]);
  const positions = new Map(groups.flatMap(group => group.domains).map((domain, index) => [domain.id, index + 1]));
  const reorder = useDomainReorder(fullGroups, !loading && !busy && !compact, {
    onGrouped,
    selectedIds,
    availableIds: allDomains.map(domain => domain.id),
    groupEnabled: (collections.length > 0 || preferences.groupBy === `custom`) && !loading && !busy,
    disabledGroupKeys: new Set(fullGroups.filter(group => {
      const collection = groupCollections.get(group.key);
      return collection ? collection.sortField : sortField;
    }).map(group => group.key)),
    groupScopes: new Map(fullGroups.map(group => [group.key, groupCollections.get(group.key)?.id ?? null])),
  });
  const collectionReorder = useCollectionReorder(!loading && !busy);
  const mainHandlers = collectionReorder.handlers(null);
  const baseWidths = columns.map(column => getPortfolioColumnWidth(column.field, columnWidths));
  const flexibleCount = columns.filter(column => flexibleColumns.includes(column.field)).length;
  const unusedWidth = Math.max(0, sticky.header.width - baseWidths.reduce((total, width) => total + width, 190));
  const dataWidths = columns.map((column, index) => (baseWidths[index] ?? 72)
    + (flexibleColumns.includes(column.field) && flexibleCount ? unusedWidth / flexibleCount : 0));
  const widths = [38, 36, ...dataWidths, flexibleCount ? 0 : unusedWidth, 116];
  const tableWidth = widths.reduce((total, width) => total + width, 0);
  const loadingWeight = columns.reduce((total, column) => total + (column.field === `name` ? 2 : 1), 0) || 1;
  const loadingDataWidths = columns.map(column => {
    const share = (column.field === `name` ? 2 : 1) / loadingWeight;
    return `calc(${share * 100}% - ${share * 190}px)`;
  });
  const renderedWidths = loading ? [38, 36, ...loadingDataWidths, 0, 116] : widths;
  const tableStyle: CSSProperties = loading
    ? { width: `100%`, minWidth: 0, tableLayout: `fixed` }
    : { width: tableWidth, minWidth: tableWidth, tableLayout: `fixed` };
  const stickyHeaderReady = sticky.header.headHeight > 0 && sticky.header.columnWidths.length === columns.length + 4;
  const grouped = preferences.groupBy !== `none`;
  const hasGroupHeading = (group: PortfolioGroup) => grouped || Boolean(groupCollections.get(group.key));
  const isGroupParentCollapsed = (group: PortfolioGroup) => expansion.isCollectionCollapsed(groupCollections.get(group.key)?.id);
  const isGroupCollapsed = (group: PortfolioGroup) => isGroupParentCollapsed(group) || expansion.isGroupCollapsed(group.key);
  const empty = !loading && !groups.some(group => group.domains.length);
  const hasHiddenMainGroups = !preferences.showHiddenGroups && fullGroups.some(group => (
    !groupCollections.get(group.key) && group.domains.length > 0 && preferences.hiddenGroupKeys.includes(group.key)
  ));
  const hasHiddenDomains = (items: DomainRecord[]) => !preferences.showHiddenDomains
    && items.some(domain => preferences.hiddenDomainIds.includes(domain.id));
  const hasHiddenMainDomains = fullGroups.some(group => !groupCollections.get(group.key) && hasHiddenDomains(group.domains));
  const showGroupHeadings = groups.some(hasGroupHeading);
  const stickyGroup = useStickyPortfolioGroup(
    sticky,
    `${collections.map(section => section.collection.id).join(`|`)}|${groups.map(group => `${group.key}:${group.domains.length}`).join(`|`)}|${[...expansion.collapsedGroups].join(`|`)}|${[...expansion.collapsedCollections].join(`|`)}`,
    stickyHeaderReady && showGroupHeadings && !loading && (preferences.view === `table` || empty),
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
    const customGroup = customGroupsById.get(group.customGroupId ?? ``);
    const moves = customGroup ? reorder.groupMoves(customGroup.id) : undefined;
    const hidden = preferences.hiddenGroupKeys.includes(key);
    const VisibilityIcon = hidden ? EyeOff : Eye;
    const visibilityLabel = `${hidden ? `Show` : `Hide`} ${label}`;
    const collection = groupCollections.get(key);
    const collectionId = collection?.id ?? null;
    const groupSortField = collection ? collection.sortField : sortField;
    const showingAll = Boolean(isGroupShowingAll?.(key, collectionId));
    const searchLabel = showingAll ? `Show only search matches in ${label}` : `Show all domains in ${label}`;
    const collapsed = expansion.isGroupCollapsed(key);
    const contentId = grid ? `${idPrefix}-grid-group-${encodeURIComponent(key)}-content`
      : group.domains.length ? group.domains.map(domain => `domain-row-${domain.id}`).join(` `)
        : `${idPrefix}-table-group-${encodeURIComponent(key)}-empty-row`;
    return (
      <div
        id={`${scope}-heading`}
        {...(grid ? reorder.groupHandlers(group) : {})}
        className={`portfolio-group-heading${customGroup?.isApp ? ` portfolio-group-heading-app` : ``}${hidden ? ` portfolio-group-heading-hidden` : ``}${grid && reorder.draggingGroupId && reorder.draggingGroupId === group.customGroupId ? ` portfolio-group-heading-dragging` : ``}${grid && reorder.targetGroupKey === key ? ` portfolio-group-heading-drop-target` : ``}`}
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
        {customGroup && (
          <DomainSiteIcon
            size={28}
            domain={``}
            fallback={`link`}
            id={`${scope}-symbol`}
            disabled={busy || loading}
            iconUrl={customGroup.siteIconUrl}
            onEdit={() => setEditingGroup(customGroup)}
            editLabel={`Add A Logo Or Icon For ${customGroup.name}`}
          />
        )}
        <div id={`${scope}-copy`} className={`portfolio-group-copy`}>
          <span id={`${scope}-label`} className={`portfolio-group-label`}>
            {label}
          </span>
          {customGroup?.isApp && (
            <span id={`${scope}-kind`} className={`portfolio-group-kind`}>
              <AppWindow size={12} aria-hidden={`true`} id={`${scope}-kind-icon`} className={`portfolio-group-kind-icon`} />
              <span id={`${scope}-kind-text`} className={`portfolio-group-kind-text`}>{`App`}</span>
            </span>
          )}
          {customGroup && (
            <>
              <DomainProjectBadge
                field={`projectStatus`}
                disabled={busy || loading}
                id={`${scope}-project-status`}
                value={customGroup.projectStatus}
                className={`portfolio-group-project-status`}
                editLabel={`Change Project Status For ${label}`}
                onChange={value => { preferences.updateGroupProjectStatus(customGroup.id, value); }}
              />
              <DomainDescription
                maxLength={280}
                domainName={label}
                busy={busy || loading}
                id={`${scope}-description`}
                value={customGroup.description}
                onReadMore={() => setEditingGroup(customGroup)}
                readMoreLabel={`Read More In Group Settings For ${label}`}
                onSave={async value => {
                  const current = preferences.customGroups.find(item => item.id === customGroup.id);
                  return current ? preferences.updateGroup(current.id, current.name, value) : false;
                }}
              />
              <PortfolioGroupLinks group={customGroup} id={`${scope}-links`} />
            </>
          )}
          {!customGroup && description && (
            <span id={`${scope}-description`} className={`portfolio-group-description`}>
              {description}
            </span>
          )}
          {hidden && (
            <span id={`${scope}-visibility-state`} className={`portfolio-group-hidden-state`}>
              {`Hidden`}
            </span>
          )}
        </div>
        <div id={`${scope}-actions`} className={`actionsCell portfolio-group-actions`}>
          <span
            id={`${scope}-count`}
            className={`portfolio-group-count`}
            title={`${group.domains.length} Domain(s) In ${label}`}
            aria-label={`${group.domains.length} Domain(s) In ${label}`}
          >
            {group.domains.length}
          </span>
          {searching && onToggleGroupSearch && (
            <button
              type={`button`}
              draggable={false}
              title={searchLabel}
              aria-label={searchLabel}
              aria-pressed={showingAll}
              id={`${scope}-search-toggle`}
              className={`portfolio-group-search-toggle`}
              onClick={() => onToggleGroupSearch(key, collectionId)}
            >
              <Eye size={14} aria-hidden={`true`} id={`${scope}-search-toggle-icon`} className={`portfolio-group-search-toggle-icon`} />
            </button>
          )}
          {!groupSortField && preferences.orders[key]?.length > 0 && (
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
          {key !== `all` && (
            <button
              type={`button`}
              draggable={false}
              title={visibilityLabel}
              disabled={busy || loading}
              aria-label={visibilityLabel}
              aria-pressed={!hidden}
              id={`${scope}-visibility-toggle`}
              className={`portfolio-group-visibility-toggle`}
              onClick={() => {
                const changed = preferences.toggleGroupVisibility(key);
                if (changed && !hidden && !preferences.showHiddenGroups) {
                  document.getElementById(`portfolio-table-settings`)?.focus({ preventScroll: true });
                }
              }}
            >
              <VisibilityIcon
                size={14}
                aria-hidden={`true`}
                id={`${scope}-visibility-toggle-icon`}
                className={`portfolio-group-visibility-toggle-icon`}
              />
            </button>
          )}
          {customGroup && (
            <>
              <StarButton
                id={`${scope}-star`}
                disabled={busy || loading}
                starred={customGroup.starred === true}
                onPress={() => { preferences.toggleGroupStar(customGroup.id); }}
                label={`${customGroup.starred ? `Unstar` : `Star`} ${customGroup.name}`}
              />
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
            </>
          )}
          <button
            type={`button`}
            draggable={false}
            aria-controls={contentId}
            aria-expanded={!collapsed}
            id={`${scope}-collapse-toggle`}
            title={`${collapsed ? `Expand` : `Collapse`} ${label}`}
            aria-label={`${collapsed ? `Expand` : `Collapse`} ${label}`}
            className={`portfolio-group-collapse-toggle${collapsed ? ` portfolio-group-collapse-toggle-collapsed` : ``}`}
            onClick={() => {
              expansion.toggleGroup(key);
              window.requestAnimationFrame(() => {
                const originalId = `${idPrefix}-group-${encodeURIComponent(key)}-collapse-toggle`;
                const mirroredId = `${idPrefix}-sticky-group-${encodeURIComponent(key)}-collapse-toggle`;
                const buttons = [document.getElementById(`${scope}-collapse-toggle`), document.getElementById(originalId), document.getElementById(mirroredId)];
                buttons.find(button => button && !button.closest(`[hidden], [inert]`) && window.getComputedStyle(button).visibility !== `hidden`)?.focus({ preventScroll: true });
              });
            }}
          >
            <ChevronDown size={14} aria-hidden={`true`} id={`${scope}-collapse-icon`} className={`portfolio-group-collapse-icon`} />
          </button>
        </div>
      </div>
    );
  };
  const groupHelp = (
    <p id={`${idPrefix}-group-interaction-help`} className={`portfolio-sr-only`}>
      {`Drag a custom group heading to reorder groups, or use its up and down buttons. Drop domain rows on a group heading to move them into that group. Use the Group context menu action as a keyboard alternative.`}
    </p>
  );
  const hiddenGroupsNotice = (
    <p role={`status`} id={`${idPrefix}-hidden-groups-notice`} className={`portfolio-hidden-groups-notice`}>
      {`Groups are hidden. Turn on Show Hidden Groups in Table Settings to display them.`}
    </p>
  );
  const hiddenDomainsMessage = `Domains are hidden. Turn on Show Hidden Domains in Table Settings to display them.`;
  const hiddenDomainsNotice = (
    <p role={`status`} id={`${idPrefix}-hidden-domains-notice`} className={`portfolio-hidden-groups-notice`}>
      {hiddenDomainsMessage}
    </p>
  );
  const groupEmptyMessage = (group: PortfolioGroup) => hasHiddenDomains(fullGroups.find(item => item.key === group.key)?.domains ?? [])
    ? hiddenDomainsMessage : searching ? `No matching domains in this group` : `No domains in this group`;

  const collectionEmptyMessage = (section: PortfolioCollectionSection) => {
    const hiddenGroups = !preferences.showHiddenGroups && fullGroups.some(group => (
      groupCollections.get(group.key)?.id === section.collection.id
      && group.domains.length > 0 && preferences.hiddenGroupKeys.includes(group.key)
    ));
    return hiddenGroups ? `Groups are hidden. Turn on Show Hidden Groups in Table Settings to display them.`
      : fullGroups.some(group => groupCollections.get(group.key)?.id === section.collection.id && hasHiddenDomains(group.domains)) ? hiddenDomainsMessage
      : hasFilters ? `No domains match the current filters in this collection` : `Drop a group here or add a group below`;
  };
  const collectionHeading = (section: PortfolioCollectionSection, grid = false) => (
    <PortfolioCollection
      busy={busy}
      loading={loading}
      searching={searching}
      collection={section.collection}
      domainCount={section.domains.length}
      collapsed={expansion.isCollectionCollapsed(section.collection.id)}
      onToggleCollapsed={() => expansion.toggleCollection(section.collection.id)}
      contentId={grid ? `portfolio-collection-${section.collection.id}-content` : [
        ...section.groups.map(group => `${idPrefix}-table-group-${encodeURIComponent(group.key)}`),
        `portfolio-collection-${section.collection.id}-add-group-body`,
        ...(!section.groups.length ? [`portfolio-collection-${section.collection.id}-empty-body`] : []),
      ].join(` `)}
      {...collectionReorder.moves(section.collection.id)}
      {...collectionReorder.handlers(section.collection.id)}
      showAllDomains={isCollectionShowingAll?.(section.collection.id)}
      onToggleSearch={() => onToggleCollectionSearch?.(section.collection.id)}
    />
  );
  const mainHeading = collections.length > 0 && showMainRecords && (
    <div
      onDrop={mainHandlers.onDrop}
      onDragOver={mainHandlers.onDragOver}
      onDragLeave={mainHandlers.onDragLeave}
      id={`${idPrefix}-main-database-heading`}
      aria-describedby={`${idPrefix}-main-database-help`}
      className={`portfolio-main-database-heading${mainHandlers.dropTarget ? ` portfolio-main-database-drop-target` : ``}`}
    >
      <h3 id={`${idPrefix}-main-database-title`} className={`portfolio-main-database-title`}>{`Database`}</h3>
      <p id={`${idPrefix}-main-database-help`} className={`portfolio-main-database-help`}>{`Drop a group here to move it back to the main database`}</p>
    </div>
  );
  const addGroupRow = (collectionId: string | null = null) => {
    const scope = collectionId ? `portfolio-collection-${collectionId}` : idPrefix;
    const collapsed = expansion.isCollectionCollapsed(collectionId);
    return (
      <tbody id={`${scope}-add-group-body`} className={`portfolio-add-group-body`}>
        <tr
          inert={collapsed}
          aria-hidden={collapsed || undefined}
          data-collapsed={collapsed || undefined}
          id={`${scope}-add-group-row`}
          className={`portfolio-add-group-row portfolio-collapse-row`}
        >
          <td colSpan={columns.length + 4} id={`${scope}-add-group-cell`} className={`portfolio-add-group-cell`}>
            <PortfolioCollapse id={`${scope}-add-group-content`} collapsed={collapsed}>
              <PortfolioAddGroup idPrefix={scope} collectionId={collectionId} disabled={loading || busy} />
            </PortfolioCollapse>
          </td>
        </tr>
      </tbody>
    );
  };
  const mainEmptyContent = showMainRecords && !loading && !mainGroups.some(group => group.domains.length || hasGroupHeading(group)) && (
    <div id={`${idPrefix}-records-empty`} className={`portfolio-records-empty`}>
      {hasHiddenMainGroups ? hiddenGroupsNotice : hasHiddenMainDomains ? hiddenDomainsNotice : <PortfolioEmptyState idPrefix={idPrefix} hasFilters={hasFilters} onAction={onEmptyAction} />}
    </div>
  );
  const tableGroup = (group: PortfolioGroup) => (
    <tbody
      key={group.key}
      data-portfolio-group-key={hasGroupHeading(group) && !isGroupParentCollapsed(group) ? group.key : undefined}
      id={`${idPrefix}-table-group-${encodeURIComponent(group.key)}`}
      className={`portfolio-table-body${groupCollections.get(group.key) ? ` portfolio-table-body-collection` : ``}`}
    >
      {hasGroupHeading(group) && (
        <tr
          {...reorder.groupHandlers(group)}
          inert={isGroupParentCollapsed(group)}
          aria-hidden={isGroupParentCollapsed(group) || undefined}
          data-collapsed={isGroupParentCollapsed(group) || undefined}
          id={`${idPrefix}-table-group-${encodeURIComponent(group.key)}-heading-row`}
          className={`portfolio-group-heading-row portfolio-collapse-row${groupCollections.get(group.key) ? ` portfolio-group-heading-row-collection` : ``}${customGroupsById.get(group.customGroupId ?? ``)?.isApp ? ` portfolio-group-heading-row-app` : ``}${reorder.draggingGroupId && reorder.draggingGroupId === group.customGroupId ? ` portfolio-group-heading-row-dragging` : ``}${reorder.targetGroupKey === group.key ? ` portfolio-group-heading-row-drop-target` : ``}`}
        >
          <th colSpan={columns.length + 4} scope={`rowgroup`} id={`${idPrefix}-table-group-${encodeURIComponent(group.key)}-heading-cell`} className={`portfolio-group-heading-cell`}>
            <PortfolioCollapse id={`${idPrefix}-group-${encodeURIComponent(group.key)}-header-content`} collapsed={isGroupParentCollapsed(group)}>
              {groupHeading(group)}
            </PortfolioCollapse>
          </th>
        </tr>
      )}
      {group.domains.map(domain => (
        <DomainRow
          busy={busy}
          key={domain.id}
          domain={domain}
          onEdit={onEdit}
          onSelect={onSelect}
          collapsed={isGroupCollapsed(group)}
          showCosts={preferences.showCosts}
          selected={selectedIds.has(domain.id)}
          position={positions.get(domain.id) ?? 1}
          visibleColumns={visibleColumns}
          hideProjectDetails={appDomainIds.has(domain.id)}
          selectionDescriptionId={`portfolio-selection-help`}
          onContextMenu={event => contextMenu.open(event, domain, menuDomains(domain))}
          onToggleAutoRenew={onToggleAutoRenew}
          onChangeDescription={onChangeDescription}
          onChangeProjectStatus={onChangeProjectStatus}
          {...reorder.handlers(group.key, domain.id, group.domains.map(item => item.id))}
        />
      ))}
      {!group.domains.length && (
        <tr
          inert={isGroupCollapsed(group)}
          aria-hidden={isGroupCollapsed(group) || undefined}
          data-collapsed={isGroupCollapsed(group) || undefined}
          id={`${idPrefix}-table-group-${encodeURIComponent(group.key)}-empty-row`}
          className={`portfolio-group-empty-row portfolio-collapse-row`}
        >
          <td colSpan={columns.length + 4} id={`${idPrefix}-table-group-${encodeURIComponent(group.key)}-empty-cell`} className={`portfolio-group-empty`}>
            <PortfolioCollapse id={`${idPrefix}-group-${encodeURIComponent(group.key)}-empty-content`} collapsed={isGroupCollapsed(group)}>
              {groupEmptyMessage(group)}
            </PortfolioCollapse>
          </td>
        </tr>
      )}
    </tbody>
  );
  const gridGroup = (group: PortfolioGroup) => (
    <section key={group.key} id={`${idPrefix}-grid-group-${encodeURIComponent(group.key)}`} className={`portfolio-grid-group`}>
      {hasGroupHeading(group) && groupHeading(group, true)}
      <PortfolioCollapse id={`${idPrefix}-grid-group-${encodeURIComponent(group.key)}-content`} collapsed={expansion.isGroupCollapsed(group.key)}>
        <div id={`${idPrefix}-grid-group-${encodeURIComponent(group.key)}-domains`} className={`portfolio-domain-grid`}>
          {group.domains.map(domain => (
            <DomainGridCard
              busy={busy}
              key={domain.id}
              domain={domain}
              onEdit={onEdit}
              onSelect={onSelect}
              selected={selectedIds.has(domain.id)}
              position={positions.get(domain.id) ?? 1}
              visibleColumns={visibleColumns}
              hideProjectDetails={appDomainIds.has(domain.id)}
              selectionDescriptionId={`portfolio-selection-help`}
              onToggleAutoRenew={onToggleAutoRenew}
              {...reorder.handlers(group.key, domain.id, group.domains.map(item => item.id))}
            />
          ))}
        </div>
        {!group.domains.length && (
          <p id={`${idPrefix}-grid-group-${encodeURIComponent(group.key)}-empty`} className={`portfolio-group-empty`}>
            {groupEmptyMessage(group)}
          </p>
        )}
      </PortfolioCollapse>
    </section>
  );

  if (preferences.view === `grid` && !empty) return (
    <div id={`${idPrefix}-grid-view`} className={`portfolio-grid-view`} aria-busy={loading}>
      {groupHelp}
      {loading ? (
        <div id={`${idPrefix}-grid-loading`} className={`portfolio-domain-grid`}>
          {[0, 1, 2, 3].map(index => <DomainGridCardSkeleton key={index} index={index} visibleColumns={visibleColumns} />)}
        </div>
      ) : (
        <>
          {collections.map(section => (
            <section key={section.collection.id} id={`portfolio-collection-${section.collection.id}-grid`} className={`portfolio-grid-collection`}>
              {collectionHeading(section, true)}
              <PortfolioCollapse id={`portfolio-collection-${section.collection.id}-content`} collapsed={expansion.isCollectionCollapsed(section.collection.id)}>
                {section.groups.map(gridGroup)}
                {!section.groups.length && (
                  <p id={`portfolio-collection-${section.collection.id}-empty-description`} className={`portfolio-group-empty`}>{collectionEmptyMessage(section)}</p>
                )}
                <PortfolioAddGroup idPrefix={`portfolio-collection-${section.collection.id}`} collectionId={section.collection.id} disabled={loading || busy} />
              </PortfolioCollapse>
            </section>
          ))}
          {mainHeading}
          {mainGroups.map(gridGroup)}
          {mainEmptyContent}
          {showMainRecords && <PortfolioAddGroup idPrefix={idPrefix} disabled={loading || busy} />}
        </>
      )}
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
              columnWidths={loading ? sticky.header.columnWidths : widths}
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
                {groups.filter(group => hasGroupHeading(group) && !isGroupParentCollapsed(group)).map(group => (
                  <tr
                    hidden
                    key={group.key}
                    aria-hidden={`true`}
                    {...reorder.groupHandlers(group)}
                    data-portfolio-sticky-group-key={group.key}
                    id={`${idPrefix}-sticky-group-${encodeURIComponent(group.key)}-row`}
                    className={`portfolio-group-heading-row${groupCollections.get(group.key) ? ` portfolio-group-heading-row-collection` : ``}${customGroupsById.get(group.customGroupId ?? ``)?.isApp ? ` portfolio-group-heading-row-app` : ``}${reorder.draggingGroupId === group.customGroupId ? ` portfolio-group-heading-row-dragging` : ``}${reorder.targetGroupKey === group.key ? ` portfolio-group-heading-row-drop-target` : ``}`}
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
        data-empty={empty || undefined}
        data-loading={loading || undefined}
        className={`portfolio-table-scroll`}
        style={{ marginTop: stickyHeaderReady ? -sticky.header.headHeight : 0 }}
      >
        <table ref={sticky.tableRef} style={tableStyle} id={`${idPrefix}-table`} className={`portfolio-table`} aria-busy={loading}>
          <caption id={`${idPrefix}-table-caption`} className={`portfolio-sr-only`}>
            {`Your saved domain records. Monthly costs are annual costs divided by twelve. Auto-renew settings are a record only.`}
          </caption>
          <colgroup id={`${idPrefix}-table-columns`}>
            <col id={`${idPrefix}-column-position`} style={{ width: renderedWidths[0] }} />
            <col id={`${idPrefix}-column-selection`} style={{ width: renderedWidths[1] }} />
            {columns.map((column, index) => (
              <col key={column.field} id={`${idPrefix}-column-${column.field}`} style={{ width: renderedWidths[index + 2] }} />
            ))}
            <col id={`${idPrefix}-column-space`} style={{ width: renderedWidths[columns.length + 2] }} />
            <col id={`${idPrefix}-column-actions`} style={{ width: renderedWidths[columns.length + 3] }} />
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
            columnWidths={loading ? undefined : widths}
          />
          {loading ? (
            <tbody id={`${idPrefix}-table-body`} className={`portfolio-table-body`}>
              {[0, 1, 2, 3].map(index => <DomainRowSkeleton key={index} index={index} idPrefix={`${idPrefix}-domain`} visibleColumns={visibleColumns} />)}
            </tbody>
          ) : (
            <>
              {collections.map(section => (
                <Fragment key={section.collection.id}>
                  <tbody id={`portfolio-collection-${section.collection.id}-heading-body`} className={`portfolio-collection-heading-body`}>
                    <tr id={`portfolio-collection-${section.collection.id}-heading-row`} className={`portfolio-collection-heading-row`}>
                      <th colSpan={columns.length + 4} scope={`rowgroup`} id={`portfolio-collection-${section.collection.id}-heading-cell`} className={`portfolio-collection-heading-cell`}>
                        {collectionHeading(section)}
                      </th>
                    </tr>
                  </tbody>
                  {section.groups.map(tableGroup)}
                  {!section.groups.length && (
                    <tbody id={`portfolio-collection-${section.collection.id}-empty-body`} className={`portfolio-collection-empty-body`}>
                      <tr
                        inert={expansion.isCollectionCollapsed(section.collection.id)}
                        aria-hidden={expansion.isCollectionCollapsed(section.collection.id) || undefined}
                        data-collapsed={expansion.isCollectionCollapsed(section.collection.id) || undefined}
                        id={`portfolio-collection-${section.collection.id}-empty-row`}
                        className={`portfolio-collection-empty-row portfolio-collapse-row`}
                      >
                        <td colSpan={columns.length + 4} id={`portfolio-collection-${section.collection.id}-empty-cell`} className={`portfolio-group-empty`}>
                          <PortfolioCollapse id={`portfolio-collection-${section.collection.id}-empty-content`} collapsed={expansion.isCollectionCollapsed(section.collection.id)}>
                            {collectionEmptyMessage(section)}
                          </PortfolioCollapse>
                        </td>
                      </tr>
                    </tbody>
                  )}
                  {addGroupRow(section.collection.id)}
                </Fragment>
              ))}
              {mainHeading && (
                <tbody id={`${idPrefix}-main-heading-body`} className={`portfolio-main-heading-body`}>
                  <tr id={`${idPrefix}-main-heading-row`} className={`portfolio-main-heading-row`}>
                    <th colSpan={columns.length + 4} scope={`rowgroup`} id={`${idPrefix}-main-heading-cell`} className={`portfolio-main-heading-cell`}>{mainHeading}</th>
                  </tr>
                </tbody>
              )}
              {mainGroups.filter(group => group.domains.length || hasGroupHeading(group)).map(tableGroup)}
              {mainEmptyContent && (
                <tbody id={`${idPrefix}-empty-body`} className={`portfolio-empty-body`}>
                  <tr id={`${idPrefix}-empty-row`} className={`portfolio-empty-row`}>
                    <td colSpan={columns.length + 4} id={`${idPrefix}-empty-cell`} className={`portfolio-empty-cell`}>{mainEmptyContent}</td>
                  </tr>
                </tbody>
              )}
              {showMainRecords && addGroupRow()}
            </>
          )}
        </table>
      </div>
      <DomainContextMenu {...contextMenu} />
      {groupPicker}
      {groupSettings}
    </div>
  );
};

export default PortfolioRecords;
