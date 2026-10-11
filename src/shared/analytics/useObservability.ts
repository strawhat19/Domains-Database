import { useEffect, useState, useCallback } from 'react';
import { canAccessAdmin } from '../admin/permissions';
import type { User } from '../models/users/User';
import { getObservabilityReport, ReportRequestError } from './client';
import type { AnalyticsFailure, ObservabilityPeriod, ObservabilityReport } from './types';

interface ReportState { key: string; report: ObservabilityReport | null; error: AnalyticsFailure | null }
export const useObservability = (user: User | null | undefined) => {
  const [revision, setRevision] = useState(0);
  const [period, setPeriod] = useState<ObservabilityPeriod>(24);
  const [state, setState] = useState<ReportState | null>(null);
  const allowed = canAccessAdmin(user, `observability`);
  const firebaseUid = user?.firebase_uid ?? ``;
  const key = JSON.stringify([user?.id ?? ``, firebaseUid, user?.role, allowed, period, revision]);
  const current = allowed && state?.key === key ? state : null;
  const loading = allowed && !current;
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    const controller = new AbortController();
    void getObservabilityReport(period, firebaseUid, controller.signal).then(report => {
      if (active) setState({ key, report, error: null });
    }).catch((failure: unknown) => {
      if (!active) return;
      const error = failure instanceof ReportRequestError ? { code: failure.code, message: failure.message } : { code: `observability_unavailable`, message: `Observability Could Not Be Loaded — Try Again` };
      setState({ key, error, report: null });
    });
    return () => { active = false; controller.abort(); };
  }, [key, period, allowed, firebaseUid]);
  return { period, loading, refresh, setPeriod, report: current?.report ?? null, error: current?.error ?? null };
};
