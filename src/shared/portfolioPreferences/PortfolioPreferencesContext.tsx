import { GROUPABLE_COLUMNS } from './groups';
import type { PropsWithChildren } from 'react';
import { PORTFOLIO_COLUMNS } from '../portfolioColumns';
import { createOperationQueue } from '../common/storage';
import { genID, getAppCollectionIDNumber } from '../common/ids';
import { readPortfolioPreferences, savePortfolioPreferences } from './storage';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CustomPortfolioCollection, PortfolioPreferences, PortfolioPreferencesContextValue } from './types';

const DEFAULT_PREFERENCES: PortfolioPreferences = {
  orders: {},
  view: `table`,
  groupBy: `none`,
  collections: [],
  customGroups: [],
  collectionNumber: 0,
};
const uniqueIds = (value: unknown): string[] => Array.isArray(value)
  ? [...new Set(value.filter((id): id is string => typeof id === `string` && Boolean(id)))]
  : [];

const restorePreferences = (value: unknown): PortfolioPreferences => {
  if (!value || typeof value !== `object` || Array.isArray(value)) return DEFAULT_PREFERENCES;
  const saved = value as Record<string, unknown>;
  const seenCollections = new Set<string>();
  const seenCollectionNames = new Set<string>();
  const seenCollectionNumbers = new Set<number>();
  const collections = (Array.isArray(saved.collections) ? saved.collections : []).flatMap((value): CustomPortfolioCollection[] => {
    if (!value || typeof value !== `object` || typeof value.name !== `string`) return [];
    const number = getAppCollectionIDNumber(value.id, `Collection`);
    const name = value.name.trim();
    if (!number || value.number !== number || !name || name.length > 80
      || seenCollections.has(value.id) || seenCollectionNumbers.has(number) || seenCollectionNames.has(name.toLowerCase())) return [];
    seenCollections.add(value.id);
    seenCollectionNumbers.add(number);
    seenCollectionNames.add(name.toLowerCase());
    const description = typeof value.description === `string` ? value.description.trim() : ``;
    const sortField = value.sortField === null ? null : PORTFOLIO_COLUMNS.some(column => column.field === value.sortField) ? value.sortField : `name`;
    return [{
      name,
      number,
      id: value.id,
      sortField,
      upvotes: Number.isSafeInteger(value.upvotes) && value.upvotes >= 0 ? value.upvotes : 0,
      downvotes: Number.isSafeInteger(value.downvotes) && value.downvotes >= 0 ? value.downvotes : 0,
      visibility: value.visibility === `public` ? `public` : `private`,
      currentVote: value.currentVote === `up` || value.currentVote === `down` ? value.currentVote : null,
      sortDirection: value.sortDirection === `desc` ? `desc` : `asc`,
      ...(description ? { description } : {}),
    }];
  });
  const savedCollectionNumber = typeof saved.collectionNumber === `number` && Number.isSafeInteger(saved.collectionNumber) && saved.collectionNumber >= 0
    ? saved.collectionNumber
    : 0;
  const collectionNumber = Math.max(savedCollectionNumber, 0, ...collections.map(collection => collection.number));
  const seenGroups = new Set<string>();
  const seenDomains = new Set<string>();
  const customGroups = (Array.isArray(saved.customGroups) ? saved.customGroups : []).flatMap(value => {
    if (!value || typeof value !== `object` || typeof value.id !== `string` || typeof value.name !== `string`) return [];
    const name = value.name.trim();
    const description = typeof value.description === `string` ? value.description.trim() : ``;
    const collectionId = typeof value.collectionId === `string` && seenCollections.has(value.collectionId) ? value.collectionId : undefined;
    if (!value.id || !name || seenGroups.has(value.id)) return [];
    seenGroups.add(value.id);
    const domainIds = uniqueIds(value.domainIds).filter(id => {
      if (seenDomains.has(id)) return false;
      seenDomains.add(id);
      return true;
    });
    return [{ id: value.id, name, domainIds, ...(description ? { description } : {}), ...(collectionId ? { collectionId } : {}) }];
  });
  const orders = saved.orders && typeof saved.orders === `object` && !Array.isArray(saved.orders)
    ? Object.fromEntries(Object.entries(saved.orders).map(([key, ids]) => [key, uniqueIds(ids)]))
    : {};
  const groupBy = saved.groupBy === `custom` || GROUPABLE_COLUMNS.some(column => column.field === saved.groupBy)
    ? saved.groupBy as PortfolioPreferences[`groupBy`]
    : `none`;
  return { orders, groupBy, collections, customGroups, collectionNumber, view: saved.view === `grid` ? `grid` : `table` };
};

