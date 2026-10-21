import { buildDomainDataResponse } from './serialize';
import type { DomainRecord } from '../types';
import type { PortfolioGroup, PortfolioSections } from '../portfolioPreferences/types';

export const buildPortfolioJson = (sections: PortfolioSections, visibleIds: string[], _grouped: boolean): string => {
  const visible = new Set(visibleIds);
  const domainMap = new Map<string, DomainRecord>();
  const groups: unknown[] = [];
  const addGroup = (group: PortfolioGroup, collectionId?: string) => {
    for (const domain of group.domains) if (visible.has(domain.id)) domainMap.set(domain.id, domain);
    if (group.customGroupId) groups.push({ ...group, id: group.customGroupId, name: group.label, collectionId: collectionId ?? group.directCollectionId, domainIds: group.domains.map(domain => domain.id) });
  };
  for (const domain of sections.mainDomains) if (visible.has(domain.id)) domainMap.set(domain.id, domain);
  for (const group of sections.mainGroups) addGroup(group);
  const collections = sections.collections.map(section => {
    for (const domain of section.domains) if (visible.has(domain.id)) domainMap.set(domain.id, domain);
    for (const group of section.groups) addGroup(group, section.collection.id);
    return { ...section.collection, domainIds: [...section.domains, ...section.groups.flatMap(group => group.domains)].map(domain => domain.id) };
  });
  const domains = [...domainMap.values()];
  const userIds = new Set(domains.map(domain => domain.uid));
  const userId = domains.length > 0 && userIds.size === 1 && domains[0].uid ? domains[0].uid : null;
  return JSON.stringify(buildDomainDataResponse({
    groups,
    userId,
    domains,
    collections,
    access: `displayed`,
    source: `displayed`,
    warnings: [`Contains The Currently Displayed Records; Server Access Was Not Rechecked`],
  }), null, 2);
};
