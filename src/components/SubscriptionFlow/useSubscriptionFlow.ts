import { plansAPI } from '../../api/plans';
import { Roles } from '../../types/types';
import { routes } from '../../shared/routes';
import { useLocalSearchParams } from 'expo-router';
import type { Plan } from '../../shared/models/plans/Plan';
import { useAuth } from '../../shared/authContext/useAuth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppBrand } from '../../shared/branding/useAppBrand';
import { useStarterAccess } from '../../shared/plans/useStarterAccess';
import { getPricingFeatureLabels, getPricingFeaturePresentation } from '../../shared/plans/pricingFeatures';
import { subscriptionAPI, subscriptionStorageSource, type SubscriptionRequest } from '../../api/subscriptions';

interface RequestState {
  scope: string;
  error: string;
  loading: boolean;
  request: SubscriptionRequest | null;
}

const paymentNotice = `Payment is not available yet. Saving a request does not charge you or activate paid features. Paid access can begin only after payment setup and a confirmed subscription.`;

export const useSubscriptionFlow = () => {
  const auth = useAuth();
  const brand = useAppBrand();
  const access = useStarterAccess();
  const params = useLocalSearchParams<{ plan?: string | string[] }>();
  const validPlan = params.plan === `starter`;
  const [revision, setRevision] = useState(0);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planError, setPlanError] = useState(``);
  const [planLoading, setPlanLoading] = useState(true);
  const [savingScope, setSavingScope] = useState(``);
  const [requestState, setRequestState] = useState<RequestState>({ scope: ``, error: ``, request: null, loading: true });
  const pending = useRef(``);
  const mounted = useRef(true);
  const owner = auth.user?.active === true && auth.user.role === Roles.Owner;
  const userId = auth.user?.id ?? ``;
  const signedIn = !auth.loading && !!userId && auth.user?.active === true && !auth.user.anonymous;
  const scope = `${userId || `guest`}:${auth.user?.active}:${auth.user?.role}:${auth.user?.plan}:${auth.loginRevision}:${auth.dataRevision}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const currentRequest = requestState.scope === scope ? requestState : null;
  const request = currentRequest?.request ?? null;
  const saving = savingScope === scope;
  const existingAccess = signedIn && !access.loading && access.allowed;
  const needsRequest = validPlan && signedIn && !access.loading && !access.error && !existingAccess;
  const requestLoading = needsRequest && (!currentRequest || currentRequest.loading);
  const ready = needsRequest && !auth.busy && !!plan && !planLoading && !planError && !requestLoading && !currentRequest?.error;
  const saved = !!plan && request?.status === `awaiting-payment-setup` && request.planSlug === `starter` && request.planId === plan.id
    && request.priceCents === plan.priceCents && request.currency === plan.currency && request.billingInterval === plan.billingInterval;
  const changedOffer = !!request && !!plan && !saved;
  const activeStep = saved || existingAccess ? 2 : signedIn ? 1 : 0;
  const features = plan ? getPricingFeatureLabels(plan, brand.formatText).map((feature, index) => ({ id: `${plan.id}-${index}`, ...getPricingFeaturePresentation(feature) })) : [];
  const authParams = { plan: `starter`, returnTo: routes.subscription.href };
  const signUpHref = { pathname: routes.signup.href, params: authParams };
  const signInHref = { pathname: routes.signin.href, params: authParams };
  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    setPlan(null);
    setPlanError(``);
    setPlanLoading(validPlan);
    if (!validPlan) return;
    let active = true;
    const stop = plansAPI.subscribePublishedPlans(plans => {
      if (!active) return;
      setPlan(plans.find(current => current.slug === `starter`) ?? null);
      setPlanError(``);
      setPlanLoading(false);
    }, failure => {
      if (!active) return;
      setPlan(null);
      setPlanError(failure.message);
      setPlanLoading(false);
    });
    return () => { active = false; stop(); };
  }, [validPlan, revision]);

  useEffect(() => {
    if (!needsRequest) return;
    let active = true;
    setRequestState({ scope, error: ``, request: null, loading: true });
    void subscriptionAPI.getRequest(userId).then(value => {
      if (active && currentScope.current === scope) setRequestState({ scope, error: ``, request: value, loading: false });
    }).catch(failure => {
      if (active && currentScope.current === scope) setRequestState({ scope, request: null, loading: false, error: failure instanceof Error ? failure.message : `Could Not Load Your Subscription Request` });
    });
    return () => { active = false; };
  }, [needsRequest, scope, revision, userId]);

  const confirm = async () => {
    if (!ready || saved || pending.current === scope || !plan || !auth.user?.id) return;
    const actorId = auth.user.id;
    const operationScope = scope;
    pending.current = operationScope;
    setSavingScope(operationScope);
    setRequestState(current => ({ ...current, error: `` }));
    try {
      const value = await subscriptionAPI.saveRequest(actorId, plan);
      if (mounted.current && currentScope.current === operationScope) setRequestState({ scope: operationScope, error: ``, request: value, loading: false });
    } catch (failure) {
      if (mounted.current && currentScope.current === operationScope) setRequestState(current => ({ ...current, scope: operationScope, loading: false, error: failure instanceof Error ? failure.message : `Could Not Save Your Subscription Request` }));
    } finally {
      if (pending.current === operationScope) pending.current = ``;
      if (mounted.current && currentScope.current === operationScope) setSavingScope(``);
    }
  };

  return {
    auth,
    plan,
    brand,
    owner,
    access,
    saved,
    saving,
    request,
    refresh,
    confirm,
    features,
    signedIn,
    validPlan,
    planError,
    changedOffer,
    activeStep,
    signUpHref,
    signInHref,
    planLoading,
    existingAccess,
    paymentNotice,
    requestLoading,
    requestedDate: request ? new Date(request.requestedAt).toLocaleDateString() : ``,
    local: subscriptionStorageSource === `local`,
    error: currentRequest?.error ?? ``,
    canConfirm: ready && !saving && !saved,
  };
};
