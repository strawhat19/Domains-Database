export type Registrar = `Hostinger` | `GoDaddy` | `GoDaddy Auctions` | `Namecheap` | `Squarespace`;

export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

export interface DomainRegistrant {
  name?: string;
  email?: string;
  country?: string;
  organization?: string;
}

// Common fields normalized from the registrar schemas below; provider extras belong in meta.
// GoDaddy: https://developer.godaddy.com/openapi/domains-v1.json
// Hostinger: https://github.com/hostinger/api/blob/main/openapi.json
// Namecheap: https://www.namecheap.com/support/api/methods/domains/get-info/
export interface Domain {
  id: string;
  name: string;
  owner: string;
  notes: string;
  number: number;
  isSample?: boolean;
  expiresAt: string;
  autoRenew: boolean;
  registrar: Registrar | ``;
  renewalPrice: number;

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
}
