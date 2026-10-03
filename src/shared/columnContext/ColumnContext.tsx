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

export const ColumnProvider = ({ children, enabled = true, userId = null }: PropsWithChildren<{ enabled?: boolean; userId?: string | null }>) => {
  const [ready, setReady] = useState(false);
  const revision = useRef(0);
  const active = useRef(enabled);
  active.current = enabled;
  const preferenceChanged = useRef(false);
  const loadedUserId = useRef<string | null>(null);
  const storageQueue = useRef(createOperationQueue()).current;
  const [visibleColumns, setVisibleColumns] = useState<PortfolioColumn[]>(DEFAULT_VISIBLE_COLUMNS);

  useEffect(() => {
    let mounted = true;
    const run = ++revision.current;
    active.current = enabled;
    const capturedUserId = userId;
    setReady(false);
    loadedUserId.current = null;
    preferenceChanged.current = false;
    setVisibleColumns([...DEFAULT_VISIBLE_COLUMNS]);
    if (!enabled) return () => { active.current = false; ++revision.current; };
    const isCurrent = () => mounted && active.current && run === revision.current;
    const read = readStorage(portfolioStorageKey(COLUMN_STORAGE_KEY, capturedUserId));
    read.then(saved => {
      if (!isCurrent() || preferenceChanged.current || !saved) return;
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
      if (isCurrent()) { loadedUserId.current = capturedUserId; setReady(true); }
    });
    return () => { mounted = false; active.current = false; ++revision.current; };
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled || !ready || loadedUserId.current !== userId) return;
    const run = revision.current;
    const capturedUserId = userId;
    const columns = JSON.stringify({ version: 3, columns: visibleColumns });
    void storageQueue(() => active.current && run === revision.current
      ? writeStorage(portfolioStorageKey(COLUMN_STORAGE_KEY, capturedUserId), columns)
      : Promise.resolve()).catch(() => undefined);
  }, [ready, enabled, userId, visibleColumns, storageQueue]);

  const resetColumns = useCallback(() => {
    if (!enabled || !active.current) return;
    preferenceChanged.current = true;
    setVisibleColumns([...DEFAULT_VISIBLE_COLUMNS]);
  }, [enabled]);

  const toggleColumn = useCallback((column: PortfolioColumn) => {
    if (!enabled || !active.current || column === `name`) return;
    preferenceChanged.current = true;
    setVisibleColumns(current => PORTFOLIO_COLUMNS
      .filter(item => item.field === `name` || (item.field === column ? !current.includes(column) : current.includes(item.field)))
      .map(item => item.field));
  }, [enabled]);

  const value = useMemo(() => ({
    resetColumns,
    toggleColumn,
    visibleColumns: enabled && ready && loadedUserId.current === userId ? visibleColumns : DEFAULT_VISIBLE_COLUMNS,
  }), [ready, enabled, userId, resetColumns, toggleColumn, visibleColumns]);

  return (
    <ColumnContext.Provider value={value}>
      {children}
    </ColumnContext.Provider>
  );
};
