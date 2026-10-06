import { Data } from '../Data';
import type { JSONValue } from '../Data';
import { Types } from '../../../types/types';
import { isAppCollectionID } from '../../common/ids';

export type Registrar = `Vercel` | `Porkbun` | `NameSilo` | `Hostinger` | `GoDaddy` | `GoDaddy Auctions` | `Namecheap` | `Squarespace`;
export type { JSONValue } from '../Data';

export interface DomainRegistrant {
  name?: string;
  email?: string;
  country?: string;
  organization?: string;
}

export class Domain extends Data {
  owner: string;
  notes: string;
  isSample?: boolean;
  expiresAt: string;
  autoRenew: boolean;
  renewalPrice: number;
  registrar: Registrar | ``;
  tld?: string;
  status?: string;
  locked?: boolean;
  privacy?: boolean;
  dnssec?: boolean;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
  providerId?: string;
  ownershipAt?: string;
  firstImportedAt?: string;
  firstExportedAt?: string;
  nameservers?: string[];
  internationalName?: string;
  registrant?: DomainRegistrant;
  meta?: Record<string, JSONValue>;

  constructor(data: Partial<Domain> = {}) {
    const appId = isAppCollectionID(data.id, Types.Domain) ? data.id : undefined;
    const externalId = data.id && !appId ? String(data.id) : undefined;
    super({ ...data, id: appId, type: Types.Domain });
    this.owner = data.owner ?? ``;
    this.notes = data.notes ?? ``;
    this.tld = data.tld;
    this.status = data.status;
    this.locked = data.locked;
    this.privacy = data.privacy;
    this.dnssec = data.dnssec;
    this.currency = data.currency;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.ownershipAt = data.ownershipAt;
    this.isSample = data.isSample === true;
    this.expiresAt = data.expiresAt ?? ``;
    this.firstImportedAt = data.firstImportedAt;
    this.firstExportedAt = data.firstExportedAt;
    this.registrar = data.registrar ?? ``;
    this.autoRenew = data.autoRenew ?? false;
    this.renewalPrice = data.renewalPrice ?? 0;
    this.internationalName = data.internationalName;
    this.providerId = data.providerId ?? externalId;
    this.nameservers = data.nameservers ? [...data.nameservers] : undefined;
    this.registrant = data.registrant ? { ...data.registrant } : undefined;
    this.meta = data.meta ? { ...data.meta } : undefined;
    this.refreshProperties();
  }
}
