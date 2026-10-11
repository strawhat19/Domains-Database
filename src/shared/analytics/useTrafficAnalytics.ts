import type { User } from '../models/users/User';
import { canAccessAdmin } from '../admin/permissions';
import { useEffect, useState, useCallback } from 'react';
import { getTrafficReport, ReportRequestError } from './client';
import type { AnalyticsFailure, TrafficPeriod, TrafficReport, AnalyticsFilters } from './types';

interface ReportState { key: string; report: TrafficReport | null; error: AnalyticsFailure | null }
export const getAnalyticsDateRange = (days: number) => {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { to: end.toISOString().slice(0, 10), from: start.toISOString().slice(0, 10) };
};
export const useTrafficAnalytics = (user: User | null | undefined) => {
  const [revision, setRevision] = useState(0);
  const [filters, setFilters] = useState<AnalyticsFilters>(() => ({ ...getAnalyticsDateRange(7), path: ``, device: ``, country: ``, referrer: `` }));
  const [state, setState] = useState<ReportState | null>(null);
  const period = Math.round((Date.parse(`${filters.to}T00:00:00Z`) - Date.parse(`${filters.from}T00:00:00Z`)) / 86400000) + 1;
  const setPeriod = (days: TrafficPeriod) => setFilters(value => ({ ...value, ...getAnalyticsDateRange(days) }));
  const allowed = canAccessAdmin(user, `analytics`);
  const firebaseUid = user?.firebase_uid ?? ``;
  const key = JSON.stringify([user?.id ?? ``, firebaseUid, user?.role, allowed, filters, revision]);
  const current = allowed && state?.key === key ? state : null;
  const loading = allowed && !current;
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    const controller = new AbortController();
    void getTrafficReport(filters, firebaseUid, controller.signal).then(report => {
      if (active) setState({ key, report, error: null });
    }).catch((failure: unknown) => {
      if (!active) return;
      const error = failure instanceof ReportRequestError ? { code: failure.code, message: failure.message } : { code: `analytics_unavailable`, message: `Traffic Could Not Be Loaded — Try Again` };
      setState({ key, error, report: null });
    });
    return () => { active = false; controller.abort(); };
  }, [key, filters, allowed, firebaseUid]);
  return { period, filters, loading, refresh, setPeriod, setFilters, report: current?.report ?? null, error: current?.error ?? null };
};
