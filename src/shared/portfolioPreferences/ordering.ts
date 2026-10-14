import type { PortfolioPreferences } from './types';

export const getGroupOrderScope = (collectionId?: string) => collectionId ? `collection:${collectionId}` : `database`;

const compareNames = (first: { id: string; name: string }, second: { id: string; name: string }) => (
  first.name.localeCompare(second.name, undefined, { numeric: true, sensitivity: `base` })
  || first.id.localeCompare(second.id)
);

export const initializePortfolioOrder = (preferences: PortfolioPreferences): PortfolioPreferences => {
  const manualScopes = new Set(preferences.manualGroupOrderScopes);
  const groupsByScope = new Map<string, PortfolioPreferences[`customGroups`]>();
  preferences.customGroups.forEach(group => {
    const scope = getGroupOrderScope(group.collectionId);
    const groups = groupsByScope.get(scope) ?? [];
    groups.push(group);
    groupsByScope.set(scope, groups);
  });
  groupsByScope.forEach((groups, scope) => {
    if (!manualScopes.has(scope)) groups.sort(compareNames);
  });
  const positions = new Map<string, number>();
  return {
    ...preferences,
    collections: preferences.manualCollectionOrder ? preferences.collections : [...preferences.collections].sort(compareNames),
    customGroups: preferences.customGroups.map(group => {
      const scope = getGroupOrderScope(group.collectionId);
      const index = positions.get(scope) ?? 0;
      positions.set(scope, index + 1);
      return groupsByScope.get(scope)?.[index] ?? group;
    }),
  };
};
