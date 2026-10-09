import { AppState } from 'react-native';
import { connectionFields } from './types';
import { useAuth } from '../authContext/useAuth';
import { connectionsAPI } from '../../api/connections';
import { CONNECTIONS_STORAGE_KEY } from './service';
import { accountStorageKey } from '../authentication/userScope';
import { getServerSearchProviders } from '../domainSearch/availability';
import { createContext, useEffect, useRef, useState, type ReactNode } from 'react';

interface ConnectionAvailability {
  error: string;
  loading: boolean;
  revision: number;
  eligible: boolean;
  hasConnections: boolean;
  hasServerConnections: boolean;
}

interface AvailabilityState extends Omit<ConnectionAvailability, `eligible` | `hasServerConnections`> {
  actorKey: string;
}

interface ServerAvailabilityState {
  error: string;
  loading: boolean;
  revision: number;
  hasConnections: boolean;
}

export const ConnectionAvailabilityContext = createContext<ConnectionAvailability | null>(null);

export const ConnectionAvailabilityProvider = ({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) => {
  const { user, loading: authLoading, loginRevision } = useAuth();
  const actorKey = `${user?.id ?? `guest`}:${loginRevision}`;
  const currentActor = useRef(actorKey);
  currentActor.current = actorKey;
  const [state, setState] = useState<AvailabilityState>({
    error: ``,
    revision: 0,
    actorKey,
    loading: true,
    hasConnections: false,
  });
  const [serverState, setServerState] = useState<ServerAvailabilityState>({
    error: ``,
    revision: 0,
    loading: true,
    hasConnections: false,
  });

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let operation = 0;
    let snapshotVersion = ``;
    let controller: AbortController | undefined;
    const isCurrent = (request: number) => active && request === operation;
    const refresh = () => {
      const request = ++operation;
      controller?.abort();
      const requestController = new AbortController();
      controller = requestController;
      void getServerSearchProviders(requestController.signal).then(providers => {
        if (!isCurrent(request) || requestController.signal.aborted) return;
        const version = [...new Set(providers)].sort().join(`,`);
        const changed = version !== snapshotVersion;
        snapshotVersion = version;
        setServerState(current => ({
          error: ``,
          loading: false,
          hasConnections: providers.length > 0,
          revision: current.revision + Number(changed),
        }));
      }).catch(failure => {
        if (!isCurrent(request) || requestController.signal.aborted) return;
        const error = failure instanceof Error ? failure.message : `Could Not Load Public Search Providers`;
        const changed = snapshotVersion !== `error:${error}`;
        snapshotVersion = `error:${error}`;
        setServerState(current => ({
          error,
          loading: false,
          hasConnections: false,
          revision: current.revision + Number(changed),
        }));
      });
    };

    refresh();
    const subscription = AppState.addEventListener(`change`, status => { if (status === `active`) refresh(); });
    if (typeof window !== `undefined`) window.addEventListener(`focus`, refresh);
    return () => {
      active = false;
      controller?.abort();
      subscription.remove();
      if (typeof window !== `undefined`) window.removeEventListener(`focus`, refresh);
    };
  }, [enabled]);

  useEffect(() => {
    let active = true;
    let operation = 0;
    let snapshotVersion = ``;
    const userId = user?.id;
    const isCurrent = (request: number) => active && request === operation && currentActor.current === actorKey;
    setState(current => ({ ...current, actorKey, error: ``, loading: !!userId || authLoading, hasConnections: false }));
    if (!enabled || !userId || authLoading) return () => { active = false; };

    const refresh = (invalidate = false) => {
      const request = ++operation;
      if (invalidate) setState(current => ({ ...current, loading: true }));
      void connectionsAPI.getConnections(userId).then(snapshot => {
        if (!isCurrent(request) || snapshot.userId !== userId) return;
        const hasConnections = connectionFields.some(field => field.search && !!snapshot.values?.[field.id]?.trim());
        const version = `${snapshot.updated}:${hasConnections}`;
        const changed = version !== snapshotVersion;
        snapshotVersion = version;
        setState(current => ({ actorKey, hasConnections, error: ``, loading: false, revision: current.revision + Number(changed) }));
      }).catch(failure => {
        if (!isCurrent(request)) return;
        const error = failure instanceof Error ? failure.message : `Could Not Load Connections`;
        const changed = snapshotVersion !== `error:${error}`;
        snapshotVersion = `error:${error}`;
        setState(current => ({ actorKey, error, loading: false, hasConnections: false, revision: current.revision + Number(changed) }));
      });
    };

    refresh();
    const unsubscribe = connectionsAPI.subscribeConnections(changedUserId => {
      if (changedUserId === userId) refresh(true);
    });
    const resume = () => refresh();
    const storageKey = accountStorageKey(CONNECTIONS_STORAGE_KEY, userId);
    const storageChanged = (event: StorageEvent) => {
      if (event.key === null || event.key === storageKey) refresh(true);
    };
    const subscription = AppState.addEventListener(`change`, status => { if (status === `active`) resume(); });
    if (typeof window !== `undefined`) {
      window.addEventListener(`focus`, resume);
      window.addEventListener(`storage`, storageChanged);
    }
    return () => {
      active = false;
      unsubscribe();
      subscription.remove();
      if (typeof window !== `undefined`) {
        window.removeEventListener(`focus`, resume);
        window.removeEventListener(`storage`, storageChanged);
      }
    };
  }, [enabled, actorKey, authLoading]);

  const currentView = state.actorKey === actorKey;
  const privateLoading = !enabled || authLoading || !currentView || state.loading;
  const hasConnections = enabled && currentView && !!user?.id && state.hasConnections;
  const hasServerConnections = enabled && serverState.hasConnections;
  const eligible = hasServerConnections || (!privateLoading && hasConnections);
  const loading = !eligible && (serverState.loading || privateLoading);
  const error = !eligible && !loading
    ? [serverState.error, currentView ? state.error : ``].filter(Boolean).join(`; `)
    : ``;
  const value = {
    error,
    loading,
    eligible,
    hasConnections,
    hasServerConnections,
    revision: state.revision + serverState.revision,
  };

  return <ConnectionAvailabilityContext.Provider value={value}>{children}</ConnectionAvailabilityContext.Provider>;
};
