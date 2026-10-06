import { useAuth } from '../authContext/useAuth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useConnectionAvailability } from '../connections/useConnectionAvailability';
import { getDomainDiscovery, type DomainDiscoveryFilter, type DomainDiscoveryResults } from './discovery';

interface DiscoveryState {
  key: string;
  error: string;
  loading: boolean;
  result: DomainDiscoveryResults | null;
}

export const useDomainDiscovery = (paused = false) => {
  const availability = useConnectionAvailability();
  const { user, loading: authLoading, loginRevision } = useAuth();
  const [tldFilter, setTldFilter] = useState(`all`);
  const [filter, setFilter] = useState<DomainDiscoveryFilter>(`all`);
  const [refreshRevision, setRefreshRevision] = useState(0);
  const userId = user?.id ?? null;
  const scopeKey = `${userId ?? `guest`}:${loginRevision}:${availability.revision}`;
  const viewKey = `${scopeKey}:${refreshRevision}`;
  const accessLoading = authLoading || availability.loading;
  const requestKey = `${viewKey}:${paused}:${availability.eligible}:${accessLoading}`;
  const currentRequest = useRef(requestKey);
  const cacheScope = useRef(scopeKey);
  const cache = useRef<DomainDiscoveryResults | null>(null);
  const controller = useRef<AbortController | null>(null);
  const [state, setState] = useState<DiscoveryState>({ key: viewKey, error: ``, result: null, loading: false });
  currentRequest.current = requestKey;

  useEffect(() => {
    if (cacheScope.current !== scopeKey) {
      cache.current = null;
      cacheScope.current = scopeKey;
    }
    if (accessLoading || !availability.eligible) {
      setState({ key: viewKey, error: ``, result: null, loading: false });
      return;
    }
    if (paused) {
      setState(current => current.key === viewKey
        ? { ...current, loading: false }
        : { key: viewKey, error: ``, result: null, loading: false });
      return;
    }
    const cached = cache.current;
    if (cached && Date.now() - Date.parse(cached.searchedAt) < 5 * 60_000) {
      setState({ key: viewKey, error: ``, result: cached, loading: false });
      return;
    }
    cache.current = null;
    let active = true;
    const request = new AbortController();
    controller.current = request;
    const isCurrent = () => active && !request.signal.aborted && currentRequest.current === requestKey;
    setState({ key: viewKey, error: ``, result: null, loading: true });
    void getDomainDiscovery(request.signal, userId, result => {
      if (isCurrent()) setState({ key: viewKey, error: ``, result, loading: true });
    }).then(result => {
      if (!isCurrent()) return;
      cache.current = result;
      setState({ key: viewKey, error: ``, result, loading: false });
    }).catch(failure => {
      if (!isCurrent()) return;
      setState({
        key: viewKey,
        result: null,
        loading: false,
        error: failure instanceof Error ? failure.message : `Could Not Check Domain Availability`,
      });
    });
    return () => {
      active = false;
      request.abort();
      if (controller.current === request) controller.current = null;
    };
  }, [paused, userId, viewKey, scopeKey, requestKey, accessLoading, availability.eligible]);

  const refresh = useCallback(() => {
    if (paused || accessLoading || !availability.eligible || currentRequest.current !== requestKey) return;
    cache.current = null;
    controller.current?.abort();
    setRefreshRevision(current => current + 1);
  }, [paused, requestKey, accessLoading, availability.eligible]);

  const visible = !accessLoading && availability.eligible && state.key === viewKey;
  const results = visible ? [...(state.result?.results ?? [])].sort((first, second) => (
    Number(second.extension === `com`) - Number(first.extension === `com`)
  )) : [];
  const statusResults = filter === `all` ? results : results.filter(result => result.statuses.includes(filter));
  return {
    filter,
    results,
    refresh,
    tldFilter,
    setFilter,
    setTldFilter,
    statusResults,
    accessLoading,
    eligible: availability.eligible,
    filteredResults: tldFilter === `all` ? statusResults : statusResults.filter(result => result.extension === tldFilter),
    checkedAt: visible ? state.result?.searchedAt ?? `` : ``,
    loading: !paused && !accessLoading && availability.eligible && (!visible || state.loading),
    error: visible ? state.error : !accessLoading && !availability.eligible ? availability.error : ``,
  };
};
