import { invalidResponse, RegistrarRelayError } from './errors';
import { requestRegistrar, type RegistrarRequestContext } from './request';
import type { RegistrarDomain, RegistrarSyncResult } from '../../shared/registrarSync/types';
import {
  asRecord, parseJson, MAX_PAGES, appendDomains, providerId, providerName,
  providerDate, providerBoolean, providerStatus,
} from './validation';

const PAGE_SIZE = 1000;

const normalizeDomain = (value: unknown): RegistrarDomain => {
  const record = asRecord(value, `godaddy`);
  const status = providerStatus(record.status, `godaddy`);
  if (!status) throw invalidResponse(`godaddy`);
  return {
    status,
    registrar: `GoDaddy`,
    name: providerName(record.domain, `godaddy`),
    locked: providerBoolean(record.locked, `godaddy`),
    privacy: providerBoolean(record.privacy, `godaddy`),
    providerId: providerId(record.domainId, `godaddy`),
    autoRenew: providerBoolean(record.renewAuto, `godaddy`),
    createdAt: providerDate(record.createdAt, `godaddy`),
    expiresAt: providerDate(record.expires, `godaddy`, true),
  };
};

export const getGoDaddyDomains = async (authorization: string, context: RegistrarRequestContext): Promise<RegistrarSyncResult> => {
  let marker = ``;
  const seen = new Set<string>();
  const domains: RegistrarDomain[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = new URL(`https://api.godaddy.com/v1/domains`);
    url.searchParams.set(`limit`, String(PAGE_SIZE));
    if (marker) url.searchParams.set(`marker`, marker);
    const text = await requestRegistrar(url, { Accept: `application/json`, Authorization: authorization }, context);
    const response = parseJson(text, `godaddy`);
    if (!Array.isArray(response) || response.length > PAGE_SIZE) throw invalidResponse(`godaddy`);
    const incoming = response.map(normalizeDomain);
    appendDomains(domains, incoming, `godaddy`, seen);
    if (incoming.length < PAGE_SIZE) return { domains };
    const nextMarker = incoming[incoming.length - 1]?.name;
    if (!nextMarker || nextMarker === marker) throw invalidResponse(`godaddy`);
    marker = nextMarker;
  }
  throw new RegistrarRelayError(422, `GoDaddy Pagination Exceeds The Sync Limit`);
};
