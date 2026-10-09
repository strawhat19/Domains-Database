import './styles.scss';
import DomainProjectBadge from '../DomainProjectBadge/index.web';
import DomainAnalyticsButton from '../DomainAnalyticsButton';
import DomainSiteIcon from '../DomainSiteIcon/index.web';
import DomainStarButton from '../DomainStarButton/index.web';
import DomainSourceBadge from '../DomainSourceBadge/index.web';
import { getDomainSource } from '../../shared/domainUtils';
import { getCustomSiteIconUrl } from '../../shared/domainSiteIcon';
import { getDomainRow, getDomainColumnKey, getDomainSelectionHandlers } from '../DomainRow/domainRow';
import type { DomainItemProps, DomainDragProps } from '../DomainRow/domainRow';
import { Check, Minus, ArrowUp, Settings, ArrowDown, GripVertical } from 'lucide-react';
import {
  PORTFOLIO_COLUMNS,
  DEFAULT_VISIBLE_COLUMNS,
  getPortfolioColumnDisplay,
  getPortfolioColumnValue,
  getWebsiteInsightsHint,
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
  onMoveUp,
  draggable,
  onDragEnd,
  onDragOver,
  onMoveDown,
  onDragStart,
  onToggleAutoRenew,
  selectionDescriptionId,
  reorderable = draggable,
  hideProjectDetails = false,
  visibleColumns = DEFAULT_VISIBLE_COLUMNS,
}: DomainGridCardProps) => {
  const scope = `domain-grid-card-${domain.id}`;
  const { status, lastDot, statusKey } = getDomainRow(domain);
  const autoRenew = getPortfolioColumnValue(domain, `autoRenew`);
  const registrarManaged = getDomainSource(domain) === `registrar`;
  const columns = PORTFOLIO_COLUMNS.filter(column => (
    column.field !== `name` && visibleColumns.includes(column.field)
    && (!hideProjectDetails || (column.field !== `status` && column.field !== `projectStatus`))
  ));
  const selectionHandlers = getDomainSelectionHandlers(domain.id, !!selected, onSelect);

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
          {...selectionHandlers}
          type={`checkbox`}
          draggable={false}
          checked={!!selected}
          disabled={busy || !onSelect}
          id={`${scope}-selection`}
          className={`domain-grid-card-selection`}
          aria-label={`Select ${domain.name}`}
          aria-describedby={selectionDescriptionId}
        />
        <DomainSiteIcon
          size={32}
          disabled={busy}
          fallback={`link`}
          domain={domain.name}
          id={`${scope}-symbol`}
          onEdit={() => onEdit(domain)}
          iconUrl={getCustomSiteIconUrl(domain)}
          editLabel={`Add A Logo Or Site Icon For ${domain.name}`}
        />
        <div id={`${scope}-name-copy`} className={`domain-grid-card-name-copy`}>
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
          </a>
          {!hideProjectDetails && (
            <>
              <span aria-hidden={`true`} id={`${scope}-status-separator`} className={`domain-grid-card-name-separator`}>
                {` | `}
              </span>
              <DomainProjectBadge
                field={`projectStatus`}
                value={domain.projectStatus}
                id={`${scope}-project-status`}
                className={`domain-project-status`}
              />
            </>
          )}
          {!hideProjectDetails && !!domain.description && (
            <>
              <span aria-hidden={`true`} id={`${scope}-description-separator`} className={`domain-grid-card-name-separator`}>
                {` | `}
              </span>
              <span id={`${scope}-description`} title={domain.description} className={`domain-grid-card-description`}>
                {domain.description}
              </span>
            </>
          )}
        </div>
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
                  title={getWebsiteInsightsHint(domain, column.field) || undefined}
                  className={`domain-grid-card-field-value${column.price ? ` domain-grid-card-field-price` : ``}`}
                >
                  {column.field === `autoRenew` ? (
                    <button
                      type={`button`}
                      role={autoRenew === undefined ? `button` : `switch`}
                      disabled={busy || registrarManaged}
                      aria-checked={autoRenew === undefined ? undefined : autoRenew === true}
                      id={`${scope}-auto-renew-toggle`}
                      onClick={registrarManaged ? undefined : () => onToggleAutoRenew(domain)}
                      title={registrarManaged ? `Managed By Your Connected Registrar` : autoRenew === undefined ? `Registrar Auto-Renew Is Unknown — Click To Update Your Inventory Record` : `This is a record of your registrar setting`}
                      aria-label={registrarManaged ? `Auto-Renew For ${domain.name}, Managed By Your Registrar` : `Mark Auto-Renew ${domain.autoRenew ? `Off` : `On`} For ${domain.name}`}
                      className={`domain-grid-card-auto-renew domain-grid-card-auto-renew-${autoRenew === true ? `on` : `off`}`}
                    >
                      {autoRenew === true
                        ? <Check size={12} aria-hidden={`true`} id={`${scope}-auto-renew-icon`} className={`domain-grid-card-auto-renew-icon`} />
                        : <Minus size={12} aria-hidden={`true`} id={`${scope}-auto-renew-icon`} className={`domain-grid-card-auto-renew-icon`} />}
                      <span id={`${scope}-auto-renew-text`} className={`domain-grid-card-auto-renew-text`}>
                        {autoRenew === undefined ? `Unknown` : autoRenew ? `On` : `Off`}
                      </span>
                    </button>
                  ) : column.field === `difficulty` ? (
                    <DomainProjectBadge
                      field={column.field}
                      value={domain[column.field]}
                      id={`${scope}-${key}-text`}
                    />
                  ) : (
                    <span title={getWebsiteInsightsHint(domain, column.field) || value} id={`${scope}-${key}-text`} className={`domain-grid-card-field-text`}>
                      {value}
                    </span>
                  )}
                  {!hideProjectDetails && column.field === `expiresAt` && (
                    <span id={`${scope}-status`} className={`domain-grid-card-status domain-grid-card-status-${statusKey}`}>
                      <span id={`${scope}-status-dot`} className={`domain-grid-card-status-dot`} aria-hidden={`true`} />
                      <span id={`${scope}-status-text`} className={`domain-grid-card-status-text`}>
                        {status}
                      </span>
                    </span>
                  )}
                  {!hideProjectDetails && column.field === `registrar` && (
                    <DomainSourceBadge domain={domain} id={`${scope}-source-status`} />
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
      <div id={`${scope}-footer`} className={`domain-grid-card-footer`}>
        {reorderable && (
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
          <DomainAnalyticsButton suffix={scope} domain={domain.name} />
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
            aria-label={`Edit ${domain.name}`}
            className={`domain-grid-card-action`}
          >
            <Settings size={14} aria-hidden={`true`} id={`${scope}-edit-icon`} className={`domain-grid-card-action-icon`} />
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
