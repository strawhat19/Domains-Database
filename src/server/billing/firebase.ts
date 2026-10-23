import { getAuth } from 'firebase-admin/auth';
import { BillingError, type BillingActor } from './types';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAppCollectionIDNumber } from '../../shared/common/ids';

const projectId = `domainsdatabase-e62a3`;
const appName = `domains-database-billing`;
const unavailable = () => new BillingError(503, `billing_database_unavailable`, `Billing Database Is Not Configured`);
const getBillingApp = () => {
  const saved = getApps().find(app => app.name === appName);
  if (saved) {
    if (saved.options.projectId !== projectId) throw unavailable();
    return saved;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw || raw.length > 32_000) throw unavailable();
  try {
    const account = JSON.parse(raw) as Record<string, unknown>;
    if (account?.type !== `service_account` || account.project_id !== projectId
      || typeof account.client_email !== `string` || !account.client_email.endsWith(`.iam.gserviceaccount.com`)
      || typeof account.private_key !== `string` || !account.private_key.includes(`-----BEGIN PRIVATE KEY-----`)) throw unavailable();
    return initializeApp({ projectId, credential: cert({ projectId, clientEmail: account.client_email, privateKey: account.private_key }) }, appName);
  } catch { throw unavailable(); }
};

export const getBillingDatabase = (): Firestore => getFirestore(getBillingApp());
export const requireBillingActor = async (request: Request): Promise<BillingActor> => {
  const token = /^Bearer ([A-Za-z0-9._-]{1,8192})$/i.exec(request.headers.get(`authorization`) ?? ``)?.[1];
  if (!token) throw new BillingError(401, `billing_sign_in_required`, `Sign In To Manage Your Subscription`);
  const app = getBillingApp();
  let uid = ``;
  try {
    const decoded = await getAuth(app).verifyIdToken(token, true);
    if (!decoded.uid || decoded.uid.length > 128 || decoded.uid.includes(`/`) || decoded.firebase?.sign_in_provider === `anonymous`) throw new BillingError(401, `billing_sign_in_required`, `Sign In With Your Account To Manage Billing`);
    uid = decoded.uid;
  } catch (failure) {
    if (failure instanceof BillingError) throw failure;
    const code = (failure as { code?: string })?.code;
    if (code && [`auth/argument-error`, `auth/invalid-id-token`, `auth/id-token-expired`, `auth/id-token-revoked`, `auth/user-disabled`, `auth/user-not-found`].includes(code)) throw new BillingError(401, `billing_sign_in_required`, `Sign In Again To Manage Your Subscription`);
    throw unavailable();
  }
  const database = getFirestore(app);
  const identity = (await database.doc(`identities/${uid}`).get()).data();
  const id = identity?.id;
  if (typeof id !== `string` || getAppCollectionIDNumber(id, `User`) !== identity?.number || identity?.firebase_uid !== uid) {
    throw new BillingError(403, `billing_account_unavailable`, `Your Account Identity Could Not Be Confirmed`);
  }
  const user = (await database.doc(`users/${id}`).get()).data();
  if (user?.id !== id || user?.number !== identity?.number || user?.firebase_uid !== uid || user?.active !== true
    || typeof user?.role !== `string`) throw new BillingError(403, `billing_account_unavailable`, `This Account Is Unavailable`);
  return { id, userId: id, active: true, firebaseUid: uid, role: user.role, owner: user.role === `Owner`, name: typeof user.name === `string` ? user.name : `Account`, email: typeof user.email === `string` ? user.email : `` };
};
