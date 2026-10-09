import type { PropsWithChildren } from 'react';
import { portfolioStorageKey } from '../portfolioPreferences/storage';
import { readStorage, writeStorage, createOperationQueue } from '../common/storage';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COLUMN_STORAGE_KEY, DEFAULT_VISIBLE_COLUMNS, PORTFOLIO_COLUMNS, type PortfolioColumn } from '../portfolioColumns';

interface ColumnContextValue {
  loading: boolean;
  resetColumns: () => void;
  visibleColumns: PortfolioColumn[];
  flexibleColumns: PortfolioColumn[];
  toggleColumn: (column: PortfolioColumn) => void;
  columnWidths: Partial<Record<PortfolioColumn, number>>;
  toggleColumnFlex: (column: PortfolioColumn) => void;
  resizeColumn: (column: PortfolioColumn, width: number) => void;
  moveColumn: (source: PortfolioColumn, target: PortfolioColumn) => void;
  setColumnWidths: (widths: Partial<Record<PortfolioColumn, number>>) => void;
}

const columnFields = new Set(PORTFOLIO_COLUMNS.map(column => column.field));
const normalizeColumnFields = (columns: unknown[]): PortfolioColumn[] => [...new Set(columns
  .filter((field): field is PortfolioColumn => typeof field === `string` && columnFields.has(field as PortfolioColumn)))];
const normalizeColumns = (columns: unknown[]): PortfolioColumn[] => {
  const orderedColumns = normalizeColumnFields(columns);
  return orderedColumns.includes(`name`) ? orderedColumns : [`name`, ...orderedColumns];
};
const normalizeWidths = (widths: unknown): Partial<Record<PortfolioColumn, number>> => {
  if (!widths || typeof widths !== `object` || Array.isArray(widths)) return {};
  return Object.fromEntries(Object.entries(widths)
    .filter(([field, width]) => columnFields.has(field as PortfolioColumn) && typeof width === `number` && Number.isFinite(width))
    .map(([field, width]) => [field, Math.max(72, Math.min(10000, Math.round(width as number)))]));
};

export const ColumnContext = createContext<ColumnContextValue | undefined>(undefined);

