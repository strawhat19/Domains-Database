import { api } from '../../api';
import { Roles } from '../../types/types';
import { useLocalStorage } from '../config';
import type { DomainRecord } from '../types';
import { getDomainSource } from '../domainUtils';
import { useAuth } from '../authContext/useAuth';
import { useDomains } from '../domainContext/useDomains';
import { fetchDomainAppraisal } from '../../api/domainAppraisal';
import type { DomainAppraisal } from '../domainAppraisal/types';
import { hasRecentUnavailableAppraisal, readDomainAppraisal } from '../domainAppraisal/values';
import { useConnectionAvailability } from '../connections/useConnectionAvailability';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

type EstimateState = { appraisal: DomainAppraisal | null; estimating: boolean; error: string };
const initial: EstimateState = { appraisal: null, estimating: false, error: `` };
const noEstimate = async () => {};
const AppraisalContext = createContext<{ entries: ReadonlyMap<string, EstimateState>; estimate: (key: string, domain: DomainRecord) => Promise<void> }>({
  entries: new Map(), estimate: noEstimate,
});

export const DomainAppraisalProvider = ({ children }: PropsWithChildren) => {
  const { user, loginRevision } = useAuth();
  const { loaded, syncing } = useDomains();
  const { revision, hasGoDaddyConnection } = useConnectionAvailability();
  const userId = user?.id;
  const allowed = !useLocalStorage && user?.active === true && !user.anonymous && user.role !== Roles.Guest && hasGoDaddyConnection;
  const [entries, setEntries] = useState(() => new Map<string, EstimateState>());
  const pending = useRef(new Map<string, AbortController>());
  const background = useRef<AbortController | null>(null);
  const retryAt = useRef(0);

  useEffect(() => {
    const requests = pending.current;
    return () => {
      requests.forEach(request => request.abort());
      requests.clear();
      retryAt.current = 0;
    };
  }, [userId, loginRevision, revision, allowed]);

  const estimate = useCallback(async (key: string, { id, uid, name }: DomainRecord) => {
    if (!allowed || !userId || uid !== userId) return;
    if (pending.current.has(key)) return;
    background.current?.abort();
    const controller = new AbortController();
    pending.current.set(key, controller);
    const apply = (state: EstimateState) => {
      if (!controller.signal.aborted) setEntries(previous => new Map(previous).set(key, state));
    };
    apply({ ...initial, estimating: true });
    try {
      const result = await fetchDomainAppraisal(id, controller.signal);
      if (result.status === `available`) {
        if (!controller.signal.aborted) await api.saveDomainAppraisal(id, name, result.appraisal, userId);
        apply({ ...initial, appraisal: result.appraisal });
      }
      else {
        if (!controller.signal.aborted && (result.status === `not-found` || result.status === `unsupported-tld`)) await api.saveDomainAppraisal(id, name, result.status, userId);
        apply({ ...initial, error: result.message });
      }
    } catch (failure) {
      apply({ ...initial, error: failure instanceof Error ? failure.message : `Domain Estimate Could Not Be Loaded` });
    } finally {
      if (pending.current.get(key) === controller) pending.current.delete(key);
    }
  }, [allowed, userId]);

  useEffect(() => {
    if (!allowed || !loaded || syncing || !userId || retryAt.current > Date.now()) return;
    const controller = new AbortController();
    background.current = controller;
    const timer = setTimeout(() => {
      void api.getDomains().then(async records => {
        const batch = records.filter(record => record.uid === userId && !record.isSample && getDomainSource(record) === `registrar`
          && (record.meta?.externalRegistration !== true || record.meta?.ownershipConfirmed === true)
          && !readDomainAppraisal(record.meta?.goValue) && !hasRecentUnavailableAppraisal(record.meta?.goValueUnavailable)).slice(0, 4);
        for (const { id, name } of batch) {
          if (controller.signal.aborted || pending.current.size) return;
          const result = await fetchDomainAppraisal(id, controller.signal);
          if (controller.signal.aborted) return;
          if (result.status === `available`) await api.saveDomainAppraisal(id, name, result.appraisal, userId);
          else if (result.status === `unsupported-tld` || result.status === `not-found`) await api.saveDomainAppraisal(id, name, result.status, userId);
          else {
            retryAt.current = (result.retryAt ? Date.parse(result.retryAt) : 0) || Date.now() + 15 * 60_000;
            return;
          }
        }
      }).catch(() => {});
    }, 750);
    return () => { clearTimeout(timer); controller.abort(); if (background.current === controller) background.current = null; };
  }, [allowed, loaded, syncing, userId, loginRevision, revision]);

  const value = useMemo(() => ({ entries, estimate }), [entries, estimate]);
  return <AppraisalContext.Provider value={value}>{children}</AppraisalContext.Provider>;
};

export const useDomainAppraisal = (domain: DomainRecord, enabled: boolean) => {
  const { user, loading, loginRevision } = useAuth();
  const { revision, hasGoDaddyConnection } = useConnectionAvailability();
  const { entries, estimate } = useContext(AppraisalContext);
  const available = enabled && !useLocalStorage && hasGoDaddyConnection && !loading && user?.active === true
    && !user.anonymous && user.role !== Roles.Guest && domain.uid === user.id && !domain.isSample;
  const key = `${user?.id ?? ``}:${loginRevision}:${revision}:${domain.id}:${domain.name}`;
  const state = available ? entries.get(key) ?? initial : initial;
  const saved = enabled && !loading && domain.uid === user?.id ? readDomainAppraisal(domain.meta?.goValue) : undefined;
  return { ...state, appraisal: state.appraisal ?? saved ?? null, available, estimate: available ? () => estimate(key, domain) : noEstimate };
};
