import type { Domain } from './models/Domain';

export type { Domain, Registrar, JSONValue, DomainRegistrant } from './models/Domain';

export type DomainRecord = Domain;
export type DomainInput = Omit<DomainRecord, `id` | `number` | `isSample`>;
export type DomainStatus = `Expired` | `Renewing Soon` | `Active` | `Unknown`;

export interface PortfolioSnapshot {
  version: 1;
  nextNumber: number;
  domains: DomainRecord[];
}
