import './styles.scss';
import type { MouseEventHandler } from 'react';
import LinkSiteIcon from '../LinkSiteIcon/index.web';
import DomainSiteIcon from '../DomainSiteIcon/index.web';
import { getDomainSource } from '../../shared/domainUtils';
import DomainStarButton from '../DomainStarButton/index.web';
import PortfolioCollapse from '../PortfolioCollapse/index.web';
import DomainDescription from '../DomainDescription/index.web';
import DomainSourceBadge from '../DomainSourceBadge/index.web';
import DomainProjectBadge from '../DomainProjectBadge/index.web';
import DomainVisibilityButton from '../DomainVisibilityButton/index.web';
import { getCustomSiteIconUrl } from '../../shared/domainSiteIcon';
import type { DomainItemProps, DomainDragProps } from './domainRow';
import { useDomainAttentionPosition } from './useDomainAttentionPosition.web';
import { Check, Minus, ArrowUp, Settings, ArrowDown, GripVertical } from 'lucide-react';
import { getDomainPreviewLink, getDomainGithubRepoLink } from '../../shared/domainLinks';
import { getDomainRow, getDomainColumnKey, getDomainSkeletonKey, getDomainRenewalDetail, isDomainSelectionTarget, getDomainSelectionHandlers } from './domainRow';
import {
  DEFAULT_VISIBLE_COLUMNS,
  getPortfolioColumnDisplay,
  getPortfolioColumnValue,
  getOrderedPortfolioColumns,
  getWebsiteInsightsHint,
  type PortfolioColumn,
} from '../../shared/portfolioColumns';

export interface DomainRowProps extends DomainItemProps, DomainDragProps<HTMLTableRowElement> {
  collapsed?: boolean;
  showCosts?: boolean;
  onContextMenu?: MouseEventHandler<HTMLTableRowElement>;
  onChangeDescription: (domain: DomainItemProps[`domain`], description: string) => Promise<boolean>;
  onChangeProjectStatus: (domain: DomainItemProps[`domain`], status: DomainItemProps[`domain`][`projectStatus`]) => void;
}

