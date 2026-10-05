import { useMemo, useState, useEffect, useRef } from 'react';
import { domainAuctionAPI } from '../../api/domainAuction';
import { useLocalStorage } from '../../shared/config';
import { defaultAuctionFilters } from '../../shared/domainAuction/values';
import type { AuctionRecord, AuctionFilters } from '../../shared/domainAuction/types';
import { filterAuctionRecords, getAuctionFilterCount } from '../../shared/domainAuction/filter';

export const useDomainAuction = () => {
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
    const current = ++request.current;
    setLoading(true);
    setError(``);
    setRecords([]);
    const operation = preview ? domainAuctionAPI.getPreview() : domainAuctionAPI.getListings();
    void operation.then(result => {
      if (request.current === current) setRecords(result);
    }).catch((reason: unknown) => {
      if (request.current === current) setError(reason instanceof Error ? reason.message : `Auction Data Could Not Be Loaded`);
    }).finally(() => {
      if (request.current === current) setLoading(false);
    });
    return () => { ++request.current; };
  }, [preview, revision]);

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
    setBusy(true);
    setError(``);
    setNotice(``);
    try {
      const result = await domainAuctionAPI.importInventory(text);
      setPreview(false);
      setRecords(result.records);
      setImportText(``);
      setImportOpen(false);
      resetFilters();
      setRevision(current => current + 1);
      setNotice(`${result.importedCount} Auction Domain(s) Imported${result.skippedCount ? ` · ${result.skippedCount} Unsupported Record(s) Skipped` : ``}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `Auction Import Failed`);
    } finally { setBusy(false); }
  };
  const clearInventory = async () => {
    if (busy || loading || preview) return;
    setBusy(true);
    setError(``);
    try {
      await domainAuctionAPI.clearInventory();
      setRecords([]);
      setNotice(`Imported Auction Inventory Cleared`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `Auction Inventory Could Not Be Cleared`);
    } finally { setBusy(false); }
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
    storageMessage: useLocalStorage ? `Imported inventory is saved on this device.` : `Connect a backend to save auction inventory.`,
  };
};
