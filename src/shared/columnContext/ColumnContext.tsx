import type { PropsWithChildren } from 'react';
import { portfolioStorageKey } from '../portfolioPreferences/storage';
import { readStorage, writeStorage, createOperationQueue } from '../common/storage';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COLUMN_STORAGE_KEY, DEFAULT_VISIBLE_COLUMNS, PORTFOLIO_COLUMNS, type PortfolioColumn } from '../portfolioColumns';

interface ColumnContextValue {
  visibleColumns: PortfolioColumn[];
  resetColumns: () => void;
  toggleColumn: (column: PortfolioColumn) => void;
}

export const ColumnContext = createContext<ColumnContextValue | undefined>(undefined);

export const ColumnProvider = ({ children, userId = null }: PropsWithChildren<{ userId?: string | null }>) => {
  const [ready, setReady] = useState(false);
  const preferenceChanged = useRef(false);
  const loadedUserId = useRef<string | null>(null);
  const storageQueue = useRef(createOperationQueue()).current;
  const [visibleColumns, setVisibleColumns] = useState<PortfolioColumn[]>(DEFAULT_VISIBLE_COLUMNS);

  useEffect(() => {
    let mounted = true;
    const capturedUserId = userId;
    setReady(false);
    loadedUserId.current = null;
    preferenceChanged.current = false;
    setVisibleColumns([...DEFAULT_VISIBLE_COLUMNS]);
    const read = readStorage(portfolioStorageKey(COLUMN_STORAGE_KEY, capturedUserId));
    read.then(saved => {
      if (!mounted || preferenceChanged.current || !saved) return;
      const parsed: unknown = JSON.parse(saved);
      if (!parsed || typeof parsed !== `object`) return;
      const insightColumns = [`websitePerformance`, `trancoRank`];
      const savedColumns = Array.isArray(parsed) ? [...parsed, `renewalEstimate`, ...insightColumns]
        : `version` in parsed && [2, 3].includes(Number(parsed.version)) && `columns` in parsed && Array.isArray(parsed.columns)
          ? parsed.version === 2 ? [...parsed.columns, ...insightColumns] : parsed.columns : undefined;
      if (!savedColumns) return;
      setVisibleColumns(PORTFOLIO_COLUMNS
        .filter(column => column.field === `name` || savedColumns.includes(column.field))
        .map(column => column.field));
    }).catch(() => undefined).finally(() => {
      if (mounted) { loadedUserId.current = capturedUserId; setReady(true); }
    });
    return () => { mounted = false; };
  }, [userId]);

  useEffect(() => {
    if (!ready || loadedUserId.current !== userId) return;
    const capturedUserId = userId;
    const columns = JSON.stringify({ version: 3, columns: visibleColumns });
    void storageQueue(() => writeStorage(portfolioStorageKey(COLUMN_STORAGE_KEY, capturedUserId), columns)).catch(() => undefined);
  }, [ready, userId, visibleColumns, storageQueue]);

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
