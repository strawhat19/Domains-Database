import type { RegistrarCredentials } from './credentials';
import { invalidResponse, RegistrarRelayError } from './errors';
import { requestRegistrar, type RegistrarRequestContext } from './request';
import type { RegistrarDomain, RegistrarSyncResult } from '../../shared/registrarSync/types';
import { asRecord, parseJson, MAX_PAGES, appendDomains, requiredText, providerName, providerBoolean, providerInteger } from './validation';

const PAGE_SIZE = 100;
const timestamp = (value: unknown) => {
  if (value == null) return undefined;
  const milliseconds = providerInteger(value, `vercel`);
  if (!milliseconds) return undefined;
  if (milliseconds > 253_402_300_799_999) throw invalidResponse(`vercel`);
  return new Date(milliseconds).toISOString();
};
const nameservers = (value: unknown) => {
  if (!Array.isArray(value) || value.length > 32) throw invalidResponse(`vercel`);
  return value.map(name => providerName(name, `vercel`));
};

export const getVercelDomains = async (
  credentials: Extract<RegistrarCredentials, { provider: `vercel` }>,
  context: RegistrarRequestContext,
): Promise<RegistrarSyncResult> => {
  let external = 0;
  let cursor: number | undefined;
  const seen = new Set<string>();
  const domains: RegistrarDomain[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(`https://api.vercel.com/v5/domains`);
    url.searchParams.set(`limit`, String(PAGE_SIZE));
    if (cursor !== undefined) url.searchParams.set(`until`, String(cursor));
    if (credentials.teamId) url.searchParams.set(`teamId`, credentials.teamId);
    const text = await requestRegistrar(url, { Accept: `application/json`, Authorization: credentials.authorization }, context);
    const response = asRecord(parseJson(text, `vercel`), `vercel`);
    if (!Array.isArray(response.domains) || response.domains.length > PAGE_SIZE) throw invalidResponse(`vercel`);
    const incoming: RegistrarDomain[] = [];
    for (const value of response.domains) {
      const record = asRecord(value, `vercel`);
      const boughtAt = timestamp(record.boughtAt);
      if (!boughtAt) { external++; continue; }
      const transferredAt = timestamp(record.transferredAt);
      const verified = providerBoolean(record.verified, `vercel`);
      const serviceType = requiredText(record.serviceType, `vercel`);
      if (verified === undefined || ![`external`, `zeit.world`, `na`].includes(serviceType)) throw invalidResponse(`vercel`);
      incoming.push({
        registrar: `Vercel`,
        name: providerName(record.name, `vercel`),
        providerId: requiredText(record.id, `vercel`),
        createdAt: timestamp(record.createdAt),
        autoRenew: providerBoolean(record.renew, `vercel`),
        expiresAt: timestamp(record.expiresAt)?.slice(0, 10),
        meta: {
          verified,
          serviceType,
          source: `Vercel Registration API`,
          nameservers: nameservers(record.nameservers),
          ...(boughtAt ? { boughtAt } : {}),
          ...(transferredAt ? { transferredAt } : {}),
        },
      });
    }
    appendDomains(domains, incoming, `vercel`, seen);
    const pagination = asRecord(response.pagination, `vercel`);
    providerInteger(pagination.count, `vercel`);
    if (pagination.next === null) return {
      domains,
      warnings: external ? [`${external} External Or Unconfirmed Vercel Domain(s) Excluded From Registered Inventory`] : [],
    };
    const next = providerInteger(pagination.next, `vercel`);
    if (!response.domains.length || (cursor !== undefined && next >= cursor)) throw invalidResponse(`vercel`);
    cursor = next;
  }
  throw new RegistrarRelayError(422, `Vercel Pagination Exceeds The Sync Limit`);
};
