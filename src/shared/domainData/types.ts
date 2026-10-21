import type { JSONValue } from '../models/Data';

export type DomainDataRecord = Record<string, JSONValue>;
export type DomainDataAccess = `public` | `own` | `owner` | `displayed`;
export interface DomainDataQuery {
  limit?: number;
  cursor?: string;
  userId?: string;
  domainId?: string;
  visibility?: `accessible` | `public`;
}
export interface DomainDataResponse {
  schemaVersion: 1;
  success: true;
  fetchedAt: string;
  userId: string | null;
  access: DomainDataAccess;
  source: `firebase` | `displayed`;
  domains: DomainDataRecord[];
  groups: DomainDataRecord[];
  collections: DomainDataRecord[];
  page: { limit: number; returned: number; hasMore: boolean; nextCursor: string | null };
  coverage: { relationships: `page`; warnings: string[] };
}
