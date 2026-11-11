import { Roles } from '../../types/types';
import { plansAPI } from '../../api/plans';
import type { AdminFeatureKey } from './features';
import { marketplaceAPI } from '../../api/marketplace';
import type { Plan } from '../../shared/models/plans/Plan';
import { useAuth } from '../../shared/authContext/useAuth';
import { useRef, useMemo, useState, useEffect } from 'react';
import { isFeaturePlan } from '../../shared/featureFlags/values';
import { getAccountRoleLabel } from '../AdminUsers/tableElements';
import { canManageFeatures } from '../../shared/admin/permissions';
import { useFeatureFlags } from '../../shared/featureFlags/useFeatureFlags';
import { prepareFeaturePlanTiers } from '../../shared/featureFlags/service';
import { featurePlanLimit } from '../../shared/featureFlags/types';
import { defaultMarketplaceSellerPolicy, type MarketplaceSellerPolicy, type MarketplaceSellerPolicyChange } from '../../shared/marketplace/sellerPolicy';

type Option = { value: string; label: string };
type SaveState = { scope: string; pending: Partial<Record<AdminFeatureKey, boolean>>; errors: Partial<Record<AdminFeatureKey, string>> };
type PlanState = { request: string; loading: boolean; error: string; options: Option[] };
type PolicyState = { scope: string; value: MarketplaceSellerPolicy | null; error: string };
const emptyState = (scope: string): SaveState => ({ scope, errors: {}, pending: {} });
const roleOptions = Object.values(Roles).map(value => ({ value, label: getAccountRoleLabel(value) }));
const freePlan = { value: `free`, label: `Free` };

