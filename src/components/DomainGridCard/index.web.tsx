import './styles.scss';
import DomainSiteIcon from '../DomainSiteIcon/index.web';
import { getDomainRow, getDomainColumnKey } from '../DomainRow/domainRow';
import type { DomainItemProps, DomainDragProps } from '../DomainRow/domainRow';
import { Check, Minus, Pencil, Trash2, ArrowUp, ArrowDown, GripVertical, ArrowUpRight } from 'lucide-react';
import {
  PORTFOLIO_COLUMNS,
  DEFAULT_VISIBLE_COLUMNS,
  getPortfolioColumnDisplay,
  type PortfolioColumn,
} from '../../shared/portfolioColumns';

export interface DomainGridCardProps extends DomainItemProps, DomainDragProps<HTMLElement> {}

const DomainGridCard = ({
  busy,
  domain,
  onEdit,
  onDrop,
  selected,
  dragging,
  dropTarget,
  onSelect,
  position,
  onDelete,
  onMoveUp,
  draggable,
  onDragEnd,
  onDragOver,
  onMoveDown,
  onDragStart,
  onToggleAutoRenew,
  visibleColumns = DEFAULT_VISIBLE_COLUMNS,
}: DomainGridCardProps) => {
  const scope = `domain-grid-card-${domain.id}`;
  const { status, lastDot, statusKey } = getDomainRow(domain);
  const columns = PORTFOLIO_COLUMNS.filter(column => (
    column.field !== `name` && visibleColumns.includes(column.field)
  ));

  return (
    <article
      id={scope}
      onDrop={onDrop}
      draggable={draggable}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      data-position={position}
      onDragStart={onDragStart}
      className={`domain-grid-card${draggable ? ` domain-grid-card-draggable` : ``}${selected ? ` domain-grid-card-selected` : ``}${dragging ? ` domain-grid-card-dragging` : ``}${dropTarget ? ` domain-grid-card-drop-target` : ``}`}
    >
      <div id={`${scope}-identity`} className={`domain-grid-card-identity`}>
        <span id={`${scope}-position`} className={`domain-grid-card-position`} aria-label={`Position ${position}`}>
          {position}
        </span>
        <input
          type={`checkbox`}
          draggable={false}
          checked={!!selected}
          disabled={busy || !onSelect}
          id={`${scope}-selection`}
          className={`domain-grid-card-selection`}
          aria-label={`Select ${domain.name}`}
          onClick={event => event.stopPropagation()}
          onChange={event => onSelect?.(domain.id, event.target.checked)}
        />
        <DomainSiteIcon size={32} domain={domain.name} id={`${scope}-symbol`} />
        <a
          target={`_blank`}
          draggable={false}
          id={`${scope}-name`}
          rel={`noopener noreferrer`}
          href={`https://${domain.name}`}
          className={`domain-grid-card-site-link`}
          aria-label={`Open ${domain.name} in a new tab`}
        >
          <span id={`${scope}-site-link-label`} className={`domain-grid-card-site-link-label`}>
            {domain.name.slice(0, lastDot)}
            <span id={`${scope}-extension`} className={`domain-grid-card-extension`}>
              {domain.name.slice(lastDot)}
            </span>
          </span>
          <ArrowUpRight
            size={13}
            aria-hidden={`true`}
            id={`${scope}-site-link-icon`}
            className={`domain-grid-card-site-link-icon`}
          />
        </a>
      </div>
      {!!columns.length && (
        <dl id={`${scope}-details`} className={`domain-grid-card-details`}>
          {columns.map(column => {
            const key = getDomainColumnKey(column.field);
            const value = getPortfolioColumnDisplay(domain, column.field);
            return (
              <div
                key={column.field}
                id={`${scope}-${key}-field`}
                className={`domain-grid-card-field domain-grid-card-field-${key}`}
              >
                <dt id={`${scope}-${key}-label`} className={`domain-grid-card-field-label`}>
                  {column.label}
                </dt>
                <dd
                  id={`${scope}-${key}-value`}
                  className={`domain-grid-card-field-value${column.price ? ` domain-grid-card-field-price` : ``}`}
                >
                  {column.field === `autoRenew` ? (
                    <button
                      type={`button`}
                      role={`switch`}
                      disabled={busy}
                      aria-checked={domain.autoRenew}
                      id={`${scope}-auto-renew-toggle`}
                      onClick={() => onToggleAutoRenew(domain)}
                      title={`This is a record of your registrar setting`}
                      aria-label={`Mark Auto-Renew ${domain.autoRenew ? `Off` : `On`} For ${domain.name}`}
                      className={`domain-grid-card-auto-renew domain-grid-card-auto-renew-${domain.autoRenew ? `on` : `off`}`}
                    >
                      {domain.autoRenew
                        ? <Check size={12} aria-hidden={`true`} id={`${scope}-auto-renew-icon`} className={`domain-grid-card-auto-renew-icon`} />
                        : <Minus size={12} aria-hidden={`true`} id={`${scope}-auto-renew-icon`} className={`domain-grid-card-auto-renew-icon`} />}
                      <span id={`${scope}-auto-renew-text`} className={`domain-grid-card-auto-renew-text`}>
                        {domain.autoRenew ? `On` : `Off`}
                      </span>
                    </button>
                  ) : (
                    <span title={value} id={`${scope}-${key}-text`} className={`domain-grid-card-field-text`}>
                      {value}
                    </span>
                  )}
                  {column.field === `expiresAt` && (
                    <span id={`${scope}-status`} className={`domain-grid-card-status domain-grid-card-status-${statusKey}`}>
                      <span id={`${scope}-status-dot`} className={`domain-grid-card-status-dot`} aria-hidden={`true`} />
                      <span id={`${scope}-status-text`} className={`domain-grid-card-status-text`}>
                        {status}
                      </span>
                    </span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
      <div id={`${scope}-footer`} className={`domain-grid-card-footer`}>
        {draggable && (
          <div id={`${scope}-reorder`} className={`domain-grid-card-reorder`}>
            <span
              id={`${scope}-drag-handle`}
              className={`domain-grid-card-drag-handle`}
              title={`Drag to reorder ${domain.name}`}
            >
              <GripVertical size={14} aria-hidden={`true`} id={`${scope}-drag-handle-icon`} className={`domain-grid-card-drag-handle-icon`} />
            </span>
            <button
              type={`button`}
              id={`${scope}-move-up`}
              title={`Move ${domain.name} up`}
              aria-label={`Move ${domain.name} up`}
              disabled={busy || !onMoveUp}
              onClick={() => onMoveUp?.(domain)}
              className={`domain-grid-card-action`}
            >
              <ArrowUp size={13} aria-hidden={`true`} id={`${scope}-move-up-icon`} className={`domain-grid-card-action-icon`} />
            </button>
            <button
              type={`button`}
              id={`${scope}-move-down`}
              title={`Move ${domain.name} down`}
              aria-label={`Move ${domain.name} down`}
              disabled={busy || !onMoveDown}
              onClick={() => onMoveDown?.(domain)}
              className={`domain-grid-card-action`}
            >
              <ArrowDown size={13} aria-hidden={`true`} id={`${scope}-move-down-icon`} className={`domain-grid-card-action-icon`} />
            </button>
          </div>
        )}
        <div id={`${scope}-actions`} className={`domain-grid-card-actions`}>
          <button
            type={`button`}
            disabled={busy}
            title={`Edit Domain`}
            id={`${scope}-edit`}
            onClick={() => onEdit(domain)}
            aria-label={`Edit ${domain.name}`}
            className={`domain-grid-card-action`}
          >
            <Pencil size={14} aria-hidden={`true`} id={`${scope}-edit-icon`} className={`domain-grid-card-action-icon`} />
          </button>
          <button
            type={`button`}
            disabled={busy}
            title={`Remove Domain`}
            id={`${scope}-remove`}
            onClick={() => onDelete(domain)}
            aria-label={`Remove ${domain.name}`}
            className={`domain-grid-card-action domain-grid-card-action-remove`}
          >
            <Trash2 size={14} aria-hidden={`true`} id={`${scope}-remove-icon`} className={`domain-grid-card-action-icon`} />
          </button>
        </div>
      </div>
    </article>
  );
};

interface DomainGridCardSkeletonProps {
  index: number;
  position?: number;
  visibleColumns?: PortfolioColumn[];
}

export const DomainGridCardSkeleton = ({
  index,
  position = index + 1,
  visibleColumns = DEFAULT_VISIBLE_COLUMNS,
}: DomainGridCardSkeletonProps) => {
  const scope = `domain-grid-card-skeleton-${index}`;
  const columns = PORTFOLIO_COLUMNS.filter(column => (
    column.field !== `name` && visibleColumns.includes(column.field)
  ));

  return (
    <article id={scope} data-position={position} className={`domain-grid-card domain-grid-card-skeleton`} aria-hidden={`true`}>
      <div id={`${scope}-identity`} className={`domain-grid-card-identity`}>
        <span id={`${scope}-position`} className={`domain-grid-card-position`}>
          {position}
        </span>
        <span id={`${scope}-selection`} className={`domain-grid-card-skeleton-line domain-grid-card-skeleton-selection`} />
        <span id={`${scope}-icon`} className={`domain-grid-card-skeleton-line domain-grid-card-skeleton-icon`} />
        <span id={`${scope}-name`} className={`domain-grid-card-skeleton-line domain-grid-card-skeleton-name`} />
      </div>
      {!!columns.length && (
        <div id={`${scope}-details`} className={`domain-grid-card-details`}>
          {columns.map(column => {
            const key = getDomainColumnKey(column.field);
            return (
              <div key={column.field} id={`${scope}-${key}-field`} className={`domain-grid-card-field`}>
                <span id={`${scope}-${key}-label`} className={`domain-grid-card-skeleton-line domain-grid-card-skeleton-label`} />
                <span id={`${scope}-${key}-value`} className={`domain-grid-card-skeleton-line domain-grid-card-skeleton-value`} />
              </div>
            );
          })}
        </div>
      )}
      <div id={`${scope}-footer`} className={`domain-grid-card-footer`}>
        <span id={`${scope}-actions`} className={`domain-grid-card-skeleton-line domain-grid-card-skeleton-actions`} />
      </div>
    </article>
  );
};

export default DomainGridCard;
