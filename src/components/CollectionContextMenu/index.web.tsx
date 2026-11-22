import './styles.scss';
import '../DomainContextMenu/styles.scss';
import Toast from '../Toast/index.web';
import { createPortal } from 'react-dom';
import MobileSheetHandle from '../MobileSheet/index.web';
import DomainCollectionSettings from '../DomainCollectionSettings/index.web';
import type { CollectionMenuAction, useCollectionContextMenu } from './useCollectionContextMenu';
import type { PortfolioCollectionSection } from '../../shared/portfolioPreferences/types';
import { X, Eye, Copy, EyeOff, Pencil, Share2, Settings2, FolderPlus, ChevronsUp, ArrowDownAZ, ChevronsDown, GripVertical } from 'lucide-react';

interface CollectionContextMenuProps {
  idPrefix: string;
  sections: PortfolioCollectionSection[];
  state: ReturnType<typeof useCollectionContextMenu>;
}

const CollectionContextMenu = ({ state, sections, idPrefix }: CollectionContextMenuProps) => {
  const { menu, collection, dialog, sheet } = state;
  if (typeof document === `undefined`) return null;
  if (dialog && collection) return createPortal(
    <DomainCollectionSettings
      key={collection.id}
      collection={collection}
      onClose={state.closeDialog}
      editDescription={dialog.section === `description`}
      initialSection={dialog.section === `description` ? `general` : dialog.section}
      copySection={sections.find(section => section.collection.id === collection.id)}
    />, document.body,
  );
  if (state.error && !menu) return createPortal(
    <Toast id={`${idPrefix}-collection-menu-error`} message={state.error} onDismiss={state.clearError} />, document.body,
  );
  if (!menu || !collection) return null;
  const scope = `${idPrefix}-collection-${collection.id}-context-menu`;
  const manual = collection.sortField === null;
  const items = [
    { action: `general`, label: `Collection Settings`, Icon: Settings2 },
    { action: `new-group`, label: `New Group`, Icon: FolderPlus },
    { action: `description`, label: collection.description ? `Edit Description` : `Add Description`, Icon: Pencil },
    { action: `copy`, label: `Copy Collection`, Icon: Copy },
    { action: `sharing`, label: `Sharing & Actions`, Icon: Share2 },
    { action: `sort`, label: manual ? `Sort Alphabetically` : `Use Manual Order`, Icon: manual ? ArrowDownAZ : GripVertical },
    { action: `collapse`, label: state.collapsed ? `Expand Collection` : `Collapse Collection`, Icon: state.collapsed ? ChevronsDown : ChevronsUp },
    { action: `visibility`, label: state.hidden ? `Show Collection` : `Hide Collection`, Icon: state.hidden ? Eye : EyeOff },
  ] satisfies { action: CollectionMenuAction; label: string; Icon: typeof Settings2 }[];

  return createPortal(
    <div
      role={`presentation`}
      style={sheet.style}
      {...sheet.pressProps}
      id={`${scope}-backdrop`}
      className={`domain-context-menu-backdrop${sheet.className}`}
      onClick={event => { if (event.target === event.currentTarget) state.close(true); }}
    >
      <div
        id={scope}
        tabIndex={-1}
        role={`menu`}
        ref={state.menuRef}
        onKeyDown={state.onKeyDown}
        aria-labelledby={`${scope}-target`}
        style={{ top: menu.y, left: menu.x }}
        className={`domain-context-menu collection-context-menu`}
        onContextMenu={event => { event.preventDefault(); event.stopPropagation(); }}
      >
        <MobileSheetHandle id={scope} sheet={sheet} />
        <p id={`${scope}-target`} className={`domain-context-menu-target`}>{collection.name}</p>
        <div role={`group`} id={`${scope}-actions`} className={`collection-context-menu-actions`}>
          {items.map(({ action, label, Icon }) => (
            <button
              key={action}
              tabIndex={-1}
              type={`button`}
              role={`menuitem`}
              id={`${scope}-${action}`}
              disabled={state.disabled}
              onClick={() => state.activate(action)}
              className={`domain-context-menu-item`}
            >
              <Icon size={15} aria-hidden={`true`} id={`${scope}-${action}-icon`} className={`domain-context-menu-icon`} />
              <span id={`${scope}-${action}-label`} className={`domain-context-menu-label`}>{label}</span>
            </button>
          ))}
          <button
            tabIndex={-1}
            type={`button`}
            role={`menuitem`}
            id={`${scope}-close`}
            onClick={() => state.close(true)}
            className={`domain-context-menu-item`}
          >
            <X size={15} aria-hidden={`true`} id={`${scope}-close-icon`} className={`domain-context-menu-icon`} />
            <span id={`${scope}-close-label`} className={`domain-context-menu-label`}>{`Close`}</span>
          </button>
        </div>
      </div>
    </div>, document.body,
  );
};

export default CollectionContextMenu;
