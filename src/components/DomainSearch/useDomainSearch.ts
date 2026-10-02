import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../shared/authContext/useAuth';
import { normalizeDomainName } from '../../shared/domainUtils';
import type { DomainSearchResults } from '../../shared/domainSearch/types';
import { searchConnectedDomains } from '../../shared/domainSearch/client';

interface SearchState {
  query: string;
  error: string;
  loading: boolean;
  actorKey: string;
  results: DomainSearchResults | null;
}

export const useDomainSearch = () => {
  const { user, loginRevision, loading: authLoading } = useAuth();
  const actorKey = `${user?.id ?? `guest`}:${loginRevision}`;
  const currentActor = useRef(actorKey);
  const mounted = useRef(false);
  const revision = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const [state, setState] = useState<SearchState>({ actorKey, query: ``, error: ``, loading: false, results: null });
  currentActor.current = actorKey;
  const visible = state.actorKey === actorKey;
  const query = visible ? state.query : ``;
  const error = visible ? state.error : ``;
  const results = visible ? state.results : null;
  const loading = visible && state.loading;

  useEffect(() => {
    mounted.current = true;
    controller.current?.abort();
    controller.current = null;
    revision.current += 1;
    setState({ actorKey, query: ``, error: ``, loading: false, results: null });
    return () => {
      mounted.current = false;
      revision.current += 1;
      controller.current?.abort();
      controller.current = null;
    };
  }, [actorKey]);

  const setQuery = (value: string) => {
    if (!mounted.current || currentActor.current !== actorKey) return;
    revision.current += 1;
    controller.current?.abort();
    controller.current = null;
    setState({ actorKey, query: value, error: ``, loading: false, results: null });
  };

  const clear = () => setQuery(``);

  const submit = async () => {
    if (authLoading || loading || !mounted.current || currentActor.current !== actorKey) return;
    if (!user?.id) {
      setState(current => ({ ...current, actorKey, error: `Sign In To Search Your Connected Registrars` }));
      return;
    }
    let domain: string;
    try {
      domain = normalizeDomainName(query);
    } catch (failure) {
      setState(current => ({ ...current, actorKey, error: failure instanceof Error ? failure.message : `Enter A Valid Domain Name` }));
      return;
    }
    controller.current?.abort();
    const request = new AbortController();
    const requestRevision = ++revision.current;
    controller.current = request;
    const isCurrent = () => mounted.current && currentActor.current === actorKey
      && revision.current === requestRevision && !request.signal.aborted;
    setState({ actorKey, query: domain, error: ``, loading: true, results: null });
    try {
      const result = await searchConnectedDomains(domain, request.signal, user.id);
      if (isCurrent()) setState(current => isCurrent() ? { ...current, results: result } : current);
    } catch (failure) {
      if (isCurrent()) setState(current => isCurrent() ? {
        ...current, error: failure instanceof Error ? failure.message : `Could Not Check Domain Availability`,
      } : current);
    } finally {
      if (isCurrent()) setState(current => isCurrent() ? { ...current, loading: false } : current);
      if (controller.current === request) controller.current = null;
    }
  };

  return { user, query, error, results, loading, authLoading, clear, submit, setQuery };
};
