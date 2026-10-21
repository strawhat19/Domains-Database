import { utf8ToBytes } from '@noble/hashes/utils.js';
import { DOMAIN_PROJECT_STATUSES } from '../domainProject';
import type { DomainProjectStatus } from '../domainProject';
import { isAppCollectionID, getAppCollectionIDNumber } from '../common/ids';

export const PUBLIC_PORTFOLIO_DOCUMENT = `shared`;
export const PUBLIC_PORTFOLIO_COLLECTION_LIMIT = 200;
export const PUBLIC_PORTFOLIO_GROUP_LIMIT = 500;
export const PUBLIC_PORTFOLIO_REFERENCE_LIMIT = 5000;
export const PUBLIC_PORTFOLIO_BYTE_LIMIT = 750_000;
export const PUBLIC_PORTFOLIO_PREFERENCES_KEY = `domains-database:preferences:v1`;

export interface PublicPortfolioCollection {
  id: string;
  name: string;
  number: number;
  domainIds: string[];
  createdAt?: string;
  description?: string;
  visibility: `public`;
  projectStatus?: DomainProjectStatus;
}

export interface PublicPortfolioGroup {
  id: string;
  name: string;
  isApp?: boolean;
  collectionId: string;
  domainIds: string[];
  createdAt?: string;
  description?: string;
}

export interface PublicPortfolioSnapshot {
  version: 1;
  userId: string;
  updatedAt: string;
  sourceDataId: string;
  sourceRevision: number;
  groups: PublicPortfolioGroup[];
  collections: PublicPortfolioCollection[];
}

type RecordValue = Record<string, unknown>;
const unreadable = () => new Error(`Shared Portfolio Could Not Be Read`);
const overLimit = () => new Error(`Shared Portfolio Exceeds Publication Limits — Reduce Shared Collections, Groups Or Memberships Before Saving`);
const asRecord = (value: unknown): RecordValue => {
  if (!value || typeof value !== `object` || Array.isArray(value)) throw unreadable();
  return value as RecordValue;
};
const list = (value: unknown): unknown[] => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw unreadable();
  return value;
};
const text = (value: unknown, maximum: number, required = false): string => {
  if (typeof value !== `string` || value.length > maximum || (required && !value.trim())) throw unreadable();
  return value;
};
const stringIds = (value: unknown): string[] => [...new Set(list(value).map(id => text(id, 240, true)))];
const domainIds = (value: unknown, hidden: Set<string>) => stringIds(value).filter(id => {
  if (!isAppCollectionID(id, `Domain`)) throw unreadable();
  return !hidden.has(id);
});
const optionalText = (source: RecordValue, field: `description` | `createdAt`, maximum: number): RecordValue => {
  if (source[field] === undefined) return {};
  const value = text(source[field], maximum);
  if (field === `createdAt` && !Number.isFinite(Date.parse(value))) throw unreadable();
  return { [field]: value };
};
const exactKeys = (record: RecordValue, keys: readonly string[]) => {
  if (Object.keys(record).some(key => !keys.includes(key))) throw unreadable();
};
const assertSnapshot = (snapshot: PublicPortfolioSnapshot) => {
  const references = snapshot.collections.reduce((count, collection) => count + collection.domainIds.length, 0)
    + snapshot.groups.reduce((count, group) => count + group.domainIds.length, 0);
  if (snapshot.collections.length > PUBLIC_PORTFOLIO_COLLECTION_LIMIT || snapshot.groups.length > PUBLIC_PORTFOLIO_GROUP_LIMIT
    || references > PUBLIC_PORTFOLIO_REFERENCE_LIMIT || utf8ToBytes(JSON.stringify(snapshot)).byteLength > PUBLIC_PORTFOLIO_BYTE_LIMIT) throw overLimit();
};

