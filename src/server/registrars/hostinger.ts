import { invalidResponse, RegistrarRelayError } from './errors';
import { requestRegistrar, type RegistrarRequestContext } from './request';
import type { RegistrarDomain, RegistrarSyncResult } from '../../shared/registrarSync/types';
import { asRecord, parseJson, MAX_DOMAINS, appendDomains, providerId, providerName, providerDate, requiredText } from './validation';

const domainTypes = [`domain`, `free_domain`, `domain_transfer`, `free_domain_transfer`];
const domainStatuses = [`active`, `expired`, `deleted`, `failed`, `requested`, `suspended`, `pending_setup`, `pending_verification`];

export const getHostingerDomains = async (authorization: string, context: RegistrarRequestContext): Promise<RegistrarSyncResult> => {
  const url = new URL(`https://developers.hostinger.com/api/domains/v1/portfolio`);
  const text = await requestRegistrar(url, {
    Accept: `application/json`,
    Authorization: authorization,
    'Content-Type': `application/json`,
  }, context);
  const response = parseJson(text, `hostinger`);
  if (!Array.isArray(response)) throw invalidResponse(`hostinger`);
  if (response.length > MAX_DOMAINS) throw new RegistrarRelayError(422, `Portfolio Exceeds The 10,000 Domain Sync Limit`);
  let unclaimed = false;
  let pending = false;
  const seen = new Set<string>();
  const domains: RegistrarDomain[] = [];
  for (const item of response) {
    const record = asRecord(item, `hostinger`);
    const type = requiredText(record.type, `hostinger`);
    const status = requiredText(record.status, `hostinger`);
    const id = providerId(record.id, `hostinger`);
    if (!domainTypes.includes(type) || !domainStatuses.includes(status)) throw invalidResponse(`hostinger`);
    if (record.domain === null) {
      unclaimed = true;
      continue;
    }
    pending ||= [`requested`, `pending_setup`, `pending_verification`].includes(status);
    appendDomains(domains, [{
      status,
      providerId: id,
      registrar: `Hostinger`,
      name: providerName(record.domain, `hostinger`),
      createdAt: providerDate(record.created_at, `hostinger`),
      expiresAt: providerDate(record.expires_at, `hostinger`, true),
    }], `hostinger`, seen);
  }
  const warnings: string[] = [];
  if (unclaimed) warnings.push(`Unclaimed Hostinger Domain Offers Were Excluded`);
  if (pending) warnings.push(`Hostinger Includes Domain Records Pending Setup Or Transfer`);
  return { domains, warnings };
};
