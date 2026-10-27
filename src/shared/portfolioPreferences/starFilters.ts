import type { DomainRecord } from '../types';
import { buildCollectionStars } from './stars';
import { allowDomainsInCollections } from '../config';
import type { PortfolioGroup, PortfolioSections, CustomPortfolioGroup, CustomPortfolioCollection } from './types';

export const buildPortfolioStarState = (
  domains: readonly DomainRecord[],
  groups: readonly CustomPortfolioGroup[],
  collections: readonly CustomPortfolioCollection[],
) => {
  const uniqueGroups = [...new Map(groups.map(group => [group.id, group])).values()];
  const uniqueDomains = [...new Map(domains.map(domain => [domain.id, domain])).values()];
  const uniqueCollections = [...new Map(collections.map(collection => [collection.id, collection])).values()];
  const domainIds = new Set(uniqueDomains.filter(domain => domain.starred === true).map(domain => domain.id));
  const groupIds = new Set(uniqueGroups.filter(group => group.starred === true || group.domainIds.some(id => domainIds.has(id))).map(group => group.id));
  const collectionIds = new Set(uniqueCollections.filter(collection => (
    buildCollectionStars(collection.id, uniqueGroups, uniqueDomains, collection.domainIds).count > 0
  )).map(collection => collection.id));
  const groupByDomainId = new Map(uniqueGroups.flatMap(group => group.domainIds.map(id => [id, group] as const)));
  const directCollectionByDomainId = new Map<string, string>();
  if (allowDomainsInCollections) uniqueCollections.forEach(collection => collection.domainIds?.forEach(id => {
    if (!groupByDomainId.has(id) && !directCollectionByDomainId.has(id)) directCollectionByDomainId.set(id, collection.id);
  }));
  const starredScopeDomainIds = new Set(uniqueDomains.filter(domain => {
    const group = groupByDomainId.get(domain.id);
    return domainIds.has(domain.id) || (group ? groupIds.has(group.id) || collectionIds.has(group.collectionId ?? ``)
      : collectionIds.has(directCollectionByDomainId.get(domain.id) ?? ``));
  }).map(domain => domain.id));
  const total = uniqueDomains.length + uniqueGroups.length + uniqueCollections.length;
  const starred = domainIds.size + groupIds.size + collectionIds.size;
  return { total, groupIds, domainIds, collectionIds, starredScopeDomainIds, counts: { true: starred, false: total - starred } };
};

export const filterPortfolioSectionsByStar = (
  sections: PortfolioSections,
  stars: ReturnType<typeof buildPortfolioStarState>,
  value?: string,
  keepEmptyMatches = true,
): PortfolioSections => {
  if (value !== `true` && value !== `false`) return sections;
  const starred = value === `true`;
  const filterGroups = (groups: PortfolioGroup[], includeAll = false) => groups.flatMap(group => {
    const matchesGroup = group.customGroupId ? stars.groupIds.has(group.customGroupId) === starred : false;
    const domains = starred && (includeAll || matchesGroup) ? group.domains
      : group.domains.filter(domain => stars.domainIds.has(domain.id) === starred);
    return includeAll || domains.length || matchesGroup && (keepEmptyMatches || group.domains.length > 0)
      ? [{ ...group, domains }] : [];
  });
  const mainGroups = filterGroups(sections.mainGroups);
  const collections = sections.collections.flatMap(section => {
    const matchesCollection = stars.collectionIds.has(section.collection.id) === starred;
    const includeAll = starred && matchesCollection && (keepEmptyMatches || section.domains.length > 0);
    const groups = filterGroups(section.groups, includeAll);
    return groups.length || matchesCollection && (keepEmptyMatches || section.domains.length > 0)
      ? [{ ...section, groups, domains: groups.flatMap(group => group.domains) }] : [];
  });
  return { ...sections, mainGroups, collections, mainDomains: mainGroups.flatMap(group => group.domains) };
};

export const countPortfolioStarMatches = (
  sections: PortfolioSections,
  stars: ReturnType<typeof buildPortfolioStarState>,
  value?: string,
): number => {
  const groups = sections.mainGroups.concat(sections.collections.flatMap(section => section.groups));
  const groupIds = new Set(groups.flatMap(group => group.customGroupId ? [group.customGroupId] : []));
  const domainIds = new Set(groups.flatMap(group => group.domains.map(domain => domain.id)));
  const collectionIds = new Set(sections.collections.map(section => section.collection.id));
  if (value !== `true` && value !== `false`) return domainIds.size + groupIds.size + collectionIds.size;
  const starred = value === `true`;
  const countMatches = (ids: Set<string>, starredIds: Set<string>) => [...ids].filter(id => starredIds.has(id) === starred).length;
  return countMatches(domainIds, stars.domainIds) + countMatches(groupIds, stars.groupIds) + countMatches(collectionIds, stars.collectionIds);
};
