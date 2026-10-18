import { plansAPI } from '../../api/plans';
import { useEffect, useState } from 'react';
import { useAuth } from '../../shared/authContext/useAuth';
import type { Plan } from '../../shared/models/plans/Plan';
import { canAccessAdmin } from '../../shared/admin/permissions';

export const usePricing = () => {
  const { user, loading: authLoading } = useAuth();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ plans: Plan[]; loading: boolean; error: string }>({ plans: [], loading: true, error: `` });
  const showFeaturePreview = !authLoading && canAccessAdmin(user);
  useEffect(() => {
    let active = true;
    setState({ plans: [], loading: true, error: `` });
    const stop = plansAPI.subscribePublishedPlans(plans => {
      if (active) setState({ plans: plans.filter(plan => plan.slug !== `enterprise`), loading: false, error: `` });
    }, failure => { if (active) setState({ plans: [], loading: false, error: failure.message }); });
    return () => { active = false; stop(); };
  }, [revision]);
  return { ...state, showFeaturePreview, refresh: () => setRevision(value => value + 1) };
};
