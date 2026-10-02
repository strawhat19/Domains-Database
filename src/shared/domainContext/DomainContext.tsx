import { api } from '../../api';
import type { PropsWithChildren } from 'react';
import type { DomainInput, DomainRecord } from '../types';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

export interface DomainContextValue {
  error: string;
  notice: string;
  loading: boolean;
  domains: DomainRecord[];
  clearNotice: () => void;
  resetSampleData: () => Promise<void>;
  deleteDomain: (id: string) => Promise<void>;
  importDomains: (inputs: DomainInput[]) => Promise<number>;
  addDomain: (input: DomainInput) => Promise<DomainRecord>;
  updateDomain: (id: string, input: DomainInput) => Promise<DomainRecord>;
}

export const DomainContext = createContext<DomainContextValue | undefined>(undefined);

export const DomainProvider = ({ children }: PropsWithChildren) => {
  const [error, setError] = useState(``);
  const [notice, setNotice] = useState(``);
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<DomainRecord[]>([]);

  useEffect(() => {
    let mounted = true;
    api.getDomains().then(records => {
      if (mounted) setDomains(records);
    }).catch(reason => {
      if (mounted) setError(reason instanceof Error ? reason.message : `Could Not Load Portfolio`);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const clearNotice = useCallback(() => setNotice(``), []);

  const mutate = useCallback(async <T,>(operation: () => Promise<T>, message: string): Promise<T> => {
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
  const resetSampleData = useCallback(async () => { await mutate(() => api.resetSampleData(), `Sample Portfolio Restored`); }, [mutate]);

  const value = useMemo(() => ({
    error,
    notice,
    loading,
    domains,
    addDomain,
    clearNotice,
    deleteDomain,
    updateDomain,
    importDomains,
    resetSampleData,
  }), [error, notice, loading, domains, addDomain, clearNotice, deleteDomain, updateDomain, importDomains, resetSampleData]);

  return (
    <DomainContext.Provider value={value}>
      {children}
    </DomainContext.Provider>
  );
};
