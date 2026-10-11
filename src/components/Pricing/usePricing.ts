import { plansAPI } from '../../api/plans';
import { useEffect, useState } from 'react';
import type { Plan } from '../../shared/models/plans/Plan';

export const usePricing = () => {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ plans: Plan[]; loading: boolean; error: string }>({ plans: [], loading: true, error: `` });
  useEffect(() => {
    let active = true;
    setState({ plans: [], loading: true, error: `` });
    const stop = plansAPI.subscribePublishedPlans(plans => {
      if (active) setState({ plans, loading: false, error: `` });
    }, failure => { if (active) setState({ plans: [], loading: false, error: failure.message }); });
    return () => { active = false; stop(); };
  }, [revision]);
  return { ...state, refresh: () => setRevision(value => value + 1) };
};
