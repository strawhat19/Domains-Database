import './styles.scss';
import DomainDescription from '../DomainDescription/index.web';
import DomainProjectBadge from '../DomainProjectBadge/index.web';
import { usePortfolioCollection } from './usePortfolioCollection';
import type { CSSProperties, DragEventHandler } from 'react';
import DomainCollectionSettings from '../DomainCollectionSettings/index.web';
import PortfolioRecords, { type PortfolioRecordsProps } from '../PortfolioRecords/index.web';
import type { CustomPortfolioCollection } from '../../shared/portfolioPreferences/types';
import { Eye, Share2, ArrowUp, Settings, ArrowDown, ThumbsUp, ThumbsDown, GripVertical } from 'lucide-react';

export interface PortfolioCollectionProps extends Omit<PortfolioRecordsProps,
  `sticky` | `compact` | `sortField` | `sortDirection` | `onSort` | `collectionId` | `idPrefix` | `forceTable`
> {
  compact?: boolean;
  dragging?: boolean;
  draggable?: boolean;
  dropTarget?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  showAllDomains?: boolean;
  onToggleSearch?: () => void;
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
  onToggleSearch,
  onDrop,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDragStart,
  globalToolbarHeight,
  compact = false,
  dragging = false,
  draggable = false,
  dropTarget = false,
  showAllDomains = false,
  ...records
}: PortfolioCollectionProps) => {
  const scope = `portfolio-collection-${collection.id}`;
  const state = usePortfolioCollection(collection, records.visibleColumns, globalToolbarHeight);
  const visibility = collection.visibility ?? `private`;
  const domainCount = records.domains.length;
  const searchToggleLabel = showAllDomains ? `Show only search matches in ${collection.name}` : `Show all domains in ${collection.name}`;
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
              <svg
                width={20}
                height={20}
                stroke={`none`}
                focusable={false}
                fill={`currentColor`}
                aria-hidden={`true`}
                viewBox={`0 0 24 24`}
                id={`${scope}-folder-icon`}
                className={`portfolio-collection-folder-icon`}
              >
                <path
                  fillRule={`evenodd`}
                  id={`${scope}-folder-icon-path`}
                  className={`portfolio-collection-folder-icon-path`}
                  d={`M4 4h5l2 3h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM5 9h14a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z`}
                />
              </svg>
              <span id={`${scope}-name`} className={`portfolio-collection-name`}>
                {collection.name}
              </span>
            </h3>
            <DomainProjectBadge
              field={`projectStatus`}
              id={`${scope}-project-status`}
              value={collection.projectStatus}
              onChange={state.setProjectStatus}
              disabled={records.loading || records.busy}
              className={`portfolio-collection-project-status`}
              editLabel={`Change Project Status For ${collection.name}`}
            />
            <div id={`${scope}-description-field`} className={`portfolio-collection-description`}>
              <DomainDescription
                maxLength={280}
                domainName={collection.name}
                value={collection.description}
                id={`${scope}-description`}
                onSave={state.setDescription}
                busy={records.loading || records.busy}
                onReadMore={() => state.setEditing(true)}
                readMoreLabel={`Read More In Collection Settings For ${collection.name}`}
              />
            </div>
          </div>
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
          <span
            id={`${scope}-domain-count`}
            className={`portfolio-collection-count`}
            title={`${domainCount} Domain(s) In ${collection.name}`}
            aria-label={`${domainCount} Domain(s) In ${collection.name}`}
          >
            {domainCount}
          </span>
          {records.searching && onToggleSearch && (
            <button
              type={`button`}
              draggable={false}
              title={searchToggleLabel}
              onClick={onToggleSearch}
              id={`${scope}-search-toggle`}
              aria-label={searchToggleLabel}
              aria-pressed={showAllDomains}
              className={`portfolio-collection-search-toggle${showAllDomains ? ` portfolio-collection-search-toggle-active` : ``}`}
            >
              <Eye size={17} aria-hidden={`true`} id={`${scope}-search-toggle-icon`} className={`portfolio-collection-search-toggle-icon`} />
            </button>
          )}
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
        </div>
      </div>
      <p id={`${scope}-interaction-help`} className={`portfolio-sr-only`}>
        {`Drag this title bar to reorder collections, or use the up and down buttons. Drop a group heading on the title bar to add it to this collection. Group settings offers a keyboard alternative.`}
      </p>
      <PortfolioRecords
        {...records}
        forceTable
        compact={compact}
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
