import { genID } from './common/ids';
import { REGISTRARS } from './config';
import { Types } from '../types/types';
import type { JSONValue, DomainInput, DomainRecord, DomainStatus, DomainRegistrant } from './types';

const DAY_IN_MS = 86_400_000;

export const getDaysUntil = (date?: string) => {
  if (!date) return Number.NaN;
  const today = new Date();
  const [year, month, day] = date.slice(0, 10).split(`-`).map(Number);
  const currentDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((Date.UTC(year, month - 1, day) - currentDay) / DAY_IN_MS);
};

export const getDomainStatus = (domain: DomainRecord): DomainStatus => {
  const days = getDaysUntil(domain.expiresAt);
  if (!Number.isFinite(days)) return `Unknown`;
  if (days < 0) return `Expired`;
  return days <= 30 ? `Renewing Soon` : `Active`;
};

export const getRegistrarCounts = (domains: DomainRecord[]) => {
  const counts = new Map<string, number>();
  for (const domain of domains) {
    const registrar = domain.registrar?.trim() || `Unknown Registrar`;
    counts.set(registrar, (counts.get(registrar) ?? 0) + 1);
  }
  return [...counts]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([registrar, count]) => ({ count, registrar }));
};

export const formatDate = (date: string) => {
  if (!date || !Number.isFinite(getDaysUntil(date))) return `—`;
  const [year, month, day] = date.slice(0, 10).split(`-`).map(Number);
  return new Intl.DateTimeFormat(`en-US`, {
    day: `numeric`,
    month: `short`,
    year: `numeric`,
  }).format(new Date(year, month - 1, day));
};

export const formatCurrency = (amount: number) => new Intl.NumberFormat(`en-US`, {
  style: `currency`,
  currency: `USD`,
}).format(amount);

export const normalizeDomainName = (value: string) => {
  const candidate = value?.trim()?.toLowerCase();
  if (!candidate || /\s/.test(candidate)) throw new Error(`Enter A Valid Domain Name`);
  let parsed: URL;
  try {
    parsed = new URL(candidate.includes(`://`) ? candidate : `https://${candidate}`);
  } catch {
    throw new Error(`Enter A Valid Domain Name`);
  }
  const authority = candidate.replace(/^https?:\/\//, ``).split(/[/?#]/)[0];
  if (![`http:`, `https:`].includes(parsed.protocol) || authority?.includes(`:`) || parsed.username || parsed.password || parsed.port || parsed.search || parsed.hash || parsed.pathname !== `/`) {
    throw new Error(`Use A Domain Name Without A Path, Port, Or Login`);
  }
  const name = parsed.hostname.replace(/\.$/, ``);
  const labels = name.split(`.`);
  const validLabels = labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
  const topLevelDomain = labels[labels.length - 1];
  if (name.length > 253 || labels.length < 2 || !validLabels || !topLevelDomain || /^\d+$/.test(topLevelDomain)) {
    throw new Error(`Enter A Valid Domain Name`);
  }
  return name;
};

const normalizeOptionalText = (value: unknown, label: string) => {
  if (value == null) return undefined;
  if (typeof value !== `string`) throw new Error(`${label} Must Be Text`);
  return value.trim() || undefined;
};

const normalizeDomainDate = (value: unknown, label: string) => {
  const text = normalizeOptionalText(value, label);
  if (!text) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(text)) {
    throw new Error(`Use ${label} In YYYY-MM-DD Or ISO Date-Time Format`);
  }
  const calendarDate = text.slice(0, 10);
  const day = new Date(`${calendarDate}T00:00:00Z`);
  if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== calendarDate || Number.isNaN(Date.parse(text))) {
    throw new Error(`Enter A Valid ${label}`);
  }
  return text;
};

const normalizeJsonValue = (value: unknown, ancestors = new WeakSet<object>()): JSONValue => {
  if (value === null || typeof value === `string` || typeof value === `boolean`) return value;
  if (typeof value === `number` && Number.isFinite(value)) return value;
  if (typeof value !== `object` || !value || ancestors.has(value)) throw new Error(`Domain Metadata Must Contain JSON Values`);
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    throw new Error(`Domain Metadata Must Contain JSON Values`);
  }
  ancestors.add(value);
  const normalized = Array.isArray(value)
    ? value.map(item => normalizeJsonValue(item, ancestors))
    : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeJsonValue(item, ancestors)]));
  ancestors.delete(value);
  return normalized;
};

