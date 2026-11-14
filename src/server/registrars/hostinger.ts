import { selectRegistrarDetails } from './detailSelection';
import type { JSONValue } from '../../shared/types';
import { invalidResponse, RegistrarRelayError } from './errors';
import { discoverHostingerDomains } from './hostingerHosting';
import { pauseRequests, requestRegistrar, type RegistrarRequestContext } from './request';
import type { RegistrarDomain, RegistrarSyncResult, RegistrarDetailSelection } from '../../shared/registrarSync/types';
import { asRecord, parseJson, MAX_DOMAINS, appendDomains, optionalText, providerName, providerDate, providerBoolean, providerInteger } from './validation';

const MAX_DETAIL_READS = 120;
const DETAIL_INTERVAL = 850;
const DETAIL_TIME_LIMIT = 115_000;
const DETAIL_REQUEST_RESERVE = 15_000;
const domainTypes = [`domain`, `free_domain`, `domain_transfer`, `free_domain_transfer`];
const verificationTypes = [`manual_review`, `sms_code`, `contact_verification`];
const contactVerificationStatuses = [`pending`, `verified`, `suspended`];
const domainStatuses = [`active`, `expired`, `deleted`, `failed`, `requested`, `suspended`, `pending_setup`, `pending_verification`];

const readHostingerField = <T,>(recordNumber: number, field: string, read: () => T): T => {
  try { return read(); }
  catch { throw new RegistrarRelayError(502, `Hostinger Returned An Invalid ${field} In Record ${recordNumber}`); }
};

const readHostingerPortfolio = (text: string): unknown[] => {
  let response: unknown;
  try { response = JSON.parse(text); }
  catch { throw new RegistrarRelayError(502, `Hostinger Returned Non-JSON Content Instead Of A Portfolio`); }
  if (Array.isArray(response)) return response;
  const envelope = response && typeof response === `object` ? response as Record<string, unknown> : undefined;
  const arrayField = [`data`, `items`, `domains`].find(field => Array.isArray(envelope?.[field]));
  if (arrayField) throw new RegistrarRelayError(502, `Hostinger Returned A Wrapped Domain Array (${arrayField}) Instead Of A Bare Array`);
  const shape = response === null ? `Null` : typeof response === `object` ? `A JSON Object` : `A JSON Primitive`;
  throw new RegistrarRelayError(502, `Hostinger Returned ${shape} Instead Of A Domain Array`);
};

const readContactVerification = (value: unknown) => {
  if (value === null) return null;
  if (!value || typeof value !== `object` || Array.isArray(value)) return undefined;
  const verification = value as Record<string, unknown>;
  const channels: Record<string, JSONValue> = {};
  for (const [key, field] of [[`email`, `email`], [`phone`, `phone`], [`contact_name`, `contactName`]] as const) {
    const entry = verification[key];
    if (entry === null) { channels[field] = null; continue; }
    if (!entry || typeof entry !== `object` || Array.isArray(entry)) continue;
    const { status, ends_at: deadline } = entry as Record<string, unknown>;
    if (typeof status !== `string` || !contactVerificationStatuses.includes(status)) continue;
    let endsAt: string | null | undefined;
    try { endsAt = deadline === null ? null : providerDate(deadline, `hostinger`); } catch { endsAt = undefined; }
    channels[field] = { status, ...(endsAt !== undefined ? { endsAt } : {}) };
  }
  return Object.keys(channels).length ? channels : undefined;
};

