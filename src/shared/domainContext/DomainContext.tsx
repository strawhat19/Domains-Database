import { api } from '../../api';
import type { PropsWithChildren } from 'react';
import type { DomainInput, DomainRecord } from '../types';
import { useAfterPaint } from '../common/useAfterPaint';
import { useWebsiteInsights } from '../websiteInsights/useWebsiteInsights';
import type { ConnectionProvider, ConnectionSnapshot } from '../connections/types';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRegistrarSync, type ManualSyncChoice } from '../registrarSync/useRegistrarSync';
import { useBackgroundProgressReporter, type BackgroundProgressUpdate } from '../backgroundProgress/BackgroundProgressContext';
import type { AccountSyncStatuses, ConnectedSyncRegistrar, ConnectionSyncResult, ConnectionSyncStatuses } from '../registrarSync/types';

export interface DomainContextValue {
  error: string;
  notice: string;
  loaded: boolean;
  loading: boolean;
  syncing: boolean;
  canSyncManually: boolean;
  canSyncConnections: boolean;
  manualSyncMessage: string;
  manualSyncWaitSeconds: number;
  manualSyncChoices: ManualSyncChoice[];
  connectedSyncRegistrars: ConnectedSyncRegistrar[];
  closeManualSync: () => void;
  syncManually: (connectionId?: string, syncRelated?: () => Promise<void>) => Promise<void>;
  syncAllManually: () => Promise<void>;
  syncRegistrarDomains: (provider: ConnectionProvider) => Promise<void>;
  refreshing: boolean;
  insightError: string;
  insightNotice: string;
  domains: DomainRecord[];
  clearNotice: () => void;
  clearInsightError: () => void;
  clearInsightNotice: () => void;
  resetConnectionSync: () => void;
  connectionStatuses: ConnectionSyncStatuses;
  accountStatuses: AccountSyncStatuses;
  syncConnections: (snapshot?: ConnectionSnapshot, connectionIds?: readonly string[]) => Promise<ConnectionSyncResult>;
  resetSampleData: () => Promise<void>;
  prepareExport: () => Promise<DomainRecord[]>;
  deleteDomain: (id: string) => Promise<void>;
  toggleDomainStar: (id: string) => Promise<void>;
  starDomains: (ids: readonly string[]) => Promise<void>;
  refreshWebsiteInsights: (domains: DomainRecord[]) => Promise<void>;
  importDomains: (inputs: DomainInput[]) => Promise<number>;
  addDomain: (input: DomainInput) => Promise<DomainRecord>;
  updateDomain: (id: string, input: DomainInput) => Promise<DomainRecord>;
}

export const DomainContext = createContext<DomainContextValue | undefined>(undefined);

