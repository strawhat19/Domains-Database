import { useAuth } from '../authContext/useAuth';
import { useTheme } from '../themeContext/useTheme';
import { useAfterPaint } from '../common/useAfterPaint';
import type { RecentDomainSearch } from './recentSearches';
import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribeRecentSearches, rememberSearch as saveSearch, clearRecentSearches as clearSearches } from './recentSearches';

const errorMessage = (failure: unknown) => failure instanceof Error ? failure.message : `Recent Searches Are Unavailable`;

interface RecentSearchState {
  error: string;
  actorKey: string;
  loading: boolean;
  records: RecentDomainSearch[];
}

export const useRecentSearches = () => {
  const { ready: themeReady } = useTheme();
  const dataReady = useAfterPaint(themeReady);
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const actorKey = authLoading ? `pending` : userId ?? `guest`;
  const mounted = useRef(false);
  const currentReady = useRef(false);
  currentReady.current = dataReady && !authLoading;
  const currentActor = useRef(actorKey);
  currentActor.current = actorKey;
  const [state, setState] = useState<RecentSearchState>({ error: ``, actorKey, records: [], loading: true });

  useEffect(() => {
    mounted.current = true;
    setState(current => current.actorKey === actorKey
      ? { ...current, error: ``, loading: true }
      : { error: ``, actorKey, records: [], loading: true });
    if (!dataReady || authLoading) return () => { mounted.current = false; };
    const isCurrent = () => currentReady.current && mounted.current && currentActor.current === actorKey;
    const unsubscribe = subscribeRecentSearches(userId, records => {
      if (!isCurrent()) return false;
      setState({ actorKey, records, error: ``, loading: false });
    }, failure => {
      if (isCurrent()) setState(current => ({ ...current, actorKey, loading: false, error: errorMessage(failure) }));
    });
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [userId, actorKey, dataReady, authLoading]);

  const mutate = useCallback(async (operation: () => Promise<void>) => {
    try {
      if (authLoading) throw new Error(`Wait For Your Account To Load`);
      if (!dataReady || !currentReady.current) throw new Error(`Wait For Your Theme To Load`);
      if (!mounted.current || currentActor.current !== actorKey) throw new Error(`Your Account Changed — Try Again`);
      await operation();
    } catch (failure) {
      if (currentReady.current && mounted.current && currentActor.current === actorKey) setState(current => ({ ...current, error: errorMessage(failure) }));
      throw failure;
    }
  }, [actorKey, dataReady, authLoading]);

  const clearError = useCallback(() => setState(current => current.actorKey === actorKey ? { ...current, error: `` } : current), [actorKey]);
  const rememberSearch = useCallback((query: string) => mutate(() => saveSearch(query, userId)), [userId, mutate]);
  const clearRecentSearches = useCallback(() => mutate(() => clearSearches(userId)), [userId, mutate]);
  const currentView = dataReady && !authLoading && state.actorKey === actorKey;

  return {
    clearError,
    rememberSearch,
    clearRecentSearches,
    ready: dataReady && !authLoading,
    error: currentView ? state.error : ``,
    records: currentView ? state.records : [],
    loading: dataReady && (!currentView || state.loading),
  };
};
