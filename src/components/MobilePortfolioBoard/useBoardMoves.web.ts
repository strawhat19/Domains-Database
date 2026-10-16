import { useMemo } from 'react';
import { allowDomainsInCollections } from '../../shared/config';
import type { BoardEntity, MobilePortfolioBoardProps } from './types';
import { buildPortfolioSections, sortPortfolioDomains } from '../../shared/portfolioPreferences/groups';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

interface BoardMoveOptions {
  disabled: boolean;
  onError: (message: string) => void;
}

export const useBoardMoves = (props: MobilePortfolioBoardProps, { disabled, onError }: BoardMoveOptions) => {
  const preferences = usePortfolioPreferences();
  const domainMap = useMemo(() => new Map(props.allDomains.map(domain => [domain.id, domain])), [props.allDomains]);
  const fullSections = useMemo(() => {
    const domains = sortPortfolioDomains(props.allDomains, props.mainSortField ?? `name`, props.mainSortField ? props.mainSortDirection : `asc`);
    const options = {
      ...preferences,
      groupBy: `custom` as const,
      showHiddenGroups: true,
      showHiddenDomains: true,
      showHiddenCollections: true,
    };
    const sections = buildPortfolioSections(domains, options);
    const mainPreferences = { ...options, groupBy: preferences.groupBy, ...(props.mainSortField ? { orders: {} } : {}) };
    const visualMainGroups = buildPortfolioSections(domains, mainPreferences).mainGroups;
    const visualMainIds = visualMainGroups.flatMap(group => group.domains.map(domain => domain.id));
    return {
      ...sections,
      visualMainIds,
      visualMainGroups,
      mainGroups: props.mainSortField ? buildPortfolioSections(domains, { ...options, orders: {} }).mainGroups : sections.mainGroups,
    };
  }, [props.allDomains, props.mainSortField, props.mainSortDirection, preferences]);
  const fullGroups = useMemo(() => [
    ...fullSections.mainGroups.filter(group => !group.customGroupId),
    ...fullSections.mainGroups.filter(group => Boolean(group.customGroupId)),
    ...fullSections.collections.flatMap(section => section.groups),
  ], [fullSections]);
  const locations = useMemo(() => {
    const items = new Map<string, { groupKey: string; collectionId?: string }>();
    preferences.customGroups.forEach(group => group.domainIds.forEach(id => {
      if (domainMap.has(id)) items.set(id, { groupKey: `custom:${group.id}`, collectionId: group.collectionId });
    }));
    if (allowDomainsInCollections) preferences.collections.forEach(collection => collection.domainIds?.forEach(id => {
      if (domainMap.has(id) && !items.has(id)) items.set(id, { groupKey: `collection:${collection.id}`, collectionId: collection.id });
    }));
    props.allDomains.forEach(domain => {
      if (!items.has(domain.id)) items.set(domain.id, { groupKey: `custom:ungrouped` });
    });
    return items;
  }, [domainMap, props.allDomains, preferences.customGroups, preferences.collections]);

  return (source: BoardEntity, target: BoardEntity, after: boolean): boolean => {
    if (disabled || preferences.loading || source.kind === target.kind && source.id === target.id) return false;
    onError(``);
    const fail = () => {
      onError(`Could Not Move Item — Try Again`);
      return false;
    };
    const placement = after ? `after` : `before`;
    if (source.kind === `collection`) {
      if (target.kind !== `collection` || target.id === `main`) return false;
      return preferences.moveCollection(source.id, target.id, placement) || fail();
    }
    if (source.kind === `group`) {
      const group = preferences.customGroups.find(item => item.id === source.id);
      if (!group || source.collectionId !== group.collectionId) return fail();
      if (target.kind === `group`) {
        const destination = preferences.customGroups.find(item => item.id === target.id);
        if (!destination || target.collectionId !== destination.collectionId) return fail();
        return preferences.moveGroup(source.id, target.id, placement) || fail();
      }
      if (target.kind !== `collection`) return false;
      const collectionId = target.id === `main` ? undefined : target.id;
      const siblings = preferences.customGroups.filter(item => item.id !== source.id && item.collectionId === collectionId);
      if (!preferences.assignGroupCollection(source.id, collectionId ?? null)) return fail();
      const last = siblings[siblings.length - 1];
      if (last && !preferences.moveGroup(source.id, last.id, `after`)) return fail();
      return true;
    }

    const sourceLocation = locations.get(source.id);
    if (!sourceLocation || source.groupKey && (source.groupKey !== sourceLocation.groupKey || source.collectionId !== sourceLocation.collectionId)) return fail();
    const targetLocation = target.kind === `domain` ? locations.get(target.id) : undefined;
    if (target.kind === `domain` && (!targetLocation || target.groupKey && (target.groupKey !== targetLocation.groupKey || target.collectionId !== targetLocation.collectionId))) return fail();
    if (source.main && sourceLocation.collectionId || target.main && targetLocation?.collectionId) return fail();
    const visualIds = [...new Set(fullSections.visualMainIds.concat(fullSections.collections.flatMap(section => section.groups.flatMap(item => item.domains.map(domain => domain.id)))))];
    const ids = props.selectedIds.has(source.id) ? visualIds.filter(id => props.selectedIds.has(id)) : [source.id];
    if (!ids.length || target.kind === `domain` && ids.includes(target.id)) return false;
    const mainDisplayGroup = target.main && preferences.groupBy !== `custom`
      ? fullSections.visualMainGroups.find(item => item.key === (target.displayGroupKey ?? (preferences.groupBy === `none` ? `all` : ``))) : undefined;
    if (source.main && target.main && preferences.groupBy !== `custom` && target.kind === `domain`) {
      if (!mainDisplayGroup || source.displayGroupKey !== mainDisplayGroup.key) {
        onError(`Reorder Domains Within The Same Main Group`);
        return false;
      }
      const order = mainDisplayGroup.domains.map(domain => domain.id);
      if (!order.includes(source.id) || !order.includes(target.id)) return fail();
      if (ids.some(id => !order.includes(id))) {
        onError(`Select Domains From The Same Main Group To Reorder`);
        return false;
      }
      // Reordering a field or flat view must preserve each domain's actual membership.
      if (props.mainSortField) preferences.resetOrder(mainDisplayGroup.key);
      const moving = after ? [...ids].reverse() : ids;
      moving.forEach(id => preferences.moveDomain(mainDisplayGroup.key, id, target.id, order, placement));
      props.onManualOrder();
      props.onGrouped();
      return true;
    }
    if (target.main && target.kind === `domain` && preferences.groupBy !== `custom` && preferences.groupBy !== `none`) {
      onError(`Drop On Database Or Use Move To For This Grouping`);
      return false;
    }
    const group = mainDisplayGroup ? undefined : target.kind === `group` ? preferences.customGroups.find(item => item.id === target.id)
      : targetLocation ? preferences.customGroups.find(item => `custom:${item.id}` === targetLocation.groupKey) : undefined;
    if (target.kind === `group` && (!group || target.collectionId !== group.collectionId)) return fail();
    const collectionId = target.kind === `collection` ? target.id === `main` ? undefined : target.id
      : group?.collectionId ?? targetLocation?.collectionId;
    if (!allowDomainsInCollections && collectionId && !group) return false;
    const collection = collectionId ? preferences.collections.find(item => item.id === collectionId) : undefined;
    if (collectionId && !collection) return fail();
    const groupKey = mainDisplayGroup?.key ?? (group ? `custom:${group.id}` : collectionId ? `collection:${collectionId}` : `custom:ungrouped`);
    const destinationOrder = (mainDisplayGroup ?? fullGroups.find(item => item.key === groupKey))?.domains.map(domain => domain.id) ?? [];
    const completeIds = [...new Set([...destinationOrder, ...ids])];
    const saved = group ? preferences.assignDomains(ids, group.id) : preferences.assignDomainsToCollection(ids, collectionId ?? null);
    if (!saved) return fail();
    if (group?.collectionId && preferences.groupBy !== `custom`) preferences.setGroupBy(preferences.groupBy);
    if (collection?.sortField) {
      preferences.setCollectionSort(collection.id, null, `asc`);
      preferences.resetOrder(groupKey);
    }
    if (!collectionId && props.mainSortField) preferences.resetOrder(groupKey);
    const moving = new Set(ids);
    const remaining = destinationOrder.filter(id => !moving.has(id));
    if (!remaining.length) preferences.resetOrder(groupKey);
    const anchor = target.kind === `domain` ? target.id : remaining[remaining.length - 1];
    const position = target.kind === `domain` ? placement : `after`;
    if (anchor) {
      const ordered = position === `after` ? [...ids].reverse() : ids;
      ordered.forEach(id => preferences.moveDomain(groupKey, id, anchor, completeIds, position));
    } else if (ids.length > 1) preferences.moveDomain(groupKey, ids[0], ids[1], ids);
    if (!collectionId) props.onManualOrder();
    props.onGrouped();
    return true;
  };
};
