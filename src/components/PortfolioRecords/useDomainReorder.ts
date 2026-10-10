import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { GROUP_DRAG_TYPE, DOMAIN_DRAG_TYPE, readDomainDrag } from './dragData';
import type { PortfolioGroup } from '../../shared/portfolioPreferences/types';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

interface DomainReorderOptions {
  groupEnabled?: boolean;
  selectedIds?: Set<string>;
  onGrouped?: () => void;
  availableIds?: string[];
  disabledGroupKeys?: Set<string>;
  groupScopes?: Map<string, string | null>;
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
  { groupEnabled = false, selectedIds, onGrouped, availableIds, disabledGroupKeys, groupScopes }: DomainReorderOptions = {},
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
    if (!enabled || disabledGroupKeys?.has(groupKey)) return;
    const group = groups.find(item => item.key === groupKey);
    if (!group) return;
    preferences.moveDomain(groupKey, domainId, target, group.domains.map(domain => domain.id), placement);
  };

  const handlers = (groupKey: string, domainId: string, visibleIds: string[]) => {
    const index = visibleIds.indexOf(domainId);
    const canReorder = enabled && !disabledGroupKeys?.has(groupKey);
    return {
      reorderable: canReorder,
      draggable: canReorder || groupEnabled,
      dragging: draggingId === domainId,
      dropTarget: targetId === domainId,
      onDragStart: (event: DragEvent<HTMLElement>) => {
        if (!canReorder && !groupEnabled) { event.preventDefault(); return; }
        const domainIds = selectedIds?.has(domainId)
          ? (availableIds ?? groups.flatMap(group => group.domains).map(domain => domain.id)).filter(id => selectedIds?.has(id))
          : [domainId];
        source.current = { groupKey, domainId, domainIds, kind: `domain` };
        event.dataTransfer.effectAllowed = `move`;
        event.dataTransfer.setData(`text/plain`, domainId);
        event.dataTransfer.setData(DOMAIN_DRAG_TYPE, JSON.stringify({ groupKey, domainId, domainIds }));
        setDraggingId(domainId);
        setDraggingGroupId(``);
      },
      onDragEnd: clear,
      onDragOver: (event: DragEvent<HTMLElement>) => {
        const current = source.current;
        if (!canReorder || current?.kind !== `domain` || current.groupKey !== groupKey || current.domainId === domainId) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = `move`;
        setTargetId(domainId);
        setTargetGroupKey(``);
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        const current = source.current;
        if (!canReorder || current?.kind !== `domain` || current.groupKey !== groupKey) return;
        event.preventDefault();
        const bounds = event.currentTarget.getBoundingClientRect();
        const placement = event.clientY > bounds.top + bounds.height / 2 ? `after` : `before`;
        move(groupKey, current.domainId, domainId, placement);
        clear();
      },
      onMoveUp: canReorder && index > 0 ? () => move(groupKey, domainId, visibleIds[index - 1]) : undefined,
      onMoveDown: canReorder && index < visibleIds.length - 1 ? () => move(groupKey, domainId, visibleIds[index + 1], `after`) : undefined,
    };
  };

  const groupMoves = (groupId: string) => {
    const scope = groupScopes?.get(`custom:${groupId}`);
    const groupIds = groups.flatMap(group => group.customGroupId && (!groupScopes || groupScopes.get(group.key) === scope) ? [group.customGroupId] : []);
    const index = groupIds.indexOf(groupId);
    return {
      onMoveUp: groupEnabled && index > 0
        ? () => preferences.moveGroup(groupId, groupIds[index - 1]) : undefined,
      onMoveDown: groupEnabled && index >= 0 && index < groupIds.length - 1
        ? () => preferences.moveGroup(groupId, groupIds[index + 1], `after`) : undefined,
    };
  };

  const groupHandlers = (group: PortfolioGroup) => {
    const canDrop = (transfer: DataTransfer) => {
      const current = source.current;
      if (!groupEnabled) return false;
      if (transfer.types.includes(GROUP_DRAG_TYPE)) {
        return Boolean(group.customGroupId && (current?.kind !== `group` || group.customGroupId !== current.groupId));
      }
      return transfer.types.includes(DOMAIN_DRAG_TYPE) && Boolean(group.customGroupId || group.key === `custom:ungrouped`);
    };
    return {
      draggable: groupEnabled && Boolean(group.customGroupId),
      onDragEnd: clear,
      onDragStart: (event: DragEvent<HTMLElement>) => {
        if (!groupEnabled || !group.customGroupId) { event.preventDefault(); return; }
        event.stopPropagation();
        source.current = { kind: `group`, groupId: group.customGroupId };
        event.dataTransfer.effectAllowed = `move`;
        event.dataTransfer.setData(GROUP_DRAG_TYPE, group.customGroupId);
        event.dataTransfer.setData(`text/plain`, group.customGroupId);
        setDraggingId(``);
        setDraggingGroupId(group.customGroupId);
      },
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (!canDrop(event.dataTransfer)) return;
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
        if (!canDrop(event.dataTransfer)) return;
        event.preventDefault();
        event.stopPropagation();
        const groupId = event.dataTransfer.getData(GROUP_DRAG_TYPE);
        const domain = readDomainDrag(event.dataTransfer);
        if (groupId && group.customGroupId && preferences.customGroups.some(item => item.id === groupId)) {
          const bounds = event.currentTarget.getBoundingClientRect();
          const placement = event.clientY > bounds.top + bounds.height / 2 ? `after` : `before`;
          preferences.moveGroup(groupId, group.customGroupId, placement);
        } else if (domain) {
          const available = new Set(availableIds ?? groups.flatMap(item => item.domains).map(record => record.id));
          if (domain.domainIds.every(id => available.has(id))
            && preferences.assignDomains(domain.domainIds, group.customGroupId ?? null)) onGrouped?.();
        }
        clear();
      },
    };
  };

  return { handlers, targetId, groupMoves, draggingId, groupHandlers, targetGroupKey, draggingGroupId };
};
