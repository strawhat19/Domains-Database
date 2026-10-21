import { FirebaseError } from 'firebase/app';
import { REGISTRARS, useLocalStorage } from '../config';
import { firebaseEnabled } from '../firebase/config';
import type { DomainRecord } from '../types';
import { isAppCollectionID } from '../common/ids';
import { readPublicProfile } from './profiles';
import { getFirebaseDb, getFirebaseAuth } from '../firebase/client';
import type { PublicProfile } from '../models/users/User';
import { DOMAIN_DIFFICULTIES, DOMAIN_PROJECT_STATUSES } from '../domainProject';
import { doc, query, where, limit, orderBy, collection, documentId, runTransaction, getDocFromServer, getDocsFromServer, type DocumentData } from 'firebase/firestore';

export const PUBLIC_DOMAIN_LIMIT = 100;
export const PUBLIC_DOMAIN_WRITE_LIMIT = 8;
export const PUBLIC_DOMAIN_PROFILE_LIMIT = 51;

export interface PublicDomainSummary {
  id: string;
  name: string;
  userId: string;
  tld?: string;
  mvp?: string;
  future?: string;
  created: string;
  expiresAt: string;
  createdAt?: string;
  description: string;
  difficulty?: DomainRecord[`difficulty`];
  projectStatus: DomainRecord[`projectStatus`];
  registrar: DomainRecord[`registrar`];
}

const unreadable = () => new Error(`Saved Public Domain Could Not Be Read`);
const buildPublicDomainSummary = (source: DocumentData, userId: string): PublicDomainSummary => {
  if (!isAppCollectionID(source.id, `Domain`) || !isAppCollectionID(userId, `User`)
    || typeof source.name !== `string` || !source.name.trim()
    || [`created`, `expiresAt`, `description`, `registrar`, `projectStatus`].some(field => typeof source[field] !== `string`)
    || (source.registrar !== `` && !REGISTRARS.includes(source.registrar))
    || !DOMAIN_PROJECT_STATUSES.some(status => status.value === source.projectStatus)) throw unreadable();
  const result: PublicDomainSummary = {
    id: source.id,
    userId,
    name: source.name,
    created: source.created,
    registrar: source.registrar,
    expiresAt: source.expiresAt,
    description: source.description,
    projectStatus: source.projectStatus,
  };
  for (const field of [`tld`, `mvp`, `future`, `createdAt`] as const) {
    if (source[field] === undefined) continue;
    if (typeof source[field] !== `string`) throw unreadable();
    result[field] = source[field];
  }
  if (source.difficulty !== undefined) {
    if (!DOMAIN_DIFFICULTIES.some(difficulty => difficulty.value === source.difficulty)) throw unreadable();
    result.difficulty = source.difficulty;
  }
  return result;
};

export const projectPublicDomain = (source: DocumentData, userId: string): PublicDomainSummary | null => {
  if (source.uid !== userId) throw unreadable();
  return source.isSample === true ? null : buildPublicDomainSummary(source, userId);
};

const readPublicDomain = (source: DocumentData, id: string, userId: string): PublicDomainSummary => {
  if (source.id !== id || source.userId !== userId) throw unreadable();
  return buildPublicDomainSummary(source, userId);
};

const publicDomainError = (failure: unknown): Error => {
  if (!(failure instanceof FirebaseError)) return failure instanceof Error ? failure : new Error(`Shared Domains Could Not Be Loaded`);
  if (failure.code === `permission-denied`) return new Error(`Shared Domain Access Was Denied — Publish The Community Firestore Rules`);
  if (failure.code === `failed-precondition`) return new Error(`Shared Domains Need The Community Firestore Indexes`);
  if (failure.code === `resource-exhausted`) return new Error(`Firestore Quota Exceeded — Try Again Later`);
  if (failure.code === `unavailable` || failure.code === `deadline-exceeded`) return new Error(`Shared Domains Need A Working Firebase Connection — Try Again`);
  return new Error(`Shared Domains Could Not Be Loaded (${failure.code})`);
};

