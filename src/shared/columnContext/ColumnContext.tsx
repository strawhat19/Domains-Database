import type { PropsWithChildren } from 'react';
import Toast from '../../components/Toast';
import { useDomains } from '../domainContext/useDomains';
import { subscribeAccountDataReset } from '../accountData/state';
import { portfolioStorageKey } from '../portfolioPreferences/storage';
import { readStorage, writeStorage, createOperationQueue } from '../common/storage';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COLUMN_STORAGE_KEY, PORTFOLIO_COLUMNS, getDefaultPortfolioColumns, type PortfolioColumn } from '../portfolioColumns';

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
const matchesColumns = (columns: readonly unknown[], defaults: readonly string[]) => columns.length === defaults.length
  && columns.every((field, index) => field === defaults[index]);
const isLegacyDefaultSelection = (columns: unknown[], version?: number) => {
  const previousDefaults = [`name`, `registrar`, `expiresAt`, `autoRenew`, `renewalPrice`, `renewalEstimate`, `websitePerformance`, `trancoRank`];
  if (matchesColumns(columns, previousDefaults)) return true;
  const insightColumns = [`websitePerformance`, `trancoRank`];
  const legacyDefaults = !version || version === 1 ? previousDefaults.filter(field => field !== `renewalEstimate` && !insightColumns.includes(field))
    : version === 2 ? previousDefaults.filter(field => !insightColumns.includes(field))
      : version === 3 ? [`name`, `registrar`, `expiresAt`, `autoRenew`, `renewalPrice`, `renewalEstimate`, `trancoRank`, `websitePerformance`]
        : previousDefaults;
  return matchesColumns(columns, legacyDefaults);
};
const normalizeWidths = (widths: unknown): Partial<Record<PortfolioColumn, number>> => {
  if (!widths || typeof widths !== `object` || Array.isArray(widths)) return {};
  return Object.fromEntries(Object.entries(widths)
    .filter(([field, width]) => columnFields.has(field as PortfolioColumn) && typeof width === `number` && Number.isFinite(width))
    .map(([field, width]) => [field, Math.max(72, Math.min(10000, Math.round(width as number)))]));
};

export const ColumnContext = createContext<ColumnContextValue | undefined>(undefined);

