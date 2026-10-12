import { Roles } from '../../types/types';
import { plansAPI } from '../../api/plans';
import type { Plan } from '../../shared/models/plans/Plan';
import { useAuth } from '../../shared/authContext/useAuth';
import { useRef, useMemo, useState, useEffect } from 'react';
import { isFeaturePlan } from '../../shared/featureFlags/values';
import { getAccountRoleLabel } from '../AdminUsers/tableElements';
import { canManageFeatures } from '../../shared/admin/permissions';
import { useFeatureFlags } from '../../shared/featureFlags/useFeatureFlags';
import { prepareFeaturePlanTiers } from '../../shared/featureFlags/service';
import { featurePlanLimit, type FeatureFlagKey } from '../../shared/featureFlags/types';

type Option = { value: string; label: string };
type SaveState = { scope: string; pending: Partial<Record<FeatureFlagKey, boolean>>; errors: Partial<Record<FeatureFlagKey, string>> };
type PlanState = { request: string; loading: boolean; error: string; options: Option[] };
const emptyState = (scope: string): SaveState => ({ scope, errors: {}, pending: {} });
const roleOptions = Object.values(Roles).map(value => ({ value, label: getAccountRoleLabel(value) }));
const freePlan = { value: `free`, label: `Free` };

export const useAdminFeatures = () => {
  const { user } = useAuth();
  const featureFlags = useFeatureFlags();
  const scope = JSON.stringify([user?.id, user?.role, user?.active]);
  const canManage = canManageFeatures(user);
  const [planRevision, setPlanRevision] = useState(0);
  const request = JSON.stringify([scope, planRevision]);
  const actor = useRef(scope);
  const planRequest = useRef(request);
  const pending = useRef(new Map<FeatureFlagKey, { scope: string }>());
  actor.current = scope;
  planRequest.current = request;
  const [saveState, setSaveState] = useState<SaveState>(() => emptyState(scope));
  const [plans, setPlans] = useState<PlanState>({ request, loading: canManage, error: ``, options: [] });
  const current = saveState.scope === scope ? saveState : emptyState(scope);
  const currentPlans = plans.request === request ? plans : { request, loading: canManage, error: ``, options: [] };
  const flags = featureFlags.settings.flags;
  const audiences = featureFlags.settings.audiences;
  const disabled = !canManage || !featureFlags.ready || featureFlags.loading || !!featureFlags.error;
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
    const saved = Object.values(audiences).flatMap(audience => audience.plans ?? []);
    for (const value of saved) if (isFeaturePlan(value) && !options.has(value)) options.set(value, { value, label: value });
    return [...options.values()];
  }, [currentPlans.options, audiences]);
  const planOptions = planAudienceOptions.filter(option => option.value !== freePlan.value);
  const planError = currentPlans.error || (planAudienceOptions.length > featurePlanLimit ? `Feature Targeting Supports Up To ${featurePlanLimit} Plans — Nothing Was Changed` : ``);
  const isPlanAvailable = (value: string) => currentPlans.options.some(option => option.value === value);
  const selectedPlan = (key: FeatureFlagKey) => {
    const audience = audiences[key];
    const selected = audience.plans;
    if (!selected?.length || selected.includes(freePlan.value)) return null;
    return audience.planMode === `minimum` ? selected[0] ?? null : currentPlans.options.find(option => selected.includes(option.value))?.value ?? selected[0] ?? null;
  };
  const runSave = async (key: FeatureFlagKey, operation: () => Promise<void>) => {
    if (disabled || pending.current.get(key)?.scope === scope) return;
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
  const save = (key: FeatureFlagKey, enabled: boolean) => flags[key] === enabled ? Promise.resolve() : runSave(key, () => featureFlags.setFeatureFlag(key, enabled));
  const toggleRole = (key: FeatureFlagKey, value: string) => runSave(key, () => featureFlags.setFeatureAudience(key, `roles`, value, !(audiences[key].roles === null || audiences[key].roles?.includes(value)), roleOptions.map(option => option.value)));
  const togglePlan = (key: FeatureFlagKey, value: string) => currentPlans.loading || planError || (!isPlanAvailable(value) && selectedPlan(key) !== value) ? Promise.resolve() : runSave(key, () => featureFlags.setFeatureAudience(key, `plans`, value, selectedPlan(key) !== value, planAudienceOptions.map(option => option.value)));
  return {
    ...featureFlags, ...current, save, flags, disabled, audiences, toggleRole, togglePlan, selectedPlan, roleOptions, planOptions, isPlanAvailable,
    planError,
    planLoading: currentPlans.loading,
    refreshPlans: () => setPlanRevision(value => value + 1),
  };
};
