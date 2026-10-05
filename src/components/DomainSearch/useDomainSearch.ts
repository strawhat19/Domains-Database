import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useRecentSearches } from '../../shared/domainSearch/useRecentSearches';
import { useAuth } from '../../shared/authContext/useAuth';
import { getAvailableConnections } from './resultPresentation';
import { useConnectionAvailability } from '../../shared/connections/useConnectionAvailability';
import { DOMAIN_SEARCH_PAGE_SIZE, normalizeDomainSearchQuery } from '../../shared/domainSearch/query';
import type { DomainSearchResults, DomainSearchVariants } from '../../shared/domainSearch/types';
import { getConnectedDomainVariants, searchConnectedDomains } from '../../shared/domainSearch/client';

interface SearchState {
  note: string;
  query: string;
  error: string;
  actorKey: string;
  loading: boolean;
  loadingMore: boolean;
  variants: DomainSearchVariants | null;
  results: DomainSearchResults | null;
}

const emptyState = (actorKey: string, query = ``): SearchState => ({
  query, actorKey, note: ``, error: ``, loading: false, loadingMore: false, variants: null, results: null,
});

export const useDomainSearch = () => {
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const availability = useConnectionAvailability();
  const recentSearches = useRecentSearches();
  const { user, loading: authLoading, loginRevision } = useAuth();
  const actorKey = `${user?.id ?? `guest`}:${loginRevision}:${availability.revision}`;
  const currentActor = useRef(actorKey);
  const mounted = useRef(false);
  const revision = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const appliedQuery = useRef(``);
  const recordedRouteQuery = useRef(``);
  const [state, setState] = useState<SearchState>(() => emptyState(actorKey));
  currentActor.current = actorKey;
  const visible = state.actorKey === actorKey && availability.eligible;
  const query = visible ? state.query : ``;
  const error = visible ? state.error : ``;
  const note = visible ? state.note : ``;
  const results = visible ? state.results : null;
  const variants = visible ? state.variants : null;
  const loading = visible && state.loading;
  const loadingMore = visible && state.loadingMore;
  const availableResults = results?.results.flatMap(result => {
    const connections = getAvailableConnections(result);
    return connections.length ? [result] : [];
  }) ?? [];
  const checkedVariants = results?.results.filter(result => (
    result.connections.length > 0 && result.connections.every(connection => !connection.pending)
  )).length ?? 0;
  const hasUnconfirmedResults = results?.results.some(result => result.connections.some(connection => (
    !connection.pending && connection.available !== false && (Boolean(connection.error) || connection.available === undefined)
  ))) ?? false;
  const checkWarnings = [...new Set(results?.results.flatMap(result => result.connections.flatMap(connection => {
    if (connection.pending || connection.available === false || (!connection.error && connection.available !== undefined)) return [];
    const message = connection.error || connection.note || `Availability Not Confirmed`;
    const warning = `${connection.label}: ${message}`;
    return error === message || error === warning ? [] : [warning];
  })) ?? [])];

  useEffect(() => {
    mounted.current = availability.eligible;
    controller.current?.abort();
    controller.current = null;
    revision.current += 1;
    appliedQuery.current = ``;
    setState(emptyState(actorKey));
    return () => {
      mounted.current = false;
      revision.current += 1;
      controller.current?.abort();
      controller.current = null;
    };
  }, [actorKey, availability.eligible]);

  const setQuery = (value: string) => {
    if (!mounted.current || currentActor.current !== actorKey) return;
    revision.current += 1;
    controller.current?.abort();
    controller.current = null;
    setState(emptyState(actorKey, value));
  };

  const clear = () => setQuery(``);

  const search = async (append: boolean, input = query, fromRoute = false) => {
    if (authLoading || !availability.eligible || (!fromRoute && (loading || loadingMore)) || !mounted.current || currentActor.current !== actorKey) return;
    if (append && (!variants || !results || results.results.length >= variants.domains.length)) return;
    let name: string;
    try {
      name = normalizeDomainSearchQuery(input);
    } catch (failure) {
      setState(current => ({ ...current, actorKey, error: failure instanceof Error ? failure.message : `Enter A Valid Domain Name` }));
      return;
    }
    controller.current?.abort();
    const request = new AbortController();
    const requestRevision = ++revision.current;
    controller.current = request;
    const previous = append ? results : null;
    const isCurrent = () => mounted.current && currentActor.current === actorKey
      && revision.current === requestRevision && !request.signal.aborted;
    setState(current => append
      ? { ...current, error: ``, loadingMore: true }
      : { ...emptyState(actorKey, name), loading: true });
    if (!append && (!fromRoute || recordedRouteQuery.current !== name)) {
      if (fromRoute) recordedRouteQuery.current = name;
      void recentSearches.rememberSearch(name).catch(() => undefined);
    }
    try {
      const choices = append && variants ? variants : await getConnectedDomainVariants(name, request.signal, user?.id ?? null);
      if (!isCurrent()) return;
      setState(current => isCurrent() ? { ...current, variants: choices, note: choices.note ?? `` } : current);
      const offset = previous?.results.length ?? 0;
      const domains = choices.domains.slice(offset, offset + DOMAIN_SEARCH_PAGE_SIZE);
      const showResults = (page: DomainSearchResults) => {
        if (isCurrent()) setState(current => isCurrent() ? {
          ...current, results: { ...page, results: [...(previous?.results ?? []), ...page.results] },
        } : current);
      };
      const result = await searchConnectedDomains(domains, request.signal, user?.id ?? null, choices.connectionsUpdated, showResults);
      showResults(result);
    } catch (failure) {
      if (isCurrent()) setState(current => isCurrent() ? {
        ...current,
        results: previous,
        error: failure instanceof Error ? failure.message : `Could Not Check Domain Availability`,
      } : current);
    } finally {
      if (isCurrent()) setState(current => isCurrent() ? { ...current, loading: false, loadingMore: false } : current);
      if (controller.current === request) controller.current = null;
    }
  };

  const incomingQuery = typeof params.q === `string` ? params.q.trim().slice(0, 253) : ``;
  useEffect(() => {
    if (authLoading || !incomingQuery || !availability.eligible || !mounted.current) return;
    const key = `${actorKey}:${incomingQuery}`;
    if (appliedQuery.current === key) return;
    appliedQuery.current = key;
    void search(false, incomingQuery, true);
  }, [actorKey, authLoading, availability.eligible, incomingQuery]);

  return {
    user, note, query, error, results, loading, loadingMore, clear, setQuery,
    checkWarnings, checkedVariants, availableResults, hasUnconfirmedResults,
    accessError: availability.error,
    requestedQuery: incomingQuery,
    recentSearches: recentSearches.records,
    recentSearchesError: recentSearches.error,
    recentSearchesLoading: recentSearches.loading,
    eligible: availability.eligible,
    accessLoading: authLoading || availability.loading,
    totalVariants: variants?.domains.length ?? 0,
    hasMore: !!results && results.results.length < (variants?.domains.length ?? 0),
    submit: () => search(false),
    searchRecent: (value: string) => { void search(false, value); },
    clearRecentSearches: () => { void recentSearches.clearRecentSearches().catch(() => undefined); },
    loadMore: () => search(true),
  };
};
