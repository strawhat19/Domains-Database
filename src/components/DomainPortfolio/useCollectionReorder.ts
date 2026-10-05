import { useState } from 'react';
import type { DragEvent } from 'react';
import { GROUP_DRAG_TYPE, COLLECTION_DRAG_TYPE } from '../PortfolioRecords/dragData';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

export const useCollectionReorder = (enabled: boolean) => {
  const preferences = usePortfolioPreferences();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null | undefined>();
  const clear = () => {
    setDraggingId(null);
    setTargetId(undefined);
  };
  const handlers = (collectionId: string | null) => {
    const canDrop = (transfer: DataTransfer) => enabled && (
      transfer.types.includes(GROUP_DRAG_TYPE)
      || (Boolean(collectionId) && draggingId !== collectionId && transfer.types.includes(COLLECTION_DRAG_TYPE))
    );
    return {
      dragging: draggingId === collectionId && Boolean(collectionId),
      draggable: enabled && Boolean(collectionId),
      dropTarget: targetId === collectionId,
      onDragEnd: clear,
      onDragStart: (event: DragEvent<HTMLDivElement>) => {
        if (!enabled || !collectionId) { event.preventDefault(); return; }
        event.stopPropagation();
        event.dataTransfer.effectAllowed = `move`;
        event.dataTransfer.setData(`text/plain`, collectionId);
        event.dataTransfer.setData(COLLECTION_DRAG_TYPE, collectionId);
        setDraggingId(collectionId);
      },
      onDragOver: (event: DragEvent<HTMLDivElement>) => {
        if (!canDrop(event.dataTransfer)) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = `move`;
        setTargetId(collectionId);
      },
      onDragLeave: (event: DragEvent<HTMLDivElement>) => {
        if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
        setTargetId(current => current === collectionId ? undefined : current);
      },
      onDrop: (event: DragEvent<HTMLDivElement>) => {
        if (!canDrop(event.dataTransfer)) return;
        event.preventDefault();
        event.stopPropagation();
        const groupId = event.dataTransfer.getData(GROUP_DRAG_TYPE);
        const sourceId = event.dataTransfer.getData(COLLECTION_DRAG_TYPE);
        if (groupId) preferences.assignGroupCollection(groupId, collectionId);
        else if (sourceId && collectionId) {
          const bounds = event.currentTarget.getBoundingClientRect();
          const placement = event.clientY > bounds.top + bounds.height / 2 ? `after` : `before`;
          preferences.moveCollection(sourceId, collectionId, placement);
        }
        clear();
      },
    };
  };
  const moves = (collectionId: string) => {
    const index = preferences.collections.findIndex(collection => collection.id === collectionId);
    return {
      onMoveUp: enabled && index > 0
        ? () => preferences.moveCollection(collectionId, preferences.collections[index - 1].id) : undefined,
      onMoveDown: enabled && index >= 0 && index < preferences.collections.length - 1
        ? () => preferences.moveCollection(collectionId, preferences.collections[index + 1].id, `after`) : undefined,
    };
  };
  return { moves, handlers };
};
