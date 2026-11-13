import { routes } from '../routes';
import { usePathname } from 'expo-router';
import { Roles } from '../../types/types';
import { useAuth } from '../authContext/useAuth';
import { AppState, Platform } from 'react-native';
import { DISCOVERY_CACHE_TTL } from './discoveryCache';
import { getDiscoveryWeek, getNextDiscoveryWeekStart } from './discoveryIdeas';
import { useConnectionAvailability } from '../connections/useConnectionAvailability';
import { useBackgroundProgressReporter } from '../backgroundProgress/BackgroundProgressContext';
import { getDomainDiscovery, type DomainDiscoveryFilter, type DomainDiscoveryResults } from './discovery';
import { createContext, createElement, startTransition, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

interface DiscoveryState {
  key: string;
  error: string;
  loading: boolean;
  result: DomainDiscoveryResults | null;
}

interface DiscoveryContextValue {
  error: string;
  paused: boolean;
  loading: boolean;
  eligible: boolean;
  accessLoading: boolean;
  result: DomainDiscoveryResults | null;
  refresh: () => void;
}

const DomainDiscoveryContext = createContext<DiscoveryContextValue | null>(null);
const ForegroundSearchContext = createContext<(() => () => void) | null>(null);
const TrendingCountContext = createContext({ count: 0, loading: false });

export const DomainDiscoveryProvider = ({ children, enabled = true }: PropsWithChildren<{ enabled?: boolean }>) => {
  const searchActive = usePathname() === routes.search.href;
  const availability = useConnectionAvailability();
  const report = useBackgroundProgressReporter(`discovery`, `Trending Domains`);
  const { user, loading: authLoading, loginRevision } = useAuth();
  const [paused, setPaused] = useState(false);
  const [refreshRevision, setRefreshRevision] = useState(0);
  const [week, setWeek] = useState(getDiscoveryWeek);
  const userId = user?.id ?? null;
  const scopeKey = JSON.stringify([userId, loginRevision, availability.revision, user?.plan, user?.active, week]);
  const viewKey = `${scopeKey}:${refreshRevision}`;
  const accessLoading = !enabled || authLoading || availability.loading;
  const requested = searchActive || Boolean(userId && user?.active && !user.anonymous && user.role !== Roles.Guest);
  const requestKey = `${viewKey}:${requested}:${paused}:${availability.eligible}:${accessLoading}`;
  const currentRequest = useRef(requestKey);
  const cacheScope = useRef(scopeKey);
  const cache = useRef<DomainDiscoveryResults | null>(null);
  const partial = useRef<DomainDiscoveryResults | null>(null);
  const forceRefresh = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const foregroundSearches = useRef(new Set<symbol>());
  const [state, setState] = useState<DiscoveryState>({ key: viewKey, error: ``, result: null, loading: false });
  currentRequest.current = requestKey;

  const beginForegroundSearch = useCallback(() => {
    const search = Symbol();
    foregroundSearches.current.add(search);
    controller.current?.abort();
    setPaused(true);
    return () => {
      if (foregroundSearches.current.delete(search) && !foregroundSearches.current.size) setPaused(false);
    };
  }, []);

  useEffect(() => {
    const cached = cache.current;
    if (searchActive && !controller.current && cached && Date.now() - Date.parse(cached.searchedAt) >= DISCOVERY_CACHE_TTL) {
      setRefreshRevision(current => current + 1);
    }
  }, [searchActive]);

  useEffect(() => {
    if (!requested || accessLoading || !availability.eligible) return;
    let timer: ReturnType<typeof setTimeout>;
    const updateWeek = () => {
      clearTimeout(timer);
      const now = Date.now();
      const current = getDiscoveryWeek(now);
      setWeek(current);
      timer = setTimeout(updateWeek, getNextDiscoveryWeekStart(current) - now);
    };
    updateWeek();
    const subscription = AppState.addEventListener(`change`, status => { if (status === `active`) updateWeek(); });
    if (Platform.OS === `web`) window.addEventListener(`focus`, updateWeek);
    return () => {
      clearTimeout(timer);
      subscription.remove();
      if (Platform.OS === `web`) window.removeEventListener(`focus`, updateWeek);
    };
  }, [requested, accessLoading, availability.eligible]);

  useEffect(() => {
    if (cacheScope.current !== scopeKey) {
      cache.current = null;
      partial.current = null;
      forceRefresh.current = false;
      cacheScope.current = scopeKey;
      report(null);
    }
    if (!requested || week !== getDiscoveryWeek() || accessLoading || !availability.eligible) {
      report(null);
      setState({ key: viewKey, error: ``, result: null, loading: false });
      return;
    }
    if (paused || foregroundSearches.current.size) {
      report(null);
      setState(current => current.key === viewKey
        ? { ...current, loading: false }
        : { key: viewKey, error: ``, result: null, loading: false });
      return;
    }
    const cached = cache.current;
    const refreshRequested = forceRefresh.current;
    forceRefresh.current = false;
    if (!refreshRequested && cached && Date.now() - Date.parse(cached.searchedAt) < 5 * 60_000) {
      setState({ key: viewKey, error: ``, result: cached, loading: false });
      return;
    }
    const previous = partial.current ?? cached;
    let active = true;
    const request = new AbortController();
    controller.current = request;
    const isCurrent = () => active && !request.signal.aborted && currentRequest.current === requestKey;
    report({});
    setState({ key: viewKey, error: ``, result: previous, loading: true });
    void getDomainDiscovery(request.signal, userId, (result, progress) => {
      if (!isCurrent()) return;
      partial.current = result;
      startTransition(() => setState(current => isCurrent() && current.key === viewKey ? { key: viewKey, error: ``, result, loading: true } : current));
      report(progress);
    }, { week, previous, refresh: refreshRequested }).then(result => {
      if (!isCurrent()) return;
      cache.current = result;
      partial.current = result;
      setState({ key: viewKey, error: ``, result, loading: false });
      report(result.incomplete ? { error: `Some Registrar Checks Could Not Be Confirmed` } : { done: true });
    }).catch(failure => {
      if (!isCurrent()) return;
      const error = failure instanceof Error ? failure.message : `Could Not Check Domain Availability`;
      setState({
        key: viewKey,
        result: partial.current ?? previous,
        loading: false,
        error,
      });
      report({ error });
    }).finally(() => { if (controller.current === request) controller.current = null; });
    return () => {
      active = false;
      request.abort();
      if (controller.current === request) controller.current = null;
    };
  }, [week, userId, viewKey, scopeKey, requestKey, requested, paused, accessLoading, availability.eligible, report]);

  const refresh = useCallback(() => {
    if (!requested || foregroundSearches.current.size || accessLoading || !availability.eligible || currentRequest.current !== requestKey) return;
    const currentWeek = getDiscoveryWeek();
    if (currentWeek !== week) { setWeek(currentWeek); return; }
    forceRefresh.current = true;
    controller.current?.abort();
    setRefreshRevision(current => current + 1);
  }, [week, requestKey, requested, accessLoading, availability.eligible]);

  const visible = requested && !accessLoading && availability.eligible && state.key === viewKey;
  const result = visible ? state.result : null;
  const loading = requested && !paused && !accessLoading && availability.eligible && (!visible || state.loading);
  const eligible = availability.eligible;
  const error = visible ? state.error : requested && !accessLoading && !eligible ? availability.error : ``;
  const value = useMemo(() => ({ error, paused, result, loading, eligible, accessLoading, refresh }),
    [error, paused, result, loading, eligible, accessLoading, refresh]);
  const count = loading ? 0 : result?.results.length ?? 0;
  const trending = useMemo(() => ({ count, loading }), [count, loading]);
  return createElement(ForegroundSearchContext.Provider, { value: beginForegroundSearch },
    createElement(TrendingCountContext.Provider, { value: trending },
      createElement(DomainDiscoveryContext.Provider, { value }, children)));
};

export const useTrendingDomainCount = () => useContext(TrendingCountContext);

const useDiscoveryContext = () => {
  const context = useContext(DomainDiscoveryContext);
  if (!context) throw new Error(`Use Domain Discovery Inside Its Provider`);
  return context;
};

export const useDiscoveryForegroundSearch = () => {
  const begin = useContext(ForegroundSearchContext);
  if (!begin) throw new Error(`Use Domain Discovery Inside Its Provider`);
  return begin;
};

export const useDomainDiscovery = () => {
  const { result, error, refresh, paused, loading, eligible, accessLoading } = useDiscoveryContext();
  const [tldFilter, setTldFilter] = useState(`all`);
  const [filter, setFilter] = useState<DomainDiscoveryFilter>(`all`);
  const results = useMemo(() => [...(result?.results ?? [])].sort((first, second) => (
    Number(second.extension === `com`) - Number(first.extension === `com`)
  )), [result]);
  const statusResults = filter === `all` ? results : results.filter(result => result.statuses.includes(filter));
  return {
    filter,
    results,
    refresh,
    tldFilter,
    toggleFilter: (value: DomainDiscoveryFilter) => setFilter(current => current === value ? `all` : value),
    toggleTldFilter: (value: string) => setTldFilter(current => current === value ? `all` : value),
    statusResults,
    paused,
    accessLoading,
    eligible,
    filteredResults: tldFilter === `all` ? statusResults : statusResults.filter(result => result.extension === tldFilter),
    checkedAt: result?.searchedAt ?? ``,
    loading,
    error,
  };
};
