import './styles.scss';
import type { ReactNode } from 'react';
import { AppWindow, Layers, MoreHorizontal } from 'lucide-react';
import { boardEntityProps } from '../MobilePortfolioBoard/types';
import DomainDescription from '../DomainDescription/index.web';
import PortfolioCollapse from '../PortfolioCollapse/index.web';
import DomainProjectBadge from '../DomainProjectBadge/index.web';
import PortfolioNameEditor from '../PortfolioNameEditor/index.web';
import type { PortfolioGroup } from '../../shared/portfolioPreferences/types';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

interface MobilePortfolioCardProps {
  busy: boolean;
  group: PortfolioGroup;
  collapsed: boolean;
  collectionId?: string;
  children: ReactNode;
  onSettings: () => void;
  onToggle: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const MobilePortfolioCard = ({
  busy,
  group,
  children,
  onToggle,
  onMoveUp,
  collapsed,
  onSettings,
  onMoveDown,
  collectionId,
}: MobilePortfolioCardProps) => {
  const preferences = usePortfolioPreferences();
  const id = `mobile-group-${group.customGroupId}`;
  const Icon = group.isApp ? AppWindow : Layers;
  const hasDescription = Boolean(group.description?.trim());
  const hasProjectStatus = Boolean(group.projectStatus && group.projectStatus !== `Future`);
  const entity = {
    kind: `group` as const,
    collectionId,
    label: group.label,
    groupKey: group.key,
    id: group.customGroupId!,
  };

  return (
    <section
      id={id}
      className={`mobile-group-card`}
      data-board-group-expanded={!collapsed}
      aria-labelledby={`${id}-name`}
      {...boardEntityProps(entity, false)}
    >
      <header
        tabIndex={0}
        id={`${id}-header`}
        className={`mobile-group-header`}
        aria-describedby={`mobile-board-keyboard-help`}
        {...boardEntityProps(entity)}
        onKeyDown={event => {
          if (busy || event.target !== event.currentTarget) return;
          if (event.key === `Enter` || event.key === `ContextMenu` || event.shiftKey && event.key === `F10`) {
            event.preventDefault();
            event.stopPropagation();
            onSettings();
          } else if (event.altKey && (event.key === `ArrowUp` || event.key === `ArrowDown`)) {
            event.preventDefault();
            event.stopPropagation();
            if (event.key === `ArrowUp`) onMoveUp?.();
            else onMoveDown?.();
          }
        }}
      >
        <Icon size={14} aria-hidden={`true`} id={`${id}-icon`} className={`mobile-group-icon`} />
        <PortfolioNameEditor
          dragHandle
          busy={busy}
          kind={`Group`}
          value={group.label}
          id={`${id}-name`}
          onSave={name => preferences.renameGroup(group.customGroupId!, name)}
        />
        {hasProjectStatus && (
          <DomainProjectBadge
            disabled={busy}
            id={`${id}-status`}
            field={`projectStatus`}
            value={group.projectStatus}
            className={`mobile-group-project-status`}
            editLabel={`Change Status For ${group.label}`}
            onChange={value => preferences.updateGroupProjectStatus(group.customGroupId!, value)}
          />
        )}
        <button
          type={`button`}
          disabled={busy}
          onClick={onToggle}
          id={`${id}-count`}
          aria-expanded={!collapsed}
          className={`mobile-group-domain-count`}
          aria-controls={`${id}-domains`}
          aria-label={`${collapsed ? `Show` : `Hide`} ${group.domains.length} Domain(s) In ${group.label}`}
        >
          <span id={`${id}-count-value`} className={`mobile-group-count-value`}>
            {group.domains.length}
          </span>
        </button>
        <button
          type={`button`}
          disabled={busy}
          onClick={onSettings}
          id={`${id}-actions`}
          aria-haspopup={`dialog`}
          aria-label={`Actions For ${group.label}`}
          className={`mobile-board-icon mobile-group-actions portfolio-group-settings`}
        >
          <MoreHorizontal
            size={18}
            aria-hidden={`true`}
            id={`${id}-actions-icon`}
            className={`mobile-group-actions-icon`}
          />
        </button>
      </header>
      {hasDescription && (
        <div id={`${id}-summary`} className={`mobile-group-summary`}>
          <DomainDescription
            busy={busy}
            id={`${id}-description`}
            domainName={group.label}
            value={group.description}
            onSave={async value => preferences.updateGroup(group.customGroupId!, group.label, value)}
          />
        </div>
      )}
      <PortfolioCollapse id={`${id}-domains`} collapsed={collapsed}>
        <div id={`${id}-domain-list`} className={`mobile-group-domains`}>
          {children}
        </div>
      </PortfolioCollapse>
    </section>
  );
};

export default MobilePortfolioCard;
