import './styles.scss';
import type { MouseEventHandler } from 'react';
import DomainSiteIcon from '../DomainSiteIcon/index.web';
import type { DomainItemProps, DomainDragProps } from './domainRow';
import { Check, Minus, Pencil, Trash2, ArrowUp, ArrowDown, GripVertical, ArrowUpRight } from 'lucide-react';
import { getDomainRow, getDomainColumnKey, getDomainSkeletonKey, isDomainSelectionTarget, getDomainSelectionHandlers } from './domainRow';
import {
  PORTFOLIO_COLUMNS,
  DEFAULT_VISIBLE_COLUMNS,
  getPortfolioColumnDisplay,
  getPortfolioColumnValue,
  getRenewalEstimateHint,
  getWebsiteInsightsHint,
  type PortfolioColumn,
} from '../../shared/portfolioColumns';

export interface DomainRowProps extends DomainItemProps, DomainDragProps<HTMLTableRowElement> {
  onContextMenu?: MouseEventHandler<HTMLTableRowElement>;
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
  onDelete,
  onMoveUp,
  draggable,
  onDragEnd,
  onDragOver,
  onDragStart,
  onMoveDown,
  onContextMenu,
  onToggleAutoRenew,
  selectionDescriptionId,
  reorderable = draggable,
  visibleColumns = DEFAULT_VISIBLE_COLUMNS,
}: DomainRowProps) => {
  const { scope, status, lastDot, statusKey, registrarKey } = getDomainRow(domain);
  const autoRenew = getPortfolioColumnValue(domain, `autoRenew`);
  const columns = PORTFOLIO_COLUMNS.filter(column => (
    column.field === `name` || visibleColumns.includes(column.field)
  ));
  const selectionHandlers = getDomainSelectionHandlers(domain.id, !!selected, onSelect);

  const handleRowClick: MouseEventHandler<HTMLTableRowElement> = event => {
    if (busy || !onSelect || !isDomainSelectionTarget(event.target, event.currentTarget)) return;
    onSelect(domain.id, !selected, event.shiftKey);
    event.currentTarget.querySelector<HTMLInputElement>(`.domain-selection`)?.focus({ preventScroll: true });
  };

  const handleRowMouseDown: MouseEventHandler<HTMLTableRowElement> = event => {
    if (busy || !onSelect || event.button !== 0 || !event.shiftKey) return;
    if (isDomainSelectionTarget(event.target, event.currentTarget)) event.preventDefault();
  };

  const renderColumn = (field: PortfolioColumn) => {
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
            <DomainSiteIcon domain={domain.name} id={`${scope}-symbol`} />
            <div id={`${scope}-name-copy`} className={`domain-name-copy`}>
              <a
                target={`_blank`}
                draggable={false}
                id={`${scope}-name`}
                rel={`noopener noreferrer`}
                href={`https://${domain.name}`}
                className={`domain-name domain-site-link`}
                aria-label={`Open ${domain.name} in a new tab`}
              >
                <span id={`${scope}-site-link-label`} className={`domain-site-link-label`}>
                  {domain.name.slice(0, lastDot)}
                  <span id={`${scope}-extension`} className={`domain-extension`}>
                    {domain.name.slice(lastDot)}
                  </span>
                </span>
                <ArrowUpRight
                  size={13}
                  aria-hidden={`true`}
                  id={`${scope}-site-link-icon`}
                  className={`domain-site-link-icon`}
                />
              </a>
            </div>
          </div>
        );
      case `registrar`:
        return (
          <div id={`${scope}-registrar`} className={`domain-registrar`}>
            <span id={`${scope}-registrar-mark`} className={`registrar-mark registrar-mark-${registrarKey}`} aria-hidden={`true`}>
              {domain.registrar.charAt(0) || `?`}
            </span>
            <span id={`${scope}-registrar-name`} className={`domain-registrar-name`}>
              {domain.registrar || `—`}
            </span>
          </div>
        );
      case `expiresAt`:
        return (
          <>
            <span id={`${scope}-renewal-date`} className={`domain-renewal-date`}>
              {getPortfolioColumnDisplay(domain, field)}
            </span>
            <span id={`${scope}-status`} className={`rowStatus rowStatus-${statusKey}`}>
              <span id={`${scope}-status-dot-wrap`} className={`statusDotWrap`} aria-hidden={`true`}>
                <span id={`${scope}-status-dot`} className={`statusDot`} />
              </span>
              <span id={`${scope}-status-text`} className={`statusText`}>
                {status}
              </span>
            </span>
          </>
        );
      case `autoRenew`:
        return (
          <button
            type={`button`}
            role={autoRenew === undefined ? `button` : `switch`}
            disabled={busy}
            aria-checked={autoRenew === undefined ? undefined : autoRenew === true}
            id={`${scope}-auto-renew-toggle`}
            aria-label={`Mark Auto-Renew ${domain.autoRenew ? `Off` : `On`} For ${domain.name}`}
            onClick={() => onToggleAutoRenew(domain)}
            title={autoRenew === undefined ? `Registrar Auto-Renew Is Unknown — Click To Update Your Inventory Record` : `This is a record of your registrar setting`}
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
      case `renewalEstimate`:
        return (
          <span
            id={`${scope}-renewal-estimate`}
            title={getRenewalEstimateHint(domain)}
            className={`domain-renewal-estimate`}
          >
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
      id={scope}
      onDrop={onDrop}
      onClick={handleRowClick}
      data-position={position}
      draggable={draggable}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onMouseDown={handleRowMouseDown}
      onContextMenu={onContextMenu}
      className={`domain-row${draggable ? ` domain-row-draggable` : ``}${selected ? ` domain-row-selected` : ``}${dragging ? ` domain-row-dragging` : ``}${dropTarget ? ` domain-row-drop-target` : ``}`}
    >
      <td id={`${scope}-position-cell`} className={`domain-position-cell`}>
        <span id={`${scope}-position`} className={`domain-row-position`} aria-label={`Position ${position}`}>
          {position}
        </span>
      </td>
      <td id={`${scope}-selection-cell`} className={`domain-selection-cell`}>
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
      </td>
      {columns.map(column => {
        const key = getDomainColumnKey(column.field);
        return (
          <td
            key={column.field}
            id={`${scope}-${key}-cell`}
            className={`domain-${key}-cell${column.price ? ` domain-price-cell` : ``}`}
          >
            {renderColumn(column.field)}
          </td>
        );
      })}
      <td id={`${scope}-actions-cell`} className={`actionsCell domain-actions-cell`}>
        <div id={`${scope}-actions`} className={`domain-row-actions`}>
          <button
            type={`button`}
            disabled={busy}
            title={`Edit Domain`}
            id={`${scope}-edit`}
            onClick={() => onEdit(domain)}
            className={`domain-row-action`}
            aria-label={`Edit ${domain.name}`}
          >
            <Pencil size={14} aria-hidden={`true`} id={`${scope}-edit-icon`} className={`domain-row-action-icon`} />
          </button>
          <button
            type={`button`}
            disabled={busy}
            title={`Remove Domain`}
            id={`${scope}-remove`}
            onClick={() => onDelete(domain)}
            aria-label={`Remove ${domain.name}`}
            className={`domain-row-action domain-row-action-remove`}
          >
            <Trash2 size={14} aria-hidden={`true`} id={`${scope}-remove-icon`} className={`domain-row-action-icon`} />
          </button>
        </div>
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
  const columns = PORTFOLIO_COLUMNS
    .filter(column => column.field === `name` || visibleColumns.includes(column.field))
    .map(column => getDomainSkeletonKey(column.field));

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
      {[...columns, `actions`].map(column => (
        <td key={column} id={`${idPrefix}-skeleton-${index}-${column}-cell`} className={`domain-skeleton-cell`}>
          {column === `name` ? (
            <div id={`${idPrefix}-skeleton-${index}-identity`} className={`domain-identity`}>
              <span id={`${idPrefix}-skeleton-${index}-icon`} className={`domain-skeleton-line domain-skeleton-line-icon`} />
              <span id={`${idPrefix}-skeleton-${index}-${column}`} className={`domain-skeleton-line domain-skeleton-line-${column}`} />
            </div>
          ) : (
            <span id={`${idPrefix}-skeleton-${index}-${column}`} className={`domain-skeleton-line domain-skeleton-line-${column}`} />
          )}
        </td>
      ))}
    </tr>
  );
};

export default DomainRow;