export const projectPublicPortfolio = (
  value: unknown,
  userId: string,
  sourceDataId: string,
  sourceRevision: number,
  updatedAt = new Date().toISOString(),
): PublicPortfolioSnapshot | null => {
  if (!isAppCollectionID(userId, `User`) || !isAppCollectionID(sourceDataId, `Data`)
    || !Number.isSafeInteger(sourceRevision) || sourceRevision < 1 || !Number.isFinite(Date.parse(updatedAt))) throw unreadable();
  const preferences = asRecord(value);
  const hiddenDomains = new Set(stringIds(preferences.hiddenDomainIds));
  const hiddenGroups = new Set(list(preferences.hiddenGroupKeys).map(key => text(key, PUBLIC_PORTFOLIO_BYTE_LIMIT, true)));
  const hiddenCollections = new Set(stringIds(preferences.hiddenCollectionIds));
  const sourceGroups = list(preferences.customGroups).map(asRecord);
  const sourceCollections = list(preferences.collections).map(asRecord);
  for (const collection of sourceCollections) {
    if (typeof collection.id === `string` && (hiddenCollections.has(collection.id) || hiddenGroups.has(`collection:${collection.id}`))) {
      stringIds(collection.domainIds).forEach(id => hiddenDomains.add(id));
    }
  }
  for (const group of sourceGroups) {
    const hidden = typeof group.id === `string` && (hiddenGroups.has(group.id) || hiddenGroups.has(`custom:${group.id}`));
    if (hidden || (typeof group.collectionId === `string` && hiddenCollections.has(group.collectionId))) {
      stringIds(group.domainIds).forEach(id => hiddenDomains.add(id));
    }
  }
  const collectionIds = new Set<string>();
  const collections = sourceCollections.flatMap((collection): PublicPortfolioCollection[] => {
    if (collection.visibility !== `public`) return [];
    const id = text(collection.id, 240, true);
    if (hiddenCollections.has(id)) return [];
    if (!isAppCollectionID(id, `Collection`) || collection.number !== getAppCollectionIDNumber(id, `Collection`) || collectionIds.has(id)) throw unreadable();
    collectionIds.add(id);
    if (collection.projectStatus !== undefined && !DOMAIN_PROJECT_STATUSES.some(status => status.value === collection.projectStatus)) throw unreadable();
    return [{
      id,
      visibility: `public`,
      name: text(collection.name, 80, true),
      number: collection.number as number,
      domainIds: domainIds(collection.domainIds, hiddenDomains),
      ...optionalText(collection, `description`, 280),
      ...optionalText(collection, `createdAt`, 100),
      ...(collection.projectStatus === undefined ? {} : { projectStatus: collection.projectStatus as DomainProjectStatus }),
    }];
  });
  const groupIds = new Set<string>();
  const groups = sourceGroups.flatMap((group): PublicPortfolioGroup[] => {
    if (typeof group.collectionId !== `string` || !collectionIds.has(group.collectionId)) return [];
    const id = text(group.id, 240, true);
    if (hiddenGroups.has(id) || hiddenGroups.has(`custom:${id}`)) return [];
    if (groupIds.has(id) || (group.isApp !== undefined && typeof group.isApp !== `boolean`)) throw unreadable();
    groupIds.add(id);
    return [{
      id,
      name: text(group.name, 80, true),
      collectionId: group.collectionId,
      domainIds: domainIds(group.domainIds, hiddenDomains),
      ...optionalText(group, `description`, 280),
      ...optionalText(group, `createdAt`, 100),
      ...(group.isApp === undefined ? {} : { isApp: group.isApp }),
    }];
  });
  if (!collections.length) return null;
  const snapshot: PublicPortfolioSnapshot = { groups, userId, updatedAt, collections, sourceDataId, sourceRevision, version: 1 };
  assertSnapshot(snapshot);
  return snapshot;
};

export const readPublicPortfolio = (value: unknown, userId: string): PublicPortfolioSnapshot => {
  const snapshot = asRecord(value);
  exactKeys(snapshot, [`groups`, `userId`, `version`, `updatedAt`, `collections`, `sourceDataId`, `sourceRevision`]);
  if (snapshot.version !== 1 || snapshot.userId !== userId || !Array.isArray(snapshot.groups) || !Array.isArray(snapshot.collections)) throw unreadable();
  for (const item of snapshot.collections) {
    const collection = asRecord(item);
    exactKeys(collection, [`id`, `name`, `number`, `domainIds`, `createdAt`, `visibility`, `description`, `projectStatus`]);
    if (collection.visibility !== `public` || !Array.isArray(collection.domainIds)) throw unreadable();
  }
  for (const item of snapshot.groups) {
    const group = asRecord(item);
    exactKeys(group, [`id`, `name`, `isApp`, `domainIds`, `createdAt`, `description`, `collectionId`]);
    if (!Array.isArray(group.domainIds) || typeof group.collectionId !== `string`) throw unreadable();
  }
  const result = projectPublicPortfolio({ collections: snapshot.collections, customGroups: snapshot.groups }, userId,
    text(snapshot.sourceDataId, 240, true), snapshot.sourceRevision as number, text(snapshot.updatedAt, 100, true));
  if (!result || result.groups.length !== snapshot.groups.length || result.collections.length !== snapshot.collections.length) throw unreadable();
  return result;
};