const readProfileDomains = async (profile: PublicProfile): Promise<PublicDomainSummary[]> => {
  try {
    const snapshots = await getDocsFromServer(query(collection(getFirebaseDb(), `publicProfiles`, profile.id, `domains`), orderBy(documentId()), limit(PUBLIC_DOMAIN_LIMIT)));
    return snapshots.docs.map(snapshot => readPublicDomain(snapshot.data(), snapshot.id, profile.id));
  } catch (failure) {
    if (failure instanceof FirebaseError && failure.code === `permission-denied`) {
      const profiles = await getDocsFromServer(query(collection(getFirebaseDb(), `publicProfiles`), where(documentId(), `==`, profile.id), where(`profilePrivacy`, `==`, `public`), limit(1)));
      const current = profiles.docs[0]?.data();
      if (!current || current.profilePrivacy !== `public` || current.publicDomains !== true) return [];
    }
    throw failure;
  }
};

export const readPublicDomainSummaries = async (profiles: PublicProfile[]): Promise<PublicDomainSummary[]> => {
  try {
    const eligible = profiles.filter(profile => profile.profilePrivacy === `public` && profile.publicDomains);
    const results = await Promise.allSettled(eligible.map(readProfileDomains));
    const summaries: PublicDomainSummary[] = [];
    for (const result of results) {
      if (result.status === `rejected`) throw result.reason;
      summaries.push(...result.value);
    }
    return summaries;
  } catch (failure) { throw publicDomainError(failure); }
};

export const readPublicDomainSummariesForIds = async (userIds: string[]): Promise<PublicDomainSummary[]> => {
  if (!Array.isArray(userIds) || userIds.some(id => !isAppCollectionID(id, `User`))) throw new Error(`Choose Valid Public Profiles`);
  const ids = [...new Set(userIds)];
  if (ids.length > PUBLIC_DOMAIN_PROFILE_LIMIT) throw new Error(`Load Up To ${PUBLIC_DOMAIN_PROFILE_LIMIT} Public Profiles At A Time`);
  try {
    const groups = Array.from({ length: Math.ceil(ids.length / 10) }, (_, index) => ids.slice(index * 10, index * 10 + 10));
    const results = await Promise.allSettled(groups.map(group => getDocsFromServer(query(collection(getFirebaseDb(), `publicProfiles`), where(documentId(), `in`, group), where(`profilePrivacy`, `==`, `public`), limit(group.length)))));
    const profiles: PublicProfile[] = [];
    for (const result of results) {
      if (result.status === `rejected`) throw result.reason;
      profiles.push(...result.value.docs.map(snapshot => readPublicProfile(snapshot.data(), snapshot.id)));
    }
    return await readPublicDomainSummaries(profiles);
  } catch (failure) { throw publicDomainError(failure); }
};

export const publishPublicDomains = async (userId: string): Promise<void> => {
  if (!firebaseEnabled || useLocalStorage) return;
  const firebaseUid = getFirebaseAuth().currentUser?.uid;
  if (!firebaseUid || !isAppCollectionID(userId, `User`)) throw new Error(`Sign In To Publish Your Shared Domains`);
  const assertActor = () => {
    if (getFirebaseAuth().currentUser?.uid !== firebaseUid) throw new Error(`Your Account Changed — Try Again`);
  };
  const account = await getDocFromServer(doc(getFirebaseDb(), `users`, userId));
  assertActor();
  if (!account.exists() || account.data().firebase_uid !== firebaseUid || account.data().active !== true) throw new Error(`Sign In To Publish Your Shared Domains`);
  const sources = await getDocsFromServer(query(collection(getFirebaseDb(), `users`, userId, `domains`), orderBy(documentId()), limit(PUBLIC_DOMAIN_LIMIT)));
  assertActor();
  for (let start = 0; start < sources.docs.length; start += PUBLIC_DOMAIN_WRITE_LIMIT) {
    const chunk = sources.docs.slice(start, start + PUBLIC_DOMAIN_WRITE_LIMIT);
    await runTransaction(getFirebaseDb(), async transaction => {
      const current = await Promise.all(chunk.map(source => transaction.get(source.ref)));
      assertActor();
      for (const source of current) {
        const reference = doc(getFirebaseDb(), `publicProfiles`, userId, `domains`, source.id);
        if (!source.exists()) transaction.delete(reference);
        else {
          const projection = projectPublicDomain(source.data(), userId);
          if (projection) transaction.set(reference, projection);
        }
      }
    });
    assertActor();
  }
};
