import type { DomainRecord } from './types';
import { normalizeWebsiteInsights } from './websiteInsights/values';
import { DOMAIN_DIFFICULTIES, DOMAIN_PROJECT_STATUSES, normalizeDomainDifficulty, normalizeDomainProjectStatus } from './domainProject';

export type PortfolioColumn =
  | `name` | `registrar` | `expiresAt` | `autoRenew` | `renewalPrice` | `monthlyCost`
  | `projectStatus` | `difficulty` | `mvp` | `future`
  | `trancoRank` | `websitePerformance` | `websiteInsightsCheckedAt`
  | `owner` | `tld` | `internationalName` | `providerId` | `status`
  | `createdAt` | `updatedAt` | `ownershipAt` | `locked` | `privacy`
  | `firstImportedAt` | `firstExportedAt`
  | `dnssec` | `nameservers` | `currency` | `registrantName`
  | `registrantEmail` | `organization` | `country`
  | `forwardingUrl` | `protectionPlan` | `estimatedValue`;

export type PortfolioColumnValue = string | number | boolean | string[] | undefined;

export interface PortfolioColumnDefinition {
  price?: boolean;
  public?: boolean;
  label: string;
  field: PortfolioColumn;
}

export const PORTFOLIO_COLUMNS: PortfolioColumnDefinition[] = [
  { field: `name`, label: `Domain`, public: true },
  { field: `mvp`, label: `MVP`, public: true },
  { field: `future`, label: `Future`, public: true },
  { field: `difficulty`, label: `Difficulty Level`, public: true },
  { field: `registrar`, label: `Registrar`, public: true },
  { field: `expiresAt`, label: `Renewal date`, public: true },
  { field: `autoRenew`, label: `Auto-renew` },
  { field: `renewalPrice`, label: `Annual cost`, price: true },
  { field: `monthlyCost`, label: `Monthly cost`, price: true },
  { field: `trancoRank`, label: `Tranco rank` },
  { field: `websitePerformance`, label: `Mobile performance` },
  { field: `websiteInsightsCheckedAt`, label: `Insights checked` },
  { field: `owner`, label: `Owner` },
  { field: `tld`, label: `TLD`, public: true },
  { field: `internationalName`, label: `International name` },
  { field: `providerId`, label: `Provider ID` },
  { field: `status`, label: `Provider status` },
  { field: `createdAt`, label: `Created`, public: true },
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
  { field: `forwardingUrl`, label: `Forwarding URL` },
  { field: `protectionPlan`, label: `Protection plan` },
  { field: `estimatedValue`, label: `Estimated value`, price: true },
];

export const PORTFOLIO_FIELDS: PortfolioColumnDefinition[] = [
  ...PORTFOLIO_COLUMNS,
  { field: `projectStatus`, label: `Status`, public: true },
];

export const DEFAULT_VISIBLE_COLUMNS: PortfolioColumn[] = [
  `name`, `registrar`, `expiresAt`, `autoRenew`, `renewalPrice`, `websitePerformance`, `trancoRank`,
];
export const getOrderedPortfolioColumns = (fields: readonly PortfolioColumn[]) => [...new Set(fields)].flatMap(field => {
  const column = PORTFOLIO_COLUMNS.find(item => item.field === field);
  return column ? [column] : [];
});
export const COLUMN_STORAGE_KEY = `domains-database:columns:v1`;

const EXTRA_HEADERS = {
  forwardingUrl: [`forwardingurl`, `forwarding`, `forwardsto`, `forwardingaddress`],
  protectionPlan: [`protectionplan`, `domainprotection`, `domainprotectionplan`],
  estimatedValue: [`estimatedvalue`, `appraisalvalue`, `godaddyappraisal`, `estimatedprice`],
};

const DATE_COLUMNS: PortfolioColumn[] = [`expiresAt`, `createdAt`, `updatedAt`, `ownershipAt`];
const TIMESTAMP_COLUMNS: PortfolioColumn[] = [`firstImportedAt`, `firstExportedAt`, `websiteInsightsCheckedAt`];
const MISSING_COLUMN_VALUES = new Set([`—`, `–`, `-`, `n/a`, `unknown`]);

export const getRenewalEstimate = (domain: DomainRecord) => {
  const sync = domain.meta?.registrarSync;
  const estimate = sync && typeof sync === `object` && !Array.isArray(sync) ? sync.renewalEstimate : undefined;
  if (!estimate || typeof estimate !== `object` || Array.isArray(estimate)) return undefined;
  const amount = estimate.amount;
  const currency = typeof estimate.currency === `string` ? estimate.currency.trim().toUpperCase() : ``;
  if (typeof amount !== `number` || !Number.isFinite(amount) || amount < 0 || !/^[A-Z]{3}$/.test(currency)) return undefined;
  const source = typeof estimate.source === `string` ? estimate.source.trim() : ``;
  const checkedAt = typeof estimate.checkedAt === `string` && Number.isFinite(Date.parse(estimate.checkedAt)) ? estimate.checkedAt : undefined;
  return { amount, source, currency, checkedAt };
};

