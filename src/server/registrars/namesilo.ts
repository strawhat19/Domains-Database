import type { RegistrarCredentials } from './credentials';
import { invalidResponse, RegistrarRelayError } from './errors';
import { pauseRequests, requestRegistrar, type RegistrarRequestContext } from './request';
import type { RegistrarDomain, RegistrarSyncResult } from '../../shared/registrarSync/types';
import { asRecord, parseJson, MAX_PAGES, MAX_DOMAINS, appendDomains, providerName, providerDate, providerInteger } from './validation';

const PAGE_SIZE = 100;
const readReply = (text: string) => {
  const response = asRecord(parseJson(text, `namesilo`), `namesilo`);
  const reply = asRecord(response.reply, `namesilo`);
  const code = providerInteger(reply.code, `namesilo`);
  if (code === 110 || code === 111) throw new RegistrarRelayError(401, `NameSilo API Credentials Are Invalid`);
  if (code === 112) throw new RegistrarRelayError(403, `NameSilo API Requires A Main Account — Subaccounts Are Unsupported`);
  if (code === 113) throw new RegistrarRelayError(403, `NameSilo Requires The Calling Server's Permitted IP`);
  if (code === 400) throw new RegistrarRelayError(429, `NameSilo Is Processing Another Request — Try Again Later`);
  if (code !== 300) throw new RegistrarRelayError(502, `NameSilo Could Not Complete The Inventory Request`);
  return reply;
};

export const getNameSiloDomains = async (
  credentials: Extract<RegistrarCredentials, { provider: `namesilo` }>,
  context: RegistrarRequestContext,
): Promise<RegistrarSyncResult> => {
  let expectedTotal: number | undefined;
  let expectedSize: number | undefined;
  const seen = new Set<string>();
  const domains: RegistrarDomain[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    if (page > 1) await pauseRequests(1250, context);
    const url = new URL(`https://www.namesilo.com/apibatch/listDomains`);
    const parameters = { version: `1`, type: `json`, page: String(page), key: credentials.apiKey, pageSize: String(PAGE_SIZE) };
    Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, value));
    const text = await requestRegistrar(url, { Accept: `application/json` }, context);
    const reply = readReply(text);
    const pager = asRecord(reply.pager, `namesilo`);
    const total = providerInteger(pager.total, `namesilo`);
    const size = providerInteger(pager.pageSize, `namesilo`);
    const currentPage = providerInteger(pager.page, `namesilo`);
    const items = reply.domains ?? (total === 0 ? [] : undefined);
    if (total > MAX_DOMAINS) throw new RegistrarRelayError(422, `Portfolio Exceeds The 10,000 Domain Sync Limit`);
    if (!Array.isArray(items) || currentPage !== page || size < 1 || size > 1000 || items.length > size) throw invalidResponse(`namesilo`);
    if (expectedTotal !== undefined && (total !== expectedTotal || size !== expectedSize)) throw new RegistrarRelayError(502, `NameSilo Portfolio Changed During Sync — Try Again`);
    expectedSize = size;
    expectedTotal = total;
    const incoming = items.map((value): RegistrarDomain => {
      const record = asRecord(value, `namesilo`);
      return {
        registrar: `NameSilo`,
        name: providerName(record.domain, `namesilo`),
        meta: { source: `NameSilo Registration API` },
        createdAt: providerDate(record.created, `namesilo`),
        expiresAt: providerDate(record.expires, `namesilo`, true),
      };
    });
    appendDomains(domains, incoming, `namesilo`, seen);
    if (domains.length > total) throw invalidResponse(`namesilo`);
    if (domains.length === total) return { domains };
    if (items.length !== size) throw invalidResponse(`namesilo`);
  }
  throw new RegistrarRelayError(422, `NameSilo Pagination Exceeds The Sync Limit`);
};
