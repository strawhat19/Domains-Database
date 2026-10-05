import './styles.scss';
import { usePortfolioCollection } from './usePortfolioCollection';
import type { CSSProperties, DragEventHandler } from 'react';
import DomainCollectionSettings from '../DomainCollectionSettings/index.web';
import PortfolioRecords, { type PortfolioRecordsProps } from '../PortfolioRecords/index.web';
import type { CollectionVisibility, CustomPortfolioCollection } from '../../shared/portfolioPreferences/types';
import { Lock, Globe, Share2, ArrowUp, Settings, ArrowDown, ThumbsUp, ThumbsDown, ChevronDown, ArrowDownAZ, GripVertical } from 'lucide-react';

export interface PortfolioCollectionProps extends Omit<PortfolioRecordsProps,
  `sticky` | `compact` | `sortField` | `sortDirection` | `onSort` | `collectionId` | `idPrefix` | `forceTable`
> {
  compact?: boolean;
  dragging?: boolean;
  draggable?: boolean;
  dropTarget?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  globalToolbarHeight: number;
  collection: CustomPortfolioCollection;
  onDrop?: DragEventHandler<HTMLDivElement>;
  onDragEnd?: DragEventHandler<HTMLDivElement>;
  onDragOver?: DragEventHandler<HTMLDivElement>;
  onDragLeave?: DragEventHandler<HTMLDivElement>;
  onDragStart?: DragEventHandler<HTMLDivElement>;
}

