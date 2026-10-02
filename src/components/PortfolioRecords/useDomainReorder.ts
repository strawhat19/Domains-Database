import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import type { PortfolioGroup } from '../../shared/portfolioPreferences/types';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

export const useDomainReorder = (groups: PortfolioGroup[], enabled: boolean) => {
  const preferences = usePortfolioPreferences();
  const source = useRef<{ groupKey: string; domainId: string } | null>(null);
  const [draggingId, setDraggingId] = useState(``);
  const [targetId, setTargetId] = useState(``);

  const clear = () => {
    source.current = null;
    setDraggingId(``);
    setTargetId(``);
  };

  const move = (groupKey: string, domainId: string, target: string, placement: `before` | `after` = `before`) => {
    if (!enabled) return;
    const group = groups.find(item => item.key === groupKey);
    if (!group) return;
    preferences.moveDomain(groupKey, domainId, target, group.domains.map(domain => domain.id), placement);
  };

  const handlers = (groupKey: string, domainId: string, visibleIds: string[]) => {
    const index = visibleIds.indexOf(domainId);
    return {
      draggable: enabled,
      dragging: draggingId === domainId,
      dropTarget: targetId === domainId,
      onDragStart: (event: DragEvent<HTMLElement>) => {
        if (!enabled) { event.preventDefault(); return; }
        source.current = { groupKey, domainId };
        event.dataTransfer.effectAllowed = `move`;
        event.dataTransfer.setData(`text/plain`, domainId);
        setDraggingId(domainId);
      },
      onDragEnd: clear,
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (!enabled || source.current?.groupKey !== groupKey || source.current.domainId === domainId) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = `move`;
        setTargetId(domainId);
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        const current = source.current;
        if (!enabled || !current || current.groupKey !== groupKey) return;
        event.preventDefault();
        const bounds = event.currentTarget.getBoundingClientRect();
        const placement = event.clientY > bounds.top + bounds.height / 2 ? `after` : `before`;
        move(groupKey, current.domainId, domainId, placement);
        clear();
      },
      onMoveUp: enabled && index > 0 ? () => move(groupKey, domainId, visibleIds[index - 1]) : undefined,
      onMoveDown: enabled && index < visibleIds.length - 1 ? () => move(groupKey, domainId, visibleIds[index + 1], `after`) : undefined,
    };
  };

  return { handlers, draggingId, targetId };
};
