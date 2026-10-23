import { authAPI } from '../../api/auth';
import { firebaseEnabled } from '../firebase/config';
import { getAccountBillingAccess } from './billing';
import { getFirebaseAuth } from '../firebase/client';
import { hasUnlimitedPlanAccess, hasPaidBillingAccess, canUseConnectionProvider } from '../accountPlans';

export const getPlanAccess = async (expectedUserId?: string | null) => {
  const user = (await authAPI.restoreSession())?.user;
  if (!user?.id || !user.active) throw new Error(`Sign In To Access This Feature`);
  if (expectedUserId !== undefined && user.id !== expectedUserId) throw new Error(`Your Account Changed — Try Again`);
  const owner = hasUnlimitedPlanAccess(user);
  const billing = owner || !firebaseEnabled ? null : await getAccountBillingAccess(user);
  const current = (await authAPI.restoreSession())?.user;
  if (!current || current.id !== user.id || !current.active || current.role !== user.role) throw new Error(`Your Account Changed — Try Again`);
  return { user: current, owner, paid: owner || hasPaidBillingAccess(billing), billing };
};
export const requireStarterAccess = async (expectedUserId?: string | null) => {
  const access = await getPlanAccess(expectedUserId);
  if (!access.paid) throw new Error(`Choose Starter To Unlock This Feature`);
  return access.user;
};
export const requireAuctionPreviewAccess = async () => {
  const access = await getPlanAccess();
  if (!access.owner) throw new Error(`Domain Auctions Are Planned — Owner Preview Only`);
  return access.user;
};
export const requireConnectionAccess = async (provider: string, expectedUserId?: string) => {
  const access = await getPlanAccess(expectedUserId);
  if (!canUseConnectionProvider(provider, access.paid)) throw new Error(`Choose Starter To Connect This Registrar`);
  return access.user;
};
export const getFeatureAuthorization = async (paid = false): Promise<Record<string, string>> => {
  if (paid) await requireStarterAccess();
  const current = getFirebaseAuth().currentUser;
  return current && !current.isAnonymous ? { Authorization: `Bearer ${await current.getIdToken()}` } : {};
};

