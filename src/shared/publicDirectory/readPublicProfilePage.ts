import { api } from '../../api';
import { authAPI } from '../../api/auth';
import { useLocalStorage } from '../config';
import { getFirebaseDb } from '../firebase/client';
import { marketplaceAPI } from '../../api/marketplace';
import type { PublicProfileProjection } from './profiles';
import type { PublicProfileCardMetadata } from './profilePortfolio';
import { PUBLIC_PROFILE_LIMIT, projectPublicProfile, publicDirectoryError, readPublicProfile } from './profiles';
import { collection, documentId, getDocsFromServer, limit, orderBy, query, startAfter, where } from 'firebase/firestore';

export type PublicProfileCard = PublicProfileProjection & { cardMetadata: PublicProfileCardMetadata | null };

const addCardMetadata = async (profiles: PublicProfileProjection[], signal?: AbortSignal): Promise<PublicProfileCard[]> => {
  if (!profiles.length || signal?.aborted) return [];
  const ids = profiles.map(profile => profile.id);
  try {
    const records = useLocalStorage ? await api.getLocalPublicProfileCardMetadata(ids) : await marketplaceAPI.getPublicProfileCardMetadata(ids, signal);
    const byId = new Map(records.map(record => [record.id, record]));
    return profiles.flatMap(profile => {
      const cardMetadata = byId.get(profile.id);
      return cardMetadata ? [{ ...profile, cardMetadata }] : [];
    });
  } catch {
    return signal?.aborted ? [] : profiles.map(profile => ({ ...profile, cardMetadata: null }));
  }
};

export const readPublicProfilePage = async (cursor: string | null, signal?: AbortSignal) => {
  try {
    if (useLocalStorage) {
      const profiles = (await authAPI.getPublicProfiles())
        .filter(profile => profile.profilePrivacy === `public` && (!cursor || profile.id > cursor))
        .sort((left, right) => left.id < right.id ? -1 : Number(left.id > right.id))
        .slice(0, PUBLIC_PROFILE_LIMIT + 1);
      const page = profiles.slice(0, PUBLIC_PROFILE_LIMIT);
      return { profiles: await addCardMetadata(page.map(projectPublicProfile), signal), nextCursor: profiles.length > PUBLIC_PROFILE_LIMIT ? page.at(-1)?.id ?? null : null };
    }
    const result = await getDocsFromServer(query(
      collection(getFirebaseDb(), `publicProfiles`),
      where(`profilePrivacy`, `==`, `public`),
      orderBy(documentId()),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(PUBLIC_PROFILE_LIMIT),
    ));
    if (result.metadata.fromCache || result.metadata.hasPendingWrites) throw new Error(`Public Profiles Could Not Be Confirmed`);
    const profiles = result.docs.map(record => readPublicProfile(record.data(), record.id)).filter(profile => profile.profilePrivacy === `public`);
    return { profiles: await addCardMetadata(profiles, signal), nextCursor: result.size === PUBLIC_PROFILE_LIMIT ? result.docs.at(-1)?.id ?? null : null };
  } catch (failure) { throw publicDirectoryError(failure); }
};
