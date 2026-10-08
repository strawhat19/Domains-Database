import { Data } from '../Data';
import type { JSONValue } from '../Data';
import { Types } from '../../../types/types';
import { isAppCollectionID } from '../../common/ids';
import type { DomainTag } from '../../domainTags';
import { normalizeDomainTags } from '../../domainTags';
import { restoreDomainPrice } from '../../domainPricing';
import { normalizeDomainProjectStatus } from '../../domainProject';
import type { DomainDifficulty, DomainProjectStatus } from '../../domainProject';

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
  projectStatus: DomainProjectStatus;
  tld?: string;
  mvp?: string;
  tags?: DomainTag[];
  status?: string;
  future?: string;
  locked?: boolean;
  starred?: boolean;
  privacy?: boolean;
  dnssec?: boolean;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
  providerId?: string;
  ownershipAt?: string;
  startingBid?: number;
  parentLink?: string;
  difficulty?: DomainDifficulty;
  estimatedRevenue?: number;
  githubRepoLink?: string;
  productionLink?: string;
  firstImportedAt?: string;
  firstExportedAt?: string;
  nameservers?: string[];
  childLinks?: string[];
  previewLinks?: string[];
  relatedLinks?: string[];
  developmentLinks?: string[];
  socialMediaLinks?: string[];
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
    this.mvp = data.mvp;
    this.tags = normalizeDomainTags(data.tags);
    this.status = data.status;
    this.future = data.future;
    this.locked = data.locked;
    this.starred = data.starred === true;
    this.privacy = data.privacy;
    this.dnssec = data.dnssec;
    this.currency = data.currency;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.ownershipAt = data.ownershipAt;
    this.startingBid = restoreDomainPrice(data.startingBid);
    this.parentLink = data.parentLink;
    this.difficulty = data.difficulty;
    this.estimatedRevenue = restoreDomainPrice(data.estimatedRevenue);
    this.githubRepoLink = data.githubRepoLink;
    this.productionLink = data.productionLink;
    this.isSample = data.isSample === true;
    this.expiresAt = data.expiresAt ?? ``;
    this.firstImportedAt = data.firstImportedAt;
    this.firstExportedAt = data.firstExportedAt;
    this.projectStatus = normalizeDomainProjectStatus(data.projectStatus);
    this.registrar = data.registrar ?? ``;
    this.autoRenew = data.autoRenew ?? false;
    this.renewalPrice = data.renewalPrice ?? 0;
    this.internationalName = data.internationalName;
    this.providerId = data.providerId ?? externalId;
    this.nameservers = data.nameservers ? [...data.nameservers] : undefined;
    this.childLinks = Array.isArray(data.childLinks) ? [...data.childLinks] : undefined;
    this.previewLinks = Array.isArray(data.previewLinks) ? [...data.previewLinks] : undefined;
    this.relatedLinks = Array.isArray(data.relatedLinks) ? [...data.relatedLinks] : undefined;
    this.developmentLinks = Array.isArray(data.developmentLinks) ? [...data.developmentLinks] : undefined;
    this.socialMediaLinks = Array.isArray(data.socialMediaLinks) ? [...data.socialMediaLinks] : undefined;
    this.registrant = data.registrant ? { ...data.registrant } : undefined;
    this.meta = data.meta ? { ...data.meta } : undefined;
    this.refreshProperties();
  }
}
