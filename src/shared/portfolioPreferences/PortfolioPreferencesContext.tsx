import { GROUPABLE_COLUMNS } from './groups';
import Toast from '../../components/Toast';
import type { PropsWithChildren } from 'react';
import { PORTFOLIO_FIELDS } from '../portfolioColumns';
import { createOperationQueue } from '../common/storage';
import { subscribeAccountDataReset } from '../accountData/state';
import { genID, getAppCollectionIDNumber } from '../common/ids';
import { normalizeGroupDetails, restoreGroupDetails } from './details';
import { savePortfolioPreferences, subscribePortfolioPreferences } from './storage';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_DOMAIN_PROJECT_STATUS, normalizeDomainProjectStatus } from '../domainProject';
import { isPortfolioNameTaken, getConvertedGroupName, normalizePortfolioName } from './names';
import type { PortfolioPreferences, PortfolioGroupDetails, CustomPortfolioCollection, PortfolioPreferencesContextValue } from './types';

const DEFAULT_PREFERENCES: PortfolioPreferences = {
  orders: {},
  view: `table`,
  groupBy: `none`,
  collections: [],
  showCosts: false,
  showAddRows: true,
  customGroups: [],
  collectionNumber: 0,
  hiddenDomainIds: [],
  hiddenGroupKeys: [],
  expandedDomainIds: [],
  collapsedGroupKeys: [],
  showHiddenGroups: false,
  showHiddenDomains: false,
  hiddenCollectionIds: [],
  showHiddenCollections: false,
  collapsedCollectionIds: [],
};
const uniqueIds = (value: unknown): string[] => Array.isArray(value)
  ? [...new Set(value.filter((id): id is string => typeof id === `string` && Boolean(id)))]
  : [];

const restorePreferences = (value: unknown): PortfolioPreferences => {
  if (!value || typeof value !== `object` || Array.isArray(value)) throw new Error(`Saved Portfolio Preferences Could Not Be Read`);
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
    const sortField = value.sortField === null ? null : PORTFOLIO_FIELDS.some(column => column.field === value.sortField) ? value.sortField : `name`;
    let projectStatus = DEFAULT_DOMAIN_PROJECT_STATUS;
    try { projectStatus = normalizeDomainProjectStatus(value.projectStatus); }
    catch { /* Preserve collections with an invalid saved status. */ }
    return [{
      name,
      number,
      id: value.id,
      sortField,
      projectStatus,
      domainIds: uniqueIds(value.domainIds),
      upvotes: Number.isSafeInteger(value.upvotes) && value.upvotes >= 0 ? value.upvotes : 0,
      downvotes: Number.isSafeInteger(value.downvotes) && value.downvotes >= 0 ? value.downvotes : 0,
      visibility: value.visibility === `public` ? `public` : `private`,
      currentVote: value.currentVote === `up` || value.currentVote === `down` ? value.currentVote : null,
      sortDirection: value.sortDirection === `desc` ? `desc` : `asc`,
      ...(typeof value.createdAt === `string` && Number.isFinite(Date.parse(value.createdAt)) ? { createdAt: value.createdAt } : {}),
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
    return [{ id: value.id, name, domainIds, ...restoreGroupDetails(value), starred: value.starred === true,
      ...(description ? { description } : {}), ...(collectionId ? { collectionId } : {}),
      ...(typeof value.createdAt === `string` && Number.isFinite(Date.parse(value.createdAt)) ? { createdAt: value.createdAt } : {}) }];
  });
  const restoredCollections = collections.map(collection => ({
    ...collection,
    domainIds: (collection.domainIds ?? []).filter(id => {
      if (seenDomains.has(id)) return false;
      seenDomains.add(id);
      return true;
    }),
  }));
  const orders = saved.orders && typeof saved.orders === `object` && !Array.isArray(saved.orders)
    ? Object.fromEntries(Object.entries(saved.orders).map(([key, ids]) => [key, uniqueIds(ids)]))
    : {};
  const groupBy = saved.groupBy === `custom` || GROUPABLE_COLUMNS.some(column => column.field === saved.groupBy)
    ? saved.groupBy as PortfolioPreferences[`groupBy`]
    : `none`;
  return {
    orders,
    groupBy,
    customGroups,
    collectionNumber,
    collections: restoredCollections,
    showCosts: saved.showCosts === true,
    showAddRows: saved.showAddRows !== false,
    showHiddenGroups: saved.showHiddenGroups === true,
    showHiddenDomains: saved.showHiddenDomains === true,
    showHiddenCollections: saved.showHiddenCollections === true,
    hiddenDomainIds: uniqueIds(saved.hiddenDomainIds),
    hiddenGroupKeys: uniqueIds(saved.hiddenGroupKeys),
    expandedDomainIds: uniqueIds(saved.expandedDomainIds).filter(id => Boolean(id.trim())),
    collapsedGroupKeys: uniqueIds(saved.collapsedGroupKeys),
    hiddenCollectionIds: uniqueIds(saved.hiddenCollectionIds).filter(id => seenCollections.has(id)),
    collapsedCollectionIds: uniqueIds(saved.collapsedCollectionIds).filter(id => seenCollections.has(id)),
    view: saved.view === `grid` ? `grid` : `table`,
  };
};

