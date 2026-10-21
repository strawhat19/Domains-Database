import { Roles } from '../../types/types';
import { DomainDataError } from './request';
import { firebaseEnabled } from '../../shared/firebase/config';
import { buildDomainDataResponse } from '../../shared/domainData/serialize';
import { getAppCollectionIDNumber } from '../../shared/common/ids';
import { readDomainDocument, readDomainPage } from './firebase';
import { readPublicPortfolio } from '../../shared/publicDirectory/portfolio';
import { applyRecordTimestamps, readRecordTimestamps } from '../../shared/firebase/recordTimestamps';
import { verifyFirebaseToken, requireSignedInUser, decodeField, readDocument } from '../connections/firebase';
import type { DomainReadContext, DomainDocument } from './firebase';
import type { DomainDataQuery } from '../../shared/domainData/types';
import type { ImportFirebaseContext } from '../connections/firebase';

const PREFERENCES_KEY = `domains-database:preferences:v1`;
const malformed = () => new DomainDataError(502, `Saved Domain Data Could Not Be Read`);
const objectValue = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : null;
const recordIdentity = (record: DomainDocument, userId: string, publicOnly: boolean) => {
  const number = getAppCollectionIDNumber(record.id, `Domain`);
  if (!number || record.data.id !== record.id || (publicOnly ? record.data.userId !== userId : record.data.uid !== userId || record.data.number !== number)) throw malformed();
  return record.data;
};
const privateRelationships = async (userId: string, context: DomainReadContext): Promise<{ groups: unknown[]; collections: unknown[] }> => {
  const index = await readDomainDocument([`users`, userId, `storageKeys`, encodeURIComponent(PREFERENCES_KEY)], context);
  if (!index) return { groups: [], collections: [] };
  const id = index.data.id;
  const number = getAppCollectionIDNumber(id, `Data`);
  if (!number || index.data.number !== number || index.data.key !== PREFERENCES_KEY) throw malformed();
  const document = await readDomainDocument([`users`, userId, `data`, id as string], context);
  const record = document?.data;
  if (!record || record.id !== id || record.uid !== userId || record.number !== number || record.key !== PREFERENCES_KEY || typeof record.value !== `string`
    || !Number.isSafeInteger(record.revision) || (record.revision as number) < 1) throw malformed();
  let preferences: Record<string, unknown> | null;
  try { preferences = objectValue(JSON.parse(record.value)); } catch { throw malformed(); }
  if (!preferences || !Array.isArray(preferences.collections) || !Array.isArray(preferences.customGroups)
    || preferences.collections.length > 1_000 || preferences.customGroups.length > 1_000) throw malformed();
  return { collections: preferences.collections, groups: preferences.customGroups };
};
const publicRelationships = async (userId: string, context: DomainReadContext) => {
  const document = await readDomainDocument([`publicProfiles`, userId, `portfolio`, `shared`], context);
  if (!document) return { groups: [], collections: [], warnings: [`Public Collection And Group Metadata Has Not Been Published`] };
  let record: ReturnType<typeof readPublicPortfolio>;
  try { record = readPublicPortfolio(document.data, userId); } catch { throw malformed(); }
  return { groups: record.groups, collections: record.collections, warnings: [] };
};

export const fetchDomainData = async (query: DomainDataQuery, token: string | undefined, signal: AbortSignal) => {
  if (!firebaseEnabled) throw new DomainDataError(503, `Connect Firebase To Fetch Saved Domain Data`);
  let actorId: string | null = null;
  let owner = false;
  if (token) {
    const authority: ImportFirebaseContext = { token, signal, readVersions: new Map() };
    const firebaseUid = await verifyFirebaseToken(authority);
    actorId = await requireSignedInUser(firebaseUid, authority);
    const actor = await readDocument([`users`, actorId], authority);
    if (!actor || decodeField(actor.fields.active) !== true || decodeField(actor.fields.firebase_uid) !== firebaseUid || decodeField(actor.fields.id) !== actorId) throw new DomainDataError(403, `Your Account Access Could Not Be Confirmed`);
    owner = decodeField(actor.fields.role) === Roles.Owner;
  }
  const userId = query.userId ?? actorId;
  if (!userId) throw new DomainDataError(400, `Choose A Public User ID Or Sign In For Your Domains`);
  const own = actorId === userId;
  const privateAccess = query.visibility !== `public` && (own || owner);
  // Public reads deliberately omit the caller token, so private Firestore grants cannot widen the response.
  const context: DomainReadContext = { signal, ...(privateAccess && token ? { token } : {}) };
  const parent = [privateAccess ? `users` : `publicProfiles`, userId];
  if (!privateAccess) {
    const profile = await readDomainDocument(parent, context);
    if (!profile || profile.data.id !== userId || profile.data.profilePrivacy !== `public` || profile.data.publicDomains !== true) throw new DomainDataError(403, `This User Has Not Shared Their Domain Portfolio`);
  }
  const limit = query.domainId ? 1 : query.limit ?? 50;
  const [records, relationships, snapshot] = await Promise.all([
    query.domainId ? readDomainDocument([...parent, `domains`, query.domainId], context).then(record => record ? [record] : []) : readDomainPage(parent, `domains`, limit + 1, query.cursor, context),
    privateAccess ? privateRelationships(userId, context).then(value => ({ ...value, warnings: [] as string[] })) : publicRelationships(userId, context),
    privateAccess ? readDomainDocument([`users`, userId, `snapshots`, `portfolio`], context) : Promise.resolve(null),
  ]);
  const hasMore = records.length > limit;
  const page = records.slice(0, limit);
  const timestamps = snapshot ? readRecordTimestamps(snapshot.data.recordTimestamps) : {};
  const indexed = snapshot?.data.ids;
  if (snapshot && (!Array.isArray(indexed) || indexed.some(id => typeof id !== `string`) || !Number.isSafeInteger(snapshot.data.revision))) throw malformed();
  const domains = page.map(record => {
    const value = recordIdentity(record, userId, !privateAccess);
    const times = privateAccess && Array.isArray(indexed) && indexed.includes(record.id) ? timestamps[value.number as number] : undefined;
    return times ? applyRecordTimestamps(value, times) : value;
  });
  const result = buildDomainDataResponse({
    domains,
    userId,
    source: `firebase`,
    groups: relationships.groups,
    collections: relationships.collections,
    warnings: [...relationships.warnings, `Relationships Include Only Domains In This Response; No Provider Refresh Was Requested`],
    access: privateAccess ? own ? `own` : `owner` : `public`,
    page: { limit, hasMore, nextCursor: hasMore ? page.at(-1)?.id ?? null : null },
  });
  if (result.domains.length !== domains.length) throw malformed();
  return result;
};