const readHostingerDetail = (text: string, domain: RegistrarDomain): RegistrarDomain => {
  const detail = asRecord(parseJson(text, `hostinger`), `hostinger`);
  if (providerName(detail.domain, `hostinger`) !== domain.name) throw invalidResponse(`hostinger`);
  const servers = detail.name_servers == null ? undefined : asRecord(detail.name_servers, `hostinger`);
  const nameservers = servers ? Object.entries(servers)
    .filter(([key, value]) => /^ns[1-4]$/.test(key) && value != null && value !== ``)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => providerName(value, `hostinger`)) : [];
  const registeredAt = providerDate(detail.registered_at, `hostinger`);
  const detailStatus = domainStatuses.find(status => status === detail.status);
  const status = detailStatus ?? domain.status;
  const contactVerification = readContactVerification(detail.contact_verification);
  const transferLockSupported = typeof detail.is_lockable === `boolean` ? detail.is_lockable : undefined;
  const privacyProtectionAllowed = typeof detail.is_privacy_protection_allowed === `boolean` ? detail.is_privacy_protection_allowed : undefined;
  const transferLockExpiresAt = detail[`60_days_lock_expires_at`] === null ? null
    : providerDate(detail[`60_days_lock_expires_at`], `hostinger`);
  return {
    ...domain,
    status,
    nameservers: nameservers.length ? [...new Set(nameservers)] : domain.nameservers,
    locked: providerBoolean(detail.is_locked, `hostinger`),
    privacy: providerBoolean(detail.is_privacy_protected, `hostinger`),
    updatedAt: providerDate(detail.updated_at, `hostinger`),
    detailsCheckedAt: new Date().toISOString(),
    createdAt: domain.createdAt ?? providerDate(detail.created_at, `hostinger`),
    expiresAt: providerDate(detail.expires_at, `hostinger`, true) ?? domain.expiresAt,
    meta: {
      ...domain.meta,
      ...(registeredAt ? { registeredAt } : {}),
      ...(detailStatus && detailStatus !== `pending_verification` ? { verificationType: null } : {}),
      ...(contactVerification !== undefined ? { contactVerification } : {}),
      ...(transferLockExpiresAt !== undefined ? { transferLockExpiresAt } : {}),
      ...(transferLockSupported !== undefined ? { transferLockSupported } : {}),
      ...(privacyProtectionAllowed !== undefined ? { privacyProtectionAllowed } : {}),
    },
  };
};

const enrichHostingerDomains = async (
  domains: readonly RegistrarDomain[], headers: Record<string, string>, context: RegistrarRequestContext, warnings: string[],
) => {
  const deadline = Math.min(context.deadline, Date.now() + DETAIL_TIME_LIMIT);
  let failed = 0;
  let remaining = 0;
  let requestStartedAt = Date.now();
  for (const [index, domain] of domains.entries()) {
    const delay = Math.max(0, DETAIL_INTERVAL - (Date.now() - requestStartedAt));
    if (index >= MAX_DETAIL_READS || context.signal.aborted || Date.now() + delay + DETAIL_REQUEST_RESERVE >= deadline) {
      remaining = domains.length - index;
      break;
    }
    try {
      if (delay) await pauseRequests(delay, context);
      requestStartedAt = Date.now();
      domain.detailsAttemptedAt = new Date(requestStartedAt).toISOString();
      const url = new URL(`https://developers.hostinger.com/api/domains/v1/portfolio/${domain.name}`);
      const text = await requestRegistrar(url, headers, { ...context, deadline });
      Object.assign(domain, readHostingerDetail(text, domain));
    } catch (failure) {
      failed++;
      const status = failure instanceof RegistrarRelayError ? failure.status : undefined;
      if (status === 401 || status === 403 || status === 429 || status === 504 || context.signal.aborted) {
        remaining = domains.length - index - 1;
        break;
      }
    }
  }
  if (failed) warnings.push(`${failed} Hostinger Registration Detail Read(s) Unavailable`);
  if (remaining) warnings.push(`${remaining} Hostinger Domain(s) Synced With Inventory Fields Only`);
};

