import './styles.scss';
import { usePortfolioCollection } from './usePortfolioCollection';
import type { CSSProperties, DragEventHandler } from 'react';
import { ArrowUp, ArrowDown, Settings, ArrowDownAZ, GripVertical } from 'lucide-react';
import DomainCollectionSettings from '../DomainCollectionSettings/index.web';
import PortfolioRecords, { type PortfolioRecordsProps } from '../PortfolioRecords/index.web';
import type { CustomPortfolioCollection } from '../../shared/portfolioPreferences/types';

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
          <h3 id={`${scope}-title`} className={`portfolio-collection-title`}>
            {collection.name}
          </h3>
          {collection.description && (
            <p id={`${scope}-description`} className={`portfolio-collection-description`}>
              {collection.description}
            </p>
          )}
        </div>
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
