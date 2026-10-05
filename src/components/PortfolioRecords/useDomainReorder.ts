import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import type { PortfolioGroup } from '../../shared/portfolioPreferences/types';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

interface DomainReorderOptions {
  groupEnabled?: boolean;
  selectedIds?: Set<string>;
  onGrouped?: () => void;
}

type DragSource = {
  kind: `domain`;
  groupKey: string;
  domainId: string;
  domainIds: string[];
} | {
  kind: `group`;
  groupId: string;
};

export const useDomainReorder = (
  groups: PortfolioGroup[],
  enabled: boolean,
  { groupEnabled = false, selectedIds, onGrouped }: DomainReorderOptions = {},
) => {
  const preferences = usePortfolioPreferences();
  const source = useRef<DragSource | null>(null);
  const [targetId, setTargetId] = useState(``);
  const [draggingId, setDraggingId] = useState(``);
  const [targetGroupKey, setTargetGroupKey] = useState(``);
  const [draggingGroupId, setDraggingGroupId] = useState(``);

  const clear = () => {
    source.current = null;
    setDraggingId(``);
    setTargetId(``);
    setTargetGroupKey(``);
    setDraggingGroupId(``);
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
      draggable: enabled || groupEnabled,
      dragging: draggingId === domainId,
      dropTarget: targetId === domainId,
      onDragStart: (event: DragEvent<HTMLElement>) => {
        if (!enabled && !groupEnabled) { event.preventDefault(); return; }
        const domainIds = selectedIds?.has(domainId)
          ? groups.flatMap(group => group.domains).filter(domain => selectedIds?.has(domain.id)).map(domain => domain.id)
          : [domainId];
        source.current = { groupKey, domainId, domainIds, kind: `domain` };
        event.dataTransfer.effectAllowed = `move`;
        event.dataTransfer.setData(`text/plain`, domainId);
        setDraggingId(domainId);
        setDraggingGroupId(``);
      },
      onDragEnd: clear,
      onDragOver: (event: DragEvent<HTMLElement>) => {
        const current = source.current;
        if (!enabled || current?.kind !== `domain` || current.groupKey !== groupKey || current.domainId === domainId) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = `move`;
        setTargetId(domainId);
        setTargetGroupKey(``);
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        const current = source.current;
        if (!enabled || current?.kind !== `domain` || current.groupKey !== groupKey) return;
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

  const groupMoves = (groupId: string) => {
    const index = preferences.customGroups.findIndex(group => group.id === groupId);
    return {
      onMoveUp: groupEnabled && index > 0
        ? () => preferences.moveGroup(groupId, preferences.customGroups[index - 1].id) : undefined,
      onMoveDown: groupEnabled && index >= 0 && index < preferences.customGroups.length - 1
        ? () => preferences.moveGroup(groupId, preferences.customGroups[index + 1].id, `after`) : undefined,
    };
  };

  const groupHandlers = (group: PortfolioGroup) => {
    const canDrop = () => {
      const current = source.current;
      if (!groupEnabled || !current) return false;
      if (current.kind === `group`) return Boolean(group.customGroupId && group.customGroupId !== current.groupId);
      return Boolean(group.customGroupId || group.key === `custom:ungrouped`);
    };
    return {
      draggable: groupEnabled && Boolean(group.customGroupId),
      onDragEnd: clear,
      onDragStart: (event: DragEvent<HTMLElement>) => {
        if (!groupEnabled || !group.customGroupId) { event.preventDefault(); return; }
        event.stopPropagation();
        source.current = { kind: `group`, groupId: group.customGroupId };
        event.dataTransfer.effectAllowed = `move`;
        event.dataTransfer.setData(`application/x-domains-database-group`, group.customGroupId);
        event.dataTransfer.setData(`text/plain`, group.customGroupId);
        setDraggingId(``);
        setDraggingGroupId(group.customGroupId);
      },
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (!canDrop()) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = `move`;
        setTargetId(``);
        setTargetGroupKey(group.key);
      },
      onDragLeave: (event: DragEvent<HTMLElement>) => {
        if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
        setTargetGroupKey(current => current === group.key ? `` : current);
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        if (!canDrop()) return;
        event.preventDefault();
        event.stopPropagation();
        const current = source.current;
        if (current?.kind === `group` && group.customGroupId) {
          const bounds = event.currentTarget.getBoundingClientRect();
          const placement = event.clientY > bounds.top + bounds.height / 2 ? `after` : `before`;
          preferences.moveGroup(current.groupId, group.customGroupId, placement);
        } else if (current?.kind === `domain`) {
          const availableIds = new Set(groups.flatMap(item => item.domains).map(domain => domain.id));
          if (current.domainIds.every(id => availableIds.has(id))
            && preferences.assignDomains(current.domainIds, group.customGroupId ?? null)) onGrouped?.();
        }
        clear();
      },
    };
  };

  return { handlers, targetId, groupMoves, draggingId, groupHandlers, targetGroupKey, draggingGroupId };
};
