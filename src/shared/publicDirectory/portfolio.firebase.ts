import { firebaseEnabled } from '../firebase/config';
import { isAppCollectionID, getAppCollectionIDNumber } from '../common/ids';
import { getFirebaseDb, getFirebaseAuth } from '../firebase/client';
import { doc, runTransaction } from 'firebase/firestore';
import { projectPublicPortfolio, PUBLIC_PORTFOLIO_DOCUMENT, PUBLIC_PORTFOLIO_PREFERENCES_KEY } from './portfolio';

const unreadable = () => new Error(`Shared Portfolio Could Not Be Read`);

export const publishPublicPortfolio = async (userId: string): Promise<void> => {
  if (!firebaseEnabled) return;
  const firebaseUid = getFirebaseAuth().currentUser?.uid;
  if (!firebaseUid || !isAppCollectionID(userId, `User`)) throw new Error(`Sign In To Publish Your Shared Portfolio`);
  const assertActor = () => {
    if (getFirebaseAuth().currentUser?.uid !== firebaseUid) throw new Error(`Your Account Changed — Try Again`);
  };
  await runTransaction(getFirebaseDb(), async transaction => {
    assertActor();
    const account = await transaction.get(doc(getFirebaseDb(), `users`, userId));
    if (!account.exists() || account.data().firebase_uid !== firebaseUid || account.data().active !== true) throw new Error(`Sign In To Publish Your Shared Portfolio`);
    const key = PUBLIC_PORTFOLIO_PREFERENCES_KEY;
    const index = await transaction.get(doc(getFirebaseDb(), `users`, userId, `storageKeys`, encodeURIComponent(key)));
    const shared = doc(getFirebaseDb(), `publicProfiles`, userId, `portfolio`, PUBLIC_PORTFOLIO_DOCUMENT);
    if (!index.exists()) { transaction.delete(shared); return; }
    const reference = index.data();
    if (!isAppCollectionID(reference.id, `Data`) || reference.key !== key || reference.number !== getAppCollectionIDNumber(reference.id, `Data`)) throw unreadable();
    const source = await transaction.get(doc(getFirebaseDb(), `users`, userId, `data`, reference.id));
    if (!source.exists()) throw unreadable();
    const record = source.data();
    if (record.id !== reference.id || record.uid !== userId || record.key !== key || typeof record.value !== `string`) throw unreadable();
    let value: unknown;
    try { value = JSON.parse(record.value); } catch { throw unreadable(); }
    const projection = projectPublicPortfolio(value, userId, record.id, record.revision);
    assertActor();
    if (projection) transaction.set(shared, projection);
    else transaction.delete(shared);
  });
  assertActor();
};
