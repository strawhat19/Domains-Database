import './styles.scss';
import Toast from '../Toast';
import StarButton from '../StarButton/index.web';
import PortfolioEmptyState from './EmptyState.web';
import { Fragment, useMemo, useState } from 'react';
import { useDomainReorder } from './useDomainReorder';
import type { DomainRecord } from '../../shared/types';
import DomainSiteIcon from '../DomainSiteIcon/index.web';
import DomainRow, { DomainRowSkeleton } from '../DomainRow';
import { PORTFOLIO_PREVIEW_LIMIT } from '../../shared/config';
import PortfolioRowCopy from '../PortfolioRowCopy/index.web';
import PortfolioAddGroup from '../PortfolioAddGroup/index.web';
import PortfolioCollapse from '../PortfolioCollapse/index.web';
import PortfolioAddDomains from '../PortfolioAddDomains/index.web';
import DomainDescription from '../DomainDescription/index.web';
import DomainGroupPicker from '../DomainGroupPicker/index.web';
import DomainContextMenu from '../DomainContextMenu/index.web';
import GroupContextMenu from '../GroupContextMenu/index.web';
import type { CSSProperties, MouseEvent, KeyboardEvent } from 'react';
import DomainProjectBadge from '../DomainProjectBadge/index.web';
import PortfolioTableHead from '../PortfolioTableHead/index.web';
import PortfolioGroupLinks from '../PortfolioGroupLinks/index.web';
import PortfolioCollection from '../PortfolioCollection/index.web';
import PortfolioNameEditor from '../PortfolioNameEditor/index.web';
import PortfolioAppDomains from '../PortfolioAppDomains/index.web';
import DomainGroupSettings from '../DomainGroupSettings/index.web';
import { useColumns } from '../../shared/columnContext/useColumns';
import { useStickyPortfolioGroup } from './useStickyPortfolioGroup';
import PortfolioAddCollection from '../PortfolioAddCollection/index.web';
import type { usePortfolioExpansion } from './usePortfolioExpansion';
import { useGroupContextMenu } from '../GroupContextMenu/useGroupContextMenu';
import { getPortfolioColumnWidth } from '../DomainPortfolio/columnLayout.web';
import { useCollectionReorder } from '../DomainPortfolio/useCollectionReorder';
import type { useStickyPortfolio } from '../DomainPortfolio/useStickyPortfolio';
import { useDomainContextMenu } from '../DomainContextMenu/useDomainContextMenu';
import { buildPortfolioSections } from '../../shared/portfolioPreferences/groups';
import { isPortfolioNameTaken } from '../../shared/portfolioPreferences/names';
import { getRecentPortfolioItems } from '../../shared/portfolioPreferences/recent';
import DomainGridCard, { DomainGridCardSkeleton } from '../DomainGridCard/index.web';
import { buildPortfolioDestinationTree } from '../../shared/portfolioPreferences/destinationTree';
import { getOrderedPortfolioColumns, type PortfolioColumn } from '../../shared/portfolioColumns';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { Eye, EyeOff, ArrowUp, Database, Settings, ArrowDown, RotateCcw, ChevronDown, GripVertical } from 'lucide-react';
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
  const [menuError, setMenuError] = useState(``);
  const [editingGroupNameKey, setEditingGroupNameKey] = useState(``);
  const [groupingIds, setGroupingIds] = useState<Set<string> | null>(null);
  const [editingGroup, setEditingGroup] = useState<{ group: CustomPortfolioGroup } | null>(null);
  const preferences = usePortfolioPreferences();
  const menuDisabled = busy || loading || preferences.loading;
  const availableDomainIds = useMemo(() => new Set(allDomains.map(domain => domain.id)), [allDomains]);
  const destinationTree = useMemo(() => buildPortfolioDestinationTree(allDomains, preferences.customGroups, preferences.collections),
    [allDomains, preferences.customGroups, preferences.collections]);
  const quickGroups = useMemo(() => {
    const recent = getRecentPortfolioItems(destinationTree.groups, 3);
    const populated = destinationTree.groups.filter(group => group.count > 0)
      .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name, undefined, { numeric: true, sensitivity: `base` }))
      .slice(0, 5);
    return [...new Map([...recent, ...populated].map(group => [group.id, group])).values()];
  }, [destinationTree.groups]);
  const quickBranches = useMemo(() => getRecentPortfolioItems(destinationTree.branches.filter(branch => !branch.main), destinationTree.branches.length)
    .concat(destinationTree.branches.filter(branch => branch.main)).map(branch => ({
    ...branch,
    groups: quickGroups.filter(group => branch.groups.some(item => item.id === group.id)),
  })), [destinationTree.branches, quickGroups]);
  const contextMenu = useDomainContextMenu((action, targets, clickedDomain, targetId) => {
    setMenuError(``);
    if (action === `settings`) {
      const domain = allDomains.find(item => item.id === clickedDomain.id);
      if (domain) onEdit(domain);
      else setMenuError(`This Domain Is No Longer Available`);
    }
    if (action === `group`) setGroupingIds(new Set(targets.map(domain => domain.id)));
    if (action !== `assign-group` && action !== `assign-collection`) return;
    const domainIds = [...new Set(targets.map(domain => domain.id))];
    if (!domainIds.length || domainIds.some(id => !availableDomainIds.has(id))) {
      setMenuError(`Some Selected Domains Are No Longer Available`);
      return;
    }
    if (action === `assign-collection`) {
      if (!targetId || targetId !== `main` && !preferences.collections.some(collection => collection.id === targetId)) {
        setMenuError(`This Collection Is No Longer Available`);
        return;
      }
    } else if (!targetId || !preferences.customGroups.some(group => group.id === targetId)) {
      setMenuError(`This Group Is No Longer Available`);
      return;
    }
    const assigned = action === `assign-collection`
      ? preferences.assignDomainsToCollection(domainIds, targetId === `main` ? null : targetId ?? null)
      : preferences.assignDomains(domainIds, targetId ?? null);
    if (!assigned) {
      setMenuError(`Could Not Move Domain(s). Try Again Shortly`);
      return;
    }
    onGrouped();
    window.requestAnimationFrame(() => {
      const controls = [
        document.getElementById(`domain-row-${clickedDomain.id}-selection`),
        document.getElementById(`portfolio-groups-button`),
      ];
      controls.find(control => control && !control.matches(`:disabled`) && !control.closest(`[hidden], [inert], [aria-hidden='true']`))?.focus({ preventScroll: true });
    });
  }, menuDisabled);
  const groupContextMenu = useGroupContextMenu((action, group, collectionId) => {
    setMenuError(``);
    const currentGroup = preferences.customGroups.find(current => current.id === group.id);
    if (!currentGroup) {
      setMenuError(`This Group Is No Longer Available`);
      return;
    }
    const focusedId = document.activeElement?.id;
    if (action === `delete`) {
      if (currentGroup.isApp) {
        setMenuError(`Only Groups Can Be Deleted`);
        return;
      }
      if (!preferences.deleteGroup(currentGroup.id)) {
        setMenuError(`Could Not Delete Group — Try Again Shortly`);
        return;
      }
    } else if (action === `assign-collection`) {
      if (!collectionId || !preferences.collections.some(collection => collection.id === collectionId)) {
        setMenuError(`This Collection Is No Longer Available`);
        return;
      }
      if (currentGroup.collectionId === collectionId) return;
      if (!preferences.assignGroupCollection(currentGroup.id, collectionId)) {
        setMenuError(`Could Not Move Group. Try Again Shortly`);
        return;
      }
    } else if (action === `convert-to-app` || action === `convert-to-group`) {
      const isApp = action === `convert-to-app`;
      if (Boolean(currentGroup.isApp) === isApp) return;
      if (!preferences.saveGroupSettings(currentGroup.id, {
        isApp,
        name: currentGroup.name,
        description: currentGroup.description ?? ``,
      })) {
        setMenuError(`Could Not Convert ${isApp ? `Group To App` : `App To Group`}. Try Again Shortly`);
        return;
      }
    } else {
      const name = currentGroup.name.trim();
      const description = currentGroup.description?.trim() ?? ``;
      if (isPortfolioNameTaken(preferences, name, { groupId: currentGroup.id })) {
        setMenuError(`A Collection Or Group With This Name Already Exists`);
        return;
      }
      if (!preferences.saveGroupSettings(currentGroup.id, {
        name,
        description,
        collectionId: null,
        convertToCollection: true,
        newCollection: { name, description },
      })) {
        setMenuError(`Could Not Convert Group. Try Again Shortly`);
        return;
      }
    }
    window.requestAnimationFrame(() => {
      const key = encodeURIComponent(`custom:${currentGroup.id}`);
      const controls = [
        focusedId ? document.getElementById(focusedId) : null,
        document.getElementById(`${idPrefix}-group-${key}-settings`),
        document.getElementById(`${idPrefix}-sticky-group-${key}-settings`),
        action === `delete` && currentGroup.collectionId ? document.getElementById(`${idPrefix}-collection-${currentGroup.collectionId}-settings`) : null,
        action === `delete` && currentGroup.collectionId ? document.getElementById(`${idPrefix}-sticky-collection-${currentGroup.collectionId}-settings`) : null,
        document.getElementById(`portfolio-groups-button`),
      ];
      controls.find(control => control && !control.matches(`:disabled`) && !control.closest(`[hidden], [inert], [aria-hidden='true']`))?.focus({ preventScroll: true });
    });
  }, menuDisabled);
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
    const sections = buildPortfolioSections(allDomains, { ...preferences, showHiddenGroups: true, showHiddenDomains: true, showHiddenCollections: true });
    return sections.collections.flatMap(section => section.groups).concat(sections.mainGroups);
  }, [allDomains, preferences]);
  const mainGroups = useMemo(() => {
    if (!showMainRecords) return [];
    const sections = searchGroups ? undefined : buildPortfolioSections(domains, orderingPreferences);
    const items = (searchGroups ?? sections?.mainGroups ?? [])
      .filter(group => group.domains.length || group.customGroupId || !collectionSections.length);
    if (!compact) return items;
    const visibleIds = new Set(items.flatMap(group => group.domains).slice(0, PORTFOLIO_PREVIEW_LIMIT).map(domain => domain.id));
    return items.map(group => ({ ...group, domains: group.domains.filter(domain => visibleIds.has(domain.id)) }))
      .filter((group, index) => group.domains.length || (searching && !items[index]?.domains.length));
  }, [domains, orderingPreferences, compact, searching, searchGroups, showMainRecords, collectionSections.length]);
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
  ] as const).concat(preferences.collections.map(collection => [`collection:${collection.id}`, collection] as const))),
  [preferences.customGroups, preferences.collections]);
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
  const collectionReorder = useCollectionReorder(!loading && !busy, { onAssigned: onGrouped, availableIds: allDomains.map(domain => domain.id) });
  const mainHandlers = collectionReorder.handlers(null);
  const baseWidths = columns.map(column => getPortfolioColumnWidth(column.field, columnWidths));
  const flexibleCount = columns.filter(column => flexibleColumns.includes(column.field)).length;
  const unusedWidth = Math.max(0, sticky.header.width - baseWidths.reduce((total, width) => total + width, 250));
  const dataWidths = columns.map((column, index) => (baseWidths[index] ?? 72)
    + (flexibleColumns.includes(column.field) && flexibleCount ? unusedWidth / flexibleCount : 0));
  const widths = [38, 36, ...dataWidths, flexibleCount ? 0 : unusedWidth, 176];
  const tableWidth = widths.reduce((total, width) => total + width, 0);
  const loadingWeight = columns.reduce((total, column) => total + (column.field === `name` ? 2 : 1), 0) || 1;
  const loadingDataWidths = columns.map(column => {
    const share = (column.field === `name` ? 2 : 1) / loadingWeight;
    return `calc(${share * 100}% - ${share * 250}px)`;
  });
  const renderedWidths = loading ? [38, 36, ...loadingDataWidths, 0, 176] : widths;
  const tableStyle: CSSProperties = loading
    ? { width: `100%`, minWidth: 0, tableLayout: `fixed` }
    : { width: `100%`, minWidth: tableWidth, tableLayout: `fixed` };
  const grouped = preferences.groupBy !== `none`;
  const hasGroupHeading = (group: PortfolioGroup) => !group.directCollectionId && (grouped || Boolean(groupCollections.get(group.key)));
  const isGroupParentCollapsed = (group: PortfolioGroup) => expansion.isCollectionCollapsed(groupCollections.get(group.key)?.id);
  const isGroupCollapsed = (group: PortfolioGroup) => isGroupParentCollapsed(group) || expansion.isGroupCollapsed(group.key);
  const renderedMainGroups = mainGroups.filter(group => group.domains.length || hasGroupHeading(group));
  const hasCollapsedSection = collections.some(section => expansion.isCollectionCollapsed(section.collection.id))
    || groups.some(group => hasGroupHeading(group) && isGroupCollapsed(group));
  const hideColumnNames = !loading && hasCollapsedSection
    && !groups.some(group => group.domains.length > 0 && !isGroupCollapsed(group));
  const columnHeaderHeight = hideColumnNames ? 0 : sticky.header.headHeight;
  const stickyHeaderReady = (hideColumnNames || columnHeaderHeight > 0) && sticky.header.columnWidths.length === columns.length + 4;
  const empty = !loading && !groups.some(group => group.domains.length);
  const hasHiddenCollections = !preferences.showHiddenCollections
    && preferences.collections.some(collection => preferences.hiddenCollectionIds.includes(collection.id));
  const hasHiddenMainGroups = !preferences.showHiddenGroups && fullGroups.some(group => (
    !groupCollections.get(group.key) && group.domains.length > 0 && preferences.hiddenGroupKeys.includes(group.key)
  ));
  const hasHiddenDomains = (items: DomainRecord[]) => !preferences.showHiddenDomains
    && items.some(domain => preferences.hiddenDomainIds.includes(domain.id));
  const hasHiddenMainDomains = fullGroups.some(group => !groupCollections.get(group.key) && hasHiddenDomains(group.domains));
  const showMainContent = showMainRecords && (mainGroups.length > 0 || !collections.length || hasHiddenMainGroups || hasHiddenMainDomains);
  const showGroupHeadings = groups.some(hasGroupHeading);
  const stickyGroup = useStickyPortfolioGroup(
    sticky,
    `${hideColumnNames}|${collections.map(section => section.collection.id).join(`|`)}|${groups.map(group => `${group.key}:${group.domains.length}:${groupCollections.get(group.key)?.id ?? `main`}:${hasGroupHeading(group) ? 1 : 0}`).join(`|`)}|${[...expansion.collapsedGroups].join(`|`)}|${[...expansion.collapsedCollections].join(`|`)}`,
    stickyHeaderReady && (showGroupHeadings || collections.length > 0) && !loading && (preferences.view === `table` || empty),
    idPrefix,
  );
  const selectedDomains = allDomains.filter(domain => selectedIds.has(domain.id));
  const groupingDomains = allDomains.filter(domain => groupingIds?.has(domain.id));
  const menuDomains = (domain: DomainRecord) => selectedIds.has(domain.id) ? selectedDomains : [domain];
  const groupPicker = groupingIds && (
    <DomainGroupPicker
      onGrouped={onGrouped}
      domains={groupingDomains}
      onClose={() => setGroupingIds(null)}
    />
  );
  const groupSettings = editingGroup && (
    <DomainGroupSettings {...editingGroup} onClose={() => setEditingGroup(null)} />
  );
  const menuFeedback = <Toast id={`${idPrefix}-context-menu-error`} message={menuError} onDismiss={() => setMenuError(``)} />;
  const openGroupContextMenu = (event: MouseEvent<HTMLElement>, group: PortfolioGroup) => {
    const customGroup = customGroupsById.get(group.customGroupId ?? ``);
    if (!customGroup || busy || loading || preferences.loading) return;
    contextMenu.close();
    groupContextMenu.open(event, customGroup);
  };
  const openContextMenuFromKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || !(event.key === `ContextMenu` || (event.shiftKey && event.key === `F10`))) return;
    const pill = event.target instanceof Element ? event.target.closest<HTMLElement>(`[data-portfolio-app-domain-id]`) : null;
    const pillDomain = pill ? allDomains.find(domain => domain.id === pill.dataset.portfolioAppDomainId) : undefined;
    if (pill && pillDomain) {
      if (menuDisabled) return;
      event.preventDefault();
      event.stopPropagation();
      groupContextMenu.close();
      contextMenu.openFromKeyboard(pill, pillDomain, menuDomains(pillDomain));
      return;
    }
    const heading = event.target instanceof Element ? event.target.closest<HTMLElement>(`[data-group-context-key]`) : null;
    const group = heading ? groups.find(item => item.key === heading.dataset.groupContextKey) : undefined;
    const customGroup = customGroupsById.get(group?.customGroupId ?? ``);
    if (heading && customGroup) {
      if (busy || loading || preferences.loading) return;
      event.preventDefault();
      event.stopPropagation();
      contextMenu.close();
      groupContextMenu.openFromKeyboard(heading, customGroup);
      return;
    }
    const row = event.target instanceof Element ? event.target.closest<HTMLTableRowElement>(`tr.domain-row`) : null;
    const domain = row ? allDomains.find(item => row.id === `domain-row-${item.id}`) : undefined;
    if (!row || !domain) return;
    event.preventDefault();
    event.stopPropagation();
    groupContextMenu.close();
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
    const projectStatusBadge = customGroup ? (
      <DomainProjectBadge
        field={`projectStatus`}
        disabled={busy || loading}
        id={`${scope}-project-status`}
        value={customGroup.projectStatus}
        className={`portfolio-group-project-status`}
        editLabel={`Change Project Status For ${label}`}
        onChange={value => { preferences.updateGroupProjectStatus(customGroup.id, value); }}
      />
    ) : null;
    return (
      <div
        id={`${scope}-heading`}
        data-group-context-key={key}
        {...(grid ? reorder.groupHandlers(group, editingGroupNameKey === key) : {})}
        onContextMenu={grid ? event => openGroupContextMenu(event, group) : undefined}
        className={`portfolio-group-heading${collection ? ` portfolio-group-heading-collection` : ``}${customGroup?.isApp ? ` portfolio-group-heading-app` : ``}${collapsed ? ` portfolio-group-heading-collapsed` : ``}${hidden ? ` portfolio-group-heading-hidden` : ``}${grid && reorder.draggingGroupId && reorder.draggingGroupId === group.customGroupId ? ` portfolio-group-heading-dragging` : ``}${grid && reorder.targetGroupKey === key ? ` portfolio-group-heading-drop-target` : ``}`}
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
        <DomainSiteIcon
          size={28}
          domain={``}
          fallback={customGroup?.isApp ? `app` : `group`}
          id={`${scope}-symbol`}
          iconUrl={group.siteIconUrl}
          disabled={busy || loading}
          editLabel={`Add A Logo Or Icon For ${label}`}
          onEdit={customGroup ? () => setEditingGroup({ group: customGroup }) : undefined}
        />
        <div id={`${scope}-copy`} className={`portfolio-group-copy`}>
          {customGroup ? (
            <PortfolioNameEditor
              kind={`Group`}
              busy={menuDisabled}
              id={`${scope}-label`}
              value={customGroup.name}
              className={`portfolio-group-label`}
              onEditingChange={editing => setEditingGroupNameKey(current => editing ? key : current === key ? `` : current)}
              onSave={value => {
                const current = preferences.customGroups.find(item => item.id === customGroup.id);
                if (!current) return `This Group Is No Longer Available`;
                const name = value.trim();
                if (!name || name.length > 80) return `Enter A Group Name Between 1 And 80 Characters`;
                if (name.toLowerCase() === `ungrouped`) return `Ungrouped Is Reserved For Domains Without A Group`;
                if (isPortfolioNameTaken(preferences, name, { groupId: current.id })) {
                  return `A Collection Or Group With This Name Already Exists`;
                }
                return preferences.renameGroup(current.id, name) ? true : `Could Not Rename Group. Try Again Shortly`;
              }}
            />
          ) : (
            <span id={`${scope}-label`} className={`portfolio-group-label`}>{label}</span>
          )}
          {!collapsed && projectStatusBadge}
          {collapsed && (
            <PortfolioAppDomains
              group={group}
              busy={menuDisabled}
              id={`${scope}-domains`}
              getDragHandlers={reorder.handlers}
              onContextMenu={(event, domain) => {
                groupContextMenu.close();
                contextMenu.open(event, domain, menuDomains(domain));
              }}
            />
          )}
          {customGroup && (
            <DomainDescription
              maxLength={280}
              domainName={label}
              busy={busy || loading}
              id={`${scope}-description`}
              value={customGroup.description}
              onSave={async value => {
                const current = preferences.customGroups.find(item => item.id === customGroup.id);
                return current ? preferences.updateGroup(current.id, current.name, value) : false;
              }}
            />
          )}
          {!customGroup && description && (
            <span id={`${scope}-description`} className={`portfolio-group-description`}>
              {description}
            </span>
          )}
          {customGroup && <PortfolioGroupLinks group={customGroup} id={`${scope}-links`} />}
          {hidden && (
            <span id={`${scope}-visibility-state`} className={`portfolio-group-hidden-state`}>
              {`Hidden`}
            </span>
          )}
        </div>
        <div id={`${scope}-actions`} className={`actionsCell portfolio-group-actions`}>
          {collapsed && projectStatusBadge}
          {group.domains.length > 0 && (
            <span
              id={`${scope}-count`}
              className={`portfolio-group-count`}
              title={`${group.domains.length} Domain(s) In ${label}`}
              aria-label={`${group.domains.length} Domain(s) In ${label}`}
            >
              {group.domains.length}
            </span>
          )}
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
          <div id={`${scope}-action-rail`} className={`portfolio-row-action-rail`}>
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
                <PortfolioRowCopy
                  label={label}
                  id={`${scope}-copy-domains`}
                  disabled={menuDisabled}
                  sections={{ collections: [], mainGroups: [group], mainDomains: group.domains }}
                  focusFallbackId={`${idPrefix}${mirrored ? `` : `-sticky`}-group-${encodeURIComponent(key)}-copy-domains`}
                />
                <button
                  type={`button`}
                  draggable={false}
                  id={`${scope}-settings`}
                  title={`Edit ${label}`}
                  aria-haspopup={`dialog`}
                  aria-label={`Edit ${label}`}
                  className={`portfolio-group-settings portfolio-row-settings-action`}
                  onClick={() => setEditingGroup({ group: customGroup })}
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
              className={`portfolio-group-collapse-toggle portfolio-row-collapse-action${collapsed ? ` portfolio-group-collapse-toggle-collapsed` : ``}`}
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
  const emptyCustomGroup = (group: PortfolioGroup) => {
    const customGroup = customGroupsById.get(group.customGroupId ?? ``);
    return customGroup && !customGroup.domainIds.some(id => availableDomainIds.has(id)) ? customGroup : undefined;
  };
  const isGroupEmptyCollapsed = (group: PortfolioGroup) => isGroupCollapsed(group) || (!preferences.showAddRows && Boolean(emptyCustomGroup(group)));
  const groupEmptyContent = (group: PortfolioGroup, grid = false) => {
    const customGroup = emptyCustomGroup(group);
    if (!customGroup) return groupEmptyMessage(group);
    const scope = `${idPrefix}-${grid ? `grid` : `table`}-group-${encodeURIComponent(group.key)}`;
    return (
      <PortfolioAddDomains
        idPrefix={scope}
        group={customGroup}
        onGrouped={onGrouped}
        disabled={menuDisabled}
        focusFallbackId={`${idPrefix}-group-${encodeURIComponent(group.key)}-settings`}
      />
    );
  };

  const collectionEmptyMessage = (section: PortfolioCollectionSection) => {
    const hiddenGroups = !preferences.showHiddenGroups && fullGroups.some(group => (
      groupCollections.get(group.key)?.id === section.collection.id
      && group.domains.length > 0 && preferences.hiddenGroupKeys.includes(group.key)
    ));
    return hiddenGroups ? `Groups are hidden. Turn on Show Hidden Groups in Table Settings to display them.`
      : fullGroups.some(group => groupCollections.get(group.key)?.id === section.collection.id && hasHiddenDomains(group.domains)) ? hiddenDomainsMessage
      : hasFilters ? `No domains match the current filters in this collection` : ``;
  };
  const collectionHeading = (section: PortfolioCollectionSection, grid = false, mirrored = false) => (
    <PortfolioCollection
      busy={busy}
      loading={loading}
      searching={searching}
      copySection={section}
      idPrefix={mirrored ? `${idPrefix}-sticky` : idPrefix}
      collection={section.collection}
      domainCount={section.domains.length}
      collapsed={expansion.isCollectionCollapsed(section.collection.id)}
      onToggleCollapsed={() => expansion.toggleCollection(section.collection.id)}
      contentId={grid ? `portfolio-collection-${section.collection.id}-content` : [
        ...section.groups.map(group => `${idPrefix}-table-group-${encodeURIComponent(group.key)}`),
        `portfolio-collection-${section.collection.id}-add-domains-body`,
        `portfolio-collection-${section.collection.id}-add-group-body`,
        ...(!section.groups.length && collectionEmptyMessage(section) ? [`portfolio-collection-${section.collection.id}-empty-body`] : []),
      ].join(` `)}
      {...collectionReorder.moves(section.collection.id)}
      {...collectionReorder.handlers(section.collection.id)}
      showAllDomains={isCollectionShowingAll?.(section.collection.id)}
      onToggleSearch={() => onToggleCollectionSearch?.(section.collection.id)}
    />
  );
  const mainHeading = collections.length > 0 && showMainContent && (
    <div
      onDrop={mainHandlers.onDrop}
      onDragOver={mainHandlers.onDragOver}
      onDragLeave={mainHandlers.onDragLeave}
      id={`${idPrefix}-main-database-heading`}
      aria-describedby={`${idPrefix}-main-database-help`}
      className={`portfolio-main-database-heading${mainHandlers.dropTarget ? ` portfolio-main-database-drop-target` : ``}`}
    >
      <h3 id={`${idPrefix}-main-database-title`} className={`portfolio-main-database-title`}>
        <span aria-hidden={`true`} id={`${idPrefix}-main-database-symbol`} className={`domain-site-icon portfolio-main-database-symbol`}>
          <Database size={16} id={`${idPrefix}-main-database-icon`} className={`portfolio-main-database-icon`} />
        </span>
        {`Database`}
      </h3>
      <p id={`${idPrefix}-main-database-help`} className={`portfolio-main-database-help`}>{`Drop a group or domain here to move it back to the main database`}</p>
    </div>
  );
  const isAddGroupCollapsed = (collectionId: string | null) => !preferences.showAddRows || expansion.isCollectionCollapsed(collectionId);
  const addCollectionDomainsContent = (section: PortfolioCollectionSection, grid = false) => {
    const scope = `portfolio-collection-${section.collection.id}`;
    return (
      <PortfolioCollapse id={`${scope}-${grid ? `grid` : `table`}-add-domains-content`} collapsed={isAddGroupCollapsed(section.collection.id)}>
        <PortfolioAddDomains
          onGrouped={onGrouped}
          disabled={menuDisabled}
          collection={section.collection}
          idPrefix={`${scope}-${grid ? `grid` : `table`}`}
          focusFallbackId={`${idPrefix}-collection-${section.collection.id}-settings`}
        />
      </PortfolioCollapse>
    );
  };
  const addCollectionDomainsRow = (section: PortfolioCollectionSection) => {
    const scope = `portfolio-collection-${section.collection.id}`;
    const collapsed = isAddGroupCollapsed(section.collection.id);
    return (
      <tbody id={`${scope}-add-domains-body`} className={`portfolio-collection-add-domains-body`} data-portfolio-collection-key={section.collection.id}>
        <tr
          inert={collapsed}
          aria-hidden={collapsed || undefined}
          data-collapsed={collapsed || undefined}
          id={`${scope}-add-domains-row`}
          className={`portfolio-add-domains-row portfolio-collapse-row`}
        >
          <td colSpan={columns.length + 4} id={`${scope}-add-domains-cell`} className={`portfolio-add-domains-cell`}>
            {addCollectionDomainsContent(section)}
          </td>
        </tr>
      </tbody>
    );
  };
  const addGroupContent = (collectionId: string | null = null, grid = false) => {
    const scope = collectionId ? `portfolio-collection-${collectionId}` : idPrefix;
    return (
      <PortfolioCollapse id={`${scope}-${grid ? `grid` : `table`}-add-group-content`} collapsed={isAddGroupCollapsed(collectionId)}>
        <PortfolioAddGroup idPrefix={scope} collectionId={collectionId} disabled={loading || busy} />
      </PortfolioCollapse>
    );
  };
  const addCollectionContent = (grid = false) => (
    <PortfolioCollapse id={`${idPrefix}-${grid ? `grid` : `table`}-add-collection-content`} collapsed={!preferences.showAddRows}>
      <PortfolioAddCollection idPrefix={idPrefix} disabled={loading || busy} />
    </PortfolioCollapse>
  );
  const addGroupRow = (collectionId: string | null = null) => {
    const scope = collectionId ? `portfolio-collection-${collectionId}` : idPrefix;
    const collapsed = isAddGroupCollapsed(collectionId);
    return (
      <tbody id={`${scope}-add-group-body`} className={`portfolio-add-group-body`} data-portfolio-collection-key={collectionId ?? undefined}>
        <tr
          inert={collapsed}
          aria-hidden={collapsed || undefined}
          data-collapsed={collapsed || undefined}
          id={`${scope}-add-group-row`}
          className={`portfolio-add-group-row portfolio-collapse-row`}
        >
          <td colSpan={columns.length + 4} id={`${scope}-add-group-cell`} className={`portfolio-add-group-cell`}>
            {addGroupContent(collectionId)}
          </td>
        </tr>
      </tbody>
    );
  };
  const mainEmptyContent = showMainRecords && (showMainContent || !allDomains.length) && !loading && !mainGroups.some(group => group.domains.length || hasGroupHeading(group)) && (
    <div id={`${idPrefix}-records-empty`} className={`portfolio-records-empty`}>
      {hasHiddenMainGroups ? hiddenGroupsNotice : hasHiddenMainDomains ? hiddenDomainsNotice : hasHiddenCollections ? (
        <p id={`${idPrefix}-hidden-collections-notice`} className={`portfolio-hidden-groups-notice`}>
          {`Collections are hidden. Turn on Show Hidden Collections in Table Settings to display them.`}
        </p>
      ) : <PortfolioEmptyState idPrefix={idPrefix} hasFilters={hasFilters} onAction={onEmptyAction} />}
    </div>
  );
  const tableGroup = (group: PortfolioGroup) => (
    <tbody
      key={group.key}
      data-portfolio-collection-key={groupCollections.get(group.key)?.id}
      data-portfolio-group-key={hasGroupHeading(group) && !isGroupParentCollapsed(group) ? group.key : undefined}
      id={`${idPrefix}-table-group-${encodeURIComponent(group.key)}`}
      className={`portfolio-table-body${groupCollections.get(group.key) ? ` portfolio-table-body-collection` : ``}`}
    >
      {hasGroupHeading(group) && (
        <tr
          {...reorder.groupHandlers(group, editingGroupNameKey === group.key)}
          data-group-context-key={group.key}
          onContextMenu={event => openGroupContextMenu(event, group)}
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
          detailsExpanded={preferences.expandedDomainIds.includes(domain.id)}
          onToggleDetails={() => { preferences.toggleDomainExpansion(domain.id); }}
          collapsed={isGroupCollapsed(group)}
          showCosts={preferences.showCosts}
          selected={selectedIds.has(domain.id)}
          position={positions.get(domain.id) ?? 1}
          visibleColumns={visibleColumns}
          hideProjectDetails={appDomainIds.has(domain.id)}
          selectionDescriptionId={`portfolio-selection-help`}
          onContextMenu={event => { groupContextMenu.close(); contextMenu.open(event, domain, menuDomains(domain)); }}
          onToggleAutoRenew={onToggleAutoRenew}
          onChangeDescription={onChangeDescription}
          onChangeProjectStatus={onChangeProjectStatus}
          {...reorder.handlers(group.key, domain.id, group.domains.map(item => item.id))}
        />
      ))}
      {!group.domains.length && (
        <tr
          inert={isGroupEmptyCollapsed(group)}
          aria-hidden={isGroupEmptyCollapsed(group) || undefined}
          data-collapsed={isGroupEmptyCollapsed(group) || undefined}
          id={`${idPrefix}-table-group-${encodeURIComponent(group.key)}-empty-row`}
          className={`portfolio-group-empty-row portfolio-collapse-row`}
        >
          <td colSpan={columns.length + 4} id={`${idPrefix}-table-group-${encodeURIComponent(group.key)}-empty-cell`} className={`portfolio-group-empty`}>
            <PortfolioCollapse id={`${idPrefix}-table-group-${encodeURIComponent(group.key)}-empty-content`} collapsed={isGroupEmptyCollapsed(group)}>
              {groupEmptyContent(group)}
            </PortfolioCollapse>
          </td>
        </tr>
      )}
    </tbody>
  );
  const gridGroup = (group: PortfolioGroup) => (
    <section
      key={group.key}
      className={`portfolio-grid-group`}
      id={`${idPrefix}-grid-group-${encodeURIComponent(group.key)}`}
      data-add-row-hidden={!group.domains.length && Boolean(emptyCustomGroup(group)) && !preferences.showAddRows || undefined}
    >
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
          <PortfolioCollapse id={`${idPrefix}-grid-group-${encodeURIComponent(group.key)}-empty-content`} collapsed={isGroupEmptyCollapsed(group)}>
            <div id={`${idPrefix}-grid-group-${encodeURIComponent(group.key)}-empty`} className={`portfolio-group-empty`}>
              {groupEmptyContent(group, true)}
            </div>
          </PortfolioCollapse>
        )}
      </PortfolioCollapse>
    </section>
  );

  if (preferences.view === `grid` && !empty) return (
    <div id={`${idPrefix}-grid-view`} className={`portfolio-grid-view`} aria-busy={loading} onKeyDown={openContextMenuFromKeyboard}>
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
                {!section.groups.length && collectionEmptyMessage(section) && (
                  <p id={`portfolio-collection-${section.collection.id}-empty-description`} className={`portfolio-group-empty`}>{collectionEmptyMessage(section)}</p>
                )}
                {addCollectionDomainsContent(section, true)}
                {addGroupContent(section.collection.id, true)}
              </PortfolioCollapse>
            </section>
          ))}
          {addCollectionContent(true)}
          {mainHeading}
          {mainGroups.map(gridGroup)}
          {mainEmptyContent}
          {showMainContent && addGroupContent(null, true)}
        </>
      )}
      {groupPicker}
      {groupSettings}
      <GroupContextMenu
        {...groupContextMenu}
        branches={destinationTree.branches.filter(branch => !branch.main)}
        collectionId={customGroupsById.get(groupContextMenu.menu?.group.id ?? ``)?.collectionId}
      />
      {menuFeedback}
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
        style={{ height: hideColumnNames ? 0 : columnHeaderHeight || undefined, top: `calc(var(--site-header-offset, 0px) + var(--portfolio-header-gap, 16px) + var(--portfolio-heading-height, 0px) + var(--portfolio-sticky-gap, 12px) + ${sticky.header.toolbarHeight}px)` }}
      >
        <div hidden={hideColumnNames} id={`${idPrefix}-sticky-head-clip`} className={`portfolio-sticky-head-clip`}>
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
            ref={stickyGroup.collectionClipRef}
            id={`${idPrefix}-sticky-collection-clip`}
            className={`portfolio-sticky-collection-clip`}
          >
            <table
              role={`presentation`}
              ref={stickyGroup.collectionMirrorRef}
              id={`${idPrefix}-sticky-collection-table`}
              className={`portfolio-table portfolio-sticky-collection-table`}
            >
              <tbody id={`${idPrefix}-sticky-collection-body`} className={`portfolio-sticky-collection-body`}>
                {collections.map(section => (
                  <tr
                    hidden
                    aria-hidden={`true`}
                    key={section.collection.id}
                    data-portfolio-sticky-collection-key={section.collection.id}
                    id={`${idPrefix}-sticky-collection-${section.collection.id}-row`}
                    className={`portfolio-collection-heading-row`}
                  >
                    <td id={`${idPrefix}-sticky-collection-${section.collection.id}-cell`} className={`portfolio-collection-heading-cell`}>
                      {collectionHeading(section, false, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                    {...reorder.groupHandlers(group, editingGroupNameKey === group.key)}
                    data-group-context-key={group.key}
                    onContextMenu={event => openGroupContextMenu(event, group)}
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
        style={{ marginTop: stickyHeaderReady ? -columnHeaderHeight : 0 }}
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
            hidden={hideColumnNames}
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
                  <tbody id={`portfolio-collection-${section.collection.id}-heading-body`} className={`portfolio-collection-heading-body`} data-portfolio-collection-key={section.collection.id}>
                    <tr id={`portfolio-collection-${section.collection.id}-heading-row`} className={`portfolio-collection-heading-row`}>
                      <th colSpan={columns.length + 4} scope={`rowgroup`} id={`portfolio-collection-${section.collection.id}-heading-cell`} className={`portfolio-collection-heading-cell`}>
                        {collectionHeading(section)}
                      </th>
                    </tr>
                  </tbody>
                  {section.groups.map(tableGroup)}
                  {!section.groups.length && collectionEmptyMessage(section) && (
                    <tbody id={`portfolio-collection-${section.collection.id}-empty-body`} className={`portfolio-collection-empty-body`} data-portfolio-collection-key={section.collection.id}>
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
                  {addCollectionDomainsRow(section)}
                  {addGroupRow(section.collection.id)}
                </Fragment>
              ))}
              <tbody id={`${idPrefix}-add-collection-body`} className={`portfolio-add-collection-body`}>
                <tr
                  inert={!preferences.showAddRows}
                  aria-hidden={!preferences.showAddRows || undefined}
                  data-collapsed={!preferences.showAddRows || undefined}
                  id={`${idPrefix}-add-collection-row`}
                  className={`portfolio-add-collection-row portfolio-collapse-row`}
                >
                  <td colSpan={columns.length + 4} id={`${idPrefix}-add-collection-cell`} className={`portfolio-add-collection-cell`}>
                    {addCollectionContent()}
                  </td>
                </tr>
              </tbody>
              {mainHeading && (
                <tbody id={`${idPrefix}-main-heading-body`} className={`portfolio-main-heading-body`}>
                  <tr id={`${idPrefix}-main-heading-row`} className={`portfolio-main-heading-row`}>
                    <th colSpan={columns.length + 4} scope={`rowgroup`} id={`${idPrefix}-main-heading-cell`} className={`portfolio-main-heading-cell`}>{mainHeading}</th>
                  </tr>
                </tbody>
              )}
              {renderedMainGroups.map(tableGroup)}
              {mainEmptyContent && (
                <tbody id={`${idPrefix}-empty-body`} className={`portfolio-empty-body`}>
                  <tr id={`${idPrefix}-empty-row`} className={`portfolio-empty-row`}>
                    <td colSpan={columns.length + 4} id={`${idPrefix}-empty-cell`} className={`portfolio-empty-cell`}>{mainEmptyContent}</td>
                  </tr>
                </tbody>
              )}
              {showMainContent && addGroupRow()}
            </>
          )}
        </table>
      </div>
      <DomainContextMenu {...contextMenu} branches={quickBranches} busy={menuDisabled} />
      <GroupContextMenu
        {...groupContextMenu}
        branches={destinationTree.branches.filter(branch => !branch.main)}
        collectionId={customGroupsById.get(groupContextMenu.menu?.group.id ?? ``)?.collectionId}
      />
      {groupPicker}
      {groupSettings}
      {menuFeedback}
    </div>
  );
};

export default PortfolioRecords;
