import { FirebaseError } from 'firebase/app';
import { Types } from '../../types/types';
import { isAppCollectionID } from '../common/ids';
import { publicHttpsUrl } from '../social/content';
import type { PublicProfile } from '../models/users/User';

export const PUBLIC_PROFILE_LIMIT = 24;
export type PublicProfileProjection = PublicProfile & { photoURL: string };

export const projectPublicProfile = (profile: PublicProfile & { active?: boolean }): PublicProfileProjection => ({
  id: profile.id,
  name: profile.name,
  description: profile.description,
  publicDomains: profile.publicDomains,
  photoURL: profile.photoURL ? publicHttpsUrl(profile.photoURL) ?? `` : ``,
  profilePrivacy: profile.active === false ? `private` : profile.profilePrivacy,
  color: { name: profile.color.name, type: profile.color.type, color: profile.color.color },
});

export const readPublicProfile = (value: unknown, id: string): PublicProfileProjection => {
  if (!value || typeof value !== `object` || Array.isArray(value)) throw new Error(`Saved Public Profile Could Not Be Read`);
  const profile = value as PublicProfile;
  if (profile.id !== id || !isAppCollectionID(id, Types.User) || typeof profile.name !== `string` || !profile.name.trim() || profile.name.length > 100
    || typeof profile.description !== `string` || profile.description.length > 2000 || typeof profile.publicDomains !== `boolean`
    || ![`public`, `private`].includes(profile.profilePrivacy) || typeof profile.photoURL !== `string`
    || !profile.color || typeof profile.color !== `object` || typeof profile.color.name !== `string`
    || typeof profile.color.color !== `string` || !/^#[a-f\d]{3}(?:[a-f\d]{3})?$/i.test(profile.color.color)
    || ![`light`, `dark`].includes(profile.color.type)) throw new Error(`Saved Public Profile Could Not Be Read`);
  return projectPublicProfile(profile);
};

export const publicDirectoryError = (failure: unknown): Error => {
  if (!(failure instanceof FirebaseError)) return failure instanceof Error ? failure : new Error(`Public Profiles Could Not Be Loaded`);
  if (failure.code === `permission-denied`) return new Error(`Public Profile Access Was Denied — Publish The Community Firestore Rules`);
  if (failure.code === `failed-precondition`) return new Error(`Public Profiles Need The Community Firestore Indexes`);
  if (failure.code === `resource-exhausted`) return new Error(`Firestore Quota Exceeded — Try Again Later`);
  if (failure.code === `unavailable` || failure.code === `deadline-exceeded`) return new Error(`Public Profiles Need A Working Firebase Connection — Try Again`);
  return new Error(`Public Profiles Could Not Be Loaded (${failure.code})`);
};
