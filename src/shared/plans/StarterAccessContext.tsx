import type { PlanTier } from './types';
import { Roles } from '../../types/types';
import { subscribePlanTiers } from './service';
import { useAuth } from '../authContext/useAuth';
import { hasStarterPlanAccess } from '../accountPlans';
import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

interface StarterAccess {
  error: string;
  allowed: boolean;
  loading: boolean;
  refresh: () => void;
}
interface TierState {
  scope: string;
  error: string;
  loading: boolean;
  tiers: PlanTier[];
}

export const StarterAccessContext = createContext<StarterAccess | null>(null);
export const StarterAccessProvider = ({ children }: PropsWithChildren) => {
  const { user, loading: authLoading, loginRevision } = useAuth();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<TierState>({ scope: ``, error: ``, tiers: [], loading: true });
  const plan = typeof user?.plan === `string` ? user.plan.trim().toLowerCase() : ``;
  const owner = !authLoading && !!user?.id && user.active === true && user.role === Roles.Owner;
  const needsTiers = !owner && !authLoading && !!user?.id && user.active === true && !!plan && plan !== `free`;
  const scope = `${user?.id ?? `guest`}:${user?.role ?? `guest`}:${plan}:${user?.active === true}:${loginRevision}:${revision}`;
  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    if (!needsTiers) {
      setState({ scope: ``, error: ``, tiers: [], loading: true });
      return;
    }
    let active = true;
    setState({ scope, error: ``, tiers: [], loading: true });
    const unsubscribe = subscribePlanTiers(tiers => {
      if (!active) return;
      const error = !tiers.some(tier => tier.slug === `starter`) || !tiers.some(tier => tier.slug === plan)
        ? `Your Plan Access Could Not Be Confirmed — Try Again` : ``;
      setState({ scope, tiers: error ? [] : tiers, error, loading: false });
    }, failure => {
      if (active) setState({ scope, tiers: [], loading: false, error: failure.message });
    });
    return () => { active = false; unsubscribe(); };
  }, [scope, plan, needsTiers]);

  const current = needsTiers && state.scope === scope;
  const loading = authLoading || (needsTiers && (!current || state.loading));
  const error = current ? state.error : ``;
  const allowed = owner || (current && !loading && !error && hasStarterPlanAccess(user, state.tiers));
  const value = useMemo(() => ({ error, allowed, loading, refresh }), [error, allowed, loading, refresh]);
  return <StarterAccessContext.Provider value={value}>{children}</StarterAccessContext.Provider>;
};
