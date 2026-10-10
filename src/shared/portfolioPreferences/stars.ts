import type { DomainRecord } from '../types';
import { buildPortfolioCopyText, type PortfolioCopyFormat } from '../../components/DomainPortfolio/copyFormats';
import type { PortfolioGroup, PortfolioSections, CustomPortfolioGroup, CustomPortfolioCollection } from './types';

export interface CollectionStarsSummary {
  count: number;
  groupCount: number;
  domainCount: number;
  directDomains: DomainRecord[];
  groups: { group: CustomPortfolioGroup; domains: DomainRecord[] }[];
}

export const buildCollectionStars = (
  collectionId: string,
  groups: readonly CustomPortfolioGroup[],
  domains: readonly DomainRecord[],
  directDomainIds: readonly string[] = [],
): CollectionStarsSummary => {
  const groupIds = new Set<string>();
  const domainIds = new Set<string>();
  const includedGroupIds = new Set<string>();
  const starredDomains = new Map(domains.filter(domain => domain.starred).map(domain => [domain.id, domain]));
  const includedGroups = groups.flatMap(group => {
    if (group.collectionId !== collectionId || includedGroupIds.has(group.id)) return [];
    includedGroupIds.add(group.id);
    const groupDomains = [...new Set(group.domainIds)].flatMap(id => {
      const domain = starredDomains.get(id);
      return domain ? [domain] : [];
    });
    if (!group.starred && !groupDomains.length) return [];
    if (group.starred) groupIds.add(group.id);
    groupDomains.forEach(domain => domainIds.add(domain.id));
    return [{ group, domains: groupDomains }];
  });
  const groupedDomainIds = new Set(groups.flatMap(group => group.domainIds));
  const directDomains = [...new Set(directDomainIds)].flatMap(id => {
    const domain = !groupedDomainIds.has(id) ? starredDomains.get(id) : undefined;
    return domain ? [domain] : [];
  });
  directDomains.forEach(domain => domainIds.add(domain.id));
  const groupCount = groupIds.size;
  const domainCount = domainIds.size;
  return { groupCount, domainCount, directDomains, groups: includedGroups, count: groupCount + domainCount };
};

export const buildCollectionStarsCopyText = (
  collection: CustomPortfolioCollection,
  stars: CollectionStarsSummary,
  format: PortfolioCopyFormat,
): string => {
  if (!stars.count) return ``;
  const starredDomains = new Map(stars.directDomains.concat(stars.groups.flatMap(({ domains }) => domains)).map(domain => [domain.id, domain]));
  if (format === `list`) {
    const starredGroups = new Map(stars.groups.filter(({ group }) => group.starred).map(({ group }) => [group.id, group.name]));
    return [...starredGroups.values(), ...[...starredDomains.values()].map(domain => domain.name)]
      .sort((first, second) => first.localeCompare(second, undefined, { numeric: true, sensitivity: `base` }))
      .map((name, index) => `${index + 1}. ${name}`)
      .join(`\n`);
  }
  const groups: PortfolioGroup[] = stars.groups.map(({ group, domains }) => ({
    domains,
    label: group.name,
    customGroupId: group.id,
    key: `custom:${group.id}`,
    description: group.description,
  }));
  if (stars.directDomains.length) groups.unshift({
    label: collection.name,
    domains: stars.directDomains,
    key: `collection:${collection.id}`,
    directCollectionId: collection.id,
  });
  const domains = [...starredDomains.values()];
  const sections: PortfolioSections = {
    mainGroups: [],
    mainDomains: [],
    collections: [{ groups, domains, collection }],
  };
  return buildPortfolioCopyText(sections, domains.map(domain => domain.id), true, format);
};
