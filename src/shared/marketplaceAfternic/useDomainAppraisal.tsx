import { Roles } from '../../types/types';
import { useLocalStorage } from '../config';
import type { DomainRecord } from '../types';
import { useAuth } from '../authContext/useAuth';
import { fetchDomainAppraisal } from '../../api/domainAppraisal';
import { useConnectionAvailability } from '../connections/useConnectionAvailability';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

type EstimateState = { estimateCents: number | null; suggestedPriceCents: number | null; estimating: boolean; error: string };
const initial: EstimateState = { estimateCents: null, suggestedPriceCents: null, estimating: false, error: `` };
const noEstimate = async () => {};
const AppraisalContext = createContext<{ entries: ReadonlyMap<string, EstimateState>; estimate: (key: string, id: string) => Promise<void> }>({
  entries: new Map(), estimate: noEstimate,
});

export const DomainAppraisalProvider = ({ children }: PropsWithChildren) => {
  const [entries, setEntries] = useState(() => new Map<string, EstimateState>());
  const pending = useRef(new Map<string, AbortController>());

  useEffect(() => {
    const requests = pending.current;
    return () => { requests.forEach(request => request.abort()); requests.clear(); };
  }, []);

  const estimate = useCallback(async (key: string, id: string) => {
    if (pending.current.has(key)) return;
    const controller = new AbortController();
    pending.current.set(key, controller);
    const apply = (state: EstimateState) => {
      if (!controller.signal.aborted) setEntries(previous => new Map(previous).set(key, state));
    };
    apply({ ...initial, estimating: true });
    try {
      const result = await fetchDomainAppraisal(id, controller.signal);
      if (result.status === `available`) {
        const { amount, listPrice } = result.appraisal;
        apply({ ...initial, estimateCents: Math.round(amount * 100), suggestedPriceCents: listPrice == null ? null : Math.round(listPrice * 100) });
      }
      else apply({ ...initial, error: result.message });
    } catch (failure) {
      apply({ ...initial, error: failure instanceof Error ? failure.message : `Domain Estimate Could Not Be Loaded` });
    } finally {
      if (pending.current.get(key) === controller) pending.current.delete(key);
    }
  }, []);

  const value = useMemo(() => ({ entries, estimate }), [entries, estimate]);
  return <AppraisalContext.Provider value={value}>{children}</AppraisalContext.Provider>;
};

export const useDomainAppraisal = (domain: DomainRecord, enabled: boolean) => {
  const { user, loading } = useAuth();
  const { hasGoDaddyConnection } = useConnectionAvailability();
  const { entries, estimate } = useContext(AppraisalContext);
  const available = enabled && !useLocalStorage && hasGoDaddyConnection && !loading && user?.active === true
    && !user.anonymous && user.role !== Roles.Guest && domain.uid === user.id && !domain.isSample;
  const key = `${domain.id}:${domain.name}`;
  return { ...(available ? entries.get(key) ?? initial : initial), available, estimate: available ? () => estimate(key, domain.id) : noEstimate };
};
