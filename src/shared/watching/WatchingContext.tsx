import type { PropsWithChildren } from 'react';
import { watchingAPI } from '../../api/watching';
import { useAuth } from '../authContext/useAuth';
import type { WatchedDomain } from '../models/watching/WatchedDomain';
import type { DomainSearchDomainResult } from '../domainSearch/types';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface WatchingContextValue {
  busy: boolean;
  error: string;
  notice: string;
  loading: boolean;
  syncing: boolean;
  records: WatchedDomain[];
  clearError: () => void;
  clearNotice: () => void;
  syncManually: () => Promise<void>;
  isWatching: (domain: string) => boolean;
  removeWatch: (id: string) => Promise<void>;
  watchDomain: (result: DomainSearchDomainResult) => Promise<void>;
}

export const WatchingContext = createContext<WatchingContextValue | null>(null);

export const WatchingProvider = ({ children, enabled = true }: PropsWithChildren<{ enabled?: boolean }>) => {
  const { user, loading: authLoading } = useAuth();
  const userId = enabled && !authLoading ? user?.id ?? null : null;
  const mounted = useRef(false);
  const request = useRef(0);
  const mutationBusy = useRef(false);
  const currentUserId = useRef(userId);
  const loadedUserId = useRef<string | null>(null);
  currentUserId.current = userId;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(``);
  const [notice, setNotice] = useState(``);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<WatchedDomain[]>([]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const revision = ++request.current;
    const isCurrent = () => mounted.current && currentUserId.current === userId && request.current === revision;
    try {
      const records = await watchingAPI.getWatching(userId);
      if (isCurrent()) { loadedUserId.current = userId; setRecords(records); setError(``); }
    } catch (failure) {
      if (isCurrent()) { loadedUserId.current = userId; setRecords([]); setError(failure instanceof Error ? failure.message : `Could Not Load Watching`); }
      throw failure;
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    mounted.current = true;
    loadedUserId.current = null;
    setRecords([]);
    setError(``);
    setNotice(``);
    setLoading(Boolean(userId));
    if (!userId) return () => { mounted.current = false; ++request.current; };
    const isCurrent = () => mounted.current && currentUserId.current === userId;
    const unsubscribe = watchingAPI.subscribeWatching(userId, saved => {
      if (!isCurrent()) return false;
      ++request.current;
      loadedUserId.current = userId;
      setRecords(saved);
      setLoading(false);
      setError(``);
    }, failure => {
      if (!isCurrent()) return;
      loadedUserId.current = userId;
      setLoading(false);
      setError(failure.message);
    });
    return () => {
      mounted.current = false;
      ++request.current;
      unsubscribe();
    };
  }, [userId]);

  const mutate = useCallback(async (operation: () => Promise<unknown>, message: string, sync = false) => {
    if (!userId) throw new Error(`Sign In To Watch Domains`);
    if (!mounted.current || currentUserId.current !== userId) throw new Error(`Your Account Changed — Try Again`);
    if (mutationBusy.current) throw new Error(`Wait For Your Current Action`);
    mutationBusy.current = true;
    setBusy(true);
    setError(``);
    setNotice(``);
    setSyncing(sync);
    try {
      await operation();
      if (!mounted.current || currentUserId.current !== userId) return;
      await refresh();
      if (mounted.current && currentUserId.current === userId) setNotice(message);
    } catch (failure) {
      if (mounted.current && currentUserId.current === userId) setError(failure instanceof Error ? failure.message : `Could Not Update Watching`);
      throw failure;
    } finally {
      mutationBusy.current = false;
      if (mounted.current && currentUserId.current === userId) { setBusy(false); setSyncing(false); }
    }
  }, [userId, refresh]);

  const value = useMemo(() => ({
    busy,
    syncing,
    error: userId ? error : ``,
    notice: userId ? notice : ``,
    records: userId && loadedUserId.current === userId ? records : [],
    loading: !enabled || authLoading || loading || loadedUserId.current !== userId,
    clearError: () => setError(``),
    clearNotice: () => setNotice(``),
    isWatching: (domain: string) => !!userId && loadedUserId.current === userId && records.some(record => record.domain === domain.trim().toLowerCase()),
    removeWatch: (id: string) => mutate(() => watchingAPI.removeWatch(id, userId), `Domain Removed From Watching`),
    watchDomain: (result: DomainSearchDomainResult) => mutate(() => watchingAPI.watchDomain(result, userId), `Domain Added To Watching`),
    syncManually: () => mutate(() => watchingAPI.syncWatching(userId), `Watching Refreshed With Mock Data`, true),
  }), [busy, syncing, error, notice, records, loading, enabled, authLoading, userId, mutate]);

  return <WatchingContext.Provider value={value}>{children}</WatchingContext.Provider>;
};
