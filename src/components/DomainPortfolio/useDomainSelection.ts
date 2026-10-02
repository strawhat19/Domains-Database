import { useEffect, useMemo, useState } from 'react';
import type { DomainRecord } from '../../shared/types';

export const useDomainSelection = (domains: DomainRecord[], visibleIds: string[]) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const availableIds = useMemo(() => new Set(domains.map(domain => domain.id)), [domains]);

  useEffect(() => {
    setSelectedIds(current => {
      const next = new Set([...current].filter(id => availableIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [availableIds]);

  const select = (id: string, checked: boolean) => setSelectedIds(current => {
    const next = new Set(current);
    if (checked) next.add(id);
    else next.delete(id);
    return next;
  });

  const selectAll = (checked: boolean) => setSelectedIds(current => {
    const next = new Set(current);
    visibleIds.forEach(id => {
      if (checked) next.add(id);
      else next.delete(id);
    });
    return next;
  });

  const visibleSelectedCount = visibleIds.filter(id => selectedIds.has(id)).length;
  return {
    select,
    selectAll,
    selectedIds,
    visibleSelectedCount,
    allSelected: visibleIds.length > 0 && visibleSelectedCount === visibleIds.length,
    someSelected: visibleSelectedCount > 0 && visibleSelectedCount < visibleIds.length,
  };
};
