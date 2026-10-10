import './styles.scss';
import '../StarButton/styles.scss';
import '../DomainSiteIcon/styles.scss';
import Toast from '../Toast/index.web';
import { createPortal } from 'react-dom';
import type { DragEventHandler } from 'react';
import PortfolioRowCopy from '../PortfolioRowCopy/index.web';
import { usePortfolioCollection } from './usePortfolioCollection';
import PortfolioNameEditor from '../PortfolioNameEditor/index.web';
import PortfolioCollectionStars from '../PortfolioCollectionStars/index.web';
import DomainCollectionSettings from '../DomainCollectionSettings/index.web';
import PortfolioCollectionProgress from '../PortfolioCollectionProgress/index.web';
import { useCollectionStars } from '../PortfolioCollectionStars/useCollectionStars';
import type { CustomPortfolioCollection, PortfolioCollectionSection } from '../../shared/portfolioPreferences/types';
import { Eye, Star, Pencil, EyeOff, ArrowUp, Settings, ArrowDown, ThumbsUp, ThumbsDown, ChevronDown, GripVertical } from 'lucide-react';

export interface PortfolioCollectionProps {
  busy: boolean;
  loading: boolean;
  collapsed: boolean;
  contentId: string;
  idPrefix?: string;
  searching?: boolean;
  domainCount: number;
  dragging?: boolean;
  draggable?: boolean;
  dropTarget?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onToggleCollapsed: () => void;
  showAllDomains?: boolean;
  onToggleSearch?: () => void;
  collection: CustomPortfolioCollection;
  copySection: PortfolioCollectionSection;
  onDrop?: DragEventHandler<HTMLDivElement>;
  onDragEnd?: DragEventHandler<HTMLDivElement>;
  onDragOver?: DragEventHandler<HTMLDivElement>;
  onDragLeave?: DragEventHandler<HTMLDivElement>;
  onDragStart?: DragEventHandler<HTMLDivElement>;
}

