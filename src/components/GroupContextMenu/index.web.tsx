import './styles.scss';
import '../DomainContextMenu/styles.scss';
import { X, Layers, Trash2, AppWindow, FolderPlus } from 'lucide-react';
import type { useGroupContextMenu } from './useGroupContextMenu';
import PortfolioDestinationTree from '../PortfolioDestinationTree/index.web';
import { getRecentPortfolioItems } from '../../shared/portfolioPreferences/recent';
import type { DestinationBranch } from '../../shared/portfolioPreferences/destinationTree';

type GroupContextMenuProps = ReturnType<typeof useGroupContextMenu> & {
  collectionId?: string;
  branches: DestinationBranch[];
};

const GroupContextMenu = ({ menu, close, menuRef, disabled, activate, onKeyDown, branches, collectionId }: GroupContextMenuProps) => {
  if (!menu) return null;
  const ConvertIcon = menu.group.isApp ? Layers : AppWindow;
  const scope = `portfolio-group-${menu.group.id}-context-menu`;
  const convertLabel = menu.group.isApp ? `Convert To Group` : `Convert To App`;
  const convertAction = menu.group.isApp ? `convert-to-group` : `convert-to-app`;
  const orderedBranches = [...getRecentPortfolioItems(branches.filter(branch => !branch.main), branches.length), ...branches.filter(branch => branch.main)];

  return (
    <div
      id={scope}
      role={`menu`}
      ref={menuRef}
      onKeyDown={onKeyDown}
      style={{ top: menu.y, left: menu.x }}
      aria-describedby={`${scope}-target`}
      aria-label={`Actions For ${menu.group.name}`}
      className={`domain-context-menu group-context-menu`}
      onContextMenu={event => { event.preventDefault(); event.stopPropagation(); }}
    >
      <p id={`${scope}-target`} className={`domain-context-menu-target`}>
        {menu.group.name}
      </p>
      {!menu.group.isApp && (
        <button
          type={`button`}
          role={`menuitem`}
          tabIndex={-1}
          disabled={disabled}
          id={`${scope}-delete`}
          onClick={() => activate(`delete`)}
          aria-label={`Delete Group ${menu.group.name}`}
          className={`domain-context-menu-item group-context-menu-delete`}
        >
          <Trash2 size={15} aria-hidden={`true`} id={`${scope}-delete-icon`} className={`domain-context-menu-icon`} />
          <span id={`${scope}-delete-label`} className={`domain-context-menu-label`}>{`Delete Group`}</span>
        </button>
      )}
      <button
        type={`button`}
        role={`menuitem`}
        tabIndex={-1}
        disabled={disabled}
        id={`${scope}-${convertAction}`}
        className={`domain-context-menu-item`}
        onClick={() => activate(convertAction)}
      >
        <ConvertIcon
          size={15}
          aria-hidden={`true`}
          id={`${scope}-${convertAction}-icon`}
          className={`domain-context-menu-icon`}
        />
        <span id={`${scope}-${convertAction}-label`} className={`domain-context-menu-label`}>
          {convertLabel}
        </span>
      </button>
      <button
        type={`button`}
        role={`menuitem`}
        tabIndex={-1}
        disabled={disabled}
        onClick={() => activate(`convert`)}
        id={`${scope}-convert-to-collection`}
        className={`domain-context-menu-item`}
      >
        <FolderPlus
          size={15}
          aria-hidden={`true`}
          className={`domain-context-menu-icon`}
          id={`${scope}-convert-to-collection-icon`}
        />
        <span id={`${scope}-convert-to-collection-label`} className={`domain-context-menu-label`}>
          {`Convert To Collection`}
        </span>
      </button>
      <div id={`${scope}-destinations`} className={`domain-context-menu-destinations group-context-menu-destinations`}>
        <p id={`${scope}-destinations-label`} className={`domain-context-menu-destinations-label`}>{`Move To Collection · Newest First`}</p>
        {branches.length ? (
          <PortfolioDestinationTree
            menu
            compact
            selectCollections
            branches={orderedBranches}
            value={collectionId}
            disabled={disabled}
            id={`${scope}-destination-tree`}
            labelId={`${scope}-destinations-label`}
            onSelect={id => activate(`assign-collection`, id)}
          />
        ) : (
          <p id={`${scope}-destinations-empty`} className={`portfolio-destination-tree-empty`}>{`No Collections Yet`}</p>
        )}
      </div>
      <button
        type={`button`}
        role={`menuitem`}
        tabIndex={-1}
        id={`${scope}-close`}
        onClick={() => close(true)}
        className={`domain-context-menu-item`}
      >
        <X size={15} aria-hidden={`true`} id={`${scope}-close-icon`} className={`domain-context-menu-icon`} />
        <span id={`${scope}-close-label`} className={`domain-context-menu-label`}>{`Close`}</span>
      </button>
    </div>
  );
};

export default GroupContextMenu;
