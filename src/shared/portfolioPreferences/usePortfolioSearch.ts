import { useMemo, useState } from 'react';
import type { DomainRecord } from '../types';
import type { PortfolioGroup, PortfolioSections } from './types';

interface SearchVisibility {
  query: string;
  groups: Map<string, boolean>;
  collections: Set<string>;
}

const createVisibility = (query: string): SearchVisibility => ({
  query,
  groups: new Map(),
  collections: new Set(),
});

const getGroupScope = (collectionId: string | null, key: string) => JSON.stringify([collectionId, key]);

export const usePortfolioSearch = (sections: PortfolioSections, query: string, matchingDomains: DomainRecord[]) => {
  const search = query.trim().toLowerCase();
  const searching = Boolean(search);
  const [visibility, setVisibility] = useState(() => createVisibility(search));

  // Reset during render so a new query cannot briefly reuse the previous query's revealed domains.
  const currentVisibility = visibility.query === search ? visibility : createVisibility(search);
  if (visibility.query !== search) setVisibility(currentVisibility);

  const showAllCollections = currentVisibility.collections;
  const isGroupShowingAll = (collectionId: string | null, key: string) => searching && (
    currentVisibility.groups.get(getGroupScope(collectionId, key))
      ?? (collectionId !== null && showAllCollections.has(collectionId))
  );
  const toggleCollection = (id: string) => {
    if (!searching) return;
    setVisibility(previous => {
      const current = previous.query === search ? previous : createVisibility(search);
      const groups = new Map(current.groups);
      const collections = new Set(current.collections);
      if (collections.has(id)) collections.delete(id);
      else collections.add(id);
      sections.collections.find(section => section.collection.id === id)?.groups.forEach(group => {
        groups.delete(getGroupScope(id, group.key));
      });
      return { query: search, groups, collections };
    });
  };
  const toggleGroup = (collectionId: string | null, key: string) => {
    if (!searching) return;
    setVisibility(previous => {
      const current = previous.query === search ? previous : createVisibility(search);
      const scope = getGroupScope(collectionId, key);
      const groups = new Map(current.groups);
      const showingAll = groups.get(scope) ?? (collectionId !== null && current.collections.has(collectionId));
      groups.set(scope, !showingAll);
      return { ...current, groups };
    });
  };
  const visibleSections = useMemo<PortfolioSections>(() => {
    if (!searching) return sections;
    const matchingIds = new Set(matchingDomains.map(domain => domain.id));
    const matchesMetadata = (...values: (string | undefined)[]) => values.some(value => value?.toLowerCase().includes(search));
    const filterGroups = (groups: PortfolioGroup[], collectionId: string | null) => groups.flatMap(group => {
      const collectionShowingAll = collectionId !== null && currentVisibility.collections.has(collectionId);
      const showingAll = currentVisibility.groups.get(getGroupScope(collectionId, group.key))
        ?? collectionShowingAll;
      const domains = showingAll ? group.domains : group.domains.filter(domain => matchingIds.has(domain.id));
      if (group.directCollectionId) return domains.length ? [{ ...group, domains }] : [];
      return showingAll || collectionShowingAll || domains.length || (group.key !== `all` && matchesMetadata(group.label, group.description))
        ? [{ ...group, domains }]
        : [];
    });
    const mainGroups = filterGroups(sections.mainGroups, null);
    const collections = sections.collections.flatMap(section => {
      const { collection } = section;
      const groups = filterGroups(section.groups, collection.id);
      const showingAll = currentVisibility.collections.has(collection.id);
      return showingAll || groups.length || matchesMetadata(collection.name, collection.description)
        ? [{ ...section, groups, domains: groups.flatMap(group => group.domains) }]
        : [];
    });
    return {
      collections,
      mainGroups,
      mainDomains: mainGroups.flatMap(group => group.domains),
    };
  }, [search, sections, searching, matchingDomains, currentVisibility]);

  return { searching, toggleGroup, toggleCollection, showAllCollections, isGroupShowingAll, sections: visibleSections };
};