export const normalizeDomainExtras = (input: Partial<DomainInput>): Partial<DomainInput> => {
  const extras: Partial<DomainInput> = {};
  for (const field of [`title`, `status`, `providerId`, `internationalName`] as const) {
    const value = normalizeOptionalText(input[field], field);
    if (value !== undefined) extras[field] = value;
  }
  if (input.description != null) {
    if (typeof input.description !== `string`) throw new Error(`Description Must Be Text`);
    extras.description = input.description.trim();
  }
  if (input.color != null) {
    const color = input.color;
    if (typeof color !== `object` || typeof color.name !== `string` || typeof color.color !== `string` || ![`dark`, `light`].includes(color.type)) {
      throw new Error(`Choose A Valid Record Color`);
    }
    extras.color = { name: color.name.trim(), color: color.color.trim(), type: color.type };
  }
  for (const field of [`createdAt`, `updatedAt`, `ownershipAt`, `firstImportedAt`, `firstExportedAt`] as const) {
    const value = normalizeDomainDate(input[field], field);
    if (value !== undefined) extras[field] = value;
  }
  for (const field of [`locked`, `privacy`, `dnssec`] as const) {
    const value = input[field];
    if (value == null) continue;
    if (typeof value !== `boolean`) throw new Error(`${field} Must Be True Or False`);
    extras[field] = value;
  }
  const tld = normalizeOptionalText(input.tld, `TLD`);
  if (tld) extras.tld = tld.replace(/^\./, ``).toLowerCase();
  const currency = normalizeOptionalText(input.currency, `Currency`);
  if (currency) {
    if (!/^[a-z]{3}$/i.test(currency)) throw new Error(`Use A Three-Letter Currency Code`);
    extras.currency = currency.toUpperCase();
  }
  if (input.nameservers != null) {
    if (!Array.isArray(input.nameservers)) throw new Error(`Nameservers Must Be A List`);
    extras.nameservers = [...new Set(input.nameservers.map(server => {
      const value = normalizeOptionalText(server, `Nameserver`);
      if (!value) throw new Error(`Enter A Valid Nameserver`);
      return normalizeDomainName(value);
    }))];
  }
  if (input.registrant != null) {
    if (typeof input.registrant !== `object` || Array.isArray(input.registrant)) throw new Error(`Registrant Must Be An Object`);
    const registrant: DomainRegistrant = {};
    for (const field of [`name`, `email`, `country`, `organization`] as const) {
      const value = normalizeOptionalText(input.registrant[field], `Registrant ${field}`);
      if (value !== undefined) registrant[field] = value;
    }
    if (Object.keys(registrant).length) extras.registrant = registrant;
  }
  if (input.meta != null) {
    if (typeof input.meta !== `object` || Array.isArray(input.meta)) throw new Error(`Domain Metadata Must Be An Object`);
    extras.meta = normalizeJsonValue(input.meta) as Record<string, JSONValue>;
  }
  return extras;
};

export const validateDomainInput = (input: DomainInput): DomainInput => {
  const name = normalizeDomainName(input?.name);
  const owner = input?.owner?.trim();
  const notes = input?.notes?.trim() ?? ``;
  const expiresAt = normalizeDomainDate(input?.expiresAt, `Expiry Date`) ?? ``;
  const registrar = input?.registrar ?? ``;
  const renewalPrice = Number(input?.renewalPrice);
  if (!owner) throw new Error(`Enter The Domain Owner`);
  if (registrar && !REGISTRARS.includes(registrar)) throw new Error(`Choose A Supported Registrar`);
  if (!Number.isFinite(renewalPrice) || renewalPrice < 0) throw new Error(`Enter A Renewal Price Of Zero Or More`);
  if (typeof input?.autoRenew !== `boolean`) throw new Error(`Choose An Auto-Renew Setting`);
  return { ...normalizeDomainExtras(input), name, owner, notes, expiresAt, renewalPrice, registrar, autoRenew: input.autoRenew };
};

export const createDomainId = (number: number, name: string) => genID(Types.Domain, number, name).id;
