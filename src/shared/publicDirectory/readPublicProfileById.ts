import { authAPI } from '../../api/auth';
import { Types } from '../../types/types';
import { useLocalStorage } from '../config';
import { isAppCollectionID } from '../common/ids';
import { getFirebaseDb } from '../firebase/client';
import { projectPublicProfile, publicDirectoryError, readPublicProfile } from './profiles';
import { collection, documentId, getDocsFromServer, limit, query, where } from 'firebase/firestore';

export const readPublicProfileById = async (id: string) => {
  if (id.length > 250 || /[/\u0000-\u001f\u007f]/.test(id) || !isAppCollectionID(id, Types.User)) return null;
  if (useLocalStorage) {
    const profile = (await authAPI.getPublicProfiles()).find(profile => profile.id === id && profile.profilePrivacy === `public`);
    return profile ? projectPublicProfile(profile) : null;
  }
  try {
    const result = await getDocsFromServer(query(
      collection(getFirebaseDb(), `publicProfiles`), where(documentId(), `==`, id), where(`profilePrivacy`, `==`, `public`), limit(1),
    ));
    if (result.metadata.fromCache || result.metadata.hasPendingWrites) throw new Error(`Public Profile Could Not Be Confirmed`);
    const record = result.docs[0];
    const profile = record ? readPublicProfile(record.data(), record.id) : null;
    return profile?.profilePrivacy === `public` ? profile : null;
  } catch (failure) { throw publicDirectoryError(failure); }
};
