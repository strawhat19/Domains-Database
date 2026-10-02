import { api } from '../../api';
import type { PropsWithChildren } from 'react';
import type { DomainInput, DomainRecord } from '../types';
import type { ConnectionSnapshot } from '../connections/types';
import { useWebsiteInsights } from '../websiteInsights/useWebsiteInsights';
import { useRegistrarSync } from '../registrarSync/useRegistrarSync';
import type { ConnectionSyncResult, ConnectionSyncStatuses } from '../registrarSync/types';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface DomainContextValue {
  error: string;
  notice: string;
  loading: boolean;
  syncing: boolean;
  refreshing: boolean;
  insightError: string;
  insightNotice: string;
  domains: DomainRecord[];
  clearNotice: () => void;
  clearInsightError: () => void;
  clearInsightNotice: () => void;
  resetConnectionSync: () => void;
  connectionStatuses: ConnectionSyncStatuses;
  syncConnections: (snapshot?: ConnectionSnapshot) => Promise<ConnectionSyncResult>;
  resetSampleData: () => Promise<void>;
  prepareExport: () => Promise<DomainRecord[]>;
  deleteDomain: (id: string) => Promise<void>;
  refreshWebsiteInsights: (domains: DomainRecord[]) => Promise<void>;
  importDomains: (inputs: DomainInput[]) => Promise<number>;
  addDomain: (input: DomainInput) => Promise<DomainRecord>;
  updateDomain: (id: string, input: DomainInput) => Promise<DomainRecord>;
}

export const DomainContext = createContext<DomainContextValue | undefined>(undefined);

export const DomainProvider = ({ children }: PropsWithChildren) => {
  const active = useRef(false);
  const [error, setError] = useState(``);
  const [notice, setNotice] = useState(``);
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<DomainRecord[]>([]);

  useEffect(() => {
    let mounted = true;
    active.current = true;
    api.getDomains().then(records => {
      if (mounted) setDomains(records);
    }).catch(reason => {
      if (mounted) setError(reason instanceof Error ? reason.message : `Could Not Load Portfolio`);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; active.current = false; };
  }, []);

  const refreshDomains = useCallback(async () => {
    const records = await api.getDomains();
    if (active.current) setDomains(records);
  }, []);
  const sync = useRegistrarSync(refreshDomains);
  const insights = useWebsiteInsights(refreshDomains);
  const clearNotice = useCallback(() => { setNotice(``); sync.clearSyncNotice(); }, [sync.clearSyncNotice]);

  const mutate = useCallback(async <T,>(operation: () => Promise<T>, message: string): Promise<T> => {
    if (!active.current) throw new Error(`Portfolio Changed, Please Try Again`);
    try {
      const result = await operation();
      const records = await api.getDomains();
      setDomains(records);
      setError(``);
      setNotice(message);
      return result;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : `Could Not Update Portfolio`;
      setError(message);
      throw new Error(message);
    }
  }, []);

  const addDomain = useCallback((input: DomainInput) => mutate(() => api.createDomain(input), `Domain Added`), [mutate]);
  const deleteDomain = useCallback((id: string) => mutate(() => api.deleteDomain(id), `Domain Removed`), [mutate]);
  const updateDomain = useCallback((id: string, input: DomainInput) => mutate(() => api.updateDomain(id, input), `Domain Updated`), [mutate]);
  const importDomains = useCallback((inputs: DomainInput[]) => mutate(() => api.importDomains(inputs), `${inputs.length} Domain(s) Imported`), [mutate]);
  const prepareExport = useCallback(() => mutate(() => api.prepareExport(), `CSV Prepared`), [mutate]);
  const resetSampleData = useCallback(async () => { await mutate(() => api.resetSampleData(), `Sample Portfolio Restored`); }, [mutate]);

  const value = useMemo(() => ({
    ...insights,
    error: error || sync.syncError,
    notice: notice || sync.syncNotice,
    loading,
    domains,
    syncing: sync.syncing,
    addDomain,
    clearNotice,
    deleteDomain,
    updateDomain,
    importDomains,
    prepareExport,
    resetSampleData,
    syncConnections: sync.syncConnections,
    connectionStatuses: sync.connectionStatuses,
    resetConnectionSync: sync.resetConnectionSync,
  }), [error, notice, loading, domains, addDomain, clearNotice, deleteDomain, updateDomain, importDomains, prepareExport, resetSampleData, insights, sync.syncing, sync.syncError, sync.syncNotice, sync.syncConnections, sync.connectionStatuses, sync.resetConnectionSync]);

  return (
    <DomainContext.Provider value={value}>
      {children}
    </DomainContext.Provider>
  );
};
