import { useState, useEffect, useContext, useCallback, createContext, useSyncExternalStore, type PropsWithChildren } from 'react';

export interface BackgroundProgressTask {
  id: string;
  label: string;
  total?: number;
  detail?: string;
  completed?: number;
  status: `running` | `complete` | `error`;
}

export type BackgroundProgressUpdate = { total?: number; completed?: number; error?: string; done?: boolean };
const noTasks: readonly BackgroundProgressTask[] = [];
const getServerSnapshot = () => noTasks;

const createProgressStore = () => {
  let sequence = 0;
  let snapshot = noTasks;
  const listeners = new Set<() => void>();
  const tasks = new Map<string, { owner: symbol; task: BackgroundProgressTask }>();
  const publish = () => {
    snapshot = [...tasks.values()].map(({ task }) => task);
    listeners.forEach(listener => listener());
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    update: (key: string, label: string, owner: symbol, update: BackgroundProgressUpdate | null) => {
      const current = tasks.get(key);
      if (!update) {
        if (current?.owner === owner) { tasks.delete(key); publish(); }
        return;
      }
      const status = update.error ? `error` : update.done ? `complete` : `running`;
      const previous = current?.owner === owner && (current.task.status === `running` || current.task.status === status) ? current.task : undefined;
      const total = update.total ?? previous?.total;
      const completed = status === `complete` ? total ?? 1 : update.completed ?? previous?.completed;
      if (current?.owner === owner && current.task.status === status && current.task.total === total
        && current.task.completed === completed && current.task.detail === update.error) return;
      tasks.set(key, { owner, task: {
        label, total, status, completed, detail: update.error,
        id: previous?.id ?? `${key}-${++sequence}`,
      } });
      publish();
    },
  };
};

const ProgressStoreContext = createContext<ReturnType<typeof createProgressStore> | null>(null);
const inactiveStore = createProgressStore();

export const BackgroundProgressProvider = ({ children }: PropsWithChildren) => {
  const [store] = useState(createProgressStore);
  return <ProgressStoreContext.Provider value={store}>{children}</ProgressStoreContext.Provider>;
};

export const useBackgroundProgressReporter = (key: string, label: string) => {
  const store = useContext(ProgressStoreContext);
  const [owner] = useState(() => Symbol(key));
  const report = useCallback((update: BackgroundProgressUpdate | null) => store?.update(key, label, owner, update), [store, key, label, owner]);
  useEffect(() => () => report(null), [report]);
  return report;
};

export const useBackgroundProgressTasks = () => {
  const store = useContext(ProgressStoreContext) ?? inactiveStore;
  return useSyncExternalStore(store.subscribe, store.getSnapshot, getServerSnapshot);
};
