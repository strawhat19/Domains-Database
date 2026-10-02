import { RegistrarRelayError } from './errors';
import { discoverHostingerDomains } from './hostingerHosting';
import { requestRegistrar, type RegistrarRequestContext } from './request';
import type { RegistrarDomain, RegistrarSyncResult } from '../../shared/registrarSync/types';
import { asRecord, MAX_DOMAINS, appendDomains, optionalText, providerName, providerDate, providerInteger } from './validation';

const domainTypes = [`domain`, `free_domain`, `domain_transfer`, `free_domain_transfer`];
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

export const getHostingerDomains = async (authorization: string, context: RegistrarRequestContext, externalDomains?: string[]): Promise<RegistrarSyncResult> => {
  const url = new URL(`https://developers.hostinger.com/api/domains/v1/portfolio`);
  const text = await requestRegistrar(url, {
    Accept: `application/json`,
    Authorization: authorization,
    'Content-Type': `application/json`,
  }, context);
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
    const domain: RegistrarDomain = {
      status,
      providerId: id,
      registrar: `Hostinger`,
      name: readHostingerField(recordNumber, `Domain Name`, () => providerName(record.domain, `hostinger`)),
      createdAt: readHostingerField(recordNumber, `Created Date`, () => providerDate(record.created_at, `hostinger`)),
      expiresAt: readHostingerField(recordNumber, `Expiry Date`, () => providerDate(record.expires_at, `hostinger`, true)),
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
  const pending = domains.some(domain => domain.status && [`requested`, `pending_setup`, `pending_verification`].includes(domain.status));
  if (unnamed) warnings.push(`${unnamed} Unnamed Hostinger Record(s) Excluded`);
  if (repeated) {
    const names = [...repeatedNames];
    const listedNames = names.slice(0, 5).join(`, `);
    const remaining = names.length > 5 ? ` (+${names.length - 5} More)` : ``;
    warnings.push(`${repeated} Repeated Hostinger Record(s) Combined For ${listedNames}${remaining} — Active Records Preferred`);
  }
  if (pending) warnings.push(`Hostinger Includes Domain Records Pending Setup Or Transfer`);
  try {
    const discovery = await discoverHostingerDomains(authorization, seen, context, externalDomains);
    const remaining = MAX_DOMAINS - domains.length;
    appendDomains(domains, discovery.domains.slice(0, remaining), `hostinger`, seen);
    warnings.push(...(discovery.warnings ?? []));
    if (discovery.domains.length > remaining) warnings.push(`Confirmed External Domains Exceed The 10,000 Domain Sync Limit`);
    return { domains, warnings, discoveredDomains: discovery.discoveredDomains };
  } catch {
    warnings.push(`Registered Inventory Synced — External Hosting Discovery Is Unavailable; Try Again Later`);
    return { domains, warnings };
  }
};
