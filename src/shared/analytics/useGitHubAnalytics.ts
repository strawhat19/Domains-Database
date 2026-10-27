import type { User } from '../models/users/User';
import type { AnalyticsFailure } from './types';
import { useEffect, useState, useCallback } from 'react';
import { canManageRoles } from '../admin/permissions';
import { getGitHubReport, ReportRequestError } from './client';
import type { GitHubPeriod, GitHubReport } from './github.types';

type ReportState = { key: string; report: GitHubReport | null; error: AnalyticsFailure | null };
export const useGitHubAnalytics = (user: User | null | undefined) => {
  const [revision, setRevision] = useState(0);
  const [period, setPeriod] = useState<GitHubPeriod>(7);
  const [state, setState] = useState<ReportState | null>(null);
  const allowed = canManageRoles(user);
  const firebaseUid = user?.firebase_uid ?? ``;
  const key = JSON.stringify([user?.id ?? ``, firebaseUid, user?.role, allowed, period, revision]);
  const current = allowed && state?.key === key ? state : null;
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    const controller = new AbortController();
    void getGitHubReport(period, firebaseUid, controller.signal, revision > 0).then(report => {
      if (active) setState({ key, report, error: null });
    }).catch((failure: unknown) => {
      if (!active) return;
      const error = failure instanceof ReportRequestError ? { code: failure.code, message: failure.message } : { code: `github_unavailable`, message: `GitHub Analytics Could Not Be Loaded — Try Again` };
      setState({ key, error, report: null });
    });
    return () => { active = false; controller.abort(); };
  }, [key, period, allowed, revision, firebaseUid]);
  return { period, refresh, setPeriod, loading: allowed && !current, report: current?.report ?? null, error: current?.error ?? null };
};
