import { plansAPI } from '../../api/plans';
import { useEffect, useState } from 'react';
import { useLocalStorage } from '../../shared/config';
import type { Plan } from '../../shared/models/plans/Plan';
import { useAuth } from '../../shared/authContext/useAuth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { firebaseEnabled } from '../../shared/firebase/config';
import { routes, resolveAuthReturnTo } from '../../shared/routes';
import { resolveEnrollmentPlan } from '../../shared/plans/enrollment';
import { resolvePlanInterestId } from '../../shared/plans/interestReturn';
import { AccountDeactivatedError } from '../../shared/authentication/types';

export type AuthMode = `signin` | `signup`;
type Field = `email` | `password`;

export const useAuthForm = (mode: AuthMode) => {
  const auth = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string | string[]; plan?: string | string[]; returnTo?: string | string[]; planInterest?: string | string[] }>();
  const enrollmentPlan = resolveEnrollmentPlan(params.plan);
  const returnTo = enrollmentPlan === `starter` ? routes.subscription.href : enrollmentPlan === `free` ? routes.domains.href : resolveAuthReturnTo(params.returnTo);
  const planInterest = returnTo === routes.pricing.href ? resolvePlanInterestId(params.planInterest) : ``;
  const query = returnTo === routes.search.href && typeof params.q === `string` ? params.q.trim().slice(0, 253) : ``;
  const [feedback, setFeedback] = useState(``);
  const [showPassword, setShowPassword] = useState(false);
  const [canReactivate, setCanReactivate] = useState(false);
  const [fields, setFields] = useState({ email: ``, password: `` });
  const [offer, setOffer] = useState<{ slug: string; plan: Plan | null; error: string }>({ slug: ``, plan: null, error: `` });
  const disabled = auth.loading || auth.busy;
  const signingUp = mode === `signup`;

  useEffect(() => {
    if (!enrollmentPlan) return;
    let active = true;
    setOffer({ slug: enrollmentPlan, plan: null, error: `` });
    const stop = plansAPI.subscribePublishedPlans(plans => {
      if (!active) return;
      const plan = plans.find(plan => plan.slug === enrollmentPlan) ?? null;
      setOffer({ slug: enrollmentPlan, plan, error: plan ? `` : `This Plan Is Not Currently Available` });
    }, failure => { if (active) setOffer({ slug: enrollmentPlan, plan: null, error: failure.message }); });
    return () => { active = false; stop(); };
  }, [enrollmentPlan]);

  const updateField = (field: Field, value: string) => {
    setFeedback(``);
    setCanReactivate(false);
    auth.clearError();
    auth.clearNotice();
    setFields(current => ({ ...current, [field]: value }));
  };

  const finishAuthentication = () => {
    setCanReactivate(false);
    setFields({ email: ``, password: `` });
    router.replace(enrollmentPlan === `starter` ? { pathname: routes.subscription.href, params: { plan: enrollmentPlan } } : planInterest ? { pathname: routes.pricing.href, params: { planInterest } } : query ? { pathname: routes.search.href, params: { q: query } } : returnTo);
  };

  const signInWithGoogle = async () => {
    if (disabled) return;
    setFeedback(``);
    setCanReactivate(false);
    auth.clearError();
    auth.clearNotice();
    try {
      await auth.signInWithGoogle();
      finishAuthentication();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : `Could Not Sign In With Google`);
    }
  };

  const authenticate = async (reactivate = false) => {
    if (disabled) return;
    setFeedback(``);
    auth.clearError();
    auth.clearNotice();
    if (!useLocalStorage && !firebaseEnabled) { setFeedback(`Backend Is Not Connected`); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) { setFeedback(`Enter A Valid Email Address`); return; }
    if (!fields.password) { setFeedback(`Enter A Password`); return; }
    try {
      const input = { email: fields.email.trim(), password: fields.password };
      if (signingUp) await auth.signUp(input);
      else await auth.signIn({ ...input, ...(reactivate ? { reactivate: true } : {}) });
      finishAuthentication();
    } catch (error) {
      setCanReactivate(useLocalStorage && !signingUp && error instanceof AccountDeactivatedError);
      setFeedback(error instanceof Error ? error.message : `Could Not Access Your Account`);
    }
  };

  const submit = () => authenticate();
  const reactivate = () => { if (canReactivate && !signingUp) return authenticate(true); };

  const navigate = (href: `/signin` | `/signup` | `/profile`) => {
    if (disabled) return;
    if (href === `/profile`) router.push(href);
    else router.push({ pathname: href, params: { returnTo, ...(query ? { q: query } : {}), ...(enrollmentPlan ? { plan: enrollmentPlan } : {}), ...(planInterest ? { planInterest } : {}) } });
  };

  const clearFeedback = () => { setFeedback(``); auth.clearError(); };

  return {
    auth,
    fields,
    submit,
    disabled,
    navigate,
    enrollmentPlan,
    reactivate,
    signingUp,
    updateField,
    clearFeedback,
    showPassword,
    canReactivate,
    setShowPassword,
    signInWithGoogle,
    selectedOffer: offer.slug === enrollmentPlan ? offer.plan : null,
    offerError: offer.slug === enrollmentPlan ? offer.error : ``,
    continueEnrollment: () => { if (enrollmentPlan && !disabled) finishAuthentication(); },
    error: feedback || auth.error,
  };
};
