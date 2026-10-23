import type { User } from '../models/users/User';
import type { BillingAccess } from '../accountPlans';
import { getFirebaseDb, getFirebaseAuth } from '../firebase/client';
import { doc, Timestamp, getDocFromServer } from 'firebase/firestore';

export const readBillingAccess = (value: Record<string, unknown> | undefined): BillingAccess => ({
  plan: value?.plan === `starter` ? `starter` : `free`,
  accessUntil: value?.accessUntil instanceof Timestamp ? value.accessUntil.toMillis() : null,
  subscriptionStatus: typeof value?.subscriptionStatus === `string` ? value.subscriptionStatus : null,
});
export const getAccountBillingAccess = async (user: Pick<User, `id` | `firebase_uid`>): Promise<BillingAccess> => {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid || uid !== user.firebase_uid) throw new Error(`Sign In To Confirm Your Plan Access`);
  const saved = await getDocFromServer(doc(getFirebaseDb(), `billingUsers`, user.id));
  if (getFirebaseAuth().currentUser?.uid !== uid) throw new Error(`Your Account Changed — Try Again`);
  return readBillingAccess(saved.exists() ? saved.data() : undefined);
};

