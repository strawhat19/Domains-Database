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
    if (!value.id || !name || seenGroups.has(value.id)) return [];
    seenGroups.add(value.id);
    const domainIds = uniqueIds(value.domainIds).filter(id => {
      if (seenDomains.has(id)) return false;
      seenDomains.add(id);
      return true;
    });
    return [{ id: value.id, name, domainIds }];
  });
  const orders = saved.orders && typeof saved.orders === `object` && !Array.isArray(saved.orders)
    ? Object.fromEntries(Object.entries(saved.orders).map(([key, ids]) => [key, uniqueIds(ids)]))
    : {};
  const groupBy = saved.groupBy === `custom` || GROUPABLE_COLUMNS.some(column => column.field === saved.groupBy)
    ? saved.groupBy as PortfolioPreferences[`groupBy`]
    : `none`;
  return { orders, groupBy, customGroups, view: saved.view === `grid` ? `grid` : `table` };
};

export const PortfolioPreferencesContext = createContext<PortfolioPreferencesContextValue | undefined>(undefined);

export const PortfolioPreferencesProvider = ({ children, userId = null }: PropsWithChildren<{ userId?: string | null }>) => {
  const [ready, setReady] = useState(false);
  const changed = useRef(false);
  const preferenceRef = useRef(DEFAULT_PREFERENCES);
  const loadedUserId = useRef<string | null>(null);
  const storageQueue = useRef(createOperationQueue()).current;
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  useEffect(() => {
    let mounted = true;
    const capturedUserId = userId;
    setReady(false);
    changed.current = false;
    loadedUserId.current = null;
    preferenceRef.current = DEFAULT_PREFERENCES;
    setPreferences(DEFAULT_PREFERENCES);
    readPortfolioPreferences(capturedUserId).then(saved => {
      if (!mounted || changed.current || !saved) return;
      const restored = restorePreferences(JSON.parse(saved));
      preferenceRef.current = restored;
      setPreferences(restored);
    }).catch(() => undefined).finally(() => {
      if (mounted) { loadedUserId.current = capturedUserId; setReady(true); }
    });
    return () => { mounted = false; };
  }, [userId]);

  useEffect(() => {
    if (!ready || loadedUserId.current !== userId) return;
    const capturedUserId = userId;
    const capturedPreferences = preferences;
    void storageQueue(() => savePortfolioPreferences(capturedPreferences, capturedUserId)).catch(() => undefined);
  }, [ready, userId, preferences, storageQueue]);

  const change = useCallback((update: (current: PortfolioPreferences) => PortfolioPreferences) => {
    changed.current = true;
    const next = update(preferenceRef.current);
    preferenceRef.current = next;
    setPreferences(next);
  }, []);

  const setView = useCallback<PortfolioPreferencesContextValue[`setView`]>(view => {
    change(current => ({ ...current, view }));
  }, [change]);

  const setGroupBy = useCallback<PortfolioPreferencesContextValue[`setGroupBy`]>(groupBy => {
    change(current => ({ ...current, groupBy }));
  }, [change]);

  const createGroup = useCallback<PortfolioPreferencesContextValue[`createGroup`]>(value => {
    const name = value.trim();
    if (!name || preferenceRef.current.customGroups.some(group => group.name.toLowerCase() === name.toLowerCase())) return undefined;
    const id = `group-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    change(current => ({ ...current, groupBy: `custom`, customGroups: [...current.customGroups, { id, name, domainIds: [] }] }));
    return id;
  }, [change]);

  const renameGroup = useCallback<PortfolioPreferencesContextValue[`renameGroup`]>((id, value) => {
    const name = value.trim();
    if (!name || preferenceRef.current.customGroups.some(group => group.id !== id && group.name.toLowerCase() === name.toLowerCase())) return false;
    change(current => ({ ...current, customGroups: current.customGroups.map(group => group.id === id ? { ...group, name } : group) }));
    return true;
  }, [change]);

  const deleteGroup = useCallback<PortfolioPreferencesContextValue[`deleteGroup`]>(id => {
    change(current => ({
      ...current,
      customGroups: current.customGroups.filter(group => group.id !== id),
      orders: Object.fromEntries(Object.entries(current.orders).filter(([key]) => key !== `custom:${id}`)),
    }));
  }, [change]);

  const assignDomain = useCallback<PortfolioPreferencesContextValue[`assignDomain`]>((domainId, groupId) => {
    change(current => ({
      ...current,
      customGroups: current.customGroups.map(group => ({
        ...group,
        domainIds: group.id === groupId
          ? [...group.domainIds.filter(id => id !== domainId), domainId]
          : group.domainIds.filter(id => id !== domainId),
      })),
      orders: Object.fromEntries(Object.entries(current.orders).map(([key, ids]) => [key, key.startsWith(`custom:`) ? ids.filter(id => id !== domainId) : ids])),
    }));
  }, [change]);

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

  const resetOrder = useCallback<PortfolioPreferencesContextValue[`resetOrder`]>(groupKey => {
    change(current => ({ ...current, orders: Object.fromEntries(Object.entries(current.orders).filter(([key]) => key !== groupKey)) }));
  }, [change]);

  const clearOrders = useCallback(() => change(current => ({ ...current, orders: {} })), [change]);
  const value = useMemo(() => ({
    ...preferences,
    setView,
    moveDomain,
    clearOrders,
    resetOrder,
    setGroupBy,
    createGroup,
    renameGroup,
    deleteGroup,
    assignDomain,
  }), [preferences, setView, moveDomain, clearOrders, resetOrder, setGroupBy, createGroup, renameGroup, deleteGroup, assignDomain]);

  return (
    <PortfolioPreferencesContext.Provider value={value}>
      {children}
    </PortfolioPreferencesContext.Provider>
  );
};
