import { AppState } from 'react-native';
import type { PropsWithChildren } from 'react';
import { WATCHING_STORAGE_KEY } from './service';
import { watchingAPI } from '../../api/watching';
import { useAuth } from '../authContext/useAuth';
import { accountStorageKey } from '../authentication/userScope';
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
      if (isCurrent()) { setRecords(records); setError(``); }
    } catch (failure) {
      if (isCurrent()) { setRecords([]); setError(failure instanceof Error ? failure.message : `Could Not Load Watching`); }
      throw failure;
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    mounted.current = true;
    setRecords([]);
    setError(``);
    setNotice(``);
    setLoading(Boolean(userId));
    if (userId) void refresh().catch(() => undefined);
    return () => { mounted.current = false; ++request.current; };
  }, [userId, refresh]);

  useEffect(() => {
    if (!userId) return;
    const resume = () => { void refresh().catch(() => undefined); };
    const storageKey = accountStorageKey(WATCHING_STORAGE_KEY, userId);
    const changed = (event: StorageEvent) => { if (event.key === null || event.key === storageKey) resume(); };
    const subscription = AppState.addEventListener(`change`, state => { if (state === `active`) resume(); });
    if (typeof window !== `undefined`) {
      window.addEventListener(`focus`, resume);
      window.addEventListener(`storage`, changed);
    }
    return () => {
      subscription.remove();
      if (typeof window !== `undefined`) {
        window.removeEventListener(`focus`, resume);
        window.removeEventListener(`storage`, changed);
      }
    };
  }, [userId, refresh]);

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
    records: userId ? records : [],
    loading: !enabled || authLoading || loading,
    clearError: () => setError(``),
    clearNotice: () => setNotice(``),
    isWatching: (domain: string) => !!userId && records.some(record => record.domain === domain.trim().toLowerCase()),
    removeWatch: (id: string) => mutate(() => watchingAPI.removeWatch(id, userId), `Domain Removed From Watching`),
    watchDomain: (result: DomainSearchDomainResult) => mutate(() => watchingAPI.watchDomain(result, userId), `Domain Added To Watching`),
    syncManually: () => mutate(() => watchingAPI.syncWatching(userId), `Watching Refreshed With Mock Data`, true),
  }), [busy, syncing, error, notice, records, loading, enabled, authLoading, userId, mutate]);

  return <WatchingContext.Provider value={value}>{children}</WatchingContext.Provider>;
};
