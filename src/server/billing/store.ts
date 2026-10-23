import { randomUUID } from 'node:crypto';
import { getBillingDatabase } from './firebase';
import { BillingError, type BillingActor } from './types';
import { genID, getAppCollectionIDNumber } from '../../shared/common/ids';
import { Timestamp, type Transaction, type DocumentData } from 'firebase-admin/firestore';

export interface BillingAccount {
  id: string;
  name: string;
  number: number;
  userId: string;
  created: string;
  updated: string;
  customerEmail?: string;
  syncVersion: number;
  firebase_uid: string;
  plan: `free` | `starter`;
  accessUntil: Timestamp | null;
  subscriptionStatus: string | null;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_checkout_session_id?: string | null;
  checkoutAttemptId?: string;
  checkoutPlanId?: string;
  checkoutPriceId?: string;
  checkoutCreatedAt?: string;
  currentPeriodEnd?: number | null;
  cancelAtPeriodEnd?: boolean;
  lockToken?: string | null;
  lockUntil?: Timestamp | null;
}
export interface BillingLock { token: string; version: number; account: BillingAccount }
export interface SubscriptionState {
  plan: `free` | `starter`;
  accessUntil: Timestamp | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  subscriptionStatus: string | null;
  stripe_subscription_id?: string;
}

const invalid = () => new BillingError(503, `billing_record_unavailable`, `Saved Billing Information Could Not Be Confirmed`);
const accountRef = (id: string) => getBillingDatabase().doc(`billingAccounts/${id}`);
export const readBillingAccount = (record: DocumentData | undefined): BillingAccount => {
  if (!record || typeof record.id !== `string` || getAppCollectionIDNumber(record.id, `BillingAccount`) !== record.number
    || typeof record.userId !== `string` || !getAppCollectionIDNumber(record.userId, `User`)
    || typeof record.firebase_uid !== `string` || !record.firebase_uid || !Number.isSafeInteger(record.syncVersion) || record.syncVersion < 0
    || ![`free`, `starter`].includes(record.plan) || (record.accessUntil !== null && !(record.accessUntil instanceof Timestamp))
    || (record.subscriptionStatus !== null && typeof record.subscriptionStatus !== `string`)
    || (record.stripe_customer_id !== undefined && (typeof record.stripe_customer_id !== `string` || !/^cus_[A-Za-z0-9]+$/.test(record.stripe_customer_id)))) throw invalid();
  return record as BillingAccount;
};
const assertAccountBinding = async (transaction: Transaction, account: BillingAccount, requireActive: boolean) => {
  const database = getBillingDatabase();
  const [identity, savedUser, mapping] = await transaction.getAll(database.doc(`identities/${account.firebase_uid}`), database.doc(`users/${account.userId}`), database.doc(`billingUsers/${account.userId}`));
  const user = savedUser.data();
  if (identity.data()?.id !== account.userId || identity.data()?.firebase_uid !== account.firebase_uid
    || user?.id !== account.userId || user?.firebase_uid !== account.firebase_uid || identity.data()?.number !== user?.number
    || mapping.data()?.billingAccountId !== account.id || (requireActive && user?.active !== true)) {
    throw new BillingError(403, `billing_account_unavailable`, `This Account Is Unavailable`);
  }
  return { user, mapping: mapping.data() };
};

export const ensureBillingAccount = (actor: BillingActor) => getBillingDatabase().runTransaction(async transaction => {
  const database = getBillingDatabase();
  const mappingRef = database.doc(`billingUsers/${actor.id}`);
  const [mapping, user, identity] = await transaction.getAll(mappingRef, database.doc(`users/${actor.id}`), database.doc(`identities/${actor.firebaseUid}`));
  if (user.data()?.id !== actor.id || user.data()?.active !== true || user.data()?.firebase_uid !== actor.firebaseUid || identity.data()?.id !== actor.id
    || identity.data()?.firebase_uid !== actor.firebaseUid || identity.data()?.number !== user.data()?.number
    || getAppCollectionIDNumber(actor.id, `User`) !== user.data()?.number) throw new BillingError(403, `billing_account_unavailable`, `This Account Is Unavailable`);
  if (mapping.exists) {
    const id = mapping.data()?.billingAccountId;
    if (typeof id !== `string` || !getAppCollectionIDNumber(id, `BillingAccount`)) throw invalid();
    const account = readBillingAccount((await transaction.get(accountRef(id))).data());
    if (account.id !== id || account.userId !== actor.id || account.firebase_uid !== actor.firebaseUid) throw invalid();
    return account;
  }
  const counterRef = database.doc(`counters/billingAccounts`);
  const previous = (await transaction.get(counterRef)).data()?.number ?? 0;
  if (!Number.isSafeInteger(previous) || previous < 0 || previous >= Number.MAX_SAFE_INTEGER) throw invalid();
  const number = previous + 1;
  const now = new Date();
  const identityData = genID(`BillingAccount`, number, actor.name, now, randomUUID().replaceAll(`-`, ``));
  const account: BillingAccount = { number, id: identityData.id, name: actor.name, userId: actor.id, syncVersion: 0, plan: `free`, accessUntil: null, subscriptionStatus: null, customerEmail: actor.email, firebase_uid: actor.firebaseUid, created: now.toISOString(), updated: now.toISOString() };
  transaction.set(counterRef, { number });
  transaction.create(accountRef(account.id), { ...account, type: `BillingAccount` });
  transaction.create(mappingRef, { plan: `free`, accessUntil: null, subscriptionStatus: null, billingAccountId: account.id });
  return account;
});