const PortfolioCollection = ({
  collection,
  copySection,
  onMoveUp,
  onMoveDown,
  onToggleSearch,
  onToggleCollapsed,
  onDrop,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDragStart,
  busy,
  loading,
  domainCount,
  collapsed,
  contentId,
  idPrefix = `portfolio`,
  searching = false,
  dragging = false,
  draggable = false,
  dropTarget = false,
  showAllDomains = false,
}: PortfolioCollectionProps) => {
  const scope = `${idPrefix}-collection-${collection.id}`;
  const fallbackPrefix = idPrefix.endsWith(`-sticky`) ? idPrefix.slice(0, -7) : `${idPrefix}-sticky`;
  const fallbackScope = `${fallbackPrefix}-collection-${collection.id}`;
  const state = usePortfolioCollection(collection);
  const stars = useCollectionStars(collection, loading || busy);
  const VisibilityIcon = state.hidden ? EyeOff : Eye;
  const visibility = collection.visibility ?? `private`;
  const visibilityLabel = `${state.hidden ? `Show` : `Hide`} ${collection.name}`;
  const descriptionLabel = `${collection.description ? `Edit` : `Add`} Description For ${collection.name}`;
  const starsLabel = stars.summary.count
    ? `View ${stars.summary.count} Star(s) In ${collection.name}: ${stars.summary.groupCount} Group(s), ${stars.summary.domainCount} Domain(s)`
    : `Star All Groups, Apps And Domains In ${collection.name}`;
  const searchToggleLabel = showAllDomains ? `Show only search matches in ${collection.name}` : `Show all domains in ${collection.name}`;

  return (
    <div
      id={scope}
      aria-labelledby={`${scope}-title`}
      className={`portfolio-collection${dragging ? ` portfolio-collection-dragging` : ``}`}
    >
      <div
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        draggable={draggable && !state.nameEditing}
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
              <span id={`${scope}-symbol`} aria-hidden={`true`} className={`domain-site-icon portfolio-collection-symbol`}>
                <svg
                  width={16}
                  height={16}
                  stroke={`none`}
                  focusable={false}
                  fill={`currentColor`}
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
              </span>
              <span id={`${scope}-name-actions`} className={`portfolio-collection-name-actions`}>
                <PortfolioNameEditor
                  kind={`Collection`}
                  id={`${scope}-name`}
                  value={collection.name}
                  onSave={state.setName}
                  onEditingChange={state.setNameEditing}
                  busy={loading || busy || state.loading}
                  className={`portfolio-collection-name`}
                />
                <button
                  type={`button`}
                  draggable={false}
                  title={descriptionLabel}
                  aria-haspopup={`dialog`}
                  aria-label={descriptionLabel}
                  id={`${scope}-description-edit`}
                  aria-expanded={state.editing && state.editDescription}
                  disabled={loading || busy || state.loading}
                  className={`portfolio-collection-description-edit`}
                  aria-controls={`domain-collection-settings-dialog`}
                  data-focus-fallback={`${fallbackScope}-description-edit`}
                  onMouseDown={event => event.stopPropagation()}
                  onPointerDown={event => event.stopPropagation()}
                  onClick={event => { event.stopPropagation(); state.openSettings(true); }}
                  onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}
                >
                  <Pencil size={12} aria-hidden={`true`} id={`${scope}-description-edit-icon`} className={`portfolio-collection-description-edit-icon`} />
                </button>
              </span>
            </h3>
            {collection.description && <span id={`${scope}-description`} className={`portfolio-collection-description`}>{collection.description}</span>}
            {state.hidden && (
              <span id={`${scope}-visibility-state`} className={`portfolio-collection-hidden-state`}>
                {`Hidden`}
              </span>
            )}
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
              disabled={loading || busy}
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
              disabled={loading || busy}
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
          <PortfolioCollectionProgress collection={collection} id={`${scope}-progress`} />
          {domainCount > 0 && (
            <span
              id={`${scope}-domain-count`}
              className={`portfolio-collection-count`}
              title={`${domainCount} Domain(s) In ${collection.name}`}
              aria-label={`${domainCount} Domain(s) In ${collection.name}`}
            >
              {domainCount}
            </span>
          )}
          {searching && onToggleSearch && (
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
          <div id={`${scope}-action-rail`} className={`portfolio-row-action-rail`}>
            <button
              type={`button`}
              draggable={false}
              title={visibilityLabel}
              aria-label={visibilityLabel}
              aria-pressed={!state.hidden}
              id={`${scope}-visibility-toggle`}
              disabled={loading || busy || state.loading}
              className={`portfolio-collection-visibility-toggle`}
              onMouseDown={event => event.stopPropagation()}
              onPointerDown={event => event.stopPropagation()}
              onClick={event => { event.stopPropagation(); state.toggleVisibility(); }}
              onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}
            >
              <VisibilityIcon size={17} aria-hidden={`true`} id={`${scope}-visibility-toggle-icon`} className={`portfolio-collection-visibility-toggle-icon`} />
            </button>
            <button
              type={`button`}
              draggable={false}
              title={starsLabel}
              ref={stars.buttonRef}
              id={`${scope}-stars`}
              data-focus-fallback={`${fallbackScope}-stars`}
              aria-label={starsLabel}
              aria-busy={stars.starring}
              aria-haspopup={stars.summary.count ? `dialog` : undefined}
              aria-expanded={stars.summary.count ? stars.open : undefined}
              disabled={loading || busy || stars.loading}
              onMouseDown={event => event.stopPropagation()}
              onPointerDown={event => event.stopPropagation()}
              onClick={event => { event.stopPropagation(); void stars.openStars(); }}
              onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}
              aria-controls={stars.open ? `${scope}-stars${stars.copyOpen ? `-copy-options` : ``}-dialog` : undefined}
              className={`star-button portfolio-collection-stars${stars.summary.count > 0 ? ` star-button-starred portfolio-collection-stars-active` : ``}`}
            >
              <Star
                size={16}
                aria-hidden={`true`}
                id={`${scope}-stars-icon`}
                className={`star-button-icon portfolio-collection-stars-icon`}
                fill={stars.summary.count ? `currentColor` : `none`}
              />
              {stars.summary.count > 0 && (
                <span aria-hidden={`true`} id={`${scope}-stars-count`} className={`portfolio-collection-stars-count`}>{stars.summary.count}</span>
              )}
            </button>
            <PortfolioRowCopy
              iconSize={17}
              label={collection.name}
              id={`${scope}-copy-domains`}
              disabled={loading || busy || state.loading}
              focusFallbackId={`${fallbackScope}-copy-domains`}
              sections={{ collections: [copySection], mainGroups: [], mainDomains: [] }}
            />
            <button
              type={`button`}
              draggable={false}
              aria-haspopup={`dialog`}
              id={`${scope}-settings`}
              data-focus-fallback={`${fallbackScope}-settings`}
              title={`Edit ${collection.name}`}
              aria-label={`Edit ${collection.name}`}
              className={`portfolio-collection-settings portfolio-row-settings-action`}
              onClick={() => state.openSettings()}
            >
              <Settings size={17} aria-hidden={`true`} id={`${scope}-settings-icon`} className={`portfolio-collection-settings-icon`} />
            </button>
            <button
              type={`button`}
              draggable={false}
              aria-controls={contentId}
              aria-expanded={!collapsed}
              onClick={onToggleCollapsed}
              id={`${scope}-collapse-toggle`}
              title={`${collapsed ? `Expand` : `Collapse`} ${collection.name}`}
              aria-label={`${collapsed ? `Expand` : `Collapse`} ${collection.name}`}
              className={`portfolio-collection-collapse-toggle portfolio-row-collapse-action${collapsed ? ` portfolio-collection-collapse-toggle-collapsed` : ``}`}
            >
              <ChevronDown size={17} aria-hidden={`true`} id={`${scope}-collapse-icon`} className={`portfolio-collection-collapse-icon`} />
            </button>
          </div>
        </div>
      </div>
      <p id={`${scope}-interaction-help`} className={`portfolio-sr-only`}>
        {`Drag this title bar to reorder collections, or use the up and down buttons. Drop a group or domain on the title bar to add it to this collection. The move menu offers a keyboard alternative.`}
      </p>
      {stars.open && typeof document !== `undefined` && createPortal(
        <PortfolioCollectionStars idPrefix={idPrefix} collection={collection} state={stars} />,
        document.body,
        `${scope}-stars-portal`,
      )}
      {stars.starError && typeof document !== `undefined` && createPortal(
        <Toast id={`${scope}-stars-error`} message={stars.starError} onDismiss={stars.dismissStarError} />,
        document.body,
        `${scope}-stars-error-portal`,
      )}
      {state.editing && typeof document !== `undefined` && createPortal(
        <DomainCollectionSettings collection={collection} editDescription={state.editDescription} onClose={() => state.setEditing(false)} />,
        document.body,
        `${scope}-settings-portal`,
      )}
    </div>
  );
};

export default PortfolioCollection;