const DomainRow = ({
  busy,
  domain,
  position,
  onEdit,
  onDrop,
  selected,
  dragging,
  dropTarget,
  onSelect,
  onMoveUp,
  draggable,
  onDragEnd,
  onDragOver,
  onDragStart,
  onMoveDown,
  onContextMenu,
  onToggleAutoRenew,
  onChangeDescription,
  onChangeProjectStatus,
  selectionDescriptionId,
  collapsed = false,
  showCosts = false,
  reorderable = draggable,
  hideProjectDetails = false,
  visibleColumns = DEFAULT_VISIBLE_COLUMNS,
}: DomainRowProps) => {
  const { scope, status, lastDot, statusKey, registrarKey } = getDomainRow(domain);
  const needsAttention = !hideProjectDetails && status !== `Active`;
  const previewLink = getDomainPreviewLink(domain);
  const githubRepoLink = getDomainGithubRepoLink(domain);
  const autoRenew = getPortfolioColumnValue(domain, `autoRenew`);
  const registrarManaged = getDomainSource(domain) === `registrar`;
  const columns = getOrderedPortfolioColumns(visibleColumns);
  const renewalDetail = getDomainRenewalDetail(domain, showCosts);
  const rowRef = useDomainAttentionPosition(needsAttention, `${reorderable}:${visibleColumns.join(`|`)}`);
  const selectionHandlers = getDomainSelectionHandlers(domain.id, !!selected, onSelect);

  const handleRowClick: MouseEventHandler<HTMLTableRowElement> = event => {
    if (busy || collapsed || !onSelect || !isDomainSelectionTarget(event.target, event.currentTarget)) return;
    onSelect(domain.id, !selected, event.shiftKey);
    event.currentTarget.querySelector<HTMLInputElement>(`.domain-selection`)?.focus({ preventScroll: true });
  };

  const handleRowMouseDown: MouseEventHandler<HTMLTableRowElement> = event => {
    if (busy || collapsed || !onSelect || event.button !== 0 || !event.shiftKey) return;
    if (isDomainSelectionTarget(event.target, event.currentTarget)) event.preventDefault();
  };

  const renderColumn = (field: PortfolioColumn) => {
    if (hideProjectDetails && (field === `status` || field === `projectStatus`)) return null;
    switch (field) {
      case `name`:
        return (
          <div id={`${scope}-identity`} className={`domain-identity`}>
            {reorderable && (
              <div id={`${scope}-reorder`} className={`domain-reorder`}>
                <span id={`${scope}-drag-handle`} className={`domain-drag-handle`} title={`Drag to reorder ${domain.name}`}>
                  <GripVertical size={14} aria-hidden={`true`} id={`${scope}-drag-handle-icon`} className={`domain-drag-handle-icon`} />
                </span>
                <div id={`${scope}-move-actions`} className={`domain-move-actions`}>
                  <button
                    type={`button`}
                    id={`${scope}-move-up`}
                    className={`domain-move-action`}
                    disabled={busy || !onMoveUp}
                    onClick={() => onMoveUp?.(domain)}
                    title={`Move ${domain.name} up`}
                    aria-label={`Move ${domain.name} up`}
                  >
                    <ArrowUp size={11} aria-hidden={`true`} id={`${scope}-move-up-icon`} className={`domain-move-action-icon`} />
                  </button>
                  <button
                    type={`button`}
                    id={`${scope}-move-down`}
                    className={`domain-move-action`}
                    disabled={busy || !onMoveDown}
                    onClick={() => onMoveDown?.(domain)}
                    title={`Move ${domain.name} down`}
                    aria-label={`Move ${domain.name} down`}
                  >
                    <ArrowDown size={11} aria-hidden={`true`} id={`${scope}-move-down-icon`} className={`domain-move-action-icon`} />
                  </button>
                </div>
              </div>
            )}
            <DomainSiteIcon
              disabled={busy}
              fallback={`link`}
              domain={domain.name}
              id={`${scope}-symbol`}
              onEdit={() => onEdit(domain)}
              iconUrl={getCustomSiteIconUrl(domain)}
              editLabel={`Add A Logo Or Site Icon For ${domain.name}`}
            />
            <div id={`${scope}-name-copy`} className={`domain-name-copy`}>
              <div id={`${scope}-name-heading`} className={`domain-name-heading`}>
                <a
                  target={`_blank`}
                  draggable={false}
                  id={`${scope}-name`}
                  rel={`noopener noreferrer`}
                  href={`https://${domain.name}`}
                  className={`domain-name domain-site-link`}
                  aria-label={`Open ${domain.name} in a new tab${needsAttention ? ` — Needs Attention: ${status}` : ``}`}
                >
                  <span id={`${scope}-site-link-label`} className={`domain-site-link-label`}>
                    {domain.name.slice(0, lastDot)}
                    <span id={`${scope}-extension`} className={`domain-extension`}>
                      {domain.name.slice(lastDot)}
                    </span>
                  </span>
                </a>
                {!hideProjectDetails && previewLink && (
                  <a
                    target={`_blank`}
                    draggable={false}
                    href={previewLink}
                    rel={`noopener noreferrer`}
                    id={`${scope}-preview-link`}
                    className={`domain-preview-link`}
                    title={`Preview ${domain.name}`}
                    aria-label={`Open Preview For ${domain.name} In A New Tab`}
                  >
                    <LinkSiteIcon size={13} url={previewLink} id={`${scope}-preview-icon`} />
                  </a>
                )}
                {githubRepoLink && (
                  <a
                    target={`_blank`}
                    draggable={false}
                    href={githubRepoLink}
                    rel={`noopener noreferrer`}
                    id={`${scope}-github-repo-link`}
                    className={`domain-github-link`}
                    title={`GitHub Repository For ${domain.name}`}
                    aria-label={`Open GitHub Repository For ${domain.name} In A New Tab`}
                  >
                    <LinkSiteIcon size={13} url={githubRepoLink} id={`${scope}-github-icon`} />
                  </a>
                )}
                {!hideProjectDetails && (
                  <DomainProjectBadge
                    disabled={busy}
                    field={`projectStatus`}
                    value={domain.projectStatus}
                    id={`${scope}-project-status`}
                    className={`domain-project-status`}
                    editLabel={`Change Project Status For ${domain.name}`}
                    onChange={value => onChangeProjectStatus(domain, value)}
                  />
                )}
              </div>
              {!hideProjectDetails && (
                <DomainDescription
                  busy={busy}
                  id={`${scope}-description`}
                  domainName={domain.name}
                  value={domain.description}
                  onReadMore={() => onEdit(domain)}
                  onSave={value => onChangeDescription(domain, value)}
                />
              )}
            </div>
          </div>
        );
      case `difficulty`:
        return (
          <DomainProjectBadge
            field={field}
            value={domain[field]}
            id={`${scope}-${getDomainColumnKey(field)}-value`}
            className={`domain-column-value-${getDomainColumnKey(field)}`}
          />
        );
      case `registrar`:
        return (
          <div id={`${scope}-registrar`} className={`domain-registrar`}>
            <span id={`${scope}-registrar-mark`} className={`registrar-mark registrar-mark-${registrarKey}`} aria-hidden={`true`}>
              {domain.registrar.charAt(0) || `?`}
            </span>
            <div id={`${scope}-registrar-copy`} className={`domain-registrar-copy`}>
              <span id={`${scope}-registrar-name`} className={`domain-registrar-name`}>
                {domain.registrar || `—`}
              </span>
              {!hideProjectDetails && (
                <DomainSourceBadge domain={domain} id={`${scope}-source-status`} />
              )}
            </div>
          </div>
        );
      case `expiresAt`:
        return (
          <>
            <span id={`${scope}-renewal-date`} className={`domain-renewal-date`}>
              {getPortfolioColumnDisplay(domain, field)}
            </span>
            {!hideProjectDetails && (
              <span
                title={renewalDetail.hint}
                id={`${scope}-${renewalDetail.isCost ? `renewal-estimate` : `status`}`}
                className={`rowStatus rowStatus-${statusKey}${renewalDetail.isCost ? ` domain-renewal-estimate` : ``}`}
              >
                {!renewalDetail.isCost && (
                  <span id={`${scope}-status-dot-wrap`} className={`statusDotWrap`} aria-hidden={`true`}>
                    <span id={`${scope}-status-dot`} className={`statusDot`} />
                  </span>
                )}
                <span id={`${scope}-${renewalDetail.isCost ? `renewal-estimate` : `status`}-text`} className={`statusText`}>
                  {renewalDetail.isCost ? renewalDetail.text.split(/(\p{Sc})/u).map((part, index) => /\p{Sc}/u.test(part) ? (
                    <span key={index} id={`${scope}-renewal-currency-${index}`} className={`domain-renewal-currency`}>{part}</span>
                  ) : part) : renewalDetail.text}
                </span>
              </span>
            )}
          </>
        );
      case `autoRenew`:
        return (
          <button
            type={`button`}
            role={autoRenew === undefined ? `button` : `switch`}
            disabled={busy || registrarManaged}
            aria-checked={autoRenew === undefined ? undefined : autoRenew === true}
            id={`${scope}-auto-renew-toggle`}
            aria-label={registrarManaged ? `Auto-Renew For ${domain.name}, Managed By Your Registrar` : `Mark Auto-Renew ${domain.autoRenew ? `Off` : `On`} For ${domain.name}`}
            onClick={registrarManaged ? undefined : () => onToggleAutoRenew(domain)}
            title={registrarManaged ? `Managed By Your Connected Registrar` : autoRenew === undefined ? `Registrar Auto-Renew Is Unknown — Click To Update Your Inventory Record` : `This is a record of your registrar setting`}
            className={`domain-auto-renew domain-auto-renew-${autoRenew === true ? `on` : `off`}`}
          >
            {autoRenew === true
              ? <Check size={13} aria-hidden={`true`} id={`${scope}-auto-renew-icon`} className={`domain-auto-renew-icon`} />
              : <Minus size={13} aria-hidden={`true`} id={`${scope}-auto-renew-icon`} className={`domain-auto-renew-icon`} />}
            <span id={`${scope}-auto-renew-text`} className={`domain-auto-renew-text`}>
              {autoRenew === undefined ? `Unknown` : autoRenew ? `On` : `Off`}
            </span>
          </button>
        );
      case `renewalPrice`:
        return (
          <span id={`${scope}-annual-cost`} className={`domain-annual-cost`}>
            {getPortfolioColumnDisplay(domain, field)}
          </span>
        );
      default: {
        const key = getDomainColumnKey(field);
        const value = getPortfolioColumnDisplay(domain, field);
        return (
          <span
            title={getWebsiteInsightsHint(domain, field) || value}
            id={`${scope}-${key}-value`}
            className={`domain-column-value domain-column-value-${key}`}
          >
            {value}
          </span>
        );
      }
    }
  };

  return (
    <tr
      ref={rowRef}
      id={scope}
      inert={collapsed}
      aria-hidden={collapsed || undefined}
      data-collapsed={collapsed}
      onDrop={collapsed ? undefined : onDrop}
      onClick={collapsed ? undefined : handleRowClick}
      data-position={position}
      draggable={!collapsed && draggable}
      onDragEnd={collapsed ? undefined : onDragEnd}
      onDragOver={collapsed ? undefined : onDragOver}
      onDragStart={collapsed ? undefined : onDragStart}
      onMouseDown={collapsed ? undefined : handleRowMouseDown}
      onContextMenu={collapsed ? undefined : onContextMenu}
      className={`domain-row${draggable ? ` domain-row-draggable` : ``}${selected ? ` domain-row-selected` : ``}${dragging ? ` domain-row-dragging` : ``}${dropTarget ? ` domain-row-drop-target` : ``}`}
    >
      <td id={`${scope}-position-cell`} className={`domain-position-cell`}>
        <PortfolioCollapse collapsed={collapsed} id={`${scope}-position-cell-content`}>
          <span id={`${scope}-position`} className={`domain-row-position`} aria-label={`Position ${position}`}>
            {position}
          </span>
        </PortfolioCollapse>
      </td>
      <td id={`${scope}-selection-cell`} className={`domain-selection-cell`}>
        <PortfolioCollapse collapsed={collapsed} id={`${scope}-selection-cell-content`}>
          <input
            {...selectionHandlers}
            type={`checkbox`}
            draggable={false}
            checked={!!selected}
            disabled={busy || !onSelect}
            id={`${scope}-selection`}
            className={`domain-selection`}
            aria-label={`Select ${domain.name}`}
            aria-describedby={selectionDescriptionId}
          />
        </PortfolioCollapse>
        {needsAttention && (
          <span
            aria-hidden={`true`}
            id={`${scope}-attention-dot`}
            className={`domain-attention-dot`}
            title={`Needs Attention: ${status}`}
          />
        )}
      </td>
      {columns.map(column => {
        const key = getDomainColumnKey(column.field);
        return (
          <td
            key={column.field}
            id={`${scope}-${key}-cell`}
            className={`domain-${key}-cell${column.price ? ` domain-price-cell` : ``}`}
          >
            <PortfolioCollapse collapsed={collapsed} id={`${scope}-${key}-cell-content`}>
              {renderColumn(column.field)}
            </PortfolioCollapse>
          </td>
        );
      })}
      <td aria-hidden={`true`} id={`${scope}-space-cell`} className={`domain-space-cell`} />
      <td id={`${scope}-actions-cell`} className={`actionsCell domain-actions-cell`}>
        <PortfolioCollapse collapsed={collapsed} id={`${scope}-actions-cell-content`}>
          <div id={`${scope}-actions`} className={`domain-row-actions`}>
            <DomainVisibilityButton
              disabled={busy}
              domainId={domain.id}
              domainName={domain.name}
              id={`${scope}-visibility-toggle`}
            />
            <DomainStarButton
              id={`${scope}-star`}
              disabled={busy}
              domainId={domain.id}
              domainName={domain.name}
            />
            <button
              type={`button`}
              disabled={busy}
              title={`Edit Domain`}
              id={`${scope}-edit`}
              onClick={() => onEdit(domain)}
              className={`domain-row-action`}
              aria-label={`Edit ${domain.name}`}
            >
              <Settings size={14} aria-hidden={`true`} id={`${scope}-edit-icon`} className={`domain-row-action-icon`} />
            </button>
          </div>
        </PortfolioCollapse>
      </td>
    </tr>
  );
};

