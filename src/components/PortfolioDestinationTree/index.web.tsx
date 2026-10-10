import './styles.scss';
import { useState } from 'react';
import type { RefObject } from 'react';
import PortfolioCollapse from '../PortfolioCollapse/index.web';
import { Check, Folder, Layers3, Database, AppWindow, ChevronDown } from 'lucide-react';
import type { DestinationBranch } from '../../shared/portfolioPreferences/destinationTree';

interface PortfolioDestinationTreeProps {
  id: string;
  menu?: boolean;
  value?: string;
  compact?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  labelId?: string;
  describedBy?: string;
  collectionValue?: string;
  selectCollections?: boolean;
  branches: DestinationBranch[];
  onSelect: (id: string) => void;
  onSelectCollection?: (id: string) => void;
  choicesRef?: RefObject<HTMLDivElement | null>;
}

const PortfolioDestinationTree = ({ id, branches, onSelect, value, disabled, compact, menu, labelId, describedBy, invalid, choicesRef, collectionValue, onSelectCollection, selectCollections = false }: PortfolioDestinationTreeProps) => {
  const [collapsedBranches, setCollapsedBranches] = useState<Map<string, boolean>>(new Map());
  const setBranchCollapsed = (branchId: string, collapsed: boolean, branchElement?: HTMLElement | null) => {
    if (disabled) return;
    if (collapsed && branchElement?.querySelector(`.portfolio-collapse`)?.contains(document.activeElement)) {
      branchElement?.querySelector<HTMLButtonElement>(`[data-destination-disclosure]`)?.focus({ preventScroll: true });
    }
    setCollapsedBranches(current => {
      const next = new Map(current);
      next.set(branchId, collapsed);
      return next;
    });
  };

  return (
    <div
      id={id}
      role={`group`}
      ref={choicesRef}
      aria-labelledby={labelId}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={`portfolio-destination-tree${compact ? ` portfolio-destination-tree-compact` : ``}${menu ? ` portfolio-destination-tree-menu` : ``}`}
    >
      {branches.map(branch => {
        const BranchIcon = branch.main ? Database : Folder;
        const collapsed = collapsedBranches.get(branch.id) ?? selectCollections;
        const collectionDestination = selectCollections ? !branch.main : Boolean(onSelectCollection);
        const currentCollection = collectionDestination && (selectCollections ? value : collectionValue) === branch.id;
        const branchId = `${id}-branch-${encodeURIComponent(branch.id)}`;
        const branchDetails = `${branch.name}${branch.description ? ` — ${branch.description}` : ``}, ${branch.count} Domain(s)`;
        const branchContent = (
          <>
            <span id={`${branchId}-icon-wrap`} className={`portfolio-destination-tree-icon-wrap`}>
              <BranchIcon size={16} aria-hidden={`true`} id={`${branchId}-icon`} className={`portfolio-destination-tree-icon`} />
            </span>
            <span id={`${branchId}-copy`} className={`portfolio-destination-tree-copy`}>
              <span id={`${branchId}-name`} className={`portfolio-destination-tree-name`}>{branch.name}</span>
              {!compact && branch.description && (
                <span id={`${branchId}-description`} className={`portfolio-destination-tree-description`}>{branch.description}</span>
              )}
            </span>
            <span id={`${branchId}-count`} className={`portfolio-destination-tree-count`} aria-hidden={`true`}>{branch.count}</span>
            {currentCollection && (
              <Check size={15} aria-hidden={`true`} id={`${branchId}-selected`} className={`portfolio-destination-tree-selected`} />
            )}
          </>
        );
        const branchChevron = (
          <ChevronDown
            size={14}
            aria-hidden={`true`}
            id={`${branchId}-chevron`}
            className={`portfolio-destination-tree-chevron${collapsed ? ` portfolio-destination-tree-chevron-collapsed` : ``}`}
          />
        );
        return (
          <section
            role={`group`}
            key={branch.id}
            id={branchId}
            aria-labelledby={`${branchId}-name`}
            className={`portfolio-destination-tree-branch`}
            onKeyDown={event => {
              if (!menu || disabled || event.key !== `ArrowLeft` && event.key !== `ArrowRight`) return;
              event.preventDefault();
              event.stopPropagation();
              setBranchCollapsed(branch.id, event.key === `ArrowLeft`, event.currentTarget);
            }}
          >
            {collectionDestination ? (
              <div id={`${branchId}-header`} className={`portfolio-destination-tree-collection-header`}>
                <button
                  type={`button`}
                  title={branchDetails}
                  id={`${branchId}-select`}
                  disabled={disabled || selectCollections && currentCollection}
                  role={menu ? `menuitem` : undefined}
                  tabIndex={menu ? -1 : undefined}
                  onClick={() => selectCollections ? onSelect(branch.id) : onSelectCollection?.(branch.id)}
                  aria-pressed={!menu && !selectCollections ? currentCollection : undefined}
                  aria-current={currentCollection ? `true` : undefined}
                  data-autofocus={!menu && currentCollection && !disabled || undefined}
                  className={`portfolio-destination-tree-header portfolio-destination-tree-collection-select`}
                  aria-label={`${selectCollections ? currentCollection ? `Current Collection` : `Move Group To Collection` : `Move Domains To ${branch.main ? `Database` : `Collection`}`}: ${branchDetails}`}
                >
                  {branchContent}
                </button>
                <button
                  type={`button`}
                  disabled={disabled}
                  data-destination-disclosure
                  aria-expanded={!collapsed}
                  id={`${branchId}-disclosure`}
                  role={menu ? `menuitem` : undefined}
                  tabIndex={menu ? -1 : undefined}
                  aria-controls={`${branchId}-groups`}
                  className={`portfolio-destination-tree-disclosure`}
                  aria-label={`${collapsed ? `Expand` : `Collapse`} Groups In ${branchDetails}`}
                  title={`${collapsed ? `Expand` : `Collapse`} Groups In ${branch.name}`}
                  onClick={event => setBranchCollapsed(branch.id, !collapsed, event.currentTarget.closest<HTMLElement>(`.portfolio-destination-tree-branch`))}
                >
                  {branchChevron}
                </button>
              </div>
            ) : (
              <button
                type={`button`}
                title={branchDetails}
                disabled={disabled}
                aria-expanded={!collapsed}
                data-destination-disclosure
                id={`${branchId}-disclosure`}
                role={menu ? `menuitem` : undefined}
                tabIndex={menu ? -1 : undefined}
                aria-controls={`${branchId}-groups`}
                onClick={event => setBranchCollapsed(branch.id, !collapsed, event.currentTarget.parentElement)}
                className={`portfolio-destination-tree-header`}
                aria-label={`${collapsed ? `Expand` : `Collapse`} ${branchDetails}`}
              >
                {branchContent}
                {branchChevron}
              </button>
            )}
            <PortfolioCollapse id={`${branchId}-groups`} collapsed={collapsed}>
              <div id={`${branchId}-group-list`} className={`portfolio-destination-tree-groups`}>
                {branch.groups.map(group => {
                  const selected = !selectCollections && value === group.id;
                  const GroupIcon = group.isApp ? AppWindow : Layers3;
                  const groupId = `${branchId}-group-${encodeURIComponent(group.id)}`;
                  const groupDetails = `${group.name}${group.description ? ` — ${group.description}` : ``}, ${group.count} Domain(s)`;
                  const groupContent = (
                    <>
                      <span id={`${groupId}-icon-wrap`} className={`portfolio-destination-tree-icon-wrap`}>
                        <GroupIcon size={15} aria-hidden={`true`} id={`${groupId}-icon`} className={`portfolio-destination-tree-icon`} />
                      </span>
                      <span id={`${groupId}-copy`} className={`portfolio-destination-tree-copy`}>
                        <span id={`${groupId}-name`} className={`portfolio-destination-tree-name`}>{group.name}</span>
                        {!compact && group.description && (
                          <span id={`${groupId}-description`} className={`portfolio-destination-tree-description`}>{group.description}</span>
                        )}
                      </span>
                      <span
                        id={`${groupId}-count`}
                        className={`portfolio-destination-tree-count`}
                        title={`${group.count} Domain(s)`}
                        aria-hidden={selectCollections ? undefined : `true`}
                      >
                        {group.count}
                      </span>
                      {!menu && selected && (
                        <Check size={15} aria-hidden={`true`} id={`${groupId}-selected`} className={`portfolio-destination-tree-selected`} />
                      )}
                    </>
                  );
                  return (
                    <div key={group.id} id={`${groupId}-item`} className={`portfolio-destination-tree-group-item`}>
                      {selectCollections ? (
                        <span id={groupId} title={groupDetails} className={`portfolio-destination-tree-group portfolio-destination-tree-group-readonly`}>
                          {groupContent}
                        </span>
                      ) : (
                        <button
                          type={`button`}
                          id={groupId}
                          title={groupDetails}
                          disabled={disabled}
                          aria-label={groupDetails}
                          role={menu ? `menuitem` : undefined}
                          tabIndex={menu ? -1 : undefined}
                          onClick={() => onSelect(group.id)}
                          aria-pressed={menu ? undefined : selected}
                          data-autofocus={!menu && !collapsed && selected && !disabled || undefined}
                          className={`portfolio-destination-tree-group${selected ? ` portfolio-destination-tree-group-selected` : ``}`}
                        >
                          {groupContent}
                        </button>
                      )}
                    </div>
                  );
                })}
                {!branch.groups.length && (
                  <p id={`${branchId}-empty`} className={`portfolio-destination-tree-empty`}>{`No Groups`}</p>
                )}
              </div>
            </PortfolioCollapse>
          </section>
        );
      })}
    </div>
  );
};

export default PortfolioDestinationTree;
