import { routes } from '../../shared/routes';
import type { Plan } from '../../shared/models/plans/Plan';
import { useAuth } from '../../shared/authContext/useAuth';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import { resolvePlanInterestId } from '../../shared/plans/interestReturn';
import { planInterestAPI, planInterestStorageSource, type PlanInterestState } from '../../api/planInterest';

export interface PricingInterestState {
  ready: boolean;
  loading: boolean;
  pending: boolean;
  error: string;
  notice: string;
  interested: boolean;
  vote: PlanInterestState[`vote`];
}

export const usePricingInterest = (plans: readonly Plan[], enabled: boolean) => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const params = useLocalSearchParams<{ planInterest?: string | string[] }>();
  const returnPlanId = resolvePlanInterestId(params.planInterest);
  const planIds = JSON.stringify(plans.map(plan => plan.id));
  const actorId = user?.id ?? ``;
  const scopeKey = JSON.stringify([actorId, user?.active, user?.anonymous, authLoading, enabled, planIds]);
  const epoch = useRef(0);
  const pendingPlans = useRef(new Set<string>());
  const activePrompt = useRef(``);
  const handledReturn = useRef(``);
  const [revision, setRevision] = useState(0);
  const [promptId, setPromptId] = useState(``);
  activePrompt.current = promptId;
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notices, setNotices] = useState<Record<string, string>>({});
  const [state, setState] = useState({ scope: ``, loading: enabled, error: ``, values: {} as Record<string, PlanInterestState> });
  const signedIn = !!user?.active && !user.anonymous;
  const local = planInterestStorageSource === `local`;
  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    const scope = ++epoch.current;
    pendingPlans.current.clear();
    setPending({});
    setErrors({});
    setNotices({});
    setState({ scope: scopeKey, loading: enabled && !authLoading, error: ``, values: {} });
    if (!enabled || authLoading) return;
    const ids = JSON.parse(planIds) as string[];
    if (!ids.length) { setState({ scope: scopeKey, loading: false, error: ``, values: {} }); return; }
    void planInterestAPI.getPlanInterestStates(ids).then(values => {
      if (epoch.current !== scope) return;
      const byPlan = Object.fromEntries(values.map(value => [value.planId, value]));
      if (ids.some(id => !byPlan[id])) throw new Error(`Plan Interest Could Not Be Loaded`);
      setState({ scope: scopeKey, loading: false, error: ``, values: byPlan });
    }).catch(failure => {
      if (epoch.current === scope) setState({ scope: scopeKey, loading: false, values: {}, error: failure instanceof Error ? failure.message : `Plan Interest Could Not Be Loaded` });
    });
    return () => { epoch.current += 1; };
  }, [enabled, authLoading, planIds, revision, scopeKey]);

  useEffect(() => {
    if (!returnPlanId) { handledReturn.current = ``; return; }
    const request = `${actorId}:${returnPlanId}`;
    if (!enabled || authLoading || handledReturn.current === request || !plans.some(plan => plan.id === returnPlanId)) return;
    handledReturn.current = request;
    setPromptId(returnPlanId);
  }, [enabled, actorId, authLoading, returnPlanId, plans]);

  useEffect(() => {
    if (!enabled || (promptId && !plans.some(plan => plan.id === promptId))) setPromptId(``);
  }, [enabled, promptId, plans]);

  const getState = (planId: string): PricingInterestState => {
    const current = state.scope === scopeKey;
    return {
      error: current ? errors[planId] || state.error : ``,
      notice: current ? notices[planId] ?? `` : ``,
      pending: current && !!pending[planId],
      vote: current ? state.values[planId]?.vote ?? null : null,
      loading: authLoading || (enabled && (!current || state.loading)),
      interested: current && (state.values[planId]?.interested ?? false),
      ready: current && enabled && !authLoading && !state.loading && !state.error && !!state.values[planId],
    };
  };
  const mutate = async (planId: string, operation: () => Promise<PlanInterestState>, notice: string) => {
    if (!getState(planId).ready || pendingPlans.current.has(planId)) return;
    const scope = epoch.current;
    pendingPlans.current.add(planId);
    setPending(current => ({ ...current, [planId]: true }));
    setErrors(current => ({ ...current, [planId]: `` }));
    setNotices(current => ({ ...current, [planId]: `` }));
    try {
      const value = await operation();
      if (epoch.current !== scope) return;
      if (value.planId !== planId) throw new Error(`Plan Interest Could Not Be Confirmed`);
      setState(current => ({ ...current, values: { ...current.values, [planId]: value } }));
      setNotices(current => ({ ...current, [planId]: local ? `${notice} · Saved On This Device` : notice }));
    } catch (failure) {
      if (epoch.current === scope) setErrors(current => ({ ...current, [planId]: failure instanceof Error ? failure.message : `Could Not Save Plan Interest` }));
    } finally {
      if (epoch.current === scope) {
        pendingPlans.current.delete(planId);
        setPending(current => ({ ...current, [planId]: false }));
      }
    }
  };
  const vote = (planId: string) => {
    const selected = getState(planId).vote === `up`;
    return mutate(planId, () => planInterestAPI.setPlanVote(planId, selected ? null : `up`), selected ? `Upvote Removed` : `Upvote Saved`);
  };
  const register = (planId: string) => {
    if (!enabled || authLoading || !plans.some(plan => plan.id === planId)) return;
    if (!signedIn) { setPromptId(planId); return; }
    if (getState(planId).interested) return;
    return mutate(planId, () => planInterestAPI.registerPlanInterest(planId), `Interest Saved`);
  };
  const closePrompt = () => {
    const current = activePrompt.current;
    if (pendingPlans.current.has(current)) return;
    setPromptId(``);
    if (returnPlanId === current) router.setParams({ planInterest: undefined });
  };
  const authenticate = (mode: `signin` | `signup`) => {
    if (!enabled || authLoading || !promptId || pendingPlans.current.has(promptId)) return;
    const planInterest = promptId;
    setPromptId(``);
    router.push({ pathname: mode === `signin` ? routes.signin.href : routes.signup.href, params: { planInterest, returnTo: routes.pricing.href } });
  };
  return { local, signedIn, getState, refresh, vote, register, authenticate, closePrompt, prompt: enabled && !authLoading ? plans.find(plan => plan.id === promptId) : undefined };
};