interface DomainRowSkeletonProps {
  index: number;
  idPrefix?: string;
  position?: number;
  visibleColumns?: PortfolioColumn[];
}

export const DomainRowSkeleton = ({
  index,
  position = index + 1,
  visibleColumns = DEFAULT_VISIBLE_COLUMNS,
  idPrefix = `domain`,
}: DomainRowSkeletonProps) => {
  const columns = getOrderedPortfolioColumns(visibleColumns).map(column => getDomainSkeletonKey(column.field));

  return (
    <tr id={`${idPrefix}-skeleton-row-${index}`} data-position={position} className={`domain-row domain-row-skeleton`} aria-hidden={`true`}>
      <td id={`${idPrefix}-skeleton-${index}-position-cell`} className={`domain-position-cell`}>
        <span id={`${idPrefix}-skeleton-${index}-position`} className={`domain-row-position`}>
          {position}
        </span>
      </td>
      <td id={`${idPrefix}-skeleton-${index}-selection-cell`} className={`domain-selection-cell`}>
        <span id={`${idPrefix}-skeleton-${index}-selection`} className={`domain-skeleton-line domain-skeleton-line-selection`} />
      </td>
      {[...columns, `space`, `actions`].map(column => (
        <td key={column} id={`${idPrefix}-skeleton-${index}-${column}-cell`} className={column === `space` ? `domain-space-cell` : column === `actions` ? `domain-skeleton-cell domain-actions-cell` : `domain-skeleton-cell`}>
          {column === `name` ? (
            <div id={`${idPrefix}-skeleton-${index}-identity`} className={`domain-identity`}>
              <span id={`${idPrefix}-skeleton-${index}-icon`} className={`domain-skeleton-line domain-skeleton-line-icon`} />
              <span id={`${idPrefix}-skeleton-${index}-${column}`} className={`domain-skeleton-line domain-skeleton-line-${column}`} />
            </div>
          ) : column === `space` ? null : (
            <span id={`${idPrefix}-skeleton-${index}-${column}`} className={`domain-skeleton-line domain-skeleton-line-${column}`} />
          )}
        </td>
      ))}
    </tr>
  );
};

export default DomainRow;
