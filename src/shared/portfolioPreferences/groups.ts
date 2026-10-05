import type { DomainRecord } from '../types';
import type { PortfolioPreferences, PortfolioGroup } from './types';
import { getPortfolioColumnDisplay, getPortfolioColumnValue, hasPortfolioColumnValue, PORTFOLIO_COLUMNS } from '../portfolioColumns';

export type { PortfolioGroup } from './types';

export const GROUPABLE_COLUMNS = PORTFOLIO_COLUMNS.filter(column => column.field !== `name` && column.field !== `notes`);

export const applyDomainOrder = (domains: DomainRecord[], order: string[] = []) => {
  const positions = new Map(order.map((id, index) => [id, index]));
  return [...domains].sort((first, second) => (
    (positions.get(first.id) ?? Number.MAX_SAFE_INTEGER) - (positions.get(second.id) ?? Number.MAX_SAFE_INTEGER)
  ));
};

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
    const identity = missing ? `unknown` : JSON.stringify([value, PORTFOLIO_COLUMNS.find(column => column.field === groupBy)?.price ? domain.currency?.trim().toUpperCase() || `USD` : ``]);
    const key = `field:${groupBy}:${encodeURIComponent(identity)}`;
    const group = groups.get(key) ?? { key, label: missing ? `Unknown` : getPortfolioColumnDisplay(domain, groupBy), domains: [] };
    group.domains.push(domain);
    groups.set(key, group);
  });
  return [...groups.values()]
    .sort((first, second) => first.label.localeCompare(second.label, undefined, { numeric: true, sensitivity: `base` }))
    .map(group => ({ ...group, domains: applyDomainOrder(group.domains, orders[group.key]) }));
};
