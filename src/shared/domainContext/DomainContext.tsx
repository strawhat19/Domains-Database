import { api } from '../../api';
import type { PropsWithChildren } from 'react';
import type { DomainInput, DomainRecord } from '../types';
import { useAfterPaint } from '../common/useAfterPaint';
import type { ConnectionSnapshot } from '../connections/types';
import { useWebsiteInsights } from '../websiteInsights/useWebsiteInsights';
import { useRegistrarSync } from '../registrarSync/useRegistrarSync';
import type { AccountSyncStatuses, ConnectionSyncResult, ConnectionSyncStatuses } from '../registrarSync/types';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  syncManually: () => Promise<void>;
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
  refreshWebsiteInsights: (domains: DomainRecord[]) => Promise<void>;
  importDomains: (inputs: DomainInput[]) => Promise<number>;
  addDomain: (input: DomainInput) => Promise<DomainRecord>;
  updateDomain: (id: string, input: DomainInput) => Promise<DomainRecord>;
}

export const DomainContext = createContext<DomainContextValue | undefined>(undefined);

export const DomainProvider = ({ children, enabled = true, requested = false }: PropsWithChildren<{ enabled?: boolean; requested?: boolean }>) => {
  const [requestedOnce, setRequestedOnce] = useState(false);
  const domainEnabled = enabled && (requested || requestedOnce);
  const active = useRef(false);
  const revision = useRef(0);
  if (!domainEnabled) active.current = false;
  const [error, setError] = useState(``);
  const [notice, setNotice] = useState(``);
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<DomainRecord[]>([]);

  useEffect(() => {
    if (enabled && requested) setRequestedOnce(true);
  }, [enabled, requested]);

  useEffect(() => {
    let mounted = true;
    const run = ++revision.current;
    active.current = domainEnabled;
    setLoading(true);
    setDomains([]);
    setError(``);
    setNotice(``);
    if (!domainEnabled) return () => { active.current = false; ++revision.current; };
    const isCurrent = () => mounted && active.current && run === revision.current;
    api.getDomains().then(records => {
      if (isCurrent()) setDomains(records);
    }).catch(reason => {
      if (isCurrent()) setError(reason instanceof Error ? reason.message : `Could Not Load Portfolio`);
    }).finally(() => {
      if (isCurrent()) setLoading(false);
    });
    return () => { mounted = false; active.current = false; ++revision.current; };
  }, [domainEnabled]);

  const refreshDomains = useCallback(async () => {
    if (!domainEnabled || !active.current) return;
    const run = revision.current;
    const records = await api.getDomains();
    if (active.current && run === revision.current) setDomains(records);
  }, [domainEnabled]);
  const syncReady = useAfterPaint(domainEnabled && !loading);
  const sync = useRegistrarSync(refreshDomains, syncReady);
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
    canSyncManually: sync.canSyncManually,
    canSyncConnections: syncReady,
    manualSyncMessage: sync.manualSyncMessage,
    manualSyncWaitSeconds: sync.manualSyncWaitSeconds,
    refreshing: domainEnabled && insights.refreshing,
    error: domainEnabled ? error || sync.syncError : ``,
    notice: domainEnabled ? notice || sync.syncNotice : ``,
    insightError: domainEnabled ? insights.insightError : ``,
    insightNotice: domainEnabled ? insights.insightNotice : ``,
    addDomain,
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
  }), [enabled, syncReady, domainEnabled, error, notice, loading, domains, addDomain, clearNotice, deleteDomain, updateDomain, importDomains, prepareExport, resetSampleData, toggleDomainStar, refreshWebsiteInsights, insights, sync.syncing, sync.syncError, sync.syncNotice, sync.syncConnections, sync.accountStatuses, sync.connectionStatuses, sync.resetConnectionSync, sync.syncManually, sync.canSyncManually, sync.manualSyncMessage, sync.manualSyncWaitSeconds]);

  return (
    <DomainContext.Provider value={value}>
      {children}
    </DomainContext.Provider>
  );
};
