import './styles.scss';
import { createPortal } from 'react-dom';
import { useRef, useEffect, useMemo, useState } from 'react';
import { useBoardMoves } from './useBoardMoves.web';
import { useBoardGestures } from './useBoardGestures.web';
import { useStickyBoardHeaders } from './useStickyBoardHeaders.web';
import { boardEntityProps, type BoardEntity, type MobilePortfolioBoardProps } from './types';
import DomainDescription from '../DomainDescription/index.web';
import DomainGroupPicker from '../DomainGroupPicker/index.web';
import DomainContextMenu from '../DomainContextMenu/index.web';
import PortfolioAddGroup from '../PortfolioAddGroup/index.web';
import MobilePortfolioCard from '../MobilePortfolioCard/index.web';
import PortfolioNameEditor from '../PortfolioNameEditor/index.web';
import DomainGroupSettings from '../DomainGroupSettings/index.web';
import PortfolioAddCollection from '../PortfolioAddCollection/index.web';
import MobilePortfolioDomain from '../MobilePortfolioDomain/index.web';
import DomainCollectionSettings from '../DomainCollectionSettings/index.web';
import { usePortfolioExpansion } from '../PortfolioRecords/usePortfolioExpansion';
import { useDomainContextMenu } from '../DomainContextMenu/useDomainContextMenu';
import { PORTFOLIO_PREVIEW_LIMIT, allowDomainsInCollections } from '../../shared/config';
import { portfolioHaptic } from '../../shared/common/haptics.web';
import { buildPortfolioDestinationTree } from '../../shared/portfolioPreferences/destinationTree';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import type { PortfolioGroup, PortfolioCollectionSection } from '../../shared/portfolioPreferences/types';
import { Plus, Folder, Ellipsis, GripVertical } from 'lucide-react';