const createPortfolioCollection = (current: PortfolioPreferences, value: { name: string; description: string }, groupId?: string): CustomPortfolioCollection | undefined => {
  const name = value.name.trim();
  const description = value.description.trim();
  const number = current.collectionNumber + 1;
  if (!name || name.length > 80 || description.length > 280 || !Number.isSafeInteger(number)) return undefined;
  if (isPortfolioNameTaken(current, name, { groupId })) return undefined;
  return {
    name,
    number,
    upvotes: 0,
    domainIds: [],
    downvotes: 0,
    description,
    currentVote: null,
    sortField: `name`,
    visibility: `private`,
    sortDirection: `asc`,
    createdAt: new Date().toISOString(),
    id: genID(`Collection`, number, name).id,
    projectStatus: DEFAULT_DOMAIN_PROJECT_STATUS,
  };
};

const assignGroupDomains = (current: PortfolioPreferences, domainIds: string[], groupId: string | null): PortfolioPreferences => {
  const selectedIds = new Set(domainIds);
  const destinationKey = `custom:${groupId ?? `ungrouped`}`;
  return {
    ...current,
    collections: current.collections.map(collection => ({
      ...collection,
      domainIds: (collection.domainIds ?? []).filter(id => !selectedIds.has(id)),
    })),
    customGroups: current.customGroups.map(group => ({
      ...group,
      domainIds: group.id === groupId
        ? uniqueIds([...group.domainIds, ...domainIds])
        : group.domainIds.filter(id => !selectedIds.has(id)),
    })),
    orders: Object.fromEntries(Object.entries(current.orders).map(([key, ids]) => [
      key,
      key !== destinationKey ? ids.filter(id => !selectedIds.has(id)) : ids,
    ])),
  };
};

const assignCollectionDomains = (current: PortfolioPreferences, domainIds: string[], collectionId: string | null): PortfolioPreferences => {
  const selectedIds = new Set(domainIds);
  const destinationKey = collectionId === null ? `custom:ungrouped` : `collection:${collectionId}`;
  return {
    ...current,
    customGroups: current.customGroups.map(group => ({ ...group, domainIds: group.domainIds.filter(id => !selectedIds.has(id)) })),
    collections: current.collections.map(collection => ({
      ...collection,
      domainIds: collection.id === collectionId
        ? uniqueIds([...(collection.domainIds ?? []), ...domainIds])
        : (collection.domainIds ?? []).filter(id => !selectedIds.has(id)),
    })),
    orders: Object.fromEntries(Object.entries(current.orders).map(([key, ids]) => [
      key,
      key !== destinationKey ? ids.filter(id => !selectedIds.has(id)) : ids,
    ])),
  };
};

export const PortfolioPreferencesContext = createContext<PortfolioPreferencesContextValue | undefined>(undefined);

