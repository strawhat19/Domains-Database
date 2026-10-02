import { REGISTRARS } from './config';
import type { DomainInput, DomainRecord, DomainStatus } from './types';

const DAY_IN_MS = 86_400_000;

export const getDaysUntil = (date: string) => {
  const today = new Date();
  const [year, month, day] = date.split(`-`).map(Number);
  const currentDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((Date.UTC(year, month - 1, day) - currentDay) / DAY_IN_MS);
};

export const getDomainStatus = (domain: DomainRecord): DomainStatus => {
  const days = getDaysUntil(domain.expiresAt);
  if (days < 0) return `Expired`;
  return days <= 30 ? `Renewing Soon` : `Active`;
};

export const formatDate = (date: string) => {
  const [year, month, day] = date.split(`-`).map(Number);
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

export const validateDomainInput = (input: DomainInput): DomainInput => {
  const name = normalizeDomainName(input?.name);
  const owner = input?.owner?.trim();
  const notes = input?.notes?.trim() ?? ``;
  const expiresAt = input?.expiresAt?.trim();
  const renewalPrice = Number(input?.renewalPrice);
  if (!owner) throw new Error(`Enter The Domain Owner`);
  if (!REGISTRARS.includes(input?.registrar)) throw new Error(`Choose A Supported Registrar`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresAt ?? ``)) throw new Error(`Use An Expiry Date In YYYY-MM-DD Format`);
  const date = new Date(`${expiresAt}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== expiresAt) throw new Error(`Enter A Valid Expiry Date`);
  if (!Number.isFinite(renewalPrice) || renewalPrice < 0) throw new Error(`Enter A Renewal Price Of Zero Or More`);
  if (typeof input?.autoRenew !== `boolean`) throw new Error(`Choose An Auto-Renew Setting`);
  return { name, owner, notes, expiresAt, renewalPrice, registrar: input.registrar, autoRenew: input.autoRenew };
};

export const createDomainId = (number: number, name: string) => {
  const now = new Date();
  const hours = now.getHours();
  const period = hours >= 12 ? `PM` : `AM`;
  const readableName = name.replace(/[^a-z0-9]/g, `_`);
  const timestamp = `${hours % 12 || 12}_${String(now.getMinutes()).padStart(2, `0`)}_${period}_${now.getMonth() + 1}_${now.getDate()}_${String(now.getFullYear()).slice(-2)}`;
  const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  return `Domain_${number}_${readableName}_${timestamp}_${uuid}`;
};
