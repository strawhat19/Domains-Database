import './styles.scss';
import { Fragment } from 'react';
import { X, Settings, FolderTree } from 'lucide-react';
import type { useDomainContextMenu } from './useDomainContextMenu';
import PortfolioDestinationTree from '../PortfolioDestinationTree/index.web';
import type { DestinationBranch } from '../../shared/portfolioPreferences/destinationTree';

const options = [
  { key: `settings`, icon: Settings, label: `Settings` },
  { key: `group`, icon: FolderTree, label: `Move To`, description: `All destinations, new groups, and new collections` },
  { key: `close`, icon: X, label: `Close` },
] as const;

type DomainContextMenuProps = ReturnType<typeof useDomainContextMenu> & {
  busy?: boolean;
  branches: DestinationBranch[];
};

const DomainContextMenu = ({ menu, menuRef, disabled, activate, onKeyDown, branches, busy = false }: DomainContextMenuProps) => {
  if (!menu) return null;
  const scope = `domain-row-${menu.domain.id}-context-menu`;
  const target = menu.domains.length === 1 ? menu.domains[0]?.name : `${menu.domains.length} Selected Domains`;
  const unavailable = busy || disabled;

  return (
    <div
      id={scope}
      role={`menu`}
      ref={menuRef}
      onKeyDown={onKeyDown}
      className={`domain-context-menu domain-row-context-menu`}
      aria-label={`Actions for ${target}`}
      aria-describedby={`${scope}-target`}
      style={{ top: menu.y, left: menu.x }}
      onContextMenu={event => { event.preventDefault(); event.stopPropagation(); }}
    >
      <p id={`${scope}-target`} className={`domain-context-menu-target`}>
        {target}
      </p>
      {options.map(option => {
        const { key, icon: Icon, label } = option;
        const description = `description` in option ? option.description : undefined;
        return (
          <Fragment key={key}>
            <button
              type={`button`}
              role={`menuitem`}
              tabIndex={-1}
              id={`${scope}-${key}`}
              onClick={() => activate(key)}
              disabled={unavailable && key !== `close`}
              className={`domain-context-menu-item${description ? ` domain-context-menu-command` : ``}`}
              aria-describedby={description ? `${scope}-${key}-description` : undefined}
              title={key === `settings` ? `Settings For ${menu.domain.name}` : undefined}
              aria-haspopup={key === `group` || key === `settings` ? `dialog` : undefined}
            >
              <Icon
                size={15}
                aria-hidden={`true`}
                id={`${scope}-${key}-icon`}
                className={`domain-context-menu-icon`}
              />
              <span id={`${scope}-${key}-content`} className={`domain-context-menu-content`}>
                <span id={`${scope}-${key}-label`} className={`domain-context-menu-label`}>
                  {`${label}${key === `group` && menu.domains.length > 1 ? ` (${menu.domains.length})` : ``}`}
                </span>
                {description && <span id={`${scope}-${key}-description`} className={`domain-context-menu-description`}>{description}</span>}
              </span>
            </button>
            {key === `group` && branches.length > 0 && (
              <div
                id={`${scope}-destinations`}
                className={`domain-context-menu-destinations`}
              >
                <p id={`${scope}-destinations-label`} className={`domain-context-menu-destinations-label`}>{`Quick Move · Recent & Populated`}</p>
                <PortfolioDestinationTree
                  menu
                  compact
                  branches={branches}
                  disabled={unavailable}
                  id={`${scope}-destination-tree`}
                  labelId={`${scope}-destinations-label`}
                  onSelect={groupId => activate(`assign-group`, groupId)}
                  onSelectCollection={collectionId => activate(`assign-collection`, collectionId)}
                />
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

export default DomainContextMenu;
