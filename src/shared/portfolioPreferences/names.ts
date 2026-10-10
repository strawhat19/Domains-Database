import type { PortfolioPreferences } from './types';

type PortfolioNames = Pick<PortfolioPreferences, `collections` | `customGroups`>;
interface PortfolioNameExclusions {
  groupId?: string;
  collectionId?: string;
}

export const normalizePortfolioName = (name: string) => name.trim().toLowerCase();

export const isPortfolioNameTaken = (preferences: PortfolioNames, name: string, exclude: PortfolioNameExclusions = {}) => {
  const normalizedName = normalizePortfolioName(name);
  return preferences.collections.some(collection => collection.id !== exclude.collectionId && normalizePortfolioName(collection.name) === normalizedName)
    || preferences.customGroups.some(group => group.id !== exclude.groupId && normalizePortfolioName(group.name) === normalizedName);
};

export const getConvertedGroupName = (preferences: PortfolioNames, collectionName: string, groupId?: string) => {
  const base = collectionName.trim();
  let number = 1;
  while (true) {
    const suffix = number === 1 ? ` Group` : ` Group ${number}`;
    const name = `${base.slice(0, 80 - suffix.length).trimEnd()}${suffix}`;
    if (normalizePortfolioName(name) !== normalizePortfolioName(collectionName) && !isPortfolioNameTaken(preferences, name, { groupId })) return name;
    number += 1;
  }
};
