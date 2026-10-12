import { useLocalStorage } from '../config';
import type { PlanTier } from '../plans/types';
import type { Plan } from '../models/plans/Plan';
import { firebaseEnabled } from '../firebase/config';
import { canManageFeatures } from '../admin/permissions';
import { restoreSession } from '../authentication/service';
import { preparePlanTiers, subscribePlanTiers } from '../plans/service';
import { readStorage, writeStorage, subscribeStorage, createOperationQueue } from '../common/storage';
import { featureFlagsError, getCloudFeatureSettings, subscribeCloudFeatureSettings, updateCloudFeatureSettings } from './firebase';
import { featureFlagKeys, type FeatureFlagKey, type FeatureFlags, type FeatureSettings, type FeatureAudienceDimension } from './types';
import { readFeatureSettings, createFeatureSettings, resolveFeatureFlags, changeFeatureAudience, migrateFeaturePlanTiers, featureRequiresPlanTiers } from './values';

const storageKey = `domains-database:features:v1`;
const cloudEnabled = firebaseEnabled && !useLocalStorage;
const serialize = createOperationQueue(storageKey);
export const featureFlagsSource: `firestore` | `local` = cloudEnabled ? `firestore` : `local`;
const readLocalSettings = (saved: string | null) => {
  if (saved === null) return undefined;
  try { return readFeatureSettings(JSON.parse(saved)); }
  catch (failure) { throw featureFlagsError(failure); }
};
const requireLocalOwner = async (expectedActorId: string) => {
  if (!useLocalStorage) throw new Error(`Connect Firebase To Manage Features`);
  const user = (await restoreSession())?.user;
  if (!canManageFeatures(user) || user?.id !== expectedActorId) throw new Error(`Owner Access Is Required`);
};
export const getFeatureSettings = async (): Promise<FeatureSettings> => {
  try {
    if (cloudEnabled) return await getCloudFeatureSettings();
    if (!useLocalStorage) throw new Error(`Connect Firebase To Load Features`);
    return readLocalSettings(await readStorage(storageKey)) ?? createFeatureSettings();
  } catch (failure) { throw featureFlagsError(failure); }
};
const getPlanTiers = (): Promise<PlanTier[]> => new Promise((resolve, reject) => {
  let settled = false;
  let unsubscribe: () => void = () => undefined;
  const finish = (tiers?: PlanTier[], failure?: Error) => {
    if (settled) return;
    settled = true;
    unsubscribe();
    if (failure) reject(failure);
    else resolve(tiers ?? []);
  };
  unsubscribe = subscribePlanTiers(tiers => finish(tiers), failure => finish(undefined, failure));
  if (settled) unsubscribe();
});
export const getFeatureFlags = async (): Promise<FeatureFlags> => {
  const [settings, session] = await Promise.all([getFeatureSettings(), restoreSession()]);
  const tiers = featureRequiresPlanTiers(settings) ? await getPlanTiers() : [];
  return resolveFeatureFlags(settings, session?.user ?? null, tiers);
};
export const subscribeFeatureSettings = (onValue: (settings: FeatureSettings) => void, onError: (failure: Error) => void) => {
  if (cloudEnabled) return subscribeCloudFeatureSettings(onValue, onError);
  if (!useLocalStorage) { onError(new Error(`Connect Firebase To Load Features`)); return () => undefined; }
  return subscribeStorage(storageKey, saved => {
    try { onValue(readLocalSettings(saved) ?? createFeatureSettings()); }
    catch (failure) { onError(featureFlagsError(failure)); }
  }, onError);
};
const updateFeatureSettings = (update: (settings: FeatureSettings) => FeatureSettings, expectedActorId: string): Promise<void> => serialize(async () => {
  try {
    if (cloudEnabled) return await updateCloudFeatureSettings(update, expectedActorId);
    await requireLocalOwner(expectedActorId);
    const original = readLocalSettings(await readStorage(storageKey)) ?? createFeatureSettings();
    await requireLocalOwner(expectedActorId);
    const next = update(original);
    if (JSON.stringify([original.flags, original.audiences]) === JSON.stringify([next.flags, next.audiences])) return;
    const record = { ...next, updated: new Date().toISOString() };
    await requireLocalOwner(expectedActorId);
    await writeStorage(storageKey, JSON.stringify(record));
    await requireLocalOwner(expectedActorId);
  } catch (failure) { throw featureFlagsError(failure); }
});
export const prepareFeaturePlanTiers = async (records: readonly Plan[]): Promise<void> => {
  const user = (await restoreSession())?.user;
  if (!canManageFeatures(user) || !user?.id) throw new Error(`Owner Access Is Required`);
  await preparePlanTiers(records);
  const tiers = await getPlanTiers();
  await updateFeatureSettings(settings => migrateFeaturePlanTiers(settings, tiers), user.id);
};
export const saveFeatureFlag = (key: FeatureFlagKey, enabled: boolean, expectedActorId: string): Promise<void> => updateFeatureSettings(settings => {
  if (!featureFlagKeys.includes(key) || typeof enabled !== `boolean`) throw new Error(`Choose A Valid Feature Status`);
  return { ...settings, flags: { ...settings.flags, [key]: enabled } };
}, expectedActorId);
export const saveFeatureAudience = (key: FeatureFlagKey, dimension: FeatureAudienceDimension, value: string, enabled: boolean, allValues: readonly string[], expectedActorId: string): Promise<void> => updateFeatureSettings(settings => {
  if (!featureFlagKeys.includes(key) || ![`roles`, `plans`].includes(dimension)) throw new Error(`Choose A Valid Feature Audience`);
  return changeFeatureAudience(settings, key, dimension, value, enabled, allValues);
}, expectedActorId);
