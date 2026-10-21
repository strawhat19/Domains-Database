import type { JSONValue } from '../models/Data';
import type { DomainDataAccess, DomainDataRecord, DomainDataResponse } from './types';

const publicDomainFields = [`id`, `name`, `userId`, `created`, `registrar`, `expiresAt`, `description`, `projectStatus`, `tld`, `mvp`, `future`, `createdAt`, `difficulty`];
const privateDomainFields = [...publicDomainFields, `uid`, `uuid`, `type`, `email`, `title`, `number`, `updated`, `color`, `properties`, `owner`, `notes`, `isSample`, `autoRenew`, `renewalPrice`, `tags`, `status`, `locked`, `starred`, `privacy`, `dnssec`, `currency`, `updatedAt`, `providerId`, `ownershipAt`, `startingBid`, `parentLink`, `estimatedRevenue`, `githubRepoLink`, `productionLink`, `firstImportedAt`, `firstExportedAt`, `nameservers`, `childLinks`, `previewLinks`, `relatedLinks`, `developmentLinks`, `socialMediaLinks`, `internationalName`, `registrant`, `meta`, `websiteInsights`];
const privateCollectionFields = [`id`, `name`, `number`, `upvotes`, `downvotes`, `createdAt`, `domainIds`, `description`, `currentVote`, `sortDirection`, `visibility`, `sortField`, `projectStatus`];
const publicCollectionFields = [`id`, `name`, `number`, `createdAt`, `domainIds`, `description`, `visibility`, `projectStatus`];
const privateGroupFields = [`id`, `name`, `isApp`, `tags`, `parentLink`, `startingBid`, `siteIconUrl`, `childLinks`, `estimatedRevenue`, `githubRepoLink`, `productionLink`, `previewLinks`, `relatedLinks`, `developmentLinks`, `socialMediaLinks`, `projectStatus`, `starred`, `createdAt`, `description`, `collectionId`, `domainIds`];
const publicGroupFields = [`id`, `name`, `isApp`, `createdAt`, `description`, `collectionId`, `domainIds`];
const objectValue = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : null;
const secretKey = (key: string) => /(?:password|passwd|credential|authorization|apikey|token|secret|privatekey)/.test(key.replace(/[^a-z0-9]/gi, ``).toLowerCase()) || /^connections?$/i.test(key);

