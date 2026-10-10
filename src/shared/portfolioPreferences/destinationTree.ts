import type { DomainRecord } from '../types';
import type { CustomPortfolioGroup, CustomPortfolioCollection } from './types';

export interface DestinationGroup {
  id: string;
  name: string;
  count: number;
  isApp?: boolean;
  createdAt?: string;
  description?: string;
  collectionId?: string;
}

export interface DestinationBranch {
  id: string;
  name: string;
  count: number;
  main: boolean;
  number?: number;
  createdAt?: string;
  description?: string;
  groups: DestinationGroup[];
}

export const buildPortfolioDestinationTree = (
  domains: DomainRecord[],
  groups: CustomPortfolioGroup[],
  collections: CustomPortfolioCollection[],
) => {
  const domainIds = new Set(domains.map(domain => domain.id));
  const groupedIds = new Set<string>();
  const collectionIds = new Set(collections.map(collection => collection.id));
  const collectionDomains = new Map<string, Set<string>>(collections.map(collection => [collection.id, new Set<string>()]));
  const destinationGroups: DestinationGroup[] = groups.map(group => {
    const validIds = new Set(group.domainIds.filter(id => domainIds.has(id)));
    const collectionId = group.collectionId && collectionIds.has(group.collectionId) ? group.collectionId : undefined;
    const collectionDomainIds = collectionId ? collectionDomains.get(collectionId) : undefined;
    for (const id of validIds) {
      groupedIds.add(id);
      collectionDomainIds?.add(id);
    }
    return {
      id: group.id,
      name: group.name,
      isApp: group.isApp,
      createdAt: group.createdAt,
      count: validIds.size,
      collectionId,
      description: group.description,
    };
  });
  const directlyCollectedIds = new Set<string>();
  collections.forEach(collection => (collection.domainIds ?? []).forEach(id => {
    if (!domainIds.has(id) || groupedIds.has(id) || directlyCollectedIds.has(id)) return;
    directlyCollectedIds.add(id);
    collectionDomains.get(collection.id)?.add(id);
  }));
  const collectedIds = new Set(Array.from(collectionDomains.values()).flatMap(ids => [...ids]));
  const mainCount = Array.from(domainIds).filter(id => !collectedIds.has(id)).length;
  const ungroupedCount = Array.from(domainIds).filter(id => !groupedIds.has(id) && !collectedIds.has(id)).length;
  const branches: DestinationBranch[] = collections.map(collection => ({
    main: false,
    id: collection.id,
    name: collection.name,
    number: collection.number,
    createdAt: collection.createdAt,
    description: collection.description,
    count: collectionDomains.get(collection.id)?.size ?? 0,
    groups: destinationGroups.filter(group => group.collectionId === collection.id),
  }));
  branches.push({
    main: true,
    id: `main`,
    name: `Database`,
    count: mainCount,
    groups: destinationGroups.filter(group => !group.collectionId),
  });
  return { branches, mainCount, ungroupedCount, groups: destinationGroups };
};
