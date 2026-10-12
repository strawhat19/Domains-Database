import type { DomainRecord } from '../../shared/types';
import { normalizeDomainTags } from '../../shared/domainTags';
import { UNGROUPED_GROUP_LABEL } from '../../shared/portfolioPreferences/names';
import { getDaysUntil, getDomainSource, getDomainStatus } from '../../shared/domainUtils';
import { DOMAIN_DIFFICULTIES, DOMAIN_PROJECT_STATUSES } from '../../shared/domainProject';
import { buildPortfolioDestinationTree } from '../../shared/portfolioPreferences/destinationTree';
import type { CustomPortfolioGroup, CustomPortfolioCollection } from '../../shared/portfolioPreferences/types';
import { getPortfolioColumnValue, getPortfolioColumnDisplay, hasPortfolioColumnValue, type PortfolioColumn } from '../../shared/portfolioColumns';

export type PortfolioFilterField =
  | `status` | `source` | `owner` | `tags` | `expiry` | `locked` | `dnssec`
  | `privacy` | `starred` | `country` | `currency` | `autoRenew`
  | `difficulty` | `projectStatus` | `providerStatus`;

export interface PortfolioFilterOption {
  value: string;
  label: string;
  count: number;
}

export interface PortfolioFilterSection {
  label: string;
  id: PortfolioFilterField;
  options: PortfolioFilterOption[];
}

type FilterOption = Pick<PortfolioFilterOption, `value` | `label`>;
type BooleanFilterField = `locked` | `dnssec` | `privacy` | `autoRenew`;

const BOOLEAN_OPTIONS: FilterOption[] = [
  { value: `true`, label: `On` },
  { value: `false`, label: `Off` },
  { value: `unknown`, label: `Unknown` },
];
const BOOLEAN_HEADERS: Record<BooleanFilterField, string[]> = {
  dnssec: [`dnssec`, `dnssecenabled`],
  autoRenew: [`autorenew`, `autorenewal`, `automaticrenewal`],
  privacy: [`privacy`, `isprivacyprotected`, `whoisguard`],
  locked: [`locked`, `lock`, `islocked`, `transferprotected`],
};
const FILTER_DEFINITIONS: { id: PortfolioFilterField; label: string; options?: readonly FilterOption[] }[] = [
  { id: `status`, label: `Renewal Status`, options: [
    { value: `Active`, label: `Active` },
    { value: `Expired`, label: `Expired` },
    { value: `Unknown`, label: `Unknown` },
    { value: `Renewing Soon`, label: `Renewing Soon` },
  ] },
  { id: `expiry`, label: `Renewal Window`, options: [
    { value: `expired`, label: `Expired` },
    { value: `0-7`, label: `Next 7 Days` },
    { value: `8-30`, label: `8–30 Days` },
    { value: `31-90`, label: `31–90 Days` },
    { value: `91-365`, label: `91–365 Days` },
    { value: `later`, label: `Over 1 Year` },
    { value: `unknown`, label: `Unknown Date` },
  ] },
  { id: `projectStatus`, label: `Project Status`, options: DOMAIN_PROJECT_STATUSES },
  { id: `difficulty`, label: `Difficulty`, options: [...DOMAIN_DIFFICULTIES, { value: `unknown`, label: `Not Set` }] },
  { id: `source`, label: `Domain Source`, options: [
    { value: `manual`, label: `Manual` },
    { value: `csv`, label: `CSV Import` },
    { value: `registrar`, label: `Registrar Sync` },
  ] },
  { id: `owner`, label: `Owner` },
  { id: `tags`, label: `Tags` },
  { id: `starred`, label: `Starred`, options: [
    { value: `true`, label: `Starred` },
    { value: `false`, label: `Not Starred` },
  ] },
  { id: `autoRenew`, label: `Auto-Renew`, options: BOOLEAN_OPTIONS },
  { id: `privacy`, label: `WHOIS Privacy`, options: BOOLEAN_OPTIONS },
  { id: `locked`, label: `Transfer Lock`, options: [
    { value: `true`, label: `Locked` },
    { value: `false`, label: `Unlocked` },
    { value: `unknown`, label: `Unknown` },
  ] },
  { id: `dnssec`, label: `DNSSEC`, options: BOOLEAN_OPTIONS },
  { id: `providerStatus`, label: `Provider Status` },
  { id: `currency`, label: `Currency` },
  { id: `country`, label: `Registrant Country` },
];

