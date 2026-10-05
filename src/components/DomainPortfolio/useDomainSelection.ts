import { useEffect, useMemo, useRef, useState } from 'react';
import type { DomainRecord } from '../../shared/types';

export const useDomainSelection = (domains: DomainRecord[], visibleIds: string[]) => {
  const selectionAnchor = useRef<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const availableIds = useMemo(() => new Set(domains.map(domain => domain.id)), [domains]);

  useEffect(() => {
    if (selectionAnchor.current && !availableIds.has(selectionAnchor.current)) {
      selectionAnchor.current = null;
    }
    setSelectedIds(current => {
      const next = new Set([...current].filter(id => availableIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [availableIds]);

  const clearSelection = () => {
    selectionAnchor.current = null;
    setSelectedIds(new Set());
  };

  const select = (id: string, checked: boolean, extend = false) => {
    const selectedIndex = visibleIds.indexOf(id);
    const anchorIndex = selectionAnchor.current ? visibleIds.indexOf(selectionAnchor.current) : -1;
    const rangeIds = extend && anchorIndex !== -1 && selectedIndex !== -1
      ? visibleIds.slice(Math.min(anchorIndex, selectedIndex), Math.max(anchorIndex, selectedIndex) + 1)
      : [id];

    if (!extend || anchorIndex === -1) selectionAnchor.current = id;

    setSelectedIds(current => {
      const next = new Set(current);
      rangeIds.forEach(rangeId => {
        if (checked) next.add(rangeId);
        else next.delete(rangeId);
      });
      return next;
    });
  };

  const selectAll = (checked: boolean) => {
    selectionAnchor.current = null;
    setSelectedIds(current => {
      const next = new Set(current);
      visibleIds.forEach(id => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  const visibleSelectedCount = visibleIds.filter(id => selectedIds.has(id)).length;
  return {
    select,
    selectAll,
    selectedIds,
    clearSelection,
    visibleSelectedCount,
    allSelected: visibleIds.length > 0 && visibleSelectedCount === visibleIds.length,
    someSelected: visibleSelectedCount > 0 && visibleSelectedCount < visibleIds.length,
  };
};