const PortfolioCollection = ({
  collection,
  onMoveUp,
  onMoveDown,
  onDrop,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDragStart,
  globalToolbarHeight,
  dragging = false,
  draggable = false,
  dropTarget = false,
  ...records
}: PortfolioCollectionProps) => {
  const scope = `portfolio-collection-${collection.id}`;
  const state = usePortfolioCollection(collection, records.visibleColumns, globalToolbarHeight);
  const visibility = collection.visibility ?? `private`;
  const VisibilityIcon = visibility === `public` ? Globe : Lock;
  const OrderIcon = collection.sortField ? GripVertical : ArrowDownAZ;
  const style = { [`--portfolio-global-toolbar-height`]: `${globalToolbarHeight}px` } as CSSProperties;

  return (
    <section
      id={scope}
      style={style}
      aria-labelledby={`${scope}-title`}
      className={`portfolio-card portfolio-collection${dragging ? ` portfolio-collection-dragging` : ``}`}
    >
      <div
        onDrop={onDrop}
        ref={state.sticky.toolbarRef}
        onDragEnd={onDragEnd}
        draggable={draggable}
        id={`${scope}-titlebar`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDragStart={onDragStart}
        className={`portfolio-collection-titlebar${dropTarget ? ` portfolio-collection-titlebar-drop-target` : ``}`}
      >
        <div
          role={`group`}
          id={`${scope}-reorder`}
          className={`portfolio-collection-reorder`}
          aria-label={`Reorder ${collection.name}`}
          aria-describedby={`${scope}-interaction-help`}
        >
          <span
            aria-hidden={`true`}
            id={`${scope}-drag-handle`}
            title={`Drag to reorder ${collection.name}`}
            className={`portfolio-collection-drag-handle`}
          >
            <GripVertical size={16} id={`${scope}-drag-handle-icon`} className={`portfolio-collection-drag-handle-icon`} />
          </span>
          <div id={`${scope}-move-actions`} className={`portfolio-collection-move-actions`}>
            <button
              type={`button`}
              draggable={false}
              disabled={!onMoveUp}
              onClick={onMoveUp}
              id={`${scope}-move-up`}
              title={`Move ${collection.name} up`}
              aria-label={`Move ${collection.name} up`}
              className={`portfolio-collection-move-action`}
            >
              <ArrowUp size={12} aria-hidden={`true`} id={`${scope}-move-up-icon`} className={`portfolio-collection-move-action-icon`} />
            </button>
            <button
              type={`button`}
              draggable={false}
              disabled={!onMoveDown}
              onClick={onMoveDown}
              id={`${scope}-move-down`}
              title={`Move ${collection.name} down`}
              aria-label={`Move ${collection.name} down`}
              className={`portfolio-collection-move-action`}
            >
              <ArrowDown size={12} aria-hidden={`true`} id={`${scope}-move-down-icon`} className={`portfolio-collection-move-action-icon`} />
            </button>
          </div>
        </div>
        <div id={`${scope}-copy`} className={`portfolio-collection-copy`}>
          <div id={`${scope}-heading`} className={`portfolio-collection-heading`}>
            <h3 id={`${scope}-title`} className={`portfolio-collection-title`}>
              {collection.name}
            </h3>
            <label
              id={`${scope}-visibility-field`}
              htmlFor={`${scope}-visibility`}
              className={`portfolio-collection-visibility portfolio-collection-visibility-${visibility}`}
            >
              <VisibilityIcon size={12} aria-hidden={`true`} id={`${scope}-visibility-icon`} className={`portfolio-collection-visibility-icon`} />
              <span id={`${scope}-visibility-label`} className={`portfolio-sr-only`}>{`Visibility for ${collection.name}`}</span>
              <select
                draggable={false}
                value={visibility}
                id={`${scope}-visibility`}
                disabled={records.loading || records.busy}
                className={`portfolio-collection-visibility-select`}
                onChange={event => state.setVisibility(event.target.value as CollectionVisibility)}
              >
                <option value={`private`}>{`Private`}</option>
                <option value={`public`}>{`Public / Published`}</option>
              </select>
              <ChevronDown size={11} aria-hidden={`true`} id={`${scope}-visibility-chevron`} className={`portfolio-collection-visibility-chevron`} />
            </label>
          </div>
          {collection.description && (
            <p id={`${scope}-description`} className={`portfolio-collection-description`}>
              {collection.description}
            </p>
          )}
        </div>
        {visibility === `public` && (
          <div role={`group`} id={`${scope}-votes`} aria-label={`Votes for ${collection.name}`} className={`portfolio-collection-votes`}>
            <button
              type={`button`}
              draggable={false}
              onClick={state.voteUp}
              id={`${scope}-upvote`}
              aria-pressed={collection.currentVote === `up`}
              disabled={records.loading || records.busy}
              title={collection.currentVote === `up` ? `Remove Upvote` : `Upvote Collection`}
              aria-label={`Upvote ${collection.name}, ${collection.upvotes ?? 0} upvotes`}
              className={`portfolio-collection-vote${collection.currentVote === `up` ? ` portfolio-collection-vote-active` : ``}`}
            >
              <ThumbsUp size={13} aria-hidden={`true`} id={`${scope}-upvote-icon`} className={`portfolio-collection-vote-icon`} />
              <span id={`${scope}-upvote-count`} className={`portfolio-collection-vote-count`}>{collection.upvotes ?? 0}</span>
            </button>
            <button
              type={`button`}
              draggable={false}
              onClick={state.voteDown}
              id={`${scope}-downvote`}
              aria-pressed={collection.currentVote === `down`}
              disabled={records.loading || records.busy}
              title={collection.currentVote === `down` ? `Remove Downvote` : `Downvote Collection`}
              aria-label={`Downvote ${collection.name}, ${collection.downvotes ?? 0} downvotes`}
              className={`portfolio-collection-vote${collection.currentVote === `down` ? ` portfolio-collection-vote-active` : ``}`}
            >
              <ThumbsDown size={13} aria-hidden={`true`} id={`${scope}-downvote-icon`} className={`portfolio-collection-vote-icon`} />
              <span id={`${scope}-downvote-count`} className={`portfolio-collection-vote-count`}>{collection.downvotes ?? 0}</span>
            </button>
          </div>
        )}
        <div id={`${scope}-actions`} className={`portfolio-collection-actions`}>
          <button
            type={`button`}
            draggable={false}
            id={`${scope}-order-toggle`}
            onClick={state.toggleManualOrder}
            aria-pressed={collection.sortField === null}
            disabled={records.loading || records.busy}
            title={collection.sortField ? `Use manual domain order` : `Sort domains A–Z`}
            className={`portfolio-button portfolio-button-secondary portfolio-collection-order-toggle`}
          >
            <OrderIcon size={14} aria-hidden={`true`} id={`${scope}-order-toggle-icon`} className={`portfolio-button-icon`} />
            <span id={`${scope}-order-toggle-text`} className={`portfolio-button-text`}>
              {collection.sortField ? `Manual Order` : `Sort A–Z`}
            </span>
          </button>
          <button
            type={`button`}
            draggable={false}
            aria-haspopup={`dialog`}
            id={`${scope}-settings`}
            title={`Edit ${collection.name}`}
            aria-label={`Edit ${collection.name}`}
            className={`portfolio-collection-settings`}
            onClick={() => state.setEditing(true)}
          >
            <Settings size={17} aria-hidden={`true`} id={`${scope}-settings-icon`} className={`portfolio-collection-settings-icon`} />
          </button>
          <button
            disabled
            type={`button`}
            draggable={false}
            id={`${scope}-share`}
            className={`portfolio-collection-share`}
            title={`Share ${collection.name} (Coming Soon)`}
            aria-label={`Share ${collection.name} (Coming Soon)`}
          >
            <Share2 size={17} aria-hidden={`true`} id={`${scope}-share-icon`} className={`portfolio-collection-share-icon`} />
          </button>
        </div>
      </div>
      <p id={`${scope}-interaction-help`} className={`portfolio-sr-only`}>
        {`Drag this title bar to reorder collections, or use the up and down buttons. Drop a group heading on the title bar to add it to this collection. Group settings offers a keyboard alternative.`}
      </p>
      <PortfolioRecords
        {...records}
        forceTable
        compact={false}
        idPrefix={scope}
        onSort={state.onSort}
        collectionId={collection.id}
        sticky={state.recordsSticky}
        sortField={collection.sortField}
        sortDirection={collection.sortDirection}
      />
      {state.editing && (
        <DomainCollectionSettings collection={collection} onClose={() => state.setEditing(false)} />
      )}
    </section>
  );
};

export default PortfolioCollection;
