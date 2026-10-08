import type { DomainRecord } from '../types';
import type { PortfolioColumn } from '../portfolioColumns';
import type { PortfolioPreferences, PortfolioGroup, PortfolioSections } from './types';
import { getPortfolioColumnDisplay, getPortfolioColumnValue, hasPortfolioColumnValue, PORTFOLIO_FIELDS } from '../portfolioColumns';

export type { PortfolioGroup } from './types';

export const GROUPABLE_COLUMNS = PORTFOLIO_FIELDS.filter(column => column.field !== `name`);

export const applyDomainOrder = (domains: DomainRecord[], order: string[] = []) => {
  const positions = new Map(order.map((id, index) => [id, index]));
  return [...domains].sort((first, second) => (
    (positions.get(first.id) ?? Number.MAX_SAFE_INTEGER) - (positions.get(second.id) ?? Number.MAX_SAFE_INTEGER)
  ));
};

export const sortPortfolioDomains = (domains: DomainRecord[], field: PortfolioColumn, direction: `asc` | `desc` = `asc`): DomainRecord[] => (
  [...domains].sort((first, second) => {
    const firstValue = getPortfolioColumnValue(first, field);
    const secondValue = getPortfolioColumnValue(second, field);
    const firstMissing = firstValue === undefined || firstValue === `` || (Array.isArray(firstValue) && !firstValue.length);
    const secondMissing = secondValue === undefined || secondValue === `` || (Array.isArray(secondValue) && !secondValue.length);
    if (firstMissing || secondMissing) return Number(firstMissing) - Number(secondMissing);
    const comparison = (typeof firstValue === `number` || typeof firstValue === `boolean`)
      && (typeof secondValue === `number` || typeof secondValue === `boolean`)
      ? Number(firstValue) - Number(secondValue)
      : String(firstValue).localeCompare(String(secondValue), undefined, { numeric: true, sensitivity: `base` });
    return direction === `asc` ? comparison : -comparison;
  })
);

export const buildPortfolioGroups = (domains: DomainRecord[], preferences: PortfolioPreferences): PortfolioGroup[] => {
  const { orders, groupBy, customGroups } = preferences;
  if (groupBy === `none`) return [{ key: `all`, label: `All domains`, domains: applyDomainOrder(domains, orders.all) }];

  if (groupBy === `custom`) {
    const membership = new Map(customGroups.flatMap(group => group.domainIds.map(id => [id, group.id] as const)));
    const groups: PortfolioGroup[] = customGroups.map(group => ({
      key: `custom:${group.id}`,
      label: group.name,
      customGroupId: group.id,
      description: group.description,
      domains: applyDomainOrder(domains.filter(domain => membership.get(domain.id) === group.id), orders[`custom:${group.id}`]),
    }));
    groups.push({
      key: `custom:ungrouped`,
      label: `Ungrouped`,
      domains: applyDomainOrder(domains.filter(domain => !membership.has(domain.id)), orders[`custom:ungrouped`]),
    });
    return groups;
  }

  const groups = new Map<string, PortfolioGroup>();
  domains.forEach(domain => {
    const value = getPortfolioColumnValue(domain, groupBy);
    const missing = !hasPortfolioColumnValue(value, groupBy);
    const identity = missing ? `unknown` : JSON.stringify([value, PORTFOLIO_FIELDS.find(column => column.field === groupBy)?.price ? domain.currency?.trim().toUpperCase() || `USD` : ``]);
    const key = `field:${groupBy}:${encodeURIComponent(identity)}`;
    const group = groups.get(key) ?? { key, label: missing ? `Unknown` : getPortfolioColumnDisplay(domain, groupBy), domains: [] };
    group.domains.push(domain);
    groups.set(key, group);
  });
  return [...groups.values()]
    .sort((first, second) => first.label.localeCompare(second.label, undefined, { numeric: true, sensitivity: `base` }))
    .map(group => ({ ...group, domains: applyDomainOrder(group.domains, orders[group.key]) }));
};

export const buildPortfolioSections = (domains: DomainRecord[], preferences: PortfolioPreferences): PortfolioSections => {
  const collectionIds = new Set(preferences.collections.map(collection => collection.id));
  const assignedDomainIds = new Set(preferences.customGroups
    .filter(group => group.collectionId && collectionIds.has(group.collectionId))
    .flatMap(group => group.domainIds));
  const mainDomains = domains.filter(domain => !assignedDomainIds.has(domain.id));
  const mainGroups = buildPortfolioGroups(mainDomains, {
    ...preferences,
    customGroups: preferences.customGroups.filter(group => !group.collectionId || !collectionIds.has(group.collectionId)),
  });
  const collections = preferences.collections.map(collection => {
    const customGroups = preferences.customGroups.filter(group => group.collectionId === collection.id);
    const domainIds = new Set(customGroups.flatMap(group => group.domainIds));
    const availableDomains = sortPortfolioDomains(domains.filter(domain => domainIds.has(domain.id)), `name`);
    const groups = buildPortfolioGroups(availableDomains, { ...preferences, customGroups, groupBy: `custom` })
      .filter(group => Boolean(group.customGroupId))
      .map(group => collection.sortField
        ? { ...group, domains: sortPortfolioDomains(group.domains, collection.sortField, collection.sortDirection) }
        : group);
    return { groups, collection, domains: groups.flatMap(group => group.domains) };
  });
  return { collections, mainGroups, mainDomains };
};
