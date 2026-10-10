import { useCallback, useState } from 'react';

const toggleCollapsed = (current: Set<string>, id: string) => {
  const next = new Set(current);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

export const usePortfolioExpansion = () => {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set());
  const [collapsedCollections, setCollapsedCollections] = useState<Set<string>>(() => new Set());
  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups(current => toggleCollapsed(current, key));
  }, []);
  const toggleCollection = useCallback((id: string) => {
    setCollapsedCollections(current => toggleCollapsed(current, id));
  }, []);
  const isGroupCollapsed = (key: string) => collapsedGroups.has(key);
  const isCollectionCollapsed = (id: string | null | undefined) => Boolean(id && collapsedCollections.has(id));

  return { toggleGroup, toggleCollection, collapsedGroups, collapsedCollections, isGroupCollapsed, isCollectionCollapsed };
};
