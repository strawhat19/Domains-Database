import { AppState } from 'react-native';
import { connectionFields } from './types';
import { useAuth } from '../authContext/useAuth';
import { connectionsAPI } from '../../api/connections';
import { CONNECTIONS_STORAGE_KEY } from './service';
import { accountStorageKey } from '../authentication/userScope';
import { createContext, useEffect, useRef, useState, type ReactNode } from 'react';

interface ConnectionAvailability {
  error: string;
  loading: boolean;
  revision: number;
  eligible: boolean;
  hasConnections: boolean;
}

interface AvailabilityState extends Omit<ConnectionAvailability, `eligible`> {
  actorKey: string;
}

export const ConnectionAvailabilityContext = createContext<ConnectionAvailability | null>(null);

export const ConnectionAvailabilityProvider = ({ children }: { children: ReactNode }) => {
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

  useEffect(() => {
    let active = true;
    let operation = 0;
    let snapshotVersion = ``;
    const userId = user?.id;
    const isCurrent = (request: number) => active && request === operation && currentActor.current === actorKey;
    setState(current => ({ ...current, actorKey, error: ``, loading: !!userId || authLoading, hasConnections: false }));
    if (!userId || authLoading) return () => { active = false; };

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
  }, [actorKey, authLoading]);

  const currentView = state.actorKey === actorKey;
  const loading = authLoading || !currentView || state.loading;
  const hasConnections = currentView && !!user?.id && state.hasConnections;
  const value = {
    loading,
    hasConnections,
    revision: state.revision,
    eligible: !loading && hasConnections,
    error: currentView ? state.error : ``,
  };

  return <ConnectionAvailabilityContext.Provider value={value}>{children}</ConnectionAvailabilityContext.Provider>;
};