const getBooleanFilterValue = (domain: DomainRecord, field: BooleanFilterField) => {
  const value = getPortfolioColumnValue(domain, field);
  if (typeof value === `boolean`) return String(value);
  const sync = domain.meta?.registrarSync;
  if (field === `autoRenew` && sync && typeof sync === `object` && !Array.isArray(sync) && sync.autoRenewKnown === false) return `unknown`;
  for (const source of [domain.meta?.normalized, domain.meta?.csv]) {
    if (!source || typeof source !== `object` || Array.isArray(source)) continue;
    const saved = Object.entries(source).find(([header]) => BOOLEAN_HEADERS[field].includes(header.toLowerCase().replace(/[^a-z0-9]/g, ``)))?.[1];
    if (typeof saved === `boolean`) return String(saved);
    const text = typeof saved === `string` || typeof saved === `number` ? String(saved).trim().toLowerCase() : ``;
    if ([`1`, `yes`, `on`, `true`, `enabled`, `locked`, `protected`, `private`, `full`, `active`, `purchased`].includes(text)) return `true`;
    if ([`0`, `no`, `off`, `false`, `disabled`, `unlocked`, `unprotected`, `public`, `none`, `not purchased`, `no protection`].includes(text)) return `false`;
  }
  return `unknown`;
};

export const getDomainFilterValues = (domain: DomainRecord, field: PortfolioFilterField, starredIds?: ReadonlySet<string>): string[] => {
  if ([`locked`, `dnssec`, `privacy`, `autoRenew`].includes(field)) return [getBooleanFilterValue(domain, field as BooleanFilterField)];
  switch (field) {
    case `status`: return [getDomainStatus(domain)];
    case `source`: return [getDomainSource(domain)];
    case `starred`: return [String(starredIds ? starredIds.has(domain.id) : domain.starred === true)];
    case `tags`: {
      const tags = normalizeDomainTags(domain.tags);
      return tags.length ? tags : [`untagged`];
    }
    case `expiry`: {
      const days = getDaysUntil(domain.expiresAt);
      return [!Number.isFinite(days) ? `unknown` : days < 0 ? `expired` : days <= 7 ? `0-7` : days <= 30 ? `8-30` : days <= 90 ? `31-90` : days <= 365 ? `91-365` : `later`];
    }
    default: {
      const column: PortfolioColumn = field === `providerStatus` ? `status` : field as PortfolioColumn;
      const value = getPortfolioColumnValue(domain, column);
      const text = hasPortfolioColumnValue(value, column) ? String(value).trim() : `unknown`;
      return [field === `currency` && text !== `unknown` ? text.toUpperCase() : text];
    }
  }
};

export const buildPortfolioFilterSections = (domains: DomainRecord[], starredIds?: ReadonlySet<string>): PortfolioFilterSection[] => FILTER_DEFINITIONS.map(definition => {
  const counts = new Map<string, number>();
  const labels = new Map<string, string>();
  for (const domain of domains) {
    for (const value of getDomainFilterValues(domain, definition.id, starredIds)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
      labels.set(value, value === `untagged` ? `No Tags` : value === `unknown` ? `Unknown` : definition.id === `providerStatus` ? getPortfolioColumnDisplay(domain, `status`) : value);
    }
  }
  const options = definition.options ?? [...counts.keys()]
    .sort((first, second) => Number([`unknown`, `untagged`].includes(first)) - Number([`unknown`, `untagged`].includes(second)) || first.localeCompare(second))
    .map(value => ({ value, label: labels.get(value) ?? value }));
  return { id: definition.id, label: definition.label, options: options.map(option => ({ ...option, count: counts.get(option.value) ?? 0 })) };
});

export const buildPortfolioFilterLocations = (domains: DomainRecord[], groups: CustomPortfolioGroup[], collections: CustomPortfolioCollection[]) => {
  const tree = buildPortfolioDestinationTree(domains, groups, collections);
  const domainIds = new Set(domains.map(domain => domain.id));
  const groupedIds = new Set(groups.flatMap(group => group.domainIds));
  const groupDomains = new Map(groups.map(group => [group.id, new Set(group.domainIds.filter(id => domainIds.has(id)))]));
  const collectionDomains = new Map(collections.map(collection => [collection.id, new Set<string>()]));
  for (const group of groups) {
    const assignedIds = group.collectionId ? collectionDomains.get(group.collectionId) : undefined;
    groupDomains.get(group.id)?.forEach(id => assignedIds?.add(id));
  }
  const directlyCollectedIds = new Set<string>();
  for (const collection of collections) {
    for (const id of collection.domainIds ?? []) {
      if (!domainIds.has(id) || groupedIds.has(id) || directlyCollectedIds.has(id)) continue;
      directlyCollectedIds.add(id);
      collectionDomains.get(collection.id)?.add(id);
    }
  }
  const collectedIds = new Set([...collectionDomains.values()].flatMap(ids => [...ids]));
  collectionDomains.set(`main`, new Set([...domainIds].filter(id => !collectedIds.has(id))));
  groupDomains.set(`ungrouped`, new Set([...domainIds].filter(id => !groupedIds.has(id) && !collectedIds.has(id))));
  const branches = tree.branches.map(branch => branch.main ? {
    ...branch,
    groups: [...branch.groups, { id: `ungrouped`, name: UNGROUPED_GROUP_LABEL, count: tree.ungroupedCount }],
  } : branch);
  return { branches, groupDomains, collectionDomains };
};