const MobilePortfolioBoard = (props: MobilePortfolioBoardProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const preferences = usePortfolioPreferences();
  const expansion = usePortfolioExpansion();
  useStickyBoardHeaders(boardRef);
  const [editingGroupId, setEditingGroupId] = useState(``);
  const [editingCollectionId, setEditingCollectionId] = useState(``);
  const [groupingIds, setGroupingIds] = useState<string[] | null>(null);
  const [error, setError] = useState(``);
  useEffect(() => {
    if (preferences.loading) {
      setGroupingIds(null);
      setEditingGroupId(``);
      setEditingCollectionId(``);
      setError(``);
      return;
    }
    if (editingGroupId && !preferences.customGroups.some(group => group.id === editingGroupId)) setEditingGroupId(``);
    if (editingCollectionId && !preferences.collections.some(collection => collection.id === editingCollectionId)) setEditingCollectionId(``);
  }, [preferences.loading, preferences.customGroups, preferences.collections, editingGroupId, editingCollectionId]);
  const disabled = props.busy || props.loading || preferences.loading;
  const blocked = disabled || Boolean(editingGroupId || editingCollectionId || groupingIds);
  const domainMap = useMemo(() => new Map(props.allDomains.map(domain => [domain.id, domain])), [props.allDomains]);
  const tree = useMemo(() => buildPortfolioDestinationTree(props.allDomains, preferences.customGroups, preferences.collections), [props.allDomains, preferences.customGroups, preferences.collections]);
  const contextMenu = useDomainContextMenu((action, domains, clicked, targetId) => {
    setError(``);
    const ids = domains.map(domain => domain.id);
    if (action === `settings`) {
      const domain = domainMap.get(clicked.id);
      if (domain) props.onEdit(domain);
      else setError(`This Domain Is No Longer Available`);
      return;
    }
    if (!ids.length || ids.some(id => !domainMap.has(id))) {
      setError(`Some Selected Domains Are No Longer Available`);
      return;
    }
    if (action === `group`) { setGroupingIds(ids); return; }
    const saved = action === `assign-group` && targetId ? preferences.assignDomains(ids, targetId)
      : action === `assign-collection` && targetId && (targetId === `main` || allowDomainsInCollections) ? preferences.assignDomainsToCollection(ids, targetId === `main` ? null : targetId) : false;
    if (saved) props.onGrouped();
    else if (action === `assign-group` || action === `assign-collection`) setError(`Could Not Move Domain(s)`);
  }, blocked);
  const showActions = (source: BoardEntity, element: HTMLElement) => {
    if (blocked) return;
    portfolioHaptic(`tap`);
    if (source.kind === `collection`) setEditingCollectionId(source.id);
    else if (source.kind === `group`) setEditingGroupId(source.id);
    else {
      const domain = domainMap.get(source.id);
      if (!domain) return;
      const records = props.selectedIds.has(source.id) ? props.allDomains.filter(record => props.selectedIds.has(record.id)) : [domain];
      contextMenu.openFromKeyboard(element, domain, records);
    }
  };
  const drop = useBoardMoves(props, { disabled: blocked, onError: setError });
  const gestures = useBoardGestures({ onDrop: drop, onAction: showActions, surfaceRef: props.surfaceRef ?? boardRef, disabled: blocked || Boolean(contextMenu.menu) });
  const editingGroup = preferences.customGroups.find(group => group.id === editingGroupId);
  const editingCollection = preferences.collections.find(collection => collection.id === editingCollectionId);
  const boardGroups = [...props.sections.mainGroups, ...props.sections.collections.flatMap(section => section.groups)];
  const copyGroup = boardGroups.find(group => group.customGroupId === editingGroupId);
  const copySection = props.sections.collections.find(section => section.collection.id === editingCollectionId);
  const menuGroup = contextMenu.menu ? boardGroups.find(group => (
    group.key !== `all`
    && group.key !== `custom:ungrouped`
    && group.domains.some(domain => domain.id === contextMenu.menu?.domain.id)
  )) : undefined;
  const menuIndex = menuGroup?.domains.findIndex(domain => domain.id === contextMenu.menu?.domain.id) ?? -1;
  const menuSelection = contextMenu.menu && props.selectedIds.has(contextMenu.menu.domain.id) ? props.selectedIds : new Set([contextMenu.menu?.domain.id]);
  const previousMenuDomain = menuGroup?.domains.slice(0, menuIndex).reverse().find(domain => !menuSelection.has(domain.id));
  const nextMenuDomain = menuGroup?.domains.slice(menuIndex + 1).find(domain => !menuSelection.has(domain.id));
  const moveMenuDomain = (offset: number) => {
    const domain = contextMenu.menu?.domain;
    const target = offset > 0 ? nextMenuDomain : previousMenuDomain;
    if (!domain || !target || !menuGroup) return;
    const collectionId = preferences.customGroups.find(group => group.id === menuGroup.customGroupId)?.collectionId ?? menuGroup.directCollectionId;
    drop(
      { id: domain.id, kind: `domain`, label: domain.name, groupKey: menuGroup.key, collectionId },
      { id: target.id, kind: `domain`, label: target.name, groupKey: menuGroup.key, collectionId },
      offset > 0,
    );
  };
  const previewIds = useMemo(() => props.compact ? new Set([
    ...props.sections.mainGroups.flatMap(group => group.domains).slice(0, PORTFOLIO_PREVIEW_LIMIT),
    ...props.sections.collections.flatMap(section => section.domains.slice(0, PORTFOLIO_PREVIEW_LIMIT)),
  ].map(domain => domain.id)) : null, [props.compact, props.sections]);
  const limit = (domains: MobilePortfolioBoardProps[`allDomains`]) => previewIds ? domains.filter(domain => previewIds.has(domain.id)) : domains;
  const renderDomains = (group: PortfolioGroup, collectionId?: string) => limit(group.domains).map((domain, index) => !props.visibleDomainIds || props.visibleDomainIds.has(domain.id) ? (
    <MobilePortfolioDomain
      key={domain.id}
      domain={domain}
      busy={disabled}
      position={index + 1}
      groupKey={group.key}
      onEdit={props.onEdit}
      onSelect={props.onSelect}
      collectionId={collectionId}
      selected={props.selectedIds.has(domain.id)}
      onChangeDescription={props.onChangeDescription}
      onChangeProjectStatus={props.onChangeProjectStatus}
      onActions={element => showActions({ id: domain.id, label: domain.name, kind: `domain` }, element)}
    />
  ) : null);
  const renderGroup = (group: PortfolioGroup, siblings: PortfolioGroup[], collectionId?: string) => {
    if (!group.customGroupId) return renderDomains(group, collectionId);
    const index = siblings.findIndex(item => item.customGroupId === group.customGroupId);
    return (
      <MobilePortfolioCard
        key={group.key}
        group={group}
        busy={disabled}
        collectionId={collectionId}
        collapsed={expansion.isGroupCollapsed(group.key)}
        onToggle={() => expansion.toggleGroup(group.key)}
        onSettings={() => {
          portfolioHaptic(`tap`);
          setEditingGroupId(group.customGroupId!);
        }}
        onMoveUp={index > 0 && siblings[index - 1]?.customGroupId
          ? () => preferences.moveGroup(group.customGroupId!, siblings[index - 1].customGroupId!) : undefined}
        onMoveDown={index < siblings.length - 1 && siblings[index + 1]?.customGroupId
          ? () => preferences.moveGroup(group.customGroupId!, siblings[index + 1].customGroupId!, `after`) : undefined}
      >
        {renderDomains(group, collectionId)}
      </MobilePortfolioCard>
    );
  };
  const renderColumn = (section: PortfolioCollectionSection, index: number) => {
    const { groups, collection } = section;
    const { id } = collection;
    const scope = `mobile-collection-${id}`;
    const siblings = groups.filter(group => Boolean(group.customGroupId));
    const collapsed = expansion.isCollectionCollapsed(id);
    const entity: BoardEntity = { id, kind: `collection`, label: collection.name };
    return (
      <section
        key={id}
        id={scope}
        className={`mobile-board-column`}
        aria-labelledby={`${scope}-name`}
        {...boardEntityProps(entity, false)}
      >
        <header
          tabIndex={0}
          id={`${scope}-header`}
          className={`mobile-board-column-header`}
          aria-describedby={`mobile-board-keyboard-help`}
          onKeyDown={event => {
            if (disabled || event.target !== event.currentTarget) return;
            if (event.key === `Enter` || event.key === `ContextMenu` || event.shiftKey && event.key === `F10`) {
              event.preventDefault();
              showActions(entity, event.currentTarget);
              return;
            }
            if (!event.altKey || ![`ArrowLeft`, `ArrowRight`].includes(event.key)) return;
            event.preventDefault();
            const after = event.key === `ArrowRight`;
            const target = props.sections.collections[index + (after ? 1 : -1)];
            if (target && preferences.moveCollection(id, target.collection.id, after ? `after` : `before`)) portfolioHaptic(`drop`);
          }}
          {...boardEntityProps(entity)}
        >
          <Folder
            size={17}
            aria-hidden={`true`}
            id={`${scope}-icon`}
            className={`mobile-board-folder`}
          />
          <PortfolioNameEditor
            dragHandle
            busy={disabled}
            kind={`Collection`}
            id={`${scope}-name`}
            value={collection.name}
            onSave={name => preferences.renameCollection(id, name)}
          />
          <button
            type={`button`}
            id={`${scope}-count`}
            disabled={disabled}
            aria-expanded={!collapsed}
            aria-controls={`${scope}-body`}
            className={`mobile-board-count mobile-board-count-toggle`}
            onClick={() => expansion.toggleCollection(id)}
            aria-label={`${collapsed ? `Expand` : `Collapse`} ${collection.name}: ${section.domains.length} Domains`}
          >
            {section.domains.length}
          </button>
          <button
            type={`button`}
            disabled={disabled}
            id={`${scope}-settings`}
            aria-haspopup={`dialog`}
            className={`mobile-board-icon`}
            aria-label={`Actions For ${collection.name}`}
            onClick={() => {
              portfolioHaptic(`tap`);
              setEditingCollectionId(id);
            }}
          >
            <Ellipsis
              size={19}
              aria-hidden={`true`}
              id={`${scope}-settings-icon`}
              className={`mobile-board-column-settings-icon`}
            />
          </button>
        </header>
        {collection.description?.trim() && !collapsed && (
          <div id={`${scope}-description-wrap`} className={`mobile-board-column-description`}>
            <DomainDescription
              busy={disabled}
              id={`${scope}-description`}
              domainName={collection.name}
              value={collection.description}
              onSave={async value => preferences.updateCollection(id, collection.name, value)}
            />
          </div>
        )}
        <div
          hidden={collapsed}
          id={`${scope}-body`}
          data-board-scroll={`vertical`}
          className={`mobile-board-column-body`}
        >
          {groups.map(group => renderGroup(group, siblings, id))}
          {!groups.length && (
            <p id={`${scope}-empty`} className={`mobile-board-drop-hint`}>
              {allowDomainsInCollections ? `Drop Groups, Apps Or Domains Here` : `Drop Groups Or Apps Here`}
            </p>
          )}
          {preferences.showAddRows && (
            <details id={`${scope}-add-group`} className={`mobile-board-composer`}>
              <summary id={`${scope}-add-group-toggle`} className={`mobile-board-add-button`}>
                <Plus size={16} aria-hidden={`true`} id={`${scope}-add-group-icon`} className={`mobile-board-add-icon`} />
                <span id={`${scope}-add-group-label`} className={`mobile-board-add-label`}>{`Add Group`}</span>
              </summary>
              <PortfolioAddGroup idPrefix={scope} collectionId={id} disabled={disabled} />
            </details>
          )}
        </div>
      </section>
    );
  };

  return (
    <div
      ref={boardRef}
      role={`region`}
      id={`mobile-portfolio-board`}
      aria-busy={props.loading}
      aria-label={`Collections Board`}
      className={`mobile-portfolio-board`}
    >
      <p id={`mobile-board-keyboard-help`} className={`portfolio-sr-only`}>
        {`Swipe horizontally to browse collections. Hold a header or row, then move to drag. Hold a row or use its actions button for settings. On a focused collection header, use Alt and Left or Right to move it, or Enter for actions.`}
      </p>
      {error && (
        <p role={`alert`} id={`mobile-board-error`} className={`mobile-board-error`}>
          {error}
        </p>
      )}
      <p
        role={`status`}
        aria-live={`polite`}
        aria-atomic={`true`}
        id={`mobile-board-move-status`}
        className={`portfolio-sr-only`}
      >
        {gestures.announcement}
      </p>
      {props.loading ? (
        <div role={`status`} id={`mobile-board-loading`} className={`mobile-board-loading`}>
          {`Loading Domains…`}
        </div>
      ) : (
        <>
          <div
            data-board-scroll={`horizontal`}
            id={`mobile-board-columns-list`}
            className={`mobile-board-columns`}
          >
            {props.sections.collections.map(renderColumn)}
            {preferences.showAddRows && (
              <details id={`mobile-board-add-collection`} className={`mobile-board-add-collection mobile-board-composer`}>
                <summary id={`mobile-board-add-collection-toggle`} className={`mobile-board-add-button`}>
                  <Plus size={17} aria-hidden={`true`} id={`mobile-board-add-collection-icon`} className={`mobile-board-add-icon`} />
                  <span id={`mobile-board-add-collection-label`} className={`mobile-board-add-label`}>{`Add Collection`}</span>
                </summary>
                <PortfolioAddCollection idPrefix={`mobile-board`} disabled={disabled} />
              </details>
            )}
          </div>
        </>
      )}
      {typeof document !== `undefined` && createPortal(
        <>
          {gestures.preview && (
            <div
              ref={gestures.previewRef}
              aria-hidden={`true`}
              id={`mobile-board-drag-preview`}
              className={`mobile-board-drag-preview`}
              style={{ left: gestures.preview.x + 12, top: gestures.preview.y + 12 }}
            >
              <GripVertical
                size={18}
                aria-hidden={`true`}
                id={`mobile-board-drag-preview-icon`}
                className={`mobile-board-drag-preview-icon`}
              />
              <span id={`mobile-board-drag-preview-label`} className={`mobile-board-drag-preview-label`}>
                {gestures.preview.source.label}
              </span>
            </div>
          )}
          {editingGroup && (
            <DomainGroupSettings
              group={editingGroup}
              copyGroup={copyGroup}
              onClose={() => setEditingGroupId(``)}
            />
          )}
          {editingCollection && (
            <DomainCollectionSettings
              collection={editingCollection}
              copySection={copySection}
              onClose={() => setEditingCollectionId(``)}
            />
          )}
          {groupingIds && (
            <DomainGroupPicker
              onGrouped={props.onGrouped}
              onClose={() => setGroupingIds(null)}
              domains={props.allDomains.filter(domain => groupingIds.includes(domain.id))}
            />
          )}
          <DomainContextMenu
            {...contextMenu}
            busy={disabled}
            branches={tree.branches}
            onMoveUp={previousMenuDomain ? () => moveMenuDomain(-1) : undefined}
            onMoveDown={nextMenuDomain ? () => moveMenuDomain(1) : undefined}
          />
        </>,
        document.body,
      )}
    </div>
  );
};

export default MobilePortfolioBoard;