export const PortfolioPreferencesProvider = ({ children, enabled = true, userId = null }: PropsWithChildren<{ enabled?: boolean; userId?: string | null }>) => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(``);
  const storageReady = useRef(false);
  const revision = useRef(0);
  const active = useRef(enabled);
  if (!enabled) active.current = false;
  const changed = useRef(false);
  const mutationRevision = useRef(0);
  const pendingSnapshot = useRef<string | null | undefined>(undefined);
  const replaySnapshot = useRef<(() => void) | null>(null);
  const preferenceRef = useRef(DEFAULT_PREFERENCES);
  const loadedUserId = useRef<string | null>(null);
  const storageQueue = useRef(createOperationQueue()).current;
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  useEffect(() => subscribeAccountDataReset(changedUserId => {
    if (changedUserId !== userId) return;
    active.current = false;
    revision.current += 1;
    loadedUserId.current = null;
    storageReady.current = false;
    setReady(false);
    setError(``);
  }), [userId]);

  useEffect(() => {
    let mounted = true;
    const run = ++revision.current;
    active.current = enabled;
    const capturedUserId = userId;
    setReady(false);
    setError(``);
    storageReady.current = false;
    changed.current = false;
    pendingSnapshot.current = undefined;
    loadedUserId.current = null;
    preferenceRef.current = DEFAULT_PREFERENCES;
    setPreferences(DEFAULT_PREFERENCES);
    if (!enabled) return () => { active.current = false; ++revision.current; };
    const isCurrent = () => mounted && active.current && run === revision.current;
    const fail = (reason: unknown) => {
      if (!isCurrent()) return;
      storageReady.current = false;
      loadedUserId.current = capturedUserId;
      setReady(true);
      setError(reason instanceof Error ? reason.message : `Could Not Load Portfolio Preferences`);
    };
    const subscribe = () => subscribePortfolioPreferences(capturedUserId, saved => {
      if (!isCurrent()) return false;
      if (changed.current) {
        pendingSnapshot.current = saved;
        return false;
      }
      pendingSnapshot.current = undefined;
      if (storageReady.current && saved === JSON.stringify(preferenceRef.current)) return;
      try {
        let restored = DEFAULT_PREFERENCES;
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          restored = restorePreferences(parsed);
          if ((Array.isArray(parsed.collections) && restored.collections.length !== parsed.collections.length)
            || (Array.isArray(parsed.customGroups) && restored.customGroups.length !== parsed.customGroups.length)) throw new Error(`Saved Portfolio Preferences Could Not Be Read`);
        }
        preferenceRef.current = restored;
        setPreferences(restored);
        storageReady.current = true;
        loadedUserId.current = capturedUserId;
        setError(``);
        setReady(true);
      } catch (reason) {
        fail(reason);
        return false;
      }
    }, fail);
    let unsubscribe = subscribe();
    const replay = () => {
      if (!isCurrent()) return;
      unsubscribe();
      unsubscribe = subscribe();
    };
    replaySnapshot.current = replay;
    return () => {
      mounted = false;
      active.current = false;
      ++revision.current;
      if (replaySnapshot.current === replay) replaySnapshot.current = null;
      unsubscribe();
    };
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled || !ready || !storageReady.current || !changed.current || loadedUserId.current !== userId) return;
    const run = revision.current;
    const mutation = mutationRevision.current;
    const capturedUserId = userId;
    const capturedPreferences = preferences;
    void storageQueue(() => active.current && run === revision.current
      ? savePortfolioPreferences(capturedPreferences, capturedUserId)
      : Promise.resolve()).then(() => {
      if (active.current && run === revision.current) {
        if (mutation === mutationRevision.current) {
          changed.current = false;
          if (pendingSnapshot.current !== undefined) replaySnapshot.current?.();
        }
        setError(``);
      }
    }).catch(reason => {
      if (active.current && run === revision.current) setError(reason instanceof Error ? reason.message : `Could Not Save Portfolio Preferences`);
    });
  }, [ready, enabled, userId, preferences, storageQueue]);

  const change = useCallback((update: (current: PortfolioPreferences) => PortfolioPreferences) => {
    if (!enabled || !active.current || !storageReady.current) return;
    changed.current = true;
    ++mutationRevision.current;
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

  const setShowCosts = useCallback<PortfolioPreferencesContextValue[`setShowCosts`]>(showCosts => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId) return;
    change(current => ({ ...current, showCosts }));
  }, [ready, change, userId, enabled]);

  const setShowAddRows = useCallback<PortfolioPreferencesContextValue[`setShowAddRows`]>(showAddRows => {
    if (!enabled || !active.current || !ready || !storageReady.current || loadedUserId.current !== userId) return;
    change(current => ({ ...current, showAddRows }));
  }, [ready, change, userId, enabled]);

  const setShowHiddenGroups = useCallback<PortfolioPreferencesContextValue[`setShowHiddenGroups`]>(showHiddenGroups => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId) return;
    change(current => ({ ...current, showHiddenGroups }));
  }, [ready, change, userId, enabled]);

  const setShowHiddenDomains = useCallback<PortfolioPreferencesContextValue[`setShowHiddenDomains`]>(showHiddenDomains => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId) return;
    change(current => ({ ...current, showHiddenDomains }));
  }, [ready, change, userId, enabled]);

  const setShowHiddenCollections = useCallback<PortfolioPreferencesContextValue[`setShowHiddenCollections`]>(showHiddenCollections => {
    if (!enabled || !active.current || !ready || !storageReady.current || loadedUserId.current !== userId) return;
    change(current => ({ ...current, showHiddenCollections }));
  }, [ready, change, userId, enabled]);

  const toggleGroupCollapsed = useCallback<PortfolioPreferencesContextValue[`toggleGroupCollapsed`]>(groupKey => {
    if (!enabled || !active.current || !ready || !storageReady.current || loadedUserId.current !== userId) return false;
    if (!groupKey.trim() || groupKey === `all`) return false;
    change(current => ({
      ...current,
      collapsedGroupKeys: current.collapsedGroupKeys.includes(groupKey)
        ? current.collapsedGroupKeys.filter(key => key !== groupKey) : [...current.collapsedGroupKeys, groupKey],
    }));
    return true;
  }, [ready, change, userId, enabled]);

  const toggleDomainExpansion = useCallback<PortfolioPreferencesContextValue[`toggleDomainExpansion`]>(domainId => {
    if (!enabled || !active.current || !ready || !storageReady.current || loadedUserId.current !== userId) return false;
    if (!domainId.trim()) return false;
    change(current => ({
      ...current,
      expandedDomainIds: current.expandedDomainIds.includes(domainId)
        ? current.expandedDomainIds.filter(id => id !== domainId) : [...current.expandedDomainIds, domainId],
    }));
    return true;
  }, [ready, change, userId, enabled]);

  const toggleCollectionCollapsed = useCallback<PortfolioPreferencesContextValue[`toggleCollectionCollapsed`]>(collectionId => {
    if (!enabled || !active.current || !ready || !storageReady.current || loadedUserId.current !== userId) return false;
    if (!preferenceRef.current.collections.some(collection => collection.id === collectionId)) return false;
    change(current => ({
      ...current,
      collapsedCollectionIds: current.collapsedCollectionIds.includes(collectionId)
        ? current.collapsedCollectionIds.filter(id => id !== collectionId) : [...current.collapsedCollectionIds, collectionId],
    }));
    return true;
  }, [ready, change, userId, enabled]);

  const toggleGroupVisibility = useCallback<PortfolioPreferencesContextValue[`toggleGroupVisibility`]>(groupKey => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId) return false;
    if (!groupKey.trim() || groupKey === `all`) return false;
    change(current => ({
      ...current,
      hiddenGroupKeys: current.hiddenGroupKeys.includes(groupKey)
        ? current.hiddenGroupKeys.filter(key => key !== groupKey)
        : [...current.hiddenGroupKeys, groupKey],
    }));
    return true;
  }, [ready, change, userId, enabled]);

  const toggleDomainVisibility = useCallback<PortfolioPreferencesContextValue[`toggleDomainVisibility`]>(domainId => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId) return false;
    if (!domainId.trim()) return false;
    change(current => ({
      ...current,
      hiddenDomainIds: current.hiddenDomainIds.includes(domainId)
        ? current.hiddenDomainIds.filter(id => id !== domainId)
        : [...current.hiddenDomainIds, domainId],
    }));
    return true;
  }, [ready, change, userId, enabled]);

  const createCollection = useCallback<PortfolioPreferencesContextValue[`createCollection`]>((name, description = ``) => {
    if (!enabled || !active.current || !ready || !storageReady.current || loadedUserId.current !== userId) return undefined;
    const collection = createPortfolioCollection(preferenceRef.current, { name, description });
    if (!collection) return undefined;
    change(current => ({
      ...current,
      collectionNumber: collection.number,
      collections: [...current.collections, collection],
    }));
    return collection.id;
  }, [ready, change, userId, enabled]);

  const toggleCollectionVisibility = useCallback<PortfolioPreferencesContextValue[`toggleCollectionVisibility`]>(collectionId => {
    if (!enabled || !active.current || !ready || !storageReady.current || loadedUserId.current !== userId) return false;
    if (!preferenceRef.current.collections.some(collection => collection.id === collectionId)) return false;
    change(current => ({
      ...current,
      hiddenCollectionIds: current.hiddenCollectionIds.includes(collectionId)
        ? current.hiddenCollectionIds.filter(id => id !== collectionId) : [...current.hiddenCollectionIds, collectionId],
    }));
    return true;
  }, [ready, change, userId, enabled]);

  const createGroup = useCallback<PortfolioPreferencesContextValue[`createGroup`]>((value, domainIds, collection) => {
    if (!enabled || !active.current || !ready || !storageReady.current || loadedUserId.current !== userId) return undefined;
    const current = preferenceRef.current;
    const selectedIds = uniqueIds(domainIds);
    if (domainIds !== undefined && !selectedIds.length) return undefined;
    const name = value.trim();
    if (!name || name.length > 80 || normalizePortfolioName(name) === `ungrouped` || isPortfolioNameTaken(current, name)) return undefined;
    let collectionId = collection?.collectionId ?? undefined;
    let createdCollection: CustomPortfolioCollection | undefined;
    if (collection?.newCollection) {
      if (collection.collectionId !== undefined && collection.collectionId !== null) return undefined;
      if (normalizePortfolioName(name) === normalizePortfolioName(collection.newCollection.name)) return undefined;
      createdCollection = createPortfolioCollection(current, collection.newCollection);
      if (!createdCollection) return undefined;
      collectionId = createdCollection.id;
    } else if (collectionId !== undefined && !current.collections.some(collection => collection.id === collectionId)) return undefined;
    const id = `group-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    change(current => assignGroupDomains({
      ...current,
      groupBy: `custom`,
      collectionNumber: createdCollection?.number ?? current.collectionNumber,
      collections: createdCollection ? [...current.collections, createdCollection] : current.collections,
      customGroups: [...current.customGroups, { id, name, isApp: false, domainIds: [], createdAt: new Date().toISOString(),
        ...(collectionId ? { collectionId } : {}), projectStatus: DEFAULT_DOMAIN_PROJECT_STATUS }],
    }, selectedIds, id));
    return id;
  }, [ready, change, userId, enabled]);

  const saveGroupSettings = useCallback<PortfolioPreferencesContextValue[`saveGroupSettings`]>((id, input) => {
    if (!enabled || !active.current || !ready || !storageReady.current || loadedUserId.current !== userId) return false;
    const current = preferenceRef.current;
    if (input.convertToCollection && !input.newCollection) return false;
    const name = input.convertToCollection && input.newCollection
      ? getConvertedGroupName(current, input.newCollection.name, id) : input.name.trim();
    const description = input.description.trim();
    const groups = current.customGroups;
    const existing = groups.find(group => group.id === id);
    if (!existing || !name || name.toLowerCase() === `ungrouped` || name.length > 80 || description.length > 280) return false;
    if (isPortfolioNameTaken(current, name, { groupId: id })) return false;
    let details: PortfolioGroupDetails;
    try { details = normalizeGroupDetails(input); }
    catch { return false; }
    let collectionId = input.collectionId === undefined ? existing.collectionId : input.collectionId ?? undefined;
    let createdCollection: CustomPortfolioCollection | undefined;
    if (input.newCollection) {
      if (input.collectionId !== undefined && input.collectionId !== null) return false;
      if (normalizePortfolioName(name) === normalizePortfolioName(input.newCollection.name)) return false;
      createdCollection = createPortfolioCollection(current, input.newCollection, id);
      if (!createdCollection) return false;
      collectionId = createdCollection.id;
    } else if (collectionId !== undefined && !current.collections.some(collection => collection.id === collectionId)) return false;
    change(current => ({
      ...current,
      collectionNumber: createdCollection?.number ?? current.collectionNumber,
      collections: createdCollection ? [...current.collections, createdCollection] : current.collections,
      customGroups: current.customGroups.map(group => group.id === id ? { ...group, ...details, name, description, collectionId } : group),
    }));
    return true;
  }, [ready, change, userId, enabled]);

  const updateGroup = useCallback<PortfolioPreferencesContextValue[`updateGroup`]>((id, name, description) => (
    saveGroupSettings(id, { name, description })
  ), [saveGroupSettings]);

  const updateGroupProjectStatus = useCallback<PortfolioPreferencesContextValue[`updateGroupProjectStatus`]>((id, value) => {
    const group = preferenceRef.current.customGroups.find(group => group.id === id);
    if (!group) return false;
    try {
      return saveGroupSettings(id, {
        name: group.name,
        description: group.description ?? ``,
        projectStatus: normalizeDomainProjectStatus(value),
      });
    } catch { return false; }
  }, [saveGroupSettings]);

  const toggleGroupStar = useCallback<PortfolioPreferencesContextValue[`toggleGroupStar`]>(id => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId) return false;
    if (!preferenceRef.current.customGroups.some(group => group.id === id)) return false;
    change(current => ({
      ...current,
      customGroups: current.customGroups.map(group => group.id === id ? { ...group, starred: group.starred !== true } : group),
    }));
    return true;
  }, [ready, change, userId, enabled]);

  const renameGroup = useCallback<PortfolioPreferencesContextValue[`renameGroup`]>((id, name) => {
    const group = preferenceRef.current.customGroups.find(group => group.id === id);
    return group ? updateGroup(id, name, group.description ?? ``) : false;
  }, [updateGroup]);

  const deleteGroup = useCallback<PortfolioPreferencesContextValue[`deleteGroup`]>(id => {
    if (!enabled || !active.current || !ready || !storageReady.current || loadedUserId.current !== userId) return false;
    const group = preferenceRef.current.customGroups.find(group => group.id === id);
    if (!group || group.isApp) return false;
    const groupKey = `custom:${id}`;
    change(current => {
      const domainIds = new Set(uniqueIds(group.domainIds));
      const orderedIds = uniqueIds([...(current.orders[groupKey] ?? []).filter(id => domainIds.has(id)), ...domainIds]);
      const collection = current.collections.find(collection => collection.id === group.collectionId);
      const destinationKey = collection ? `collection:${collection.id}` : `custom:ungrouped`;
      const next = assignCollectionDomains(current, orderedIds, collection?.id ?? null);
      const orders = Object.fromEntries(Object.entries(next.orders).filter(([key]) => key !== groupKey));
      if (orderedIds.length) {
        orders[destinationKey] = uniqueIds([
          ...(current.orders[destinationKey] ?? []).filter(id => !domainIds.has(id)),
          ...(collection?.domainIds ?? []).filter(id => !domainIds.has(id)),
          ...orderedIds,
        ]);
        if (!collection && current.orders.all) orders.all = uniqueIds([...current.orders.all, ...orderedIds]);
      }
      return {
        ...next,
        orders,
        customGroups: next.customGroups.filter(group => group.id !== id),
        hiddenGroupKeys: current.hiddenGroupKeys.filter(key => key !== groupKey),
        collapsedGroupKeys: current.collapsedGroupKeys.filter(key => key !== groupKey),
      };
    });
    return true;
  }, [ready, change, userId, enabled]);

  const assignDomain = useCallback<PortfolioPreferencesContextValue[`assignDomain`]>((domainId, groupId) => {
    if (!enabled || !active.current || !ready || !storageReady.current || loadedUserId.current !== userId) return;
    if (!domainId.trim() || (groupId !== null && !preferenceRef.current.customGroups.some(group => group.id === groupId))) return;
    change(current => assignGroupDomains(current, [domainId], groupId));
  }, [ready, change, userId, enabled]);

  const assignDomains = useCallback<PortfolioPreferencesContextValue[`assignDomains`]>((domainIds, groupId) => {
    if (!enabled || !active.current || !ready || !storageReady.current || loadedUserId.current !== userId) return false;
    const selectedIds = uniqueIds(domainIds);
    if (!selectedIds.length || (groupId !== null && !preferenceRef.current.customGroups.some(group => group.id === groupId))) return false;
    change(current => ({ ...assignGroupDomains(current, selectedIds, groupId), groupBy: `custom` }));
    return true;
  }, [ready, change, userId, enabled]);

  const starGroups = useCallback<PortfolioPreferencesContextValue[`starGroups`]>(ids => {
    if (!enabled || !active.current || !ready || !storageReady.current || loadedUserId.current !== userId) return false;
    const selectedIds = new Set(ids);
    if (preferenceRef.current.customGroups.some(group => selectedIds.has(group.id) && !group.starred)) change(current => ({
      ...current,
      customGroups: current.customGroups.map(group => selectedIds.has(group.id) ? { ...group, starred: true } : group),
    }));
    return true;
  }, [ready, change, userId, enabled]);

  const assignDomainsToCollection = useCallback<PortfolioPreferencesContextValue[`assignDomainsToCollection`]>((domainIds, collectionId) => {
    if (!enabled || !active.current || !ready || !storageReady.current || loadedUserId.current !== userId) return false;
    const selectedIds = uniqueIds(domainIds);
    if (!selectedIds.length || (collectionId !== null && !preferenceRef.current.collections.some(collection => collection.id === collectionId))) return false;
    change(current => assignCollectionDomains(current, selectedIds, collectionId));
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

  const updateCollection = useCallback<PortfolioPreferencesContextValue[`updateCollection`]>((id, value, descriptionValue, visibility, statusValue) => {
    if (!enabled || !active.current || !ready || !storageReady.current || loadedUserId.current !== userId) return false;
    if (visibility !== undefined && visibility !== `private` && visibility !== `public`) return false;
    const name = value.trim();
    const description = descriptionValue.trim();
    const collections = preferenceRef.current.collections;
    if (!name || name.length > 80 || description.length > 280 || !collections.some(collection => collection.id === id)) return false;
    if (isPortfolioNameTaken(preferenceRef.current, name, { collectionId: id })) return false;
    let projectStatus: CustomPortfolioCollection[`projectStatus`] | undefined;
    try { if (statusValue !== undefined) projectStatus = normalizeDomainProjectStatus(statusValue); }
    catch { return false; }
    change(current => ({
      ...current,
      collections: current.collections.map(collection => collection.id === id ? {
        ...collection,
        name,
        description,
        ...(visibility !== undefined ? { visibility } : {}),
        ...(projectStatus !== undefined ? { projectStatus } : {}),
      } : collection),
    }));
    return true;
  }, [ready, change, userId, enabled]);

  const renameCollection = useCallback<PortfolioPreferencesContextValue[`renameCollection`]>((id, name) => {
    const collection = preferenceRef.current.collections.find(collection => collection.id === id);
    return collection ? updateCollection(id, name, collection.description ?? ``) : false;
  }, [updateCollection]);

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
    if (sortField !== null && !PORTFOLIO_FIELDS.some(column => column.field === sortField)) return false;
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
    if (!enabled || !active.current || !ready || !storageReady.current || loadedUserId.current !== userId) return false;
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
    loading: !enabled || !ready || loadedUserId.current !== userId,
    setView,
    moveGroup,
    moveDomain,
    clearOrders,
    resetOrder,
    setGroupBy,
    starGroups,
    createGroup,
    renameGroup,
    deleteGroup,
    updateGroup,
    setShowCosts,
    setShowAddRows,
    voteCollection,
    createCollection,
    assignDomain,
    assignDomains,
    toggleGroupStar,
    moveCollection,
    updateCollection,
    renameCollection,
    saveGroupSettings,
    setCollectionSort,
    setShowHiddenGroups,
    setShowHiddenDomains,
    setShowHiddenCollections,
    toggleGroupCollapsed,
    toggleDomainExpansion,
    toggleGroupVisibility,
    assignGroupCollection,
    assignDomainsToCollection,
    toggleDomainVisibility,
    setCollectionVisibility,
    toggleCollectionVisibility,
    toggleCollectionCollapsed,
    updateGroupProjectStatus,
  }), [ready, enabled, userId, preferences, setView, moveGroup, moveDomain, clearOrders, resetOrder, setGroupBy, starGroups, createGroup, renameGroup, deleteGroup, updateGroup, setShowCosts, setShowAddRows, voteCollection, createCollection, assignDomain, assignDomains, toggleGroupStar, moveCollection, updateCollection, renameCollection, saveGroupSettings, setCollectionSort, setShowHiddenGroups, setShowHiddenDomains, setShowHiddenCollections, toggleGroupCollapsed, toggleDomainExpansion, toggleGroupVisibility, assignGroupCollection, assignDomainsToCollection, toggleDomainVisibility, setCollectionVisibility, toggleCollectionVisibility, toggleCollectionCollapsed, updateGroupProjectStatus]);

  return (
    <PortfolioPreferencesContext.Provider value={value}>
      {children}
      <Toast id={`portfolio-preferences-error`} message={enabled ? error : ``} onDismiss={() => setError(``)} />
    </PortfolioPreferencesContext.Provider>
  );
};
