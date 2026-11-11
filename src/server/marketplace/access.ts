import { Roles } from '../../types/types';
import { isFeaturePlan } from '../../shared/featureFlags/values';
import { BillingError, type BillingActor } from '../billing/types';
import { hasPaidBillingAccess } from '../../shared/accountPlans';
import { getAppCollectionIDNumber } from '../../shared/common/ids';
import { getBillingDatabase, requireBillingActor } from '../billing/firebase';
import { FieldValue, type Transaction, type Firestore } from 'firebase-admin/firestore';
import { loadMarketplaceSellerPolicy, marketplacePolicyId, readMarketplacePlanTier } from './sellerPolicy';

export class MarketplaceError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export const assertPublicSellerProfile = (profilePrivacy: unknown) => {
  if (profilePrivacy !== `public`) throw new MarketplaceError(403, `Set Your Profile To Public To Use Seller Tools`);
};

export const requireMarketplaceActor = async (request: Request) => {
  try {
    const actor = await requireBillingActor(request);
    if (actor.role === Roles.Guest || !Object.values(Roles).includes(actor.role as Roles)) throw new MarketplaceError(403, `An Active Marketplace Account Is Required`);
    return actor;
  }
  catch (failure) {
    if (failure instanceof BillingError && failure.status === 401) throw new MarketplaceError(401, `Sign In To Use The Marketplace`);
    if (failure instanceof BillingError && failure.status === 403) throw new MarketplaceError(403, `Your Marketplace Account Could Not Be Confirmed`);
    throw failure;
  }
};

export const confirmMarketplaceActor = async (transaction: Transaction, database: Firestore, actor: BillingActor) => {
  const [identity, account] = await transaction.getAll(database.doc(`identities/${actor.firebaseUid}`), database.doc(`users/${actor.id}`));
  const user = account.data();
  if (identity.data()?.id !== actor.id || identity.data()?.firebase_uid !== actor.firebaseUid || identity.data()?.number !== user?.number
    || user?.id !== actor.id || user.firebase_uid !== actor.firebaseUid || user.active !== true || user.role !== actor.role
    || getAppCollectionIDNumber(actor.id, `User`) !== user.number || user.role === Roles.Guest) throw new MarketplaceError(403, `Your Marketplace Access Changed — Sign In Again`);
  return user;
};

export const assertSellerEligible = async (transaction: Transaction, database: Firestore, sellerId: string): Promise<void> => {
  const [account, billingSnapshot] = await transaction.getAll(database.doc(`users/${sellerId}`), database.doc(`billingUsers/${sellerId}`));
  const user = account.data();
  const role = user?.role;
  if (user?.id !== sellerId || user?.active !== true || role === Roles.Guest || !Object.values(Roles).includes(role)) throw new MarketplaceError(403, `An Active Seller Account Is Required`);
  const { policy: { enabled, audience } } = await loadMarketplaceSellerPolicy(transaction, database);
  if (!enabled || (audience.roles !== null && !audience.roles.includes(role))) throw new MarketplaceError(403, `Your Role Is Not Eligible To List Domains`);
  if (role === Roles.Owner) return;
  const billing = billingSnapshot.data();
  const paid = hasPaidBillingAccess({ plan: billing?.plan === `starter` ? `starter` : `free`, subscriptionStatus: typeof billing?.subscriptionStatus === `string` ? billing.subscriptionStatus : null, accessUntil: billing?.accessUntil?.toMillis?.() ?? null });
  const plan = paid ? `starter` : `free`;
  const minimum = audience.plans?.[0];
  if (audience.planMode !== `minimum`) {
    if (audience.plans === null || audience.plans.includes(plan)) return;
  } else if (!minimum || minimum === `free`) return;
  else if (plan !== `free`) {
    const selected = await readMarketplacePlanTier(transaction, database, minimum);
    const viewer = minimum === plan ? selected : await readMarketplacePlanTier(transaction, database, plan);
    if (selected && viewer && (viewer.displayOrder > selected.displayOrder || (viewer.displayOrder === selected.displayOrder && viewer.number >= selected.number))) return;
  }
  throw new MarketplaceError(403, `Your Current Plan Is Not Eligible To List Domains`);
};

const confirmPolicyOwner = async (transaction: Transaction, database: Firestore, actor: BillingActor) => {
  if (actor.role !== Roles.Owner) throw new MarketplaceError(403, `Owner Access Is Required`);
  await confirmMarketplaceActor(transaction, database, actor);
};

export const getMarketplaceSellerPolicy = async (actor: BillingActor) => {
  const database = getBillingDatabase();
  return database.runTransaction(async transaction => {
    await confirmPolicyOwner(transaction, database, actor);
    return (await loadMarketplaceSellerPolicy(transaction, database)).policy;
  });
};

export const updateMarketplaceSellerPolicy = async (actor: BillingActor, change: Record<string, unknown>) => {
  const database = getBillingDatabase();
  return database.runTransaction(async transaction => {
    await confirmPolicyOwner(transaction, database, actor);
    const saved = await loadMarketplaceSellerPolicy(transaction, database);
    const original = saved.policy;
    let policy = original;
    if (change.field === `enabled` && typeof change.value === `boolean`) policy = { ...original, enabled: change.value };
    else if (change.field === `role` && typeof change.allowed === `boolean` && Object.values(Roles).includes(change.role as Roles)) {
      const roles = new Set(original.audience.roles ?? Object.values(Roles));
      if (change.allowed) roles.add(change.role as Roles);
      else roles.delete(change.role as Roles);
      const ordered = Object.values(Roles).filter(role => roles.has(role));
      policy = { ...original, audience: { ...original.audience, roles: ordered.length === Object.values(Roles).length ? null : ordered } };
    } else if (change.field === `minimumPlan` && (change.value === null || isFeaturePlan(change.value) && change.value !== `free`)) {
      if (change.value !== null && !(await readMarketplacePlanTier(transaction, database, change.value))) throw new MarketplaceError(400, `Choose A Published Plan Tier`);
      policy = { ...original, audience: { ...original.audience, plans: change.value ? [change.value] : null, planMode: `minimum` } };
    } else throw new MarketplaceError(400, `Choose A Valid Marketplace Policy Change`);
    if (saved.exists) {
      if (JSON.stringify(original) !== JSON.stringify(policy)) transaction.update(saved.reference, { ...policy, updatedAt: FieldValue.serverTimestamp() });
      return policy;
    }
    const counter = database.doc(`counters/marketplacePolicies`);
    if ((await transaction.get(counter)).exists) throw new MarketplaceError(503, `Saved Marketplace Policy Identity Needs Attention`);
    transaction.create(saved.reference, { ...policy, id: marketplacePolicyId, number: 1, version: 1, type: `MarketplacePolicy`, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    transaction.create(counter, { number: 1, lastId: marketplacePolicyId });
    if (saved.legacy && saved.stagedFields?.length) transaction.update(saved.legacy, Object.fromEntries(saved.stagedFields.map(field => [field, FieldValue.delete()])));
    return policy;
  });
};
