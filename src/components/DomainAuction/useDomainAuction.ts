import { useMemo, useState, useEffect, useRef } from 'react';
import { domainAuctionAPI } from '../../api/domainAuction';
import { persistenceEnabled } from '../../shared/config';
import { useAuth } from '../../shared/authContext/useAuth';
import { defaultAuctionFilters } from '../../shared/domainAuction/values';
import type { AuctionRecord, AuctionFilters, AuctionFeedSnapshot } from '../../shared/domainAuction/types';
import { filterAuctionRecords, getAuctionFilterCount } from '../../shared/domainAuction/filter';

type AuctionMode = `feed` | `saved` | `preview`;
interface SavedInventory {
  actor: string;
  error: string;
  loading: boolean;
  records: AuctionRecord[];
}

export const useDomainAuction = () => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const actorKey = authLoading ? `pending` : userId ?? `guest`;
  const currentActor = useRef(actorKey);
  currentActor.current = actorKey;
  const savedRequest = useRef(0);
  const feedRequest = useRef(0);
  const mutationRequest = useRef(0);
  const pendingMutation = useRef<number | null>(null);
  const feedController = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const [actionError, setActionError] = useState(``);
  const [feedError, setFeedError] = useState(``);
  const [previewError, setPreviewError] = useState(``);
  const [notice, setNotice] = useState(``);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState(``);
  const [mode, setMode] = useState<AuctionMode>(`saved`);
  const [feedLoading, setFeedLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [feed, setFeed] = useState<AuctionFeedSnapshot | null>(null);
  const [saved, setSaved] = useState<SavedInventory>({ actor: actorKey, error: ``, loading: true, records: [] });
  const [previewRecords, setPreviewRecords] = useState<AuctionRecord[]>([]);
  const [filters, setFilters] = useState<AuctionFilters>({ ...defaultAuctionFilters });
  const [revision, setRevision] = useState(0);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      savedRequest.current++; feedRequest.current++; mutationRequest.current++;
      feedController.current?.abort();
    };
  }, []);
  useEffect(() => {
    pendingMutation.current = null;
    mutationRequest.current++;
    setBusy(false); setNotice(``); setActionError(``); setImportText(``); setImportOpen(false);
  }, [actorKey]);
  useEffect(() => {
    const current = ++savedRequest.current;
    setSaved({ actor: actorKey, error: ``, loading: true, records: [] });
    if (authLoading) return () => { savedRequest.current++; };
    const isCurrent = () => mounted.current && savedRequest.current === current && currentActor.current === actorKey;
    const stop = domainAuctionAPI.subscribeListings(userId, records => {
      if (!isCurrent()) return false;
      setSaved({ actor: actorKey, records, loading: false, error: `` });
    }, failure => {
      if (isCurrent()) setSaved({ actor: actorKey, records: [], loading: false, error: failure.message });
    });
    return () => { savedRequest.current++; stop(); };
  }, [userId, revision, actorKey, authLoading]);
  useEffect(() => {
    if (mode !== `preview`) return;
    let active = true;
    setPreviewLoading(true); setPreviewError(``);
    void domainAuctionAPI.getPreview().then(records => {
      if (active) setPreviewRecords(records);
    }).catch(failure => {
      if (active) setPreviewError(failure instanceof Error ? failure.message : `Preview Could Not Be Loaded`);
    }).finally(() => { if (active) setPreviewLoading(false); });
    return () => { active = false; };
  }, [mode]);
  useEffect(() => {
    if (mode !== `feed`) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, [mode]);

  const savedInventory = saved.actor === actorKey ? saved : { actor: actorKey, error: ``, loading: true, records: [] };
  const feedRecords = useMemo(() => feed?.records.filter(record => !record.endsAt || Date.parse(record.endsAt) > now) ?? [], [feed, now]);
  const records = mode === `feed` ? feedRecords : mode === `preview` ? previewRecords : savedInventory.records;
  const loading = mode === `feed` ? feedLoading && !feed : mode === `preview` ? previewLoading : savedInventory.loading;
  const sourceError = mode === `feed` ? feedError : mode === `preview` ? previewError : savedInventory.error;
  const error = actionError || sourceError;
  const matchingRecords = useMemo(() => filterAuctionRecords(records, filters), [records, filters]);
  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(matchingRecords.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * pageSize;
  const visibleRecords = matchingRecords.slice(offset, offset + pageSize);
  useEffect(() => { setPage(1); }, [mode, filters, records]);
  const filterCount = getAuctionFilterCount(filters);
  const updateFilter = <Key extends keyof AuctionFilters>(key: Key, value: AuctionFilters[Key]) => {
    setFilters(current => ({ ...current, [key]: value }));
  };
  const resetFilters = () => setFilters({ ...defaultAuctionFilters });
  const selectMode = (next: AuctionMode) => {
    if (pendingMutation.current !== null) return;
    feedRequest.current++;
    feedController.current?.abort(); feedController.current = null;
    setFeedLoading(false); setActionError(``); setNotice(``); setMode(next);
  };
  const loadFreeAuctions = async () => {
    if (pendingMutation.current !== null || feedController.current) return;
    const current = ++feedRequest.current;
    const controller = new AbortController();
    feedController.current = controller;
    setMode(`feed`); setNow(Date.now()); setFeedLoading(true); setFeedError(``); setActionError(``); setNotice(``);
    try {
      const result = await domainAuctionAPI.getFreeFeed(controller.signal);
      if (!mounted.current || current !== feedRequest.current || controller.signal.aborted) return;
      setFeed(result); setNow(Date.now());
      setNotice(`${result.records.length.toLocaleString()} Free Auction Listing(s) Loaded`);
    } catch (failure) {
      if (mounted.current && current === feedRequest.current && !controller.signal.aborted) {
        setFeedError(failure instanceof Error ? failure.message : `Free Auctions Could Not Be Loaded`);
      }
    } finally {
      if (feedController.current === controller) feedController.current = null;
      if (mounted.current && current === feedRequest.current) setFeedLoading(false);
    }
  };
  const importInventory = async (text = importText) => {
    if (pendingMutation.current !== null || feedController.current || authLoading) return;
    if (currentActor.current !== actorKey) return;
    const capturedActor = actorKey;
    const operation = ++mutationRequest.current;
    pendingMutation.current = operation;
    const isCurrent = () => mounted.current && currentActor.current === capturedActor && operation === mutationRequest.current;
    setBusy(true); setActionError(``); setNotice(``);
    try {
      const result = await domainAuctionAPI.importInventory(text, userId);
      if (!isCurrent()) return;
      setMode(`saved`);
      setSaved({ actor: capturedActor, records: result.records, error: ``, loading: false });
      setImportText(``); setImportOpen(false); resetFilters();
      setNotice(`${result.importedCount} Auction Domain(s) Imported${result.skippedCount ? ` · ${result.skippedCount} Unsupported Record(s) Skipped` : ``}`);
    } catch (failure) {
      if (isCurrent()) setActionError(failure instanceof Error ? failure.message : `Auction Import Failed`);
    } finally {
      if (isCurrent()) { pendingMutation.current = null; setBusy(false); }
    }
  };
  const clearInventory = async () => {
    if (pendingMutation.current !== null || feedController.current || loading || mode !== `saved`) return;
    if (currentActor.current !== actorKey) return;
    const capturedActor = actorKey;
    const operation = ++mutationRequest.current;
    pendingMutation.current = operation;
    const isCurrent = () => mounted.current && currentActor.current === capturedActor && operation === mutationRequest.current;
    setBusy(true); setActionError(``); setNotice(``);
    try {
      await domainAuctionAPI.clearInventory(userId);
      if (!isCurrent()) return;
      setSaved({ actor: capturedActor, records: [], error: ``, loading: false });
      setNotice(`Imported Auction Inventory Cleared`);
    } catch (failure) {
      if (isCurrent()) setActionError(failure instanceof Error ? failure.message : `Auction Inventory Could Not Be Cleared`);
    } finally {
      if (isCurrent()) { pendingMutation.current = null; setBusy(false); }
    }
  };

  return {
    feed,
    mode,
    error,
    busy,
    notice,
    filters,
    loading,
    records,
    advanced,
    feedLoading,
    currentPage,
    pageCount,
    importOpen,
    importText,
    filterCount,
    setAdvanced,
    setImportText,
    setImportOpen,
    updateFilter,
    resetFilters,
    clearInventory,
    importInventory,
    loadFreeAuctions,
    visibleRecords,
    feedMode: mode === `feed`,
    feedRefreshFailed: Boolean(feedError),
    preview: mode === `preview`,
    showSavedInventory: () => selectMode(`saved`),
    setPreview: (value: boolean) => selectMode(value ? `preview` : `saved`),
    previousPage: () => setPage(current => Math.max(1, current - 1)),
    nextPage: () => setPage(current => Math.min(pageCount, current + 1)),
    matchingCount: matchingRecords.length,
    resultStart: matchingRecords.length ? offset + 1 : 0,
    resultEnd: Math.min(offset + pageSize, matchingRecords.length),
    clearError: () => {
      setActionError(``); setFeedError(``); setPreviewError(``);
      setSaved(current => ({ ...current, error: `` }));
    },
    reportError: setActionError,
    clearNotice: () => setNotice(``),
    reloadListings: () => { selectMode(`saved`); setRevision(current => current + 1); },
    storageMessage: persistenceEnabled ? `Imported inventory is saved as a snapshot.` : `Connect a backend to save auction inventory.`,
  };
};
