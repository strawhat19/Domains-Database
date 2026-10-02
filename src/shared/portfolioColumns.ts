import type { DomainRecord } from './types';

export type PortfolioColumn =
  | `name` | `registrar` | `expiresAt` | `autoRenew` | `renewalPrice` | `monthlyCost`
  | `owner` | `tld` | `internationalName` | `providerId` | `status`
  | `createdAt` | `updatedAt` | `ownershipAt` | `locked` | `privacy`
  | `firstImportedAt` | `firstExportedAt`
  | `dnssec` | `nameservers` | `currency` | `registrantName`
  | `registrantEmail` | `organization` | `country` | `notes`
  | `forwardingUrl` | `protectionPlan` | `estimatedValue`;

export type PortfolioColumnValue = string | number | boolean | string[] | undefined;

export interface PortfolioColumnDefinition {
  price?: boolean;
  label: string;
  field: PortfolioColumn;
}

export const PORTFOLIO_COLUMNS: PortfolioColumnDefinition[] = [
  { field: `name`, label: `Domain` },
  { field: `registrar`, label: `Registrar` },
  { field: `expiresAt`, label: `Renewal date` },
  { field: `autoRenew`, label: `Auto-renew` },
  { field: `renewalPrice`, label: `Annual cost`, price: true },
  { field: `monthlyCost`, label: `Monthly cost`, price: true },
  { field: `owner`, label: `Owner` },
  { field: `tld`, label: `TLD` },
  { field: `internationalName`, label: `International name` },
  { field: `providerId`, label: `Provider ID` },
  { field: `status`, label: `Provider status` },
  { field: `createdAt`, label: `Created` },
  { field: `updatedAt`, label: `Last updated` },
  { field: `ownershipAt`, label: `Ownership date` },
  { field: `firstImportedAt`, label: `First imported` },
  { field: `firstExportedAt`, label: `First exported` },
  { field: `locked`, label: `Domain lock` },
  { field: `privacy`, label: `Privacy` },
  { field: `dnssec`, label: `DNSSEC` },
  { field: `nameservers`, label: `Nameservers` },
  { field: `currency`, label: `Currency` },
  { field: `registrantName`, label: `Registrant name` },
  { field: `registrantEmail`, label: `Registrant email` },
  { field: `organization`, label: `Organization` },
  { field: `country`, label: `Country` },
  { field: `notes`, label: `Notes` },
  { field: `forwardingUrl`, label: `Forwarding URL` },
  { field: `protectionPlan`, label: `Protection plan` },
  { field: `estimatedValue`, label: `Estimated value`, price: true },
];

export const DEFAULT_VISIBLE_COLUMNS: PortfolioColumn[] = [
  `name`, `registrar`, `expiresAt`, `autoRenew`, `renewalPrice`,
];
export const COLUMN_STORAGE_KEY = `domains-database:columns:v1`;

const EXTRA_HEADERS = {
  forwardingUrl: [`forwardingurl`, `forwarding`, `forwardsto`, `forwardingaddress`],
  protectionPlan: [`protectionplan`, `domainprotection`, `domainprotectionplan`],
  estimatedValue: [`estimatedvalue`, `appraisalvalue`, `godaddyappraisal`, `estimatedprice`],
};

const DATE_COLUMNS: PortfolioColumn[] = [`expiresAt`, `createdAt`, `updatedAt`, `ownershipAt`];
const TIMESTAMP_COLUMNS: PortfolioColumn[] = [`firstImportedAt`, `firstExportedAt`];
const MISSING_COLUMN_VALUES = new Set([`—`, `–`, `-`, `n/a`, `unknown`]);

export const hasPortfolioColumnValue = (value: unknown, column?: PortfolioColumn): boolean => {
  if (typeof value === `number`) return Number.isFinite(value);
  if (typeof value === `boolean`) return true;
  if (Array.isArray(value)) return value.some(entry => hasPortfolioColumnValue(entry));
  if (typeof value !== `string`) return false;
  const text = value.trim();
  if (!text || MISSING_COLUMN_VALUES.has(text.toLowerCase())) return false;
  if (column && (DATE_COLUMNS.includes(column) || TIMESTAMP_COLUMNS.includes(column))) {
    return !Number.isNaN(new Date(text).getTime());
  }
  return true;
};