export const ColumnProvider = ({ children, enabled = true, userId = null }: PropsWithChildren<{ enabled?: boolean; userId?: string | null }>) => {
  const { domains, loading: domainsLoading } = useDomains();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(``);
  const storageReady = useRef(false);
  const revision = useRef(0);
  const active = useRef(enabled);
  if (!enabled) active.current = false;
  const preferenceChanged = useRef(false);
  const loadedUserId = useRef<string | null>(null);
  const storageQueue = useRef(createOperationQueue()).current;
  const [flexibleColumns, setFlexibleColumns] = useState<PortfolioColumn[]>([`name`]);
  const [columnWidths, updateColumnWidths] = useState<Partial<Record<PortfolioColumn, number>>>({});
  const [columnSelection, setColumnSelection] = useState<{ columns: PortfolioColumn[]; useDefaultColumns: boolean }>({ columns: [`name`], useDefaultColumns: true });
  const scopedReady = enabled && ready && !domainsLoading && loadedUserId.current === userId;
  const defaultColumns = useMemo(() => scopedReady ? getDefaultPortfolioColumns(domains) : [`name`] as PortfolioColumn[], [domains, scopedReady]);
  const visibleColumns = columnSelection.useDefaultColumns ? defaultColumns : columnSelection.columns;
  const serializedColumns = JSON.stringify({ version: 6, widths: columnWidths, columns: visibleColumns, flexibleColumns, useDefaultColumns: columnSelection.useDefaultColumns });

  useEffect(() => subscribeAccountDataReset(changedUserId => {
    if (changedUserId !== userId) return;
    active.current = false;
    revision.current += 1;
    loadedUserId.current = null;
    storageReady.current = false;
    setReady(false);
    setError(``);
  }), [userId]);

  useEffect(() => {
    let mounted = true;
    const run = ++revision.current;
    active.current = enabled;
    const capturedUserId = userId;
    setReady(false);
    setError(``);
    storageReady.current = false;
    loadedUserId.current = null;
    preferenceChanged.current = false;
    updateColumnWidths({});
    setFlexibleColumns([`name`]);
    setColumnSelection({ columns: [`name`], useDefaultColumns: true });
    if (!enabled) return () => { active.current = false; ++revision.current; };
    const isCurrent = () => mounted && active.current && run === revision.current;
    const read = readStorage(portfolioStorageKey(COLUMN_STORAGE_KEY, capturedUserId));
    read.then(saved => {
      if (!isCurrent() || preferenceChanged.current) return;
      if (!saved) { storageReady.current = true; return; }
      const parsed: unknown = JSON.parse(saved);
      if (!parsed || typeof parsed !== `object`) throw new Error(`Saved Column Preferences Could Not Be Read`);
      const version = `version` in parsed ? Number(parsed.version) : undefined;
      const savedColumns = Array.isArray(parsed) ? parsed
        : version && [1, 2, 3, 4, 5, 6].includes(version) && `columns` in parsed && Array.isArray(parsed.columns) ? parsed.columns : undefined;
      if (!savedColumns) throw new Error(`Saved Column Preferences Could Not Be Read`);
      const columns = normalizeColumns(savedColumns);
      const useDefaultColumns = version === 6 ? `useDefaultColumns` in parsed && parsed.useDefaultColumns === true : isLegacyDefaultSelection(savedColumns, version);
      setColumnSelection({ columns, useDefaultColumns });
      if (version && version >= 4 && `widths` in parsed) updateColumnWidths(normalizeWidths(parsed.widths));
      if (version && version >= 5 && `flexibleColumns` in parsed && Array.isArray(parsed.flexibleColumns)) setFlexibleColumns(normalizeColumnFields(parsed.flexibleColumns));
      storageReady.current = true;
    }).catch(reason => {
      if (isCurrent()) {
        active.current = false;
        setError(reason instanceof Error ? reason.message : `Could Not Load Column Preferences`);
      }
    }).finally(() => {
      if (mounted && enabled && run === revision.current) { loadedUserId.current = capturedUserId; setReady(true); }
    });
    return () => { mounted = false; active.current = false; ++revision.current; };
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled || !ready || !storageReady.current || !preferenceChanged.current || domainsLoading || loadedUserId.current !== userId) return;
    const run = revision.current;
    const capturedUserId = userId;
    void storageQueue(() => active.current && run === revision.current
      ? writeStorage(portfolioStorageKey(COLUMN_STORAGE_KEY, capturedUserId), serializedColumns)
      : Promise.resolve()).then(() => {
      if (active.current && run === revision.current) setError(``);
    }).catch(reason => {
      if (active.current && run === revision.current) setError(reason instanceof Error ? reason.message : `Could Not Save Column Preferences`);
    });
  }, [ready, enabled, userId, domainsLoading, serializedColumns, storageQueue]);

  const resetColumns = useCallback(() => {
    if (!enabled || !active.current || !ready || domainsLoading || loadedUserId.current !== userId) return;
    preferenceChanged.current = true;
    updateColumnWidths({});
    setFlexibleColumns([`name`]);
    setColumnSelection({ columns: defaultColumns, useDefaultColumns: true });
  }, [ready, userId, enabled, domainsLoading, defaultColumns]);

  const toggleColumn = useCallback((column: PortfolioColumn) => {
    if (!enabled || !active.current || !ready || domainsLoading || loadedUserId.current !== userId || column === `name` || !columnFields.has(column)) return;
    preferenceChanged.current = true;
    setColumnSelection(current => {
      const columns = current.useDefaultColumns ? defaultColumns : current.columns;
      return { useDefaultColumns: false, columns: columns.includes(column) ? columns.filter(field => field !== column) : [...columns, column] };
    });
  }, [ready, userId, enabled, domainsLoading, defaultColumns]);

  const toggleColumnFlex = useCallback((column: PortfolioColumn) => {
    if (!enabled || !active.current || !ready || domainsLoading || loadedUserId.current !== userId || !columnFields.has(column)) return;
    preferenceChanged.current = true;
    setFlexibleColumns(current => current.includes(column) ? current.filter(field => field !== column) : [...current, column]);
  }, [ready, userId, enabled, domainsLoading]);

  const moveColumn = useCallback((source: PortfolioColumn, target: PortfolioColumn) => {
    if (!enabled || !active.current || !ready || domainsLoading || loadedUserId.current !== userId || source === target || !columnFields.has(source) || !columnFields.has(target)) return;
    preferenceChanged.current = true;
    setColumnSelection(current => {
      const columns = current.useDefaultColumns ? defaultColumns : current.columns;
      const sourceIndex = columns.indexOf(source);
      const targetIndex = columns.indexOf(target);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const reorderedColumns = [...columns];
      reorderedColumns.splice(sourceIndex, 1);
      reorderedColumns.splice(targetIndex, 0, source);
      return { columns: reorderedColumns, useDefaultColumns: false };
    });
  }, [ready, userId, enabled, domainsLoading, defaultColumns]);

  const resizeColumn = useCallback((column: PortfolioColumn, width: number) => {
    if (!enabled || !active.current || !ready || domainsLoading || loadedUserId.current !== userId || !columnFields.has(column) || !Number.isFinite(width)) return;
    preferenceChanged.current = true;
    const nextWidth = Math.max(72, Math.min(10000, Math.round(width)));
    setFlexibleColumns(current => current.includes(column) ? current.filter(field => field !== column) : current);
    updateColumnWidths(current => current[column] === nextWidth ? current : { ...current, [column]: nextWidth });
  }, [ready, userId, enabled, domainsLoading]);

  const setColumnWidths = useCallback((widths: Partial<Record<PortfolioColumn, number>>) => {
    if (!enabled || !active.current || !ready || domainsLoading || loadedUserId.current !== userId) return;
    preferenceChanged.current = true;
    setFlexibleColumns([]);
    updateColumnWidths(normalizeWidths(widths));
  }, [ready, userId, enabled, domainsLoading]);

  const value = useMemo(() => ({
    loading: !scopedReady,
    moveColumn,
    resetColumns,
    resizeColumn,
    toggleColumn,
    setColumnWidths,
    toggleColumnFlex,
    columnWidths: scopedReady ? columnWidths : {},
    flexibleColumns: scopedReady ? flexibleColumns : [],
    visibleColumns: scopedReady ? visibleColumns : defaultColumns,
  }), [scopedReady, defaultColumns, moveColumn, resetColumns, resizeColumn, toggleColumn, columnWidths, visibleColumns, flexibleColumns, setColumnWidths, toggleColumnFlex]);

  return (
    <ColumnContext.Provider value={value}>
      {children}
      <Toast id={`column-preferences-error`} message={enabled ? error : ``} onDismiss={() => setError(``)} />
    </ColumnContext.Provider>
  );
};
