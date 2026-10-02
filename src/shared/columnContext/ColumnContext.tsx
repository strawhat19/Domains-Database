import { Platform } from 'react-native';
import type { PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COLUMN_STORAGE_KEY, DEFAULT_VISIBLE_COLUMNS, PORTFOLIO_COLUMNS, type PortfolioColumn } from '../portfolioColumns';

interface ColumnContextValue {
  visibleColumns: PortfolioColumn[];
  resetColumns: () => void;
  toggleColumn: (column: PortfolioColumn) => void;
}

const readColumns = async () => {
  if (Platform.OS !== `web`) return AsyncStorage.getItem(COLUMN_STORAGE_KEY);
  return typeof window === `undefined` ? null : window.localStorage.getItem(COLUMN_STORAGE_KEY);
};

const saveColumns = async (columns: PortfolioColumn[]) => {
  const value = JSON.stringify(columns);
  if (Platform.OS !== `web`) return AsyncStorage.setItem(COLUMN_STORAGE_KEY, value);
  if (typeof window !== `undefined`) window.localStorage.setItem(COLUMN_STORAGE_KEY, value);
};

export const ColumnContext = createContext<ColumnContextValue | undefined>(undefined);

export const ColumnProvider = ({ children }: PropsWithChildren) => {
  const [ready, setReady] = useState(false);
  const preferenceChanged = useRef(false);
  const storageQueue = useRef<Promise<void>>(Promise.resolve());
  const [visibleColumns, setVisibleColumns] = useState<PortfolioColumn[]>(DEFAULT_VISIBLE_COLUMNS);

  useEffect(() => {
    let mounted = true;
    readColumns().then(saved => {
      if (!mounted || preferenceChanged.current || !saved) return;
      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed)) return;
      setVisibleColumns(PORTFOLIO_COLUMNS
        .filter(column => column.field === `name` || parsed.includes(column.field))
        .map(column => column.field));
    }).catch(() => undefined).finally(() => {
      if (mounted) setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    storageQueue.current = storageQueue.current
      .then(() => saveColumns(visibleColumns))
      .catch(() => undefined);
  }, [ready, visibleColumns]);

  const resetColumns = useCallback(() => {
    preferenceChanged.current = true;
    setVisibleColumns([...DEFAULT_VISIBLE_COLUMNS]);
  }, []);

  const toggleColumn = useCallback((column: PortfolioColumn) => {
    if (column === `name`) return;
    preferenceChanged.current = true;
    setVisibleColumns(current => PORTFOLIO_COLUMNS
      .filter(item => item.field === `name` || (item.field === column ? !current.includes(column) : current.includes(item.field)))
      .map(item => item.field));
  }, []);

  const value = useMemo(() => ({
    resetColumns,
    toggleColumn,
    visibleColumns,
  }), [resetColumns, toggleColumn, visibleColumns]);

  return (
    <ColumnContext.Provider value={value}>
      {children}
    </ColumnContext.Provider>
  );
};