export const acquireBillingLock = (id: string, requireActive = true): Promise<BillingLock> => getBillingDatabase().runTransaction(async transaction => {
  const account = readBillingAccount((await transaction.get(accountRef(id))).data());
  if (account.id !== id) throw invalid();
  await assertAccountBinding(transaction, account, requireActive);
  if (account.lockToken && account.lockUntil instanceof Timestamp && account.lockUntil.toMillis() > Date.now()) throw new BillingError(409, `billing_sync_pending`, `Your Subscription Is Updating — Try Again Shortly`);
  const token = randomUUID();
  transaction.update(accountRef(id), { lockToken: token, lockUntil: Timestamp.fromMillis(Date.now() + 90_000) });
  return { token, account, version: account.syncVersion };
});
export const assertBillingLock = async (transaction: Transaction, lock: BillingLock) => {
  const current = readBillingAccount((await transaction.get(accountRef(lock.account.id))).data());
  if (current.id !== lock.account.id || current.lockToken !== lock.token || current.syncVersion !== lock.version || !(current.lockUntil instanceof Timestamp)
    || current.lockUntil.toMillis() <= Date.now()) throw new BillingError(409, `billing_sync_pending`, `Your Subscription Changed — Try Again`);
  return current;
};
export const updateLockedAccount = async (lock: BillingLock, patch: Partial<BillingAccount>) => {
  await getBillingDatabase().runTransaction(async transaction => {
    await assertBillingLock(transaction, lock);
    transaction.update(accountRef(lock.account.id), { ...patch, updated: new Date().toISOString() });
  });
  lock.account = { ...lock.account, ...patch };
};
export const releaseBillingLock = async (lock: BillingLock) => getBillingDatabase().runTransaction(async transaction => {
  const current = (await transaction.get(accountRef(lock.account.id))).data();
  if (current?.lockToken === lock.token) transaction.update(accountRef(lock.account.id), { lockToken: null, lockUntil: null });
});
export const finishBillingSync = (lock: BillingLock, state: SubscriptionState): Promise<BillingAccount> => getBillingDatabase().runTransaction(async transaction => {
  const account = await assertBillingLock(transaction, lock);
  const binding = await assertAccountBinding(transaction, account, false);
  const database = getBillingDatabase();
  const saved = { ...account, ...state, updated: new Date().toISOString(), syncVersion: account.syncVersion + 1, lockToken: null, lockUntil: null };
  transaction.set(accountRef(account.id), saved, { merge: true });
  const sameExpiry = state.accessUntil === null ? binding.mapping?.accessUntil === null
    : binding.mapping?.accessUntil instanceof Timestamp && state.accessUntil.isEqual(binding.mapping.accessUntil);
  if (binding.mapping?.plan !== state.plan || binding.mapping?.subscriptionStatus !== state.subscriptionStatus || !sameExpiry) {
    transaction.set(database.doc(`billingUsers/${account.userId}`), { plan: state.plan, accessUntil: state.accessUntil, subscriptionStatus: state.subscriptionStatus, billingAccountId: account.id });
  }
  if (binding.user.plan !== state.plan) transaction.update(database.doc(`users/${account.userId}`), { plan: state.plan, updated: saved.updated, lastUpdated: saved.updated });
  return saved;
});
export const bindBillingCustomer = (account: BillingAccount, customerId: string) => getBillingDatabase().runTransaction(async transaction => {
  const current = readBillingAccount((await transaction.get(accountRef(account.id))).data());
  const mappingRef = getBillingDatabase().doc(`billingCustomers/${customerId}`);
  const mapping = await transaction.get(mappingRef);
  if (current.id !== account.id || (current.stripe_customer_id && current.stripe_customer_id !== customerId) || (mapping.exists && mapping.data()?.billingAccountId !== account.id)) throw invalid();
  transaction.set(mappingRef, { billingAccountId: account.id });
  transaction.update(accountRef(account.id), { stripe_customer_id: customerId, updated: new Date().toISOString() });
  return { ...current, stripe_customer_id: customerId };
});
export const getCustomerBillingAccount = async (customerId: string) => {
  if (!/^cus_[A-Za-z0-9]{1,200}$/.test(customerId)) return null;
  const mapping = (await getBillingDatabase().doc(`billingCustomers/${customerId}`).get()).data();
  if (!mapping) return null;
  if (typeof mapping.billingAccountId !== `string` || !getAppCollectionIDNumber(mapping.billingAccountId, `BillingAccount`)) throw invalid();
  const account = readBillingAccount((await accountRef(mapping.billingAccountId).get()).data());
  if (account.id !== mapping.billingAccountId || account.stripe_customer_id !== customerId) throw invalid();
  return account;
};

export const beginBillingEvent = (id: string, type: string) => getBillingDatabase().runTransaction(async transaction => {
  if (!/^evt_[A-Za-z0-9]{1,200}$/.test(id)) throw new BillingError(400, `billing_event_invalid`, `Invalid Stripe Event`);
  const reference = getBillingDatabase().doc(`billingEvents/${id}`);
  const previous = (await transaction.get(reference)).data();
  if (previous?.status === `processed`) return null;
  if (previous?.leaseUntil instanceof Timestamp && previous.leaseUntil.toMillis() > Date.now()) throw new BillingError(409, `billing_event_pending`, `Stripe Event Is Already Processing`);
  const token = randomUUID();
  transaction.set(reference, { type, token, stripe_event_id: id, status: `processing`, leaseUntil: Timestamp.fromMillis(Date.now() + 120_000), updated: new Date().toISOString() });
  return token;
});
export const finishBillingEvent = (id: string, token: string, processed: boolean) => getBillingDatabase().runTransaction(async transaction => {
  const reference = getBillingDatabase().doc(`billingEvents/${id}`);
  if ((await transaction.get(reference)).data()?.token === token) transaction.update(reference, { status: processed ? `processed` : `pending`, leaseUntil: null, updated: new Date().toISOString() });
});
