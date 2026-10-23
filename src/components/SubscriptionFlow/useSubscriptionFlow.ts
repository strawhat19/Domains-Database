import { Roles } from '../../types/types';
import { plansAPI } from '../../api/plans';
import { routes } from '../../shared/routes';
import { AppState, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getPricingAmount } from '../Pricing/presentation';
import type { Plan } from '../../shared/models/plans/Plan';
import { useAuth } from '../../shared/authContext/useAuth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppBrand } from '../../shared/branding/useAppBrand';
import { useStarterAccess } from '../../shared/plans/useStarterAccess';
import { subscriptionAPI, type BillingStatus } from '../../api/subscriptions';
import { getPricingFeatureLabels, getPricingFeaturePresentation } from '../../shared/plans/pricingFeatures';

interface BillingState {
  scope: string;
  error: string;
  loading: boolean;
  returnVerified: boolean;
  status: BillingStatus | null;
}
const errorMessage = (failure: unknown) => failure instanceof Error ? failure.message : `Billing Is Unavailable — Try Again`;
const endedStatuses = new Set([`canceled`, `incomplete_expired`]);

export const useSubscriptionFlow = () => {
  const auth = useAuth();
  const brand = useAppBrand();
  const access = useStarterAccess();
  const params = useLocalSearchParams<{ plan?: string | string[]; billing?: string | string[]; checkout?: string | string[]; session_id?: string | string[] }>();
  const validPlan = params.plan === `starter`;
  const checkoutReturn = typeof params.checkout === `string` ? params.checkout : ``;
  const sessionId = typeof params.session_id === `string` ? params.session_id : ``;
  const [revision, setRevision] = useState(0);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planError, setPlanError] = useState(``);
  const [planLoading, setPlanLoading] = useState(true);
  const [actionState, setActionState] = useState({ scope: ``, action: ``, error: `` });
  const [billingState, setBillingState] = useState<BillingState>({ scope: ``, error: ``, status: null, loading: true, returnVerified: false });
  const pending = useRef(``);
  const mounted = useRef(true);
  const actionController = useRef<AbortController | null>(null);
  const userId = auth.user?.id ?? ``;
  const firebaseUid = auth.user?.firebase_uid ?? ``;
  const owner = !auth.loading && auth.user?.active === true && auth.user.role === Roles.Owner;
  const signedIn = !auth.loading && !!userId && auth.user?.active === true && !auth.user.anonymous;
  const scope = `${userId || `guest`}:${firebaseUid}:${auth.user?.active}:${auth.user?.role}:${auth.loginRevision}`;
  const currentScope = useRef(scope);
  const previousAccess = useRef({ scope, allowed: access.allowed });
  currentScope.current = scope;
  const currentBilling = billingState.scope === scope ? billingState : null;
  const status = currentBilling?.status ?? null;
  const error = (actionState.scope === scope ? actionState.error : ``) || currentBilling?.error || ``;
  const action = actionState.scope === scope ? actionState.action : ``;
  const saving = !!action;
  const billingLoading = signedIn && (!currentBilling || currentBilling.loading);
  const existingAccess = owner || status?.plan === `starter`;
  const subscription = status?.subscription ?? null;
  const needsPortal = !!subscription && !endedStatuses.has(subscription.status);
  const paymentProcessing = checkoutReturn === `success` && currentBilling?.returnVerified === true && !existingAccess
    && (!subscription || [`active`, `trialing`, `incomplete`].includes(subscription.status));
  const portalAvailable = status?.portalAvailable === true;
  const showCheckout = !owner && !existingAccess && !needsPortal && !paymentProcessing;
  const canConfirm = signedIn && showCheckout && !auth.busy && !!plan && !planLoading && !planError && !billingLoading && !error && !saving && status?.checkoutAvailable === true;
  const activeStep = existingAccess ? 3 : checkoutReturn === `success` ? 2 : signedIn ? 1 : 0;
  const features = plan ? getPricingFeatureLabels(plan, brand.formatText).map((feature, index) => ({ id: `${plan.id}-${index}`, ...getPricingFeaturePresentation(feature) })) : [];
  const authParams = { plan: `starter`, returnTo: routes.subscription.href };
  const signUpHref = { pathname: routes.signup.href, params: authParams };
  const signInHref = { pathname: routes.signin.href, params: authParams };
  const refresh = useCallback(() => { setRevision(value => value + 1); access.refresh(); }, [access.refresh]);
  const paymentNotice = `Continue to secure Stripe Checkout to review and pay. Your subscription renews automatically until cancelled in Manage Billing.${Platform.OS === `web` ? `` : ` Checkout opens in your browser.`}`;
  const period = plan?.billingInterval === `month` ? `Month` : plan?.billingInterval === `year` ? `Year` : `One Time`;
  const checkoutLabel = plan ? `Subscribe For ${getPricingAmount(plan)}/${period}` : `Subscribe`;
  const renewalDate = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : ``;
  const billingLabel = owner ? `Owner Access` : paymentProcessing ? `Payment Processing` : subscription?.cancelAtPeriodEnd && existingAccess ? `Cancellation Scheduled`
    : subscription?.status === `past_due` || subscription?.status === `unpaid` ? `Payment Needs Attention`
    : subscription?.status === `incomplete` ? `Payment Incomplete` : subscription?.status === `paused` ? `Subscription Paused`
    : existingAccess ? `Starter Subscription Active` : subscription && endedStatuses.has(subscription.status) ? `Subscription Ended` : `Free Plan`;
  const billingCopy = owner ? `Your active Owner account has access to every feature without a paid subscription.`
    : paymentProcessing ? `Stripe has not confirmed an active subscription yet. Paid features unlock only after confirmation. Refresh your billing status if this takes a moment.`
    : subscription?.cancelAtPeriodEnd && existingAccess ? `Your subscription will end${renewalDate ? ` on ${renewalDate}` : ` at the end of its paid period`}. Starter features remain available until then. You can review your cancellation in Manage Billing.`
    : existingAccess ? `Your confirmed subscription includes Starter features.${renewalDate ? ` Your current billing period ends on ${renewalDate}.` : ``}`
    : needsPortal ? `Your subscription is ${subscription?.status.replace(/_/g, ` `)}. Open Manage Billing to review payment details and restore access.`
    : `Review the price and included features, then subscribe through Stripe. Your account stays on Free until payment and subscription access are confirmed.`;
  const notice = checkoutReturn === `cancelled` ? `Checkout was cancelled. You can review the plan and try again.`
    : params.billing === `updated` && status ? `Your latest subscription status is shown below.` : ``;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; actionController.current?.abort(); };
  }, []);

  useEffect(() => () => { actionController.current?.abort(); pending.current = ``; }, [scope]);

  useEffect(() => {
    if (previousAccess.current.scope !== scope) { previousAccess.current = { scope, allowed: access.allowed }; return; }
    if (access.loading || access.error || previousAccess.current.allowed === access.allowed) return;
    previousAccess.current = { scope, allowed: access.allowed };
    setRevision(value => value + 1);
  }, [scope, access.error, access.allowed, access.loading]);

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
    if (!validPlan || !signedIn) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let polls = 0;
    let active = true;
    let returnVerified = false;
    const actor = { userId, firebaseUid };
    setBillingState({ scope, error: ``, status: null, loading: true, returnVerified: false });
    setActionState({ scope, action: ``, error: `` });
    const load = async (confirmReturn: boolean) => {
      let returnedError = ``;
      try {
        let result: BillingStatus;
        if (confirmReturn && checkoutReturn === `success` && !owner) {
          try {
            result = await subscriptionAPI.reconcile(actor, sessionId, controller.signal);
            returnVerified = true;
          } catch (failure) {
            if (controller.signal.aborted) return;
            returnedError = errorMessage(failure);
            result = await subscriptionAPI.getStatus(actor, controller.signal);
          }
        } else result = await subscriptionAPI.getStatus(actor, controller.signal);
        if (!active || currentScope.current !== scope) return;
        setBillingState({ scope, status: result, error: returnedError, loading: false, returnVerified });
        if (result.plan === `starter`) void auth.refreshUser().catch(() => undefined);
        if (returnVerified && result.plan !== `starter` && !result.owner && polls < 5) {
          polls += 1;
          timer = setTimeout(() => { void load(false); }, 3_000);
        }
      } catch (failure) {
        if (active && currentScope.current === scope) setBillingState({ scope, status: null, loading: false, returnVerified, error: errorMessage(failure) });
      }
    };
    void load(true);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [scope, owner, userId, revision, validPlan, signedIn, sessionId, firebaseUid, checkoutReturn, auth.refreshUser]);

  useEffect(() => {
    if (Platform.OS === `web` || !signedIn) return;
    const subscription = AppState.addEventListener(`change`, value => { if (value === `active`) refresh(); });
    return () => subscription.remove();
  }, [signedIn, refresh]);

  const runAction = async (type: `checkout` | `portal`) => {
    if (pending.current || !signedIn || auth.busy || (type === `checkout` ? !canConfirm || !plan : !portalAvailable || saving)) return;
    const operationScope = scope;
    const controller = new AbortController();
    actionController.current = controller;
    pending.current = operationScope;
    setActionState({ scope: operationScope, action: type, error: `` });
    try {
      const actor = { userId, firebaseUid };
      const url = type === `checkout` && plan ? await subscriptionAPI.createCheckout(actor, plan, controller.signal) : await subscriptionAPI.createPortal(actor, controller.signal);
      if (!mounted.current || currentScope.current !== operationScope || controller.signal.aborted) return;
      await subscriptionAPI.openBillingUrl(url);
    } catch (failure) {
      if (mounted.current && currentScope.current === operationScope && !controller.signal.aborted) setActionState({ scope: operationScope, action: ``, error: errorMessage(failure) });
    } finally {
      if (pending.current === operationScope) pending.current = ``;
      if (mounted.current && currentScope.current === operationScope) setActionState(current => ({ ...current, action: `` }));
    }
  };

  return {
    auth, plan, brand, owner, error, access, action, saving, status, notice, refresh, features, signedIn, validPlan, planError,
    activeStep, billingCopy, signUpHref, signInHref, planLoading, billingLabel, canConfirm, showCheckout, checkoutLabel,
    paymentNotice, billingLoading, existingAccess, portalAvailable, paymentProcessing,
    accessSyncing: !owner && existingAccess && (access.loading || !access.allowed),
    confirm: () => runAction(`checkout`),
    manageBilling: () => runAction(`portal`),
  };
};
