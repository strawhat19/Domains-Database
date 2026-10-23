import type { PropsWithChildren } from 'react';
import type { PlanTier } from '../plans/types';
import { useAuth } from '../authContext/useAuth';
import { subscribePlanTiers } from '../plans/service';
import { canManageFeatures } from '../admin/permissions';
import { useStarterAccess } from '../plans/useStarterAccess';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createFeatureSettings, resolveFeatureFlags, featureRequiresPlanTiers } from './values';
import type { FeatureFlags, FeatureFlagKey, FeatureSettings, FeatureAudienceDimension } from './types';
import { saveFeatureFlag, saveFeatureAudience, subscribeFeatureSettings, featureFlagsSource } from './service';

interface FeatureFlagsContextValue {
  error: string;
  ready: boolean;
  loading: boolean;
  flags: FeatureFlags;
  settings: FeatureSettings;
  refresh: () => void;
  source: `local` | `firestore`;
  setFeatureFlag: (key: FeatureFlagKey, enabled: boolean) => Promise<void>;
  setFeatureAudience: (key: FeatureFlagKey, dimension: FeatureAudienceDimension, value: string, enabled: boolean, allValues: readonly string[]) => Promise<void>;
}
export const FeatureFlagsContext = createContext<FeatureFlagsContextValue | undefined>(undefined);
export const FeatureFlagsProvider = ({ children }: PropsWithChildren) => {
  const { user, loading: authLoading } = useAuth();
  const access = useStarterAccess();
  const actor = useRef(user);
  actor.current = user;
  const [revision, setRevision] = useState(0);
  const [planTiers, setPlanTiers] = useState({ tiers: [] as PlanTier[], ready: false, loading: false, error: `` });
  const [state, setState] = useState(() => ({ ready: false, loading: true, error: ``, settings: createFeatureSettings() }));
  const needsPlanTiers = state.ready && featureRequiresPlanTiers(state.settings);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    let active = true;
    setState(current => ({ ...current, loading: true, error: `` }));
    const unsubscribe = subscribeFeatureSettings(settings => {
      if (active) setState({ settings, ready: true, loading: false, error: `` });
    }, failure => {
      if (active) setState(current => ({ ...current, loading: false, error: failure.message }));
    });
    return () => { active = false; unsubscribe(); };
  }, [revision]);
  useEffect(() => {
    let active = true;
    setPlanTiers(current => needsPlanTiers ? { ...current, loading: true, error: `` } : { tiers: [], ready: false, loading: false, error: `` });
    if (!needsPlanTiers) return;
    const unsubscribe = subscribePlanTiers(tiers => {
      if (active) setPlanTiers({ tiers, ready: true, loading: false, error: `` });
    }, failure => {
      if (active) setPlanTiers(current => ({ ...current, loading: false, error: failure.message }));
    });
    return () => { active = false; unsubscribe(); };
  }, [revision, needsPlanTiers]);
  const setFeatureFlag = useCallback(async (key: FeatureFlagKey, enabled: boolean) => {
    const current = actor.current;
    if (!canManageFeatures(current) || !current?.id) throw new Error(`Owner Access Is Required`);
    await saveFeatureFlag(key, enabled, current.id);
    if (actor.current?.id !== current.id || !canManageFeatures(actor.current)) throw new Error(`Your Account Changed — Try Again`);
  }, []);
  const setFeatureAudience = useCallback(async (key: FeatureFlagKey, dimension: FeatureAudienceDimension, value: string, enabled: boolean, allValues: readonly string[]) => {
    const current = actor.current;
    if (!canManageFeatures(current) || !current?.id) throw new Error(`Owner Access Is Required`);
    await saveFeatureAudience(key, dimension, value, enabled, allValues, current.id);
    if (actor.current?.id !== current.id || !canManageFeatures(actor.current)) throw new Error(`Your Account Changed — Try Again`);
  }, []);
  const value = useMemo(() => ({ ...state, refresh, setFeatureFlag, setFeatureAudience, flags: resolveFeatureFlags(state.settings, user ? { ...user, plan: access.plan } : null, needsPlanTiers ? planTiers.tiers : []), source: featureFlagsSource,
    error: state.error || (needsPlanTiers ? planTiers.error : ``), ready: access.owner || (state.ready && !authLoading && !access.loading && (!needsPlanTiers || planTiers.ready)),
    loading: !access.owner && (state.loading || authLoading || access.loading || (needsPlanTiers && planTiers.loading)) }), [state, user, planTiers, authLoading, access.plan, access.owner, access.loading, needsPlanTiers, refresh, setFeatureFlag, setFeatureAudience]);
  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
};