const assignGroupDomains = (current: PortfolioPreferences, domainIds: string[], groupId: string | null): PortfolioPreferences => {
  const selectedIds = new Set(domainIds);
  const destinationKey = `custom:${groupId ?? `ungrouped`}`;
  return {
    ...current,
    customGroups: current.customGroups.map(group => ({
      ...group,
      domainIds: group.id === groupId
        ? uniqueIds([...group.domainIds, ...domainIds])
        : group.domainIds.filter(id => !selectedIds.has(id)),
    })),
    orders: Object.fromEntries(Object.entries(current.orders).map(([key, ids]) => [
      key,
      key.startsWith(`custom:`) && key !== destinationKey ? ids.filter(id => !selectedIds.has(id)) : ids,
    ])),
  };
};

export const PortfolioPreferencesContext = createContext<PortfolioPreferencesContextValue | undefined>(undefined);

export const PortfolioPreferencesProvider = ({ children, enabled = true, userId = null }: PropsWithChildren<{ enabled?: boolean; userId?: string | null }>) => {
  const [ready, setReady] = useState(false);
  const revision = useRef(0);
  const active = useRef(enabled);
  active.current = enabled;
  const changed = useRef(false);
  const preferenceRef = useRef(DEFAULT_PREFERENCES);
  const loadedUserId = useRef<string | null>(null);
  const storageQueue = useRef(createOperationQueue()).current;
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  useEffect(() => {
    let mounted = true;
    const run = ++revision.current;
    active.current = enabled;
    const capturedUserId = userId;
    setReady(false);
    changed.current = false;
    loadedUserId.current = null;
    preferenceRef.current = DEFAULT_PREFERENCES;
    setPreferences(DEFAULT_PREFERENCES);
    if (!enabled) return () => { active.current = false; ++revision.current; };
    const isCurrent = () => mounted && active.current && run === revision.current;
    readPortfolioPreferences(capturedUserId).then(saved => {
      if (!isCurrent() || changed.current || !saved) return;
      const restored = restorePreferences(JSON.parse(saved));
      preferenceRef.current = restored;
      setPreferences(restored);
    }).catch(() => undefined).finally(() => {
      if (isCurrent()) { loadedUserId.current = capturedUserId; setReady(true); }
    });
    return () => { mounted = false; active.current = false; ++revision.current; };
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled || !ready || loadedUserId.current !== userId) return;
    const run = revision.current;
    const capturedUserId = userId;
    const capturedPreferences = preferences;
    void storageQueue(() => active.current && run === revision.current
      ? savePortfolioPreferences(capturedPreferences, capturedUserId)
      : Promise.resolve()).catch(() => undefined);
  }, [ready, enabled, userId, preferences, storageQueue]);

  const change = useCallback((update: (current: PortfolioPreferences) => PortfolioPreferences) => {
    if (!enabled || !active.current) return;
    changed.current = true;
    const next = update(preferenceRef.current);
    preferenceRef.current = next;
    setPreferences(next);
  }, [enabled]);

  const setView = useCallback<PortfolioPreferencesContextValue[`setView`]>(view => {
    change(current => ({ ...current, view }));
  }, [change]);

  const setGroupBy = useCallback<PortfolioPreferencesContextValue[`setGroupBy`]>(groupBy => {
    change(current => ({ ...current, groupBy }));
  }, [change]);

  const createGroup = useCallback<PortfolioPreferencesContextValue[`createGroup`]>((value, domainIds) => {
    if (!enabled || !active.current) return undefined;
    const selectedIds = uniqueIds(domainIds);
    if (domainIds !== undefined && (!ready || loadedUserId.current !== userId || !selectedIds.length)) return undefined;
    const name = value.trim();
    if (!name || name.toLowerCase() === `ungrouped` || preferenceRef.current.customGroups.some(group => group.name.toLowerCase() === name.toLowerCase())) return undefined;
    const id = `group-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    change(current => assignGroupDomains({
      ...current,
      groupBy: `custom`,
      customGroups: [...current.customGroups, { id, name, domainIds: [] }],
    }, selectedIds, id));
    return id;
  }, [ready, change, userId, enabled]);

  const saveGroupSettings = useCallback<PortfolioPreferencesContextValue[`saveGroupSettings`]>((id, input) => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId) return false;
    const current = preferenceRef.current;
    const name = input.name.trim();
    const description = input.description.trim();
    const groups = current.customGroups;
    const existing = groups.find(group => group.id === id);
    if (!existing || !name || name.toLowerCase() === `ungrouped` || name.length > 80 || description.length > 280) return false;
    if (groups.some(group => group.id !== id && group.name.toLowerCase() === name.toLowerCase())) return false;
    let collectionId = input.collectionId === undefined ? existing.collectionId : input.collectionId ?? undefined;
    let createdCollection: CustomPortfolioCollection | undefined;
    if (input.newCollection) {
      if (input.collectionId !== undefined && input.collectionId !== null) return false;
      const collectionName = input.newCollection.name.trim();
      const collectionDescription = input.newCollection.description.trim();
      const number = current.collectionNumber + 1;
      if (!collectionName || collectionName.length > 80 || collectionDescription.length > 280 || !Number.isSafeInteger(number)) return false;
      if (current.collections.some(collection => collection.name.toLowerCase() === collectionName.toLowerCase())) return false;
      collectionId = genID(`Collection`, number, collectionName).id;
      createdCollection = {
        number,
        upvotes: 0,
        downvotes: 0,
        id: collectionId,
        currentVote: null,
        name: collectionName,
        sortField: `name`,
        visibility: `private`,
        sortDirection: `asc`,
        description: collectionDescription,
      };
    } else if (collectionId !== undefined && !current.collections.some(collection => collection.id === collectionId)) return false;
    change(current => ({
      ...current,
      collectionNumber: createdCollection?.number ?? current.collectionNumber,
      collections: createdCollection ? [...current.collections, createdCollection] : current.collections,
      customGroups: current.customGroups.map(group => group.id === id ? { ...group, name, description, collectionId } : group),
    }));
    return true;
  }, [ready, change, userId, enabled]);

  const updateGroup = useCallback<PortfolioPreferencesContextValue[`updateGroup`]>((id, name, description) => (
    saveGroupSettings(id, { name, description })
  ), [saveGroupSettings]);

  const renameGroup = useCallback<PortfolioPreferencesContextValue[`renameGroup`]>((id, name) => {
    const group = preferenceRef.current.customGroups.find(group => group.id === id);
    return group ? updateGroup(id, name, group.description ?? ``) : false;
  }, [updateGroup]);

  const deleteGroup = useCallback<PortfolioPreferencesContextValue[`deleteGroup`]>(id => {
    change(current => ({
      ...current,
      customGroups: current.customGroups.filter(group => group.id !== id),
      orders: Object.fromEntries(Object.entries(current.orders).filter(([key]) => key !== `custom:${id}`)),
    }));
  }, [change]);

  const assignDomain = useCallback<PortfolioPreferencesContextValue[`assignDomain`]>((domainId, groupId) => {
    change(current => assignGroupDomains(current, [domainId], groupId));
  }, [change]);

  const assignDomains = useCallback<PortfolioPreferencesContextValue[`assignDomains`]>((domainIds, groupId) => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId) return false;
    const selectedIds = uniqueIds(domainIds);
    if (!selectedIds.length || (groupId !== null && !preferenceRef.current.customGroups.some(group => group.id === groupId))) return false;
    change(current => ({ ...assignGroupDomains(current, selectedIds, groupId), groupBy: `custom` }));
    return true;
  }, [ready, change, userId, enabled]);

  const moveDomain = useCallback<PortfolioPreferencesContextValue[`moveDomain`]>((groupKey, domainId, targetId, fullGroupDomainIds, placement = `before`) => {
    const available = uniqueIds(fullGroupDomainIds);
    if (domainId === targetId || !available.includes(domainId) || !available.includes(targetId)) return;
    change(current => {
      const saved = (current.orders[groupKey] ?? []).filter(id => available.includes(id));
      const order = [...saved, ...available.filter(id => !saved.includes(id))].filter(id => id !== domainId);
      const targetIndex = order.indexOf(targetId) + (placement === `after` ? 1 : 0);
      order.splice(targetIndex, 0, domainId);
      return { ...current, orders: { ...current.orders, [groupKey]: order } };
    });
  }, [change]);

  const moveGroup = useCallback<PortfolioPreferencesContextValue[`moveGroup`]>((groupId, targetId, placement = `before`) => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId || groupId === targetId) return false;
    const groups = preferenceRef.current.customGroups;
    const source = groups.find(group => group.id === groupId);
    const target = groups.find(group => group.id === targetId);
    if (!source || !target) return false;
    change(current => {
      const customGroups = current.customGroups.filter(group => group.id !== groupId);
      const targetIndex = customGroups.findIndex(group => group.id === targetId) + (placement === `after` ? 1 : 0);
      customGroups.splice(targetIndex, 0, { ...source, collectionId: target.collectionId });
      return { ...current, customGroups };
    });
    return true;
  }, [ready, change, userId, enabled]);

  const updateCollection = useCallback<PortfolioPreferencesContextValue[`updateCollection`]>((id, value, descriptionValue, visibility) => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId) return false;
    if (visibility !== undefined && visibility !== `private` && visibility !== `public`) return false;
    const name = value.trim();
    const description = descriptionValue.trim();
    const collections = preferenceRef.current.collections;
    if (!name || name.length > 80 || description.length > 280 || !collections.some(collection => collection.id === id)) return false;
    if (collections.some(collection => collection.id !== id && collection.name.toLowerCase() === name.toLowerCase())) return false;
    change(current => ({
      ...current,
      collections: current.collections.map(collection => collection.id === id ? {
        ...collection,
        name,
        description,
        ...(visibility !== undefined ? { visibility } : {}),
      } : collection),
    }));
    return true;
  }, [ready, change, userId, enabled]);

  const setCollectionVisibility = useCallback<PortfolioPreferencesContextValue[`setCollectionVisibility`]>((id, visibility) => {
    if (visibility !== `private` && visibility !== `public`) return false;
    const collection = preferenceRef.current.collections.find(collection => collection.id === id);
    return collection ? updateCollection(id, collection.name, collection.description ?? ``, visibility) : false;
  }, [updateCollection]);

  const voteCollection = useCallback<PortfolioPreferencesContextValue[`voteCollection`]>((id, vote) => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId) return false;
    if (vote !== `up` && vote !== `down`) return false;
    if (!preferenceRef.current.collections.some(collection => collection.id === id && collection.visibility === `public`)) return false;
    change(current => ({
      ...current,
      collections: current.collections.map(collection => {
        if (collection.id !== id) return collection;
        const currentVote = collection.currentVote === vote ? null : vote;
        return {
          ...collection,
          currentVote,
          upvotes: Math.max(0, collection.upvotes - (collection.currentVote === `up` ? 1 : 0) + (currentVote === `up` ? 1 : 0)),
          downvotes: Math.max(0, collection.downvotes - (collection.currentVote === `down` ? 1 : 0) + (currentVote === `down` ? 1 : 0)),
        };
      }),
    }));
    return true;
  }, [ready, change, userId, enabled]);

  const setCollectionSort = useCallback<PortfolioPreferencesContextValue[`setCollectionSort`]>((id, sortField, sortDirection) => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId) return false;
    if (sortDirection !== `asc` && sortDirection !== `desc`) return false;
    if (sortField !== null && !PORTFOLIO_COLUMNS.some(column => column.field === sortField)) return false;
    if (!preferenceRef.current.collections.some(collection => collection.id === id)) return false;
    change(current => ({ ...current, collections: current.collections.map(collection => collection.id === id ? { ...collection, sortField, sortDirection } : collection) }));
    return true;
  }, [ready, change, userId, enabled]);

  const moveCollection = useCallback<PortfolioPreferencesContextValue[`moveCollection`]>((id, targetId, placement = `before`) => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId || id === targetId) return false;
    const collections = preferenceRef.current.collections;
    const source = collections.find(collection => collection.id === id);
    if (!source || !collections.some(collection => collection.id === targetId)) return false;
    change(current => {
      const collections = current.collections.filter(collection => collection.id !== id);
      const targetIndex = collections.findIndex(collection => collection.id === targetId) + (placement === `after` ? 1 : 0);
      collections.splice(targetIndex, 0, source);
      return { ...current, collections };
    });
    return true;
  }, [ready, change, userId, enabled]);

  const assignGroupCollection = useCallback<PortfolioPreferencesContextValue[`assignGroupCollection`]>((id, collectionId) => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId) return false;
    const current = preferenceRef.current;
    if (!current.customGroups.some(group => group.id === id)) return false;
    if (collectionId !== null && !current.collections.some(collection => collection.id === collectionId)) return false;
    change(current => ({
      ...current,
      customGroups: current.customGroups.map(group => group.id === id ? { ...group, collectionId: collectionId ?? undefined } : group),
    }));
    return true;
  }, [ready, change, userId, enabled]);

  const resetOrder = useCallback<PortfolioPreferencesContextValue[`resetOrder`]>(groupKey => {
    change(current => ({ ...current, orders: Object.fromEntries(Object.entries(current.orders).filter(([key]) => key !== groupKey)) }));
  }, [change]);

  const clearOrders = useCallback(() => change(current => ({ ...current, orders: {} })), [change]);
  const value = useMemo(() => ({
    ...(enabled && ready && loadedUserId.current === userId ? preferences : DEFAULT_PREFERENCES),
    setView,
    moveGroup,
    moveDomain,
    clearOrders,
    resetOrder,
    setGroupBy,
    createGroup,
    renameGroup,
    deleteGroup,
    updateGroup,
    voteCollection,
    assignDomain,
    assignDomains,
    moveCollection,
    updateCollection,
    saveGroupSettings,
    setCollectionSort,
    assignGroupCollection,
    setCollectionVisibility,
  }), [ready, enabled, userId, preferences, setView, moveGroup, moveDomain, clearOrders, resetOrder, setGroupBy, createGroup, renameGroup, deleteGroup, updateGroup, voteCollection, assignDomain, assignDomains, moveCollection, updateCollection, saveGroupSettings, setCollectionSort, assignGroupCollection, setCollectionVisibility]);

  return (
    <PortfolioPreferencesContext.Provider value={value}>
      {children}
    </PortfolioPreferencesContext.Provider>
  );
};
