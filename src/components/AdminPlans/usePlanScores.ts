import { useMemo, useEffect, useState } from 'react';
import { planInterestAPI } from '../../api/planInterest';
import { useAuth } from '../../shared/authContext/useAuth';
import { canManagePlans } from '../../shared/admin/permissions';
import type { PlanInterestSummary } from '../../shared/planInterest/types';

type ScoreState = { scope: string; ready: boolean; loading: boolean; error: string; records: PlanInterestSummary[] };
const emptyState = (scope: string): ScoreState => ({ scope, ready: false, loading: true, error: ``, records: [] });
export const usePlanScores = () => {
  const { user } = useAuth();
  const allowed = canManagePlans(user);
  const scope = JSON.stringify([user?.id, user?.role, user?.active, user?.firebase_uid]);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState(() => emptyState(scope));
  const current = state.scope === scope ? state : emptyState(scope);
  const scores = useMemo(() => new Map(current.records.map(record => [record.planId, record.up])), [current.records]);
  useEffect(() => {
    let active = true;
    setState(previous => ({ ...(previous.scope === scope ? previous : emptyState(scope)), loading: allowed, error: `` }));
    if (!allowed) return;
    const unsubscribe = planInterestAPI.subscribePlanInterestSummary(records => {
      if (active) setState({ scope, records, ready: true, loading: false, error: `` });
    }, failure => {
      if (active) setState(previous => previous.scope === scope ? { ...previous, loading: false, error: failure.message } : previous);
    });
    return () => { active = false; unsubscribe(); };
  }, [scope, revision, allowed]);
  return {
    ready: current.ready,
    error: current.error,
    loading: current.loading,
    refresh: () => setRevision(value => value + 1),
    score: (id: string) => current.ready ? scores.get(id) ?? 0 : null,
  };
};
