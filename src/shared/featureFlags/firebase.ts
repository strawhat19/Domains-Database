import { FirebaseError } from 'firebase/app';
import { canManageFeatures } from '../admin/permissions';
import { restoreSession } from '../authentication/service';
import { assertOwnerSession } from '../authentication/firebase';
import { getFirebaseDb, getFirebaseAuth } from '../firebase/client';
import type { FeatureSettings } from './types';
import { featureSettingsId, readFeatureSettings, createFeatureSettings } from './values';
import { doc, onSnapshot, runTransaction, serverTimestamp, getDocFromServer } from 'firebase/firestore';

const settingsRef = () => doc(getFirebaseDb(), `featureSettings`, featureSettingsId);
export const featureFlagsError = (failure: unknown) => {
  if (!(failure instanceof FirebaseError)) return failure instanceof Error ? failure : new Error(`Features Could Not Be Loaded`);
  if (failure.code === `permission-denied`) return new Error(`Feature Access Was Denied — Check Your Role And Firestore Rules`);
  if (failure.code === `unavailable`) return new Error(`Features Could Not Connect To Firestore — Try Again`);
  return new Error(`Feature Database Is Unavailable — Try Again`);
};
export const getCloudFeatureSettings = async (): Promise<FeatureSettings> => {
  const saved = await getDocFromServer(settingsRef());
  return saved.exists() ? readFeatureSettings(saved.data()) : createFeatureSettings();
};
export const subscribeCloudFeatureSettings = (onValue: (settings: FeatureSettings) => void, onError: (failure: Error) => void) => {
  let active = true;
  let unsubscribe: () => void = () => undefined;
  const fail = (failure: unknown) => {
    if (!active) return;
    active = false;
    clearTimeout(timeout);
    unsubscribe();
    onError(featureFlagsError(failure));
  };
  const timeout = setTimeout(() => fail(new Error(`Could Not Confirm Features — Refresh To Try Again`)), 20_000);
  try {
    unsubscribe = onSnapshot(settingsRef(), { includeMetadataChanges: true }, saved => {
      if (!active || saved.metadata.fromCache || saved.metadata.hasPendingWrites) return;
      try {
        const settings = saved.exists() ? readFeatureSettings(saved.data()) : createFeatureSettings();
        clearTimeout(timeout);
        onValue(settings);
      } catch (failure) { fail(failure); }
    }, fail);
  } catch (failure) { fail(failure); }
  return () => { active = false; clearTimeout(timeout); unsubscribe(); };
};
export const updateCloudFeatureSettings = async (update: (settings: FeatureSettings) => FeatureSettings, expectedActorId: string): Promise<void> => {
  const user = (await restoreSession())?.user;
  if (!canManageFeatures(user) || user?.id !== expectedActorId || !user?.firebase_uid) throw new Error(`Owner Access Is Required`);
  const actor = { id: user.id, firebaseUid: user.firebase_uid };
  const database = getFirebaseDb();
  await runTransaction(database, async transaction => {
    assertOwnerSession(actor.firebaseUid);
    const account = (await transaction.get(doc(database, `users`, actor.id))).data();
    if (account?.id !== actor.id || account?.firebase_uid !== actor.firebaseUid || !canManageFeatures({ id: account.id, role: account.role, active: account.active })) throw new Error(`Owner Access Is Required`);
    const reference = settingsRef();
    const counterRef = doc(database, `counters`, `features`);
    const saved = await transaction.get(reference);
    const counter = await transaction.get(counterRef);
    const counterData = counter.data();
    if (saved.exists() !== counter.exists() || (counter.exists() && (Object.keys(counterData ?? {}).length !== 2
      || counterData?.number !== 1 || counterData?.lastFeatureId !== featureSettingsId))) throw new Error(`Saved Feature Identity Needs Attention`);
    const original = saved.exists() ? readFeatureSettings(saved.data()) : createFeatureSettings();
    const next = update(original);
    assertOwnerSession(actor.firebaseUid);
    if (JSON.stringify([original.flags, original.audiences]) === JSON.stringify([next.flags, next.audiences])) return;
    if (saved.exists()) transaction.update(reference, { flags: next.flags, audiences: next.audiences, updated: serverTimestamp() });
    else {
      transaction.set(reference, { ...next, created: serverTimestamp(), updated: serverTimestamp() });
      transaction.set(counterRef, { number: next.number, lastFeatureId: next.id });
    }
  });
  if (getFirebaseAuth().currentUser?.uid !== actor.firebaseUid) throw new Error(`Your Account Changed — Try Again`);
  assertOwnerSession(actor.firebaseUid);
};
