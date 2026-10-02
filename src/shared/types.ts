import type { Data, DataColor } from './models/Data';
import type { Domain } from './models/domains/Domain';

export type { JSONValue } from './models/Data';
export type { Domain, Registrar, DomainRegistrant } from './models/domains/Domain';

export type DomainRecord = Domain;
export interface DomainInput extends Omit<DomainRecord, keyof Data | `isSample`> {
  name: string;
  title?: string;
  color?: DataColor;
  description?: string;
}
export type DomainStatus = `Expired` | `Renewing Soon` | `Active` | `Unknown`;

export interface PortfolioSnapshot {
  version: 1;
  nextNumber: number;
  domains: DomainRecord[];
}