export const useAdminFeatures = () => {
  const { user } = useAuth();
  const featureFlags = useFeatureFlags();
  const scope = JSON.stringify([user?.id, user?.role, user?.active]);
  const canManage = canManageFeatures(user);
  const [planRevision, setPlanRevision] = useState(0);
  const [policyRevision, setPolicyRevision] = useState(0);
  const request = JSON.stringify([scope, planRevision]);
  const actor = useRef(scope);
  const planRequest = useRef(request);
  const pending = useRef(new Map<AdminFeatureKey, { scope: string }>());
  actor.current = scope;
  planRequest.current = request;
  const [saveState, setSaveState] = useState<SaveState>(() => emptyState(scope));
  const [plans, setPlans] = useState<PlanState>({ request, loading: canManage, error: ``, options: [] });
  const [policyState, setPolicyState] = useState<PolicyState>({ scope, value: null, error: `` });
  const current = saveState.scope === scope ? saveState : emptyState(scope);
  const currentPlans = plans.request === request ? plans : { request, loading: canManage, error: ``, options: [] };
  const policy = policyState.scope === scope ? policyState.value : null;
  const policyError = featureFlags.source === `local` ? `Connect Firebase To Manage Marketplace Listings` : policyState.scope === scope ? policyState.error : ``;
  const flags = { ...featureFlags.settings.flags, marketplaceListings: policy?.enabled ?? false };
  const audiences = { ...featureFlags.settings.audiences, marketplaceListings: policy?.audience ?? defaultMarketplaceSellerPolicy.audience };
  const disabled = !canManage || !featureFlags.ready || featureFlags.loading || !!featureFlags.error;
  const featureReady = (key: AdminFeatureKey) => key === `marketplaceListings` ? !!policy && !policyError : featureFlags.ready;
  const featureDisabled = (key: AdminFeatureKey) => key === `marketplaceListings` ? !canManage || !featureReady(key) : disabled;
  useEffect(() => {
    if (!canManage || featureFlags.source === `local`) return;
    const controller = new AbortController();
    setPolicyState({ scope, value: null, error: `` });
    void marketplaceAPI.getSellerPolicy(controller.signal).then(value => {
      if (!controller.signal.aborted && actor.current === scope) setPolicyState({ scope, value, error: `` });
    }).catch(failure => {
      if (!controller.signal.aborted && actor.current === scope) setPolicyState({ scope, value: null, error: failure instanceof Error ? failure.message : `Unable To Load Marketplace Policy` });
    });
    return () => controller.abort();
  }, [scope, canManage, policyRevision, featureFlags.source]);
  useEffect(() => {
    let active = true;
    const isCurrent = () => active && planRequest.current === request;
    setPlans({ request, loading: canManage, error: ``, options: [] });
    if (!canManage) return;
    const load = async () => {
      const records: Plan[] = [];
      let cursor: number | null = null;
      for (let pageIndex = 0; pageIndex < 100; pageIndex++) {
        const page = await plansAPI.getPlansPage(cursor);
        if (!isCurrent()) return;
        records.push(...page.records);
        if (new Set([freePlan.value, ...records.map(plan => plan.slug)]).size > featurePlanLimit) throw new Error(`Feature Targeting Supports Up To ${featurePlanLimit} Plans — Nothing Was Changed`);
        if (page.nextCursor === null) {
          const options = new Map<string, Option>([[freePlan.value, freePlan]]);
          records.sort((first, second) => first.displayOrder - second.displayOrder || first.number - second.number).forEach(plan => options.set(plan.slug, { value: plan.slug, label: plan.name }));
          await prepareFeaturePlanTiers(records);
          if (!isCurrent()) return;
          setPlans({ request, error: ``, loading: false, options: [...options.values()] });
          return;
        }
        if (cursor !== null && page.nextCursor >= cursor) throw new Error(`Plan Catalog Could Not Be Read — Refresh And Try Again`);
        cursor = page.nextCursor;
      }
      throw new Error(`Plan Catalog Is Too Large To Load — Nothing Was Changed`);
    };
    void load().catch(failure => {
      if (isCurrent()) setPlans({ request, options: [], loading: false, error: failure instanceof Error ? failure.message : `Unable To Load Plans` });
    });
    return () => { active = false; };
  }, [request, canManage]);
  const planAudienceOptions = useMemo(() => {
    const options = new Map<string, Option>(currentPlans.options.map(option => [option.value, option] as const));
    if (!options.has(freePlan.value)) options.set(freePlan.value, freePlan);
    const saved = [...Object.values(featureFlags.settings.audiences), ...(policy ? [policy.audience] : [])].flatMap(audience => audience.plans ?? []);
    for (const value of saved) if (isFeaturePlan(value) && !options.has(value)) options.set(value, { value, label: value });
    return [...options.values()];
  }, [currentPlans.options, featureFlags.settings.audiences, policy]);
  const planOptions = planAudienceOptions.filter(option => option.value !== freePlan.value);
  const planError = currentPlans.error || (planAudienceOptions.length > featurePlanLimit ? `Feature Targeting Supports Up To ${featurePlanLimit} Plans — Nothing Was Changed` : ``);
  const isPlanAvailable = (value: string) => currentPlans.options.some(option => option.value === value);
  const selectedPlan = (key: AdminFeatureKey) => {
    const audience = audiences[key];
    const selected = audience.plans;
    if (!selected?.length || selected.includes(freePlan.value)) return null;
    return audience.planMode === `minimum` ? selected[0] ?? null : currentPlans.options.find(option => selected.includes(option.value))?.value ?? selected[0] ?? null;
  };
  const runSave = async (key: AdminFeatureKey, operation: () => Promise<void>) => {
    if (featureDisabled(key) || pending.current.get(key)?.scope === scope) return;
    const saveRequest = { scope };
    pending.current.set(key, saveRequest);
    setSaveState(previous => {
      const saved = previous.scope === scope ? previous : emptyState(scope);
      return { ...saved, errors: { ...saved.errors, [key]: `` }, pending: { ...saved.pending, [key]: true } };
    });
    try { await operation(); }
    catch (failure) {
      const error = failure instanceof Error ? failure.message : `Unable To Save Feature`;
      if (actor.current === scope && pending.current.get(key) === saveRequest) setSaveState(previous => previous.scope === scope ? { ...previous, errors: { ...previous.errors, [key]: error } } : previous);
    } finally {
      if (pending.current.get(key) === saveRequest) {
        pending.current.delete(key);
        if (actor.current === scope) setSaveState(previous => previous.scope === scope ? { ...previous, pending: { ...previous.pending, [key]: false } } : previous);
      }
    }
  };
  const updatePolicy = async (change: MarketplaceSellerPolicyChange) => {
    const value = await marketplaceAPI.updateSellerPolicy(change);
    if (actor.current === scope) setPolicyState({ scope, value, error: `` });
  };
  const save = (key: AdminFeatureKey, enabled: boolean) => flags[key] === enabled ? Promise.resolve() : runSave(key, () => key === `marketplaceListings`
    ? updatePolicy({ field: `enabled`, value: enabled }) : featureFlags.setFeatureFlag(key, enabled));
  const toggleRole = (key: AdminFeatureKey, value: string) => runSave(key, () => {
    const allowed = !(audiences[key].roles === null || audiences[key].roles?.includes(value));
    return key === `marketplaceListings` ? updatePolicy({ field: `role`, role: value, allowed }) : featureFlags.setFeatureAudience(key, `roles`, value, allowed, roleOptions.map(option => option.value));
  });
  const togglePlan = (key: AdminFeatureKey, value: string) => currentPlans.loading || planError || (!isPlanAvailable(value) && selectedPlan(key) !== value) ? Promise.resolve() : runSave(key, () => key === `marketplaceListings`
    ? updatePolicy({ field: `minimumPlan`, value: selectedPlan(key) === value ? null : value }) : featureFlags.setFeatureAudience(key, `plans`, value, selectedPlan(key) !== value, planAudienceOptions.map(option => option.value)));
  return {
    ...featureFlags, ...current, save, flags, audiences, toggleRole, togglePlan, selectedPlan, roleOptions, planOptions, isPlanAvailable, featureReady, featureDisabled,
    planError, policyError,
    planLoading: currentPlans.loading,
    policyLoading: canManage && !policy && !policyError,
    refreshPlans: () => setPlanRevision(value => value + 1),
    refreshPolicy: () => setPolicyRevision(value => value + 1),
  };
};
