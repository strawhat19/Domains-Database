import { AppState } from 'react-native';
import { useAuth } from '../authContext/useAuth';
import type { RecentDomainSearch } from './recentSearches';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getRecentSearches, subscribeRecentSearches, recentSearchesStorageKey, RECENT_SEARCHES_STORAGE_KEY, rememberSearch as saveSearch, clearRecentSearches as clearSearches } from './recentSearches';

const errorMessage = (failure: unknown) => failure instanceof Error ? failure.message : `Recent Searches Are Unavailable`;

interface RecentSearchState {
  error: string;
  actorKey: string;
  loading: boolean;
  records: RecentDomainSearch[];
}

export const useRecentSearches = () => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const actorKey = authLoading ? `pending` : userId ?? `guest`;
  const mounted = useRef(false);
  const request = useRef(0);
  const currentActor = useRef(actorKey);
  currentActor.current = actorKey;
  const [state, setState] = useState<RecentSearchState>({ error: ``, actorKey, records: [], loading: true });

  const refresh = useCallback(async () => {
    if (authLoading || !mounted.current || currentActor.current !== actorKey) return;
    const revision = ++request.current;
    const isCurrent = () => mounted.current && currentActor.current === actorKey && revision === request.current;
    try {
      const records = await getRecentSearches(userId);
      if (isCurrent()) setState({ actorKey, records, error: ``, loading: false });
    } catch (failure) {
      if (isCurrent()) setState({ actorKey, records: [], loading: false, error: errorMessage(failure) });
      throw failure;
    }
  }, [userId, actorKey, authLoading]);

  useEffect(() => {
    mounted.current = true;
    setState({ error: ``, actorKey, records: [], loading: true });
    if (authLoading) return () => { mounted.current = false; ++request.current; };
    const resume = () => { void refresh().catch(() => undefined); };
    const storageKey = recentSearchesStorageKey(userId);
    const relevantKey = (key: string | null) => key === null || key === storageKey || key === RECENT_SEARCHES_STORAGE_KEY;
    const changed = (event: StorageEvent) => { if (relevantKey(event.key)) resume(); };
    const unsubscribe = subscribeRecentSearches(key => { if (relevantKey(key)) resume(); });
    const subscription = AppState.addEventListener(`change`, state => { if (state === `active`) resume(); });
    resume();
    if (typeof window !== `undefined`) {
      window.addEventListener(`focus`, resume);
      window.addEventListener(`storage`, changed);
    }
    return () => {
      mounted.current = false;
      ++request.current;
      unsubscribe();
      subscription.remove();
      if (typeof window !== `undefined`) {
        window.removeEventListener(`focus`, resume);
        window.removeEventListener(`storage`, changed);
      }
    };
  }, [userId, actorKey, authLoading, refresh]);

  const mutate = useCallback(async (operation: () => Promise<void>) => {
    try {
      if (authLoading) throw new Error(`Wait For Your Account To Load`);
      if (!mounted.current || currentActor.current !== actorKey) throw new Error(`Your Account Changed — Try Again`);
      await operation();
      await refresh();
    } catch (failure) {
      if (mounted.current && currentActor.current === actorKey) setState(current => ({ ...current, error: errorMessage(failure) }));
      throw failure;
    }
  }, [actorKey, authLoading, refresh]);

  const clearError = useCallback(() => setState(current => current.actorKey === actorKey ? { ...current, error: `` } : current), [actorKey]);
  const rememberSearch = useCallback((query: string) => mutate(() => saveSearch(query, userId)), [userId, mutate]);
  const clearRecentSearches = useCallback(() => mutate(() => clearSearches(userId)), [userId, mutate]);
  const currentView = !authLoading && state.actorKey === actorKey;

  return {
    clearError,
    rememberSearch,
    clearRecentSearches,
    error: currentView ? state.error : ``,
    records: currentView ? state.records : [],
    loading: !currentView || state.loading,
  };
};