export const DomainProvider = ({ children, enabled = true, preload = false, requested = false }: PropsWithChildren<{ enabled?: boolean; preload?: boolean; requested?: boolean }>) => {
  const [requestedOnce, setRequestedOnce] = useState(false);
  const domainEnabled = enabled && (preload || requested || requestedOnce);
  const active = useRef(false);
  const revision = useRef(0);
  const readError = useRef(``);
  const showProgress = useRef(enabled && preload);
  const report = useBackgroundProgressReporter(`portfolio`, `Your Domains`);
  showProgress.current = enabled && preload;
  if (!domainEnabled) active.current = false;
  const [error, setError] = useState(``);
  const [notice, setNotice] = useState(``);
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<DomainRecord[]>([]);

  useEffect(() => {
    if (enabled && (requested || preload)) setRequestedOnce(true);
  }, [enabled, preload, requested]);

  useEffect(() => {
    let mounted = true;
    const run = ++revision.current;
    active.current = domainEnabled;
    setLoading(true);
    setDomains([]);
    setError(``);
    setNotice(``);
    readError.current = ``;
    if (!domainEnabled) { report(null); return; }
    if (showProgress.current) report({});
    const isCurrent = () => mounted && active.current && run === revision.current;
    let snapshotRevision = 0;
    const receive = (records: DomainRecord[]) => {
      if (!isCurrent()) return;
      setDomains(records);
      setLoading(false);
      setError(``);
      readError.current = ``;
    };
    const fail = (reason: unknown) => {
      if (!isCurrent()) return;
      const message = reason instanceof Error ? reason.message : `Could Not Load Portfolio`;
      readError.current = message;
      setError(message);
      setLoading(false);
    };
    const unsubscribe = api.subscribeDomains(records => {
      snapshotRevision += 1;
      receive(records);
    }, fail);
    const requestRevision = snapshotRevision;
    api.getDomains().then(records => {
      if (requestRevision === snapshotRevision) receive(records);
    }).catch(reason => { if (requestRevision === snapshotRevision) fail(reason); });
    return () => { mounted = false; active.current = false; ++revision.current; unsubscribe(); report(null); };
  }, [domainEnabled, report]);

  const refreshDomains = useCallback(async () => {
    if (!domainEnabled || !active.current) return;
    const run = revision.current;
    const records = await api.getDomains();
    if (active.current && run === revision.current) {
      const failedRead = readError.current;
      if (failedRead) setError(current => current === failedRead ? `` : current);
      readError.current = ``;
      setDomains(records);
    }
  }, [domainEnabled]);
  const reportAutomaticSync = useCallback((update: BackgroundProgressUpdate | null) => {
    if (!update || !showProgress.current) { report(null); return; }
    report(update.done && readError.current ? { error: `Could Not Load Your Domains` } : update);
  }, [report]);
  const syncReady = useAfterPaint(domainEnabled && !loading);
  const sync = useRegistrarSync(refreshDomains, syncReady, reportAutomaticSync);
  const insights = useWebsiteInsights(refreshDomains, domainEnabled);
  const refreshWebsiteInsights = useCallback(async (records: DomainRecord[]) => {
    if (!domainEnabled || !active.current) return;
    await insights.refreshWebsiteInsights(records);
  }, [domainEnabled, insights.refreshWebsiteInsights]);
  const clearNotice = useCallback(() => { setNotice(``); sync.clearSyncNotice(); }, [sync.clearSyncNotice]);

  const mutate = useCallback(async <T,>(operation: () => Promise<T>, message: string): Promise<T> => {
    if (!domainEnabled || !active.current) throw new Error(`Open Domains To Load Your Portfolio`);
    const run = revision.current;
    const isCurrent = () => active.current && run === revision.current;
    try {
      const result = await operation();
      if (!isCurrent()) throw new Error(`Portfolio Changed, Please Try Again`);
      const records = await api.getDomains();
      if (!isCurrent()) throw new Error(`Portfolio Changed, Please Try Again`);
      setDomains(records);
      setError(``);
      setNotice(message);
      return result;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : `Could Not Update Portfolio`;
      if (isCurrent()) setError(message);
      throw new Error(message);
    }
  }, [domainEnabled]);

  const addDomain = useCallback((input: DomainInput) => mutate(() => api.createDomain(input), `Domain Added`), [mutate]);
  const deleteDomain = useCallback((id: string) => mutate(() => api.deleteDomain(id), `Domain Removed`), [mutate]);
  const toggleDomainStar = useCallback((id: string) => mutate(() => api.toggleDomainStar(id), `Domain Star Updated`), [mutate]);
  const starDomains = useCallback((ids: readonly string[]) => mutate(() => api.starDomains(ids), `Domains Starred`), [mutate]);
  const updateDomain = useCallback((id: string, input: DomainInput) => mutate(() => api.updateDomain(id, input), `Domain Updated`), [mutate]);
  const importDomains = useCallback((inputs: DomainInput[]) => mutate(() => api.importDomains(inputs), `${inputs.length} Domain(s) Imported`), [mutate]);
  const prepareExport = useCallback(() => mutate(() => api.prepareExport(), `CSV Prepared`), [mutate]);
  const resetSampleData = useCallback(async () => { await mutate(() => api.resetSampleData(), `Sample Portfolio Restored`); }, [mutate]);

  const value = useMemo(() => ({
    ...insights,
    loaded: domainEnabled && !loading,
    loading: !enabled || (domainEnabled && loading),
    domains: domainEnabled ? domains : [],
    syncing: sync.syncing,
    syncManually: sync.syncManually,
    syncAllManually: sync.syncAllManually,
    syncRegistrarDomains: sync.syncRegistrarDomains,
    closeManualSync: sync.closeManualSync,
    canSyncManually: sync.canSyncManually,
    canSyncConnections: syncReady,
    manualSyncMessage: sync.manualSyncMessage,
    manualSyncChoices: sync.manualSyncChoices,
    connectedSyncRegistrars: sync.connectedSyncRegistrars,
    manualSyncWaitSeconds: sync.manualSyncWaitSeconds,
    refreshing: domainEnabled && insights.refreshing,
    error: domainEnabled ? error || sync.syncError : ``,
    notice: domainEnabled ? notice || sync.syncNotice : ``,
    insightError: domainEnabled ? insights.insightError : ``,
    insightNotice: domainEnabled ? insights.insightNotice : ``,
    addDomain,
    starDomains,
    clearNotice,
    deleteDomain,
    updateDomain,
    importDomains,
    prepareExport,
    resetSampleData,
    toggleDomainStar,
    refreshWebsiteInsights,
    syncConnections: sync.syncConnections,
    accountStatuses: sync.accountStatuses,
    connectionStatuses: sync.connectionStatuses,
    resetConnectionSync: sync.resetConnectionSync,
  }), [enabled, syncReady, domainEnabled, error, notice, loading, domains, addDomain, starDomains, clearNotice, deleteDomain, updateDomain, importDomains, prepareExport, resetSampleData, toggleDomainStar, refreshWebsiteInsights, insights, sync.syncing, sync.syncError, sync.syncNotice, sync.syncConnections, sync.accountStatuses, sync.connectionStatuses, sync.resetConnectionSync, sync.syncManually, sync.syncAllManually, sync.syncRegistrarDomains, sync.closeManualSync, sync.canSyncManually, sync.manualSyncMessage, sync.manualSyncChoices, sync.connectedSyncRegistrars, sync.manualSyncWaitSeconds]);

  return (
    <DomainContext.Provider value={value}>
      {children}
    </DomainContext.Provider>
  );
};
