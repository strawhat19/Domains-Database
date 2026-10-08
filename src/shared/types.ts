import type { Data, DataColor } from './models/Data';
import type { Domain } from './models/domains/Domain';

export type { JSONValue } from './models/Data';
export type { DomainDifficulty, DomainProjectStatus } from './domainProject';
export type { Domain, Registrar, DomainRegistrant } from './models/domains/Domain';

export type DomainRecord = Domain;
export type DomainSource = `csv` | `manual` | `registrar`;
export interface DomainInput extends Omit<DomainRecord, keyof Data | `isSample` | `projectStatus`> {
  name: string;
  title?: string;
  color?: DataColor;
  description?: string;
  projectStatus?: DomainRecord[`projectStatus`];
}
export type DomainStatus = `Expired` | `Renewing Soon` | `Active` | `Unknown`;

export interface PortfolioSnapshot {
  version: 1;
  nextNumber: number;
  domains: DomainRecord[];
}
