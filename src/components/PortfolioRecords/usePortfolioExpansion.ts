import { useMemo, useCallback } from 'react';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

export const usePortfolioExpansion = () => {
  const { collapsedGroupKeys, collapsedCollectionIds, toggleGroupCollapsed, toggleCollectionCollapsed } = usePortfolioPreferences();
  const collapsedGroups = useMemo(() => new Set(collapsedGroupKeys), [collapsedGroupKeys]);
  const collapsedCollections = useMemo(() => new Set(collapsedCollectionIds), [collapsedCollectionIds]);
  const toggleGroup = useCallback((key: string) => {
    toggleGroupCollapsed(key);
  }, [toggleGroupCollapsed]);
  const toggleCollection = useCallback((id: string) => {
    toggleCollectionCollapsed(id);
  }, [toggleCollectionCollapsed]);
  const isGroupCollapsed = (key: string) => collapsedGroups.has(key);
  const isCollectionCollapsed = (id: string | null | undefined) => Boolean(id && collapsedCollections.has(id));

  return { toggleGroup, toggleCollection, collapsedGroups, collapsedCollections, isGroupCollapsed, isCollectionCollapsed };
};
