import { useMemo, useState, useEffect, useRef } from 'react';
import { domainAuctionAPI } from '../../api/domainAuction';
import { persistenceEnabled } from '../../shared/config';
import { useAuth } from '../../shared/authContext/useAuth';
import { defaultAuctionFilters } from '../../shared/domainAuction/values';
import type { AuctionRecord, AuctionFilters } from '../../shared/domainAuction/types';
import { filterAuctionRecords, getAuctionFilterCount } from '../../shared/domainAuction/filter';

export const useDomainAuction = () => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const actorKey = authLoading ? `pending` : userId ?? `guest`;
  const currentActor = useRef(actorKey);
  currentActor.current = actorKey;
  const request = useRef(0);
  const [error, setError] = useState(``);
  const [notice, setNotice] = useState(``);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState(``);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [records, setRecords] = useState<AuctionRecord[]>([]);
  const [filters, setFilters] = useState<AuctionFilters>({ ...defaultAuctionFilters });
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    setBusy(false);
    setNotice(``);
  }, [actorKey]);

  useEffect(() => {
    const current = ++request.current;
    setLoading(true);
    setError(``);
    setRecords([]);
    if (authLoading && !preview) return () => { ++request.current; };
    const isCurrent = () => request.current === current && currentActor.current === actorKey;
    const accept = (result: AuctionRecord[]) => {
      if (!isCurrent()) return false;
      setRecords(result);
      setError(``);
      setLoading(false);
    };
    const fail = (reason: unknown) => {
      if (!isCurrent()) return;
      setLoading(false);
      setError(reason instanceof Error ? reason.message : `Auction Data Could Not Be Loaded`);
    };
    if (preview) {
      void domainAuctionAPI.getPreview().then(accept).catch(fail);
      return () => { ++request.current; };
    }
    const unsubscribe = domainAuctionAPI.subscribeListings(userId, accept, fail);
    return () => { ++request.current; unsubscribe(); };
  }, [userId, preview, revision, actorKey, authLoading]);

  const matchingRecords = useMemo(() => filterAuctionRecords(records, filters), [records, filters]);
  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(matchingRecords.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * pageSize;
  const visibleRecords = matchingRecords.slice(offset, offset + pageSize);
  useEffect(() => { setPage(1); }, [filters, records]);
  const filterCount = getAuctionFilterCount(filters);
  const updateFilter = <Key extends keyof AuctionFilters>(key: Key, value: AuctionFilters[Key]) => {
    setFilters(current => ({ ...current, [key]: value }));
  };
  const resetFilters = () => setFilters({ ...defaultAuctionFilters });
  const importInventory = async (text = importText) => {
    if (busy || loading) return;
    const capturedActor = actorKey;
    setBusy(true);
    setError(``);
    setNotice(``);
    try {
      const result = await domainAuctionAPI.importInventory(text);
      if (currentActor.current !== capturedActor) return;
      setPreview(false);
      setRecords(result.records);
      setImportText(``);
      setImportOpen(false);
      resetFilters();
      setNotice(`${result.importedCount} Auction Domain(s) Imported${result.skippedCount ? ` · ${result.skippedCount} Unsupported Record(s) Skipped` : ``}`);
    } catch (reason) {
      if (currentActor.current === capturedActor) setError(reason instanceof Error ? reason.message : `Auction Import Failed`);
    } finally { if (currentActor.current === capturedActor) setBusy(false); }
  };
  const clearInventory = async () => {
    if (busy || loading || preview) return;
    const capturedActor = actorKey;
    setBusy(true);
    setError(``);
    try {
      await domainAuctionAPI.clearInventory();
      if (currentActor.current !== capturedActor) return;
      setRecords([]);
      setNotice(`Imported Auction Inventory Cleared`);
    } catch (reason) {
      if (currentActor.current === capturedActor) setError(reason instanceof Error ? reason.message : `Auction Inventory Could Not Be Cleared`);
    } finally { if (currentActor.current === capturedActor) setBusy(false); }
  };

  return {
    error,
    busy,
    notice,
    filters,
    loading,
    preview,
    records,
    advanced,
    currentPage,
    pageCount,
    importOpen,
    importText,
    filterCount,
    setPreview,
    setAdvanced,
    setImportText,
    setImportOpen,
    updateFilter,
    resetFilters,
    clearInventory,
    importInventory,
    visibleRecords,
    previousPage: () => setPage(current => Math.max(1, current - 1)),
    nextPage: () => setPage(current => Math.min(pageCount, current + 1)),
    matchingCount: matchingRecords.length,
    resultStart: matchingRecords.length ? offset + 1 : 0,
    resultEnd: Math.min(offset + pageSize, matchingRecords.length),
    clearError: () => setError(``),
    reportError: setError,
    clearNotice: () => setNotice(``),
    reloadListings: () => { setPreview(false); setRevision(current => current + 1); },
    storageMessage: persistenceEnabled ? `Imported inventory is saved as a snapshot.` : `Connect a backend to save auction inventory.`,
  };
};
