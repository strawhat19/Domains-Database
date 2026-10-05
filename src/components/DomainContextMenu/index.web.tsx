import './styles.scss';
import { X, Eye, Info, Layers3 } from 'lucide-react';
import type { useDomainContextMenu } from './useDomainContextMenu';

const options = [
  { key: `view`, icon: Eye, label: `View` },
  { key: `details`, icon: Info, label: `Details` },
  { key: `group`, icon: Layers3, label: `Group` },
  { key: `close`, icon: X, label: `Close` },
] as const;

type DomainContextMenuProps = ReturnType<typeof useDomainContextMenu>;

const DomainContextMenu = ({ menu, menuRef, activate, onKeyDown }: DomainContextMenuProps) => {
  if (!menu) return null;
  const scope = `domain-row-${menu.domain.id}-context-menu`;
  const target = menu.domains.length === 1 ? menu.domains[0]?.name : `${menu.domains.length} Selected Domains`;

  return (
    <div
      id={scope}
      role={`menu`}
      ref={menuRef}
      onKeyDown={onKeyDown}
      className={`domain-context-menu`}
      aria-label={`Actions for ${target}`}
      aria-describedby={`${scope}-target`}
      style={{ top: menu.y, left: menu.x }}
      onContextMenu={event => event.preventDefault()}
    >
      <p id={`${scope}-target`} className={`domain-context-menu-target`}>
        {target}
      </p>
      {options.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          type={`button`}
          role={`menuitem`}
          tabIndex={-1}
          id={`${scope}-${key}`}
          onClick={() => activate(key)}
          className={`domain-context-menu-item`}
          aria-haspopup={key === `group` ? `dialog` : undefined}
        >
          <Icon
            size={15}
            aria-hidden={`true`}
            id={`${scope}-${key}-icon`}
            className={`domain-context-menu-icon`}
          />
          <span id={`${scope}-${key}-label`} className={`domain-context-menu-label`}>
            {`${label}${menu.domains.length > 1 ? ` (${menu.domains.length})` : ``}`}
          </span>
        </button>
      ))}
    </div>
  );
};

export default DomainContextMenu;
