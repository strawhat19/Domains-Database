import { GROUPABLE_COLUMNS } from './groups';
import type { PropsWithChildren } from 'react';
import { createOperationQueue } from '../common/storage';
import { readPortfolioPreferences, savePortfolioPreferences } from './storage';
import type { PortfolioPreferences, PortfolioPreferencesContextValue } from './types';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_PREFERENCES: PortfolioPreferences = { view: `table`, groupBy: `none`, customGroups: [], orders: {} };
const uniqueIds = (value: unknown): string[] => Array.isArray(value)
  ? [...new Set(value.filter((id): id is string => typeof id === `string` && Boolean(id)))]
  : [];

const restorePreferences = (value: unknown): PortfolioPreferences => {
  if (!value || typeof value !== `object` || Array.isArray(value)) return DEFAULT_PREFERENCES;
  const saved = value as Record<string, unknown>;
  const seenGroups = new Set<string>();
  const seenDomains = new Set<string>();
  const customGroups = (Array.isArray(saved.customGroups) ? saved.customGroups : []).flatMap(value => {
    if (!value || typeof value !== `object` || typeof value.id !== `string` || typeof value.name !== `string`) return [];
    const name = value.name.trim();
    const description = typeof value.description === `string` ? value.description.trim() : ``;
    if (!value.id || !name || seenGroups.has(value.id)) return [];
    seenGroups.add(value.id);
    const domainIds = uniqueIds(value.domainIds).filter(id => {
      if (seenDomains.has(id)) return false;
      seenDomains.add(id);
      return true;
    });
    return [{ id: value.id, name, domainIds, ...(description ? { description } : {}) }];
  });
  const orders = saved.orders && typeof saved.orders === `object` && !Array.isArray(saved.orders)
    ? Object.fromEntries(Object.entries(saved.orders).map(([key, ids]) => [key, uniqueIds(ids)]))
    : {};
  const groupBy = saved.groupBy === `custom` || GROUPABLE_COLUMNS.some(column => column.field === saved.groupBy)
    ? saved.groupBy as PortfolioPreferences[`groupBy`]
    : `none`;
  return { orders, groupBy, customGroups, view: saved.view === `grid` ? `grid` : `table` };
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

  const updateGroup = useCallback<PortfolioPreferencesContextValue[`updateGroup`]>((id, value, descriptionValue) => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId) return false;
    const name = value.trim();
    const description = descriptionValue.trim();
    const groups = preferenceRef.current.customGroups;
    if (!name || name.toLowerCase() === `ungrouped` || name.length > 80 || description.length > 280 || !groups.some(group => group.id === id)) return false;
    if (groups.some(group => group.id !== id && group.name.toLowerCase() === name.toLowerCase())) return false;
    change(current => ({ ...current, customGroups: current.customGroups.map(group => group.id === id ? { ...group, name, description } : group) }));
    return true;
  }, [ready, change, userId, enabled]);

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
    if (!source || !groups.some(group => group.id === targetId)) return false;
    change(current => {
      const customGroups = current.customGroups.filter(group => group.id !== groupId);
      const targetIndex = customGroups.findIndex(group => group.id === targetId) + (placement === `after` ? 1 : 0);
      customGroups.splice(targetIndex, 0, source);
      return { ...current, customGroups };
    });
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
    assignDomain,
    assignDomains,
  }), [ready, enabled, userId, preferences, setView, moveGroup, moveDomain, clearOrders, resetOrder, setGroupBy, createGroup, renameGroup, deleteGroup, updateGroup, assignDomain, assignDomains]);

  return (
    <PortfolioPreferencesContext.Provider value={value}>
      {children}
    </PortfolioPreferencesContext.Provider>
  );
};