export const getRenewalEstimateDisplay = (domain: DomainRecord) => {
  const estimate = getRenewalEstimate(domain);
  if (!estimate) return `—`;
  return new Intl.NumberFormat(`en-US`, {
    style: `currency`,
    currency: estimate.currency,
  }).format(estimate.amount);
};

export const getRenewalEstimateHint = (domain: DomainRecord) => {
  const estimate = getRenewalEstimate(domain);
  if (!estimate) return ``;
  const checked = estimate.checkedAt ? ` · Checked ${new Intl.DateTimeFormat(`en-US`, { dateStyle: `medium` }).format(new Date(estimate.checkedAt))}` : ``;
  return `${estimate.source || `Registrar API`}${checked} · Before taxes and fees · Renewal term not provided`;
};

const getDomainWebsiteInsights = (domain: DomainRecord) => {
  if (!domain.meta?.websiteInsights) return undefined;
  try { return normalizeWebsiteInsights(domain.meta.websiteInsights, domain.name); }
  catch { return undefined; }
};

export const getWebsiteInsightsHint = (domain: DomainRecord, column: PortfolioColumn) => {
  if (![`trancoRank`, `websitePerformance`, `websiteInsightsCheckedAt`].includes(column)) return ``;
  const insights = getDomainWebsiteInsights(domain);
  if (!insights) return `Refresh Website Info To Check This Domain`;
  const timestamp = column === `websitePerformance` ? insights.performance?.checkedAt : column === `trancoRank` ? insights.trancoCheckedAt : insights.checkedAt;
  const checked = timestamp ? ` · Checked ${new Intl.DateTimeFormat(`en-US`, { dateStyle: `medium`, timeStyle: `short` }).format(new Date(timestamp))}` : ``;
  if (column === `websitePerformance`) return `Google PageSpeed Insights · Mobile lab score out of 100${checked} · Performance measures page speed; visitor counts are unknown${insights.performance ? `` : ` · ${insights.errors.find(message => message.startsWith(`PageSpeed:`)) || `Score unavailable`}`}`;
  if (column === `trancoRank`) return `Tranco · Latest returned daily rank${insights.trancoDate ? ` from ${insights.trancoDate}` : ``}${checked} · Popularity rank is not a visitor count${insights.trancoListed === false ? ` · Not listed in returned rankings` : insights.trancoRank ? `` : ` · ${insights.errors.find(message => message.startsWith(`Tranco:`)) || `Rank unavailable`}`}`;
  return `${insights.source}${checked} · ${insights.errors.length ? `Some insights unavailable` : `Check completed`} · Visitor counts are unknown`;
};

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
  const sync = domain.meta?.registrarSync;
  const registrarSync = sync && typeof sync === `object` && !Array.isArray(sync) ? sync : undefined;
  if (column === `autoRenew` && registrarSync?.autoRenewKnown === false) return undefined;
  if ((column === `renewalPrice` || column === `monthlyCost`) && registrarSync?.renewalPriceKnown === false && domain.renewalPrice === 0) return undefined;
  switch (column) {
    case `createdAt`: return domain.createdAt ?? domain.created;
    case `difficulty`: return normalizeDomainDifficulty(domain.difficulty);
    case `projectStatus`: return normalizeDomainProjectStatus(domain.projectStatus);
    case `websitePerformance`: return getDomainWebsiteInsights(domain)?.performance?.score;
    case `websiteInsightsCheckedAt`: return getDomainWebsiteInsights(domain)?.checkedAt;
    case `trancoRank`: {
      const insights = getDomainWebsiteInsights(domain);
      return insights?.trancoRank ?? (insights?.trancoListed === false ? `Not listed` : undefined);
    }
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

export const getDefaultPortfolioColumns = (domains: readonly DomainRecord[]): PortfolioColumn[] => DEFAULT_VISIBLE_COLUMNS
  .filter(field => field === `name` || domains.some(domain => hasPortfolioColumnValue(getPortfolioColumnValue(domain, field), field)));

export const getPortfolioColumnDisplay = (domain: DomainRecord, column: PortfolioColumn) => {
  const value = getPortfolioColumnValue(domain, column);
  if (!hasPortfolioColumnValue(value, column)) return `—`;
  if (column === `difficulty`) return DOMAIN_DIFFICULTIES.find(option => option.value === value)?.label ?? String(value);
  if (column === `projectStatus`) return DOMAIN_PROJECT_STATUSES.find(option => option.value === value)?.label ?? String(value);
  if (column === `status` && typeof value === `string`) return value
    .replace(/([a-z\d])([A-Z])/g, `$1 $2`).replace(/[_\s-]+/g, ` `).trim().toLowerCase()
    .replace(/\b[a-z]/g, letter => letter.toUpperCase());
  if (column === `websitePerformance` && typeof value === `number`) return `${value} / 100`;
  if (column === `trancoRank` && typeof value === `number`) return `#${new Intl.NumberFormat(`en-US`).format(value)}`;
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
