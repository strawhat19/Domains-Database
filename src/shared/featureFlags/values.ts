import { genID } from '../common/ids';
import { Roles } from '../../types/types';
import { Timestamp } from 'firebase/firestore';
import type { PlanTier } from '../plans/types';
import type { User } from '../models/users/User';
import { defaultFeatureFlags, featureFlagKeys, featurePlanLimit, type FeatureFlags, type FeatureSettings, type FeatureAudiences, type FeatureAudienceDimension } from './types';

const identity = genID(`FeatureSettings`, 1, `Global`, new Date(`2026-10-12T04:00:00.000Z`), `cb23b14255924fdd95957eac7ca7e35e`);
export const featureSettingsId = identity.id;
const fields = [`id`, `name`, `type`, `flags`, `number`, `version`, `created`, `updated`];
export const createFeatureAudiences = (): FeatureAudiences => Object.fromEntries(featureFlagKeys.map(key => [key, { roles: null, plans: null, planMode: `minimum` }])) as FeatureAudiences;
const roleValues: string[] = Object.values(Roles);
export const isFeaturePlan = (value: unknown): value is string => typeof value === `string` && value.length <= 100 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const unreadable = () => new Error(`Saved Features Could Not Be Read — Nothing Was Changed`);
const readAudienceValues = (value: unknown, dimension: FeatureAudienceDimension): string[] | null => {
  if (value === null) return null;
  if (!Array.isArray(value) || value.length > (dimension === `roles` ? roleValues.length : featurePlanLimit)
    || new Set(value).size !== value.length || value.some(item => dimension === `roles` ? !roleValues.includes(item) : !isFeaturePlan(item))) throw unreadable();
  return [...value];
};
const readAudiences = (value: unknown): FeatureAudiences => {
  if (value === undefined) return createFeatureAudiences();
  if (!value || typeof value !== `object` || Array.isArray(value)) throw unreadable();
  const data = value as Record<string, unknown>;
  if (Object.keys(data).length !== featureFlagKeys.length || featureFlagKeys.some(key => !(key in data))) throw unreadable();
  return Object.fromEntries(featureFlagKeys.map(key => {
    const audience = data[key] as Record<string, unknown> | undefined;
    if (!audience || typeof audience !== `object` || Array.isArray(audience) || Object.keys(audience).some(field => ![`roles`, `plans`, `planMode`].includes(field))
      || !(`roles` in audience) || !(`plans` in audience) || (`planMode` in audience && audience.planMode !== `minimum`)) throw unreadable();
    const plans = readAudienceValues(audience.plans, `plans`);
    if (audience.planMode === `minimum` && plans && plans.length > 1) throw unreadable();
    return [key, { roles: readAudienceValues(audience.roles, `roles`), plans, ...(audience.planMode === `minimum` ? { planMode: `minimum` } : {}) }];
  })) as FeatureAudiences;
};
export const featureRequiresPlanTiers = (settings: FeatureSettings) => featureFlagKeys.some(key => settings.flags[key]
  && settings.audiences[key].planMode === `minimum` && !!settings.audiences[key].plans?.length && settings.audiences[key].plans?.[0] !== `free`);
export const resolveFeatureFlags = (settings: FeatureSettings, user: Pick<User, `role` | `plan` | `active`> | null, tiers: readonly PlanTier[] = []): FeatureFlags => {
  const role = user?.role ?? Roles.Guest;
  const plan = typeof user?.plan === `string` ? user.plan.toLowerCase() : user ? `` : `free`;
  const valid = !user || (user.active && roleValues.includes(role) && isFeaturePlan(plan));
  return Object.fromEntries(featureFlagKeys.map(key => {
    const audience = settings.audiences[key];
    const minimum = audience.plans?.[0];
    const selectedTier = tiers.find(tier => tier.slug === minimum);
    const viewerTier = tiers.find(tier => tier.slug === plan);
    const plansAllow = audience.planMode === `minimum` ? !minimum || minimum === `free` || (plan !== `free` && !!selectedTier && !!viewerTier
      && (viewerTier.displayOrder > selectedTier.displayOrder || (viewerTier.displayOrder === selectedTier.displayOrder && viewerTier.number >= selectedTier.number)))
      : audience.plans === null || audience.plans.includes(plan);
    return [key, valid && settings.flags[key] && (audience.roles === null || audience.roles.includes(role)) && plansAllow];
  })) as FeatureFlags;
};
export const migrateFeaturePlanTiers = (settings: FeatureSettings, tiers: readonly PlanTier[]): FeatureSettings => ({
  ...settings,
  audiences: Object.fromEntries(featureFlagKeys.map(key => {
    const audience = settings.audiences[key];
    if (audience.planMode === `minimum`) return [key, audience];
    const selected = audience.plans;
    const minimum = [...tiers].sort((first, second) => first.displayOrder - second.displayOrder || first.number - second.number).find(tier => selected?.includes(tier.slug))?.slug ?? selected?.[0];
    return [key, { ...audience, planMode: `minimum`, plans: !selected?.length || selected.includes(`free`) ? null : [minimum!] }];
  })) as FeatureAudiences,
});
export const changeFeatureAudience = (settings: FeatureSettings, key: keyof FeatureFlags, dimension: FeatureAudienceDimension, value: string, enabled: boolean, allValues: readonly string[]): FeatureSettings => {
  const universe = readAudienceValues([...new Set(allValues)], dimension)!;
  if (!universe.includes(value) || typeof enabled !== `boolean`) throw new Error(`Choose A Valid Feature Audience`);
  if (dimension === `plans`) return { ...settings, audiences: { ...settings.audiences, [key]: { ...settings.audiences[key], planMode: `minimum`, plans: enabled && value !== `free` ? [value] : null } } };
  const original = settings.audiences[key][dimension];
  const selected = new Set(original ?? universe);
  if (enabled) selected.add(value);
  else selected.delete(value);
  const next = universe.every(item => selected.has(item)) && selected.size === universe.length ? null : [...selected];
  readAudienceValues(next, dimension);
  return { ...settings, audiences: { ...settings.audiences, [key]: { ...settings.audiences[key], [dimension]: next } } };
};
const readDate = (value: unknown) => {
  const date = value instanceof Timestamp ? value.toDate().toISOString() : value;
  if (typeof date !== `string` || !Number.isFinite(new Date(date).getTime())) throw unreadable();
  return date;
};
export const readFeatureSettings = (value: unknown): FeatureSettings => {
  if (!value || typeof value !== `object` || Array.isArray(value)) throw unreadable();
  const data = value as Record<string, unknown>;
  const flags = data.flags as Record<string, unknown> | undefined;
  if (fields.some(field => !(field in data)) || Object.keys(data).some(field => !fields.includes(field) && field !== `audiences`)
    || data.id !== featureSettingsId || data.number !== 1 || data.version !== 1 || data.name !== `Global` || data.type !== `FeatureSettings`
    || !flags || typeof flags !== `object` || Array.isArray(flags) || Object.keys(flags).length !== featureFlagKeys.length
    || featureFlagKeys.some(key => typeof flags[key] !== `boolean`)) throw unreadable();
  return { ...data, flags: { ...flags }, audiences: readAudiences(data.audiences), created: readDate(data.created), updated: readDate(data.updated) } as FeatureSettings;
};
export const createFeatureSettings = (flags: FeatureFlags = defaultFeatureFlags): FeatureSettings => ({
  number: 1,
  version: 1,
  name: `Global`,
  id: featureSettingsId,
  flags: { ...flags },
  audiences: createFeatureAudiences(),
  type: `FeatureSettings`,
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
});