const readMetaValue = (domain: DomainRecord, column: keyof typeof EXTRA_HEADERS): PortfolioColumnValue => {
  for (const source of [domain.meta?.normalized, domain.meta?.csv]) {
    if (!source || typeof source !== `object` || Array.isArray(source)) continue;
    const match = Object.entries(source).find(([header]) => (
      EXTRA_HEADERS[column].includes(header.toLowerCase().replace(/[^a-z0-9]/g, ``))
    ));
    const value = match?.[1];
    if (typeof value !== `string` && typeof value !== `number` && typeof value !== `boolean`) continue;
    if (!hasPortfolioColumnValue(value, column)) continue;
    if (column === `estimatedValue` && typeof value === `string` && /\d/.test(value)) {
      const amount = Number(value.replace(/[^\d.-]/g, ``));
      if (Number.isFinite(amount)) return amount;
    }
    return value;
  }
  return undefined;
};

export const getPortfolioColumnValue = (domain: DomainRecord, column: PortfolioColumn): PortfolioColumnValue => {
  switch (column) {
    case `monthlyCost`: return Number.isFinite(domain.renewalPrice) ? domain.renewalPrice / 12 : undefined;
    case `registrantName`: return domain.registrant?.name;
    case `registrantEmail`: return domain.registrant?.email;
    case `organization`: return domain.registrant?.organization;
    case `country`: return domain.registrant?.country;
    case `tld`: return hasPortfolioColumnValue(domain.tld) ? domain.tld : domain.name.slice(domain.name.lastIndexOf(`.`));
    case `forwardingUrl`:
    case `protectionPlan`:
    case `estimatedValue`: return readMetaValue(domain, column);
    default: return domain[column];
  }
};

export const getPortfolioColumnDisplay = (domain: DomainRecord, column: PortfolioColumn) => {
  const value = getPortfolioColumnValue(domain, column);
  if (!hasPortfolioColumnValue(value, column)) return `—`;
  if (Array.isArray(value)) return value.filter(entry => hasPortfolioColumnValue(entry)).join(`, `);
  if (typeof value === `boolean`) {
    if (column === `locked`) return value ? `Locked` : `Unlocked`;
    return value ? `On` : `Off`;
  }
  if ((DATE_COLUMNS.includes(column) || TIMESTAMP_COLUMNS.includes(column)) && typeof value === `string`) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return `—`;
    if (TIMESTAMP_COLUMNS.includes(column)) {
      return new Intl.DateTimeFormat(`en-US`, {
        dateStyle: `medium`,
        timeStyle: `short`,
      }).format(date);
    }
    return new Intl.DateTimeFormat(`en-US`, {
      day: `numeric`,
      month: `short`,
      year: `numeric`,
      timeZone: `UTC`,
    }).format(date);
  }
  if ((column === `renewalPrice` || column === `monthlyCost` || column === `estimatedValue`) && typeof value === `number`) {
    if (!Number.isFinite(value)) return `—`;
    const currency = domain.currency?.trim().toUpperCase() || `USD`;
    return new Intl.NumberFormat(`en-US`, {
      style: `currency`,
      currency: /^[A-Z]{3}$/.test(currency) ? currency : `USD`,
    }).format(value);
  }
  return String(value);
};

export const getPortfolioColumnCounts = (domains: DomainRecord[]): Record<PortfolioColumn, number> => (
  Object.fromEntries(PORTFOLIO_COLUMNS.map(column => [
    column.field,
    domains.filter(domain => hasPortfolioColumnValue(getPortfolioColumnValue(domain, column.field), column.field)).length,
  ])) as Record<PortfolioColumn, number>
);
