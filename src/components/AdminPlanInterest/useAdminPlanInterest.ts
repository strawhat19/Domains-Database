import { useEffect, useState } from 'react';
import { planInterestAPI } from '../../api/planInterest';
import { useAuth } from '../../shared/authContext/useAuth';
import { canManageFeatures } from '../../shared/admin/permissions';
import type { PlanInterestSummary } from '../../shared/planInterest/types';
import { planInterestStorageSource } from '../../shared/planInterest/service';

type InterestReportState = { scope: string; ready: boolean; loading: boolean; error: string; records: PlanInterestSummary[] };
const emptyState = (scope: string): InterestReportState => ({ scope, ready: false, loading: true, error: ``, records: [] });
export const useAdminPlanInterest = () => {
  const { user } = useAuth();
  const scope = JSON.stringify([user?.id, user?.role, user?.active]);
  const allowed = canManageFeatures(user);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState(() => emptyState(scope));
  const current = state.scope === scope ? state : emptyState(scope);
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
  return { ...current, allowed, source: planInterestStorageSource, refresh: () => setRevision(value => value + 1) };
};