export const getHostingerDomains = async (
  authorization: string, context: RegistrarRequestContext, externalDomains?: string[], includeDiscovery = false, detailSelection?: RegistrarDetailSelection,
): Promise<RegistrarSyncResult> => {
  const url = new URL(`https://developers.hostinger.com/api/domains/v1/portfolio`);
  const headers = { Accept: `application/json`, Authorization: authorization, 'Content-Type': `application/json` };
  const text = await requestRegistrar(url, headers, context);
  const response = readHostingerPortfolio(text);
  if (response.length > MAX_DOMAINS) throw new RegistrarRelayError(422, `Portfolio Exceeds The 10,000 Domain Sync Limit`);
  let unnamed = 0;
  let repeated = 0;
  const seen = new Set<string>();
  const repeatedNames = new Set<string>();
  const indexes = new Map<string, number>();
  const domains: RegistrarDomain[] = [];
  for (const [index, item] of response.entries()) {
    const recordNumber = index + 1;
    const record = readHostingerField(recordNumber, `Domain Record`, () => asRecord(item, `hostinger`));
    if (record.domain == null) {
      unnamed += 1;
      continue;
    }
    const type = readHostingerField(recordNumber, `Type`, () => optionalText(record.type, `hostinger`));
    const status = readHostingerField(recordNumber, `Status`, () => optionalText(record.status, `hostinger`));
    if ((type && !domainTypes.includes(type)) || (status && !domainStatuses.includes(status))) {
      throw new RegistrarRelayError(502, `Hostinger Returned An Unsupported Type Or Status In Record ${recordNumber}`);
    }
    const id = readHostingerField(recordNumber, `Provider ID`, () => record.id == null ? undefined : String(providerInteger(record.id, `hostinger`)));
    const verification = record.verification;
    const rawVerificationType = verification && typeof verification === `object` && `type` in verification ? verification.type : undefined;
    const verificationType = verification === null || (status && status !== `pending_verification`)
      ? null : verificationTypes.find(value => value === rawVerificationType);
    const domain: RegistrarDomain = {
      status,
      providerId: id,
      registrar: `Hostinger`,
      name: readHostingerField(recordNumber, `Domain Name`, () => providerName(record.domain, `hostinger`)),
      createdAt: readHostingerField(recordNumber, `Created Date`, () => providerDate(record.created_at, `hostinger`)),
      expiresAt: readHostingerField(recordNumber, `Expiry Date`, () => providerDate(record.expires_at, `hostinger`, true)),
      meta: {
        source: `Hostinger Portfolio API`,
        ...(type ? { registrationType: type } : {}),
        ...(verificationType !== undefined ? { verificationType } : {}),
      },
    };
    const existingIndex = indexes.get(domain.name);
    if (existingIndex !== undefined) {
      repeated += 1;
      repeatedNames.add(domain.name);
      if (domain.status === `active` && domains[existingIndex]?.status !== `active`) domains[existingIndex] = domain;
      continue;
    }
    indexes.set(domain.name, domains.length);
    appendDomains(domains, [domain], `hostinger`, seen);
  }
  const warnings: string[] = [];
  if (unnamed) warnings.push(`${unnamed} Unnamed Hostinger Record(s) Excluded`);
  if (repeated) {
    const names = [...repeatedNames];
    const listedNames = names.slice(0, 5).join(`, `);
    const remaining = names.length > 5 ? ` (+${names.length - 5} More)` : ``;
    warnings.push(`${repeated} Repeated Hostinger Record(s) Combined For ${listedNames}${remaining} — Active Records Preferred`);
  }
  await enrichHostingerDomains(selectRegistrarDetails(domains, detailSelection), headers, context, warnings);
  if (domains.some(domain => domain.status && [`requested`, `pending_setup`, `pending_verification`].includes(domain.status))) {
    warnings.push(`Hostinger Includes Domain Records Pending Setup Or Transfer`);
  }
  if (!includeDiscovery) return { domains, warnings };
  try {
    const discovery = await discoverHostingerDomains(authorization, domains, context, externalDomains);
    const remaining = MAX_DOMAINS - domains.length;
    appendDomains(domains, discovery.domains.slice(0, remaining), `hostinger`, seen);
    warnings.push(...(discovery.warnings ?? []));
    if (discovery.domains.length > remaining) warnings.push(`Externally Hosted Domains Exceed The 10,000 Domain Sync Limit`);
    return { domains, warnings };
  } catch {
    warnings.push(`Registered Inventory Synced — External Hosting Discovery Is Unavailable; Try Again Later`);
    return { domains, warnings };
  }
};