export const ColumnProvider = ({ children, enabled = true, userId = null }: PropsWithChildren<{ enabled?: boolean; userId?: string | null }>) => {
  const [ready, setReady] = useState(false);
  const revision = useRef(0);
  const active = useRef(enabled);
  active.current = enabled;
  const preferenceChanged = useRef(false);
  const loadedUserId = useRef<string | null>(null);
  const storageQueue = useRef(createOperationQueue()).current;
  const [flexibleColumns, setFlexibleColumns] = useState<PortfolioColumn[]>([]);
  const [columnWidths, updateColumnWidths] = useState<Partial<Record<PortfolioColumn, number>>>({});
  const [visibleColumns, setVisibleColumns] = useState<PortfolioColumn[]>(DEFAULT_VISIBLE_COLUMNS);

  useEffect(() => {
    let mounted = true;
    const run = ++revision.current;
    active.current = enabled;
    const capturedUserId = userId;
    setReady(false);
    loadedUserId.current = null;
    preferenceChanged.current = false;
    updateColumnWidths({});
    setFlexibleColumns([]);
    setVisibleColumns([...DEFAULT_VISIBLE_COLUMNS]);
    if (!enabled) return () => { active.current = false; ++revision.current; };
    const isCurrent = () => mounted && active.current && run === revision.current;
    const read = readStorage(portfolioStorageKey(COLUMN_STORAGE_KEY, capturedUserId));
    read.then(saved => {
      if (!isCurrent() || preferenceChanged.current || !saved) return;
      const parsed: unknown = JSON.parse(saved);
      if (!parsed || typeof parsed !== `object`) return;
      const insightColumns = [`websitePerformance`, `trancoRank`];
      const version = `version` in parsed ? Number(parsed.version) : undefined;
      const savedColumns = Array.isArray(parsed) ? [...parsed, `renewalEstimate`, ...insightColumns]
        : version && [2, 3, 4, 5].includes(version) && `columns` in parsed && Array.isArray(parsed.columns)
          ? version === 2 ? [...parsed.columns, ...insightColumns] : parsed.columns : undefined;
      if (!savedColumns) return;
      setVisibleColumns(version && version >= 4 ? normalizeColumns(savedColumns) : PORTFOLIO_COLUMNS
        .filter(column => column.field === `name` || savedColumns.includes(column.field))
        .map(column => column.field));
      if (version && version >= 4 && `widths` in parsed) updateColumnWidths(normalizeWidths(parsed.widths));
      if (version === 5 && `flexibleColumns` in parsed && Array.isArray(parsed.flexibleColumns)) setFlexibleColumns(normalizeColumnFields(parsed.flexibleColumns));
    }).catch(() => undefined).finally(() => {
      if (isCurrent()) { loadedUserId.current = capturedUserId; setReady(true); }
    });
    return () => { mounted = false; active.current = false; ++revision.current; };
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled || !ready || loadedUserId.current !== userId) return;
    const run = revision.current;
    const capturedUserId = userId;
    const columns = JSON.stringify({ version: 5, widths: columnWidths, columns: visibleColumns, flexibleColumns });
    void storageQueue(() => active.current && run === revision.current
      ? writeStorage(portfolioStorageKey(COLUMN_STORAGE_KEY, capturedUserId), columns)
      : Promise.resolve()).catch(() => undefined);
  }, [ready, enabled, userId, columnWidths, visibleColumns, flexibleColumns, storageQueue]);

  const resetColumns = useCallback(() => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId) return;
    preferenceChanged.current = true;
    updateColumnWidths({});
    setFlexibleColumns([]);
    setVisibleColumns([...DEFAULT_VISIBLE_COLUMNS]);
  }, [ready, userId, enabled]);

  const toggleColumn = useCallback((column: PortfolioColumn) => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId || column === `name` || !columnFields.has(column)) return;
    preferenceChanged.current = true;
    setVisibleColumns(current => current.includes(column) ? current.filter(field => field !== column) : [...current, column]);
  }, [ready, userId, enabled]);

  const toggleColumnFlex = useCallback((column: PortfolioColumn) => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId || !columnFields.has(column)) return;
    preferenceChanged.current = true;
    setFlexibleColumns(current => current.includes(column) ? current.filter(field => field !== column) : [...current, column]);
  }, [ready, userId, enabled]);

  const moveColumn = useCallback((source: PortfolioColumn, target: PortfolioColumn) => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId || source === target || !columnFields.has(source) || !columnFields.has(target)) return;
    preferenceChanged.current = true;
    setVisibleColumns(current => {
      const sourceIndex = current.indexOf(source);
      const targetIndex = current.indexOf(target);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const columns = [...current];
      columns.splice(sourceIndex, 1);
      columns.splice(targetIndex, 0, source);
      return columns;
    });
  }, [ready, userId, enabled]);

  const resizeColumn = useCallback((column: PortfolioColumn, width: number) => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId || !columnFields.has(column) || !Number.isFinite(width)) return;
    preferenceChanged.current = true;
    const nextWidth = Math.max(72, Math.min(10000, Math.round(width)));
    setFlexibleColumns(current => current.includes(column) ? current.filter(field => field !== column) : current);
    updateColumnWidths(current => current[column] === nextWidth ? current : { ...current, [column]: nextWidth });
  }, [ready, userId, enabled]);

  const setColumnWidths = useCallback((widths: Partial<Record<PortfolioColumn, number>>) => {
    if (!enabled || !active.current || !ready || loadedUserId.current !== userId) return;
    preferenceChanged.current = true;
    setFlexibleColumns([]);
    updateColumnWidths(normalizeWidths(widths));
  }, [ready, userId, enabled]);

  const value = useMemo(() => ({
    loading: !enabled || !ready || loadedUserId.current !== userId,
    moveColumn,
    resetColumns,
    resizeColumn,
    toggleColumn,
    setColumnWidths,
    toggleColumnFlex,
    columnWidths: enabled && ready && loadedUserId.current === userId ? columnWidths : {},
    flexibleColumns: enabled && ready && loadedUserId.current === userId ? flexibleColumns : [],
    visibleColumns: enabled && ready && loadedUserId.current === userId ? visibleColumns : DEFAULT_VISIBLE_COLUMNS,
  }), [ready, enabled, userId, moveColumn, resetColumns, resizeColumn, toggleColumn, columnWidths, visibleColumns, flexibleColumns, setColumnWidths, toggleColumnFlex]);

  return (
    <ColumnContext.Provider value={value}>
      {children}
    </ColumnContext.Provider>
  );
};