const safeValue = (value: unknown, depth = 0, ancestors = new Set<object>()): JSONValue | undefined => {
  if (value === null || typeof value === `boolean`) return value;
  if (typeof value === `string`) {
    if (/^(?:Bearer\s|-----BEGIN .*PRIVATE KEY)/i.test(value)) return undefined;
    if (/^https?:\/\//i.test(value)) {
      try {
        const url = new URL(value);
        if (url.username || url.password || [...url.searchParams.keys()].some(secretKey)) return undefined;
      } catch { /* Ordinary text remains exportable. */ }
    }
    return value;
  }
  if (typeof value === `number`) return Number.isFinite(value) ? value : null;
  if (typeof value !== `object` || depth > 20 || ancestors.has(value)) return undefined;
  const next = new Set(ancestors).add(value);
  if (Array.isArray(value)) return value.map(item => safeValue(item, depth + 1, next) ?? null);
  const result: DomainDataRecord = {};
  for (const [key, item] of Object.entries(value)) {
    if (secretKey(key) || [`__proto__`, `prototype`, `constructor`].includes(key)) continue;
    const safe = safeValue(item, depth + 1, next);
    if (safe !== undefined) result[key] = safe;
  }
  return result;
};
const pickFields = (value: unknown, fields: string[]): DomainDataRecord => {
  const source = objectValue(value);
  if (!source) return {};
  const result: DomainDataRecord = {};
  for (const key of fields) {
    const safe = safeValue(source[key]);
    if (safe !== undefined) result[key] = safe;
  }
  return result;
};
const validId = (value: unknown): value is string => typeof value === `string` && value.length > 0 && value.length <= 512 && !/[\u0000-\u001f\u007f/]/.test(value);
const publicText = (value: unknown, maximum: number): value is string => typeof value === `string` && value.length <= maximum;
const projectDomain = (value: unknown, publicOnly: boolean): DomainDataRecord => {
  if (!publicOnly) return pickFields(value, privateDomainFields);
  const source = objectValue(value);
  if (!source || !validId(source.id) || !validId(source.userId) || !publicText(source.name, 253) || !source.name
    || !publicText(source.description, 2_000) || !publicText(source.registrar, 100) || !publicText(source.projectStatus, 80)
    || !publicText(source.created, 64) || !publicText(source.expiresAt, 64)) return {};
  const result = pickFields(source, publicDomainFields);
  for (const field of [`tld`, `mvp`, `future`, `createdAt`, `difficulty`]) if (source[field] !== undefined && !publicText(source[field], 2_000)) delete result[field];
  return result;
};
const relationship = (value: unknown, publicOnly: boolean, collection: boolean): DomainDataRecord | null => {
  const source = objectValue(value);
  if (!source || !validId(source.id) || !publicText(source.name, 200) || !source.name.trim()
    || source.domainIds !== undefined && (!Array.isArray(source.domainIds) || source.domainIds.length > 10_000 || source.domainIds.some(id => !validId(id)))
    || !collection && !Array.isArray(source.domainIds)) return null;
  if (publicOnly) {
    if (source.description !== undefined && !publicText(source.description, 2_000) || source.createdAt !== undefined && !publicText(source.createdAt, 64)) return null;
    if (collection && (source.visibility !== `public` || !Number.isSafeInteger(source.number) || (source.number as number) < 1)) return null;
    if (!collection && (!validId(source.collectionId) || source.isApp !== undefined && typeof source.isApp !== `boolean`)) return null;
    if (source.projectStatus !== undefined && !publicText(source.projectStatus, 80)) return null;
  }
  return { ...pickFields(source, collection ? publicOnly ? publicCollectionFields : privateCollectionFields : publicOnly ? publicGroupFields : privateGroupFields), domainIds: (source.domainIds as string[] | undefined) ?? [] };
};

export interface BuildDomainDataInput {
  domains: unknown[];
  groups?: unknown[];
  collections?: unknown[];
  userId?: string | null;
  access: DomainDataAccess;
  source: DomainDataResponse[`source`];
  warnings?: string[];
  page?: Partial<DomainDataResponse[`page`]>;
}
export const buildDomainDataResponse = (input: BuildDomainDataInput): DomainDataResponse => {
  const publicOnly = input.access === `public`;
  const domains = input.domains.map(value => projectDomain(value, publicOnly)).filter(value => validId(value.id));
  const ids = new Set(domains.map(domain => domain.id as string));
  const prune = (record: DomainDataRecord): DomainDataRecord & { domainIds: string[] } => ({ ...record, domainIds: [...new Set((record.domainIds as string[]).filter(id => ids.has(id)))] });
  const relationships = (input.groups ?? []).map(value => relationship(value, publicOnly, false)).filter((value): value is DomainDataRecord => !!value);
  const collections = (input.collections ?? []).map(value => relationship(value, publicOnly, true)).filter((value): value is DomainDataRecord => !!value).map(value => prune({ ...value, domainIds: [...(value.domainIds as string[]), ...relationships.filter(group => group.collectionId === value.id).flatMap(group => group.domainIds as string[])] }));
  const collectionIds = new Set(collections.map(collection => collection.id));
  const groups = relationships.map(prune).filter(value => !publicOnly || collectionIds.has(value.collectionId));
  const hasMore = input.page?.hasMore === true;
  return {
    schemaVersion: 1,
    success: true,
    fetchedAt: new Date().toISOString(),
    userId: input.userId ?? null,
    source: input.source,
    access: input.access,
    domains,
    groups,
    collections,
    page: { limit: input.page?.limit ?? domains.length, returned: domains.length, hasMore, nextCursor: hasMore ? input.page?.nextCursor ?? null : null },
    coverage: { relationships: `page`, warnings: [...new Set(input.warnings ?? [])] },
  };
};
