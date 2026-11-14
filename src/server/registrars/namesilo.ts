import { selectRegistrarDetails } from './detailSelection';
import type { RegistrarCredentials } from './credentials';
import { invalidResponse, RegistrarRelayError } from './errors';
import { pauseRequests, requestRegistrar, type RegistrarRequestContext } from './request';
import type { RegistrarDomain, RegistrarDetailSelection, RegistrarSyncResult } from '../../shared/registrarSync/types';
import { asRecord, parseJson, MAX_PAGES, MAX_DOMAINS, appendDomains, providerName, providerDate, providerStatus, providerInteger } from './validation';

const PAGE_SIZE = 100;
const MAX_DETAIL_READS = 40;
const DETAIL_INTERVAL = 1250;
const DETAIL_TIME_LIMIT = 65_000;
const REQUEST_RESERVE = 15_000;
const readReply = (text: string, operation?: `getDomainInfo`) => {
  const response = asRecord(parseJson(text, `namesilo`), `namesilo`);
  const reply = asRecord(response.reply, `namesilo`);
  const code = providerInteger(reply.code, `namesilo`);
  if (code === 110 || code === 111) throw new RegistrarRelayError(401, `NameSilo API Credentials Are Invalid`);
  if (code === 112) throw new RegistrarRelayError(403, `NameSilo API Requires A Main Account — Subaccounts Are Unsupported`);
  if (code === 113) throw new RegistrarRelayError(403, `NameSilo Requires The Calling Server's Permitted IP`);
  if (code === 400) throw new RegistrarRelayError(429, `NameSilo Is Processing Another Request — Try Again Later`);
  if (code !== 300) throw new RegistrarRelayError(502, `NameSilo Could Not Complete The Domain Request`);
  if (operation && asRecord(response.request, `namesilo`).operation !== operation) throw invalidResponse(`namesilo`);
  return reply;
};

const readFlag = (value: unknown) => {
  if (value == null) return undefined;
  const flag = typeof value === `string` ? value.toLowerCase() : ``;
  if (flag !== `yes` && flag !== `no`) throw invalidResponse(`namesilo`);
  return flag === `yes`;
};

const readDomainDetail = (detail: Record<string, unknown>, domain: RegistrarDomain): Partial<RegistrarDomain> => {
  if (detail.domain != null && providerName(detail.domain, `namesilo`) !== domain.name) throw invalidResponse(`namesilo`);
  const nameservers = detail.nameservers;
  if (nameservers != null && (!Array.isArray(nameservers) || nameservers.length > 32)) throw invalidResponse(`namesilo`);
  const servers = Array.isArray(nameservers) ? [...new Set(nameservers.map(item => {
    const server = asRecord(item, `namesilo`);
    return providerName(server.nameserver, `namesilo`);
  }))] : undefined;
  const status = providerStatus(detail.status, `namesilo`);
  const locked = readFlag(detail.locked);
  const privacy = readFlag(detail.private);
  const autoRenew = readFlag(detail.auto_renew);
  if (status === undefined && locked === undefined && privacy === undefined && autoRenew === undefined && servers === undefined) throw invalidResponse(`namesilo`);
  return {
    status,
    locked,
    privacy,
    autoRenew,
    nameservers: servers,
    detailsCheckedAt: new Date().toISOString(),
    createdAt: domain.createdAt ?? providerDate(detail.created, `namesilo`),
    expiresAt: domain.expiresAt ?? providerDate(detail.expires, `namesilo`, true),
  };
};

const enrichNameSiloDomains = async (domains: readonly RegistrarDomain[], apiKey: string, context: RegistrarRequestContext) => {
  const deadline = Math.min(context.deadline, Date.now() + DETAIL_TIME_LIMIT);
  const detailContext = { ...context, deadline };
  const url = new URL(`https://www.namesilo.com/apibatch/getDomainInfo`);
  Object.entries({ version: `1`, type: `json`, key: apiKey }).forEach(([key, value]) => url.searchParams.set(key, value));
  let failed = 0;
  let attempted = 0;
  let requestStartedAt = Date.now();
  for (const domain of domains.slice(0, MAX_DETAIL_READS)) {
    const delay = Math.max(0, DETAIL_INTERVAL - (Date.now() - requestStartedAt));
    if (context.signal.aborted || Date.now() + delay + REQUEST_RESERVE >= deadline) break;
    try {
      if (delay) await pauseRequests(delay, detailContext);
      requestStartedAt = Date.now();
      attempted++;
      domain.detailsAttemptedAt = new Date(requestStartedAt).toISOString();
      url.searchParams.set(`domain`, domain.name);
      const text = await requestRegistrar(url, { Accept: `application/json` }, detailContext);
      Object.assign(domain, readDomainDetail(readReply(text, `getDomainInfo`), domain));
    } catch (failure) {
      failed++;
      const status = failure instanceof RegistrarRelayError ? failure.status : undefined;
      if (status === 401 || status === 403 || status === 429 || status === 504 || context.signal.aborted) break;
    }
  }
  const warnings: string[] = [];
  if (failed) warnings.push(`${failed} NameSilo Registration Detail Read(s) Unavailable`);
  if (attempted < domains.length) warnings.push(`${domains.length - attempted} NameSilo Domain(s) Synced With Inventory Fields Only`);
  return warnings;
};

export const getNameSiloDomains = async (
  credentials: Extract<RegistrarCredentials, { provider: `namesilo` }>,
  context: RegistrarRequestContext,
  detailSelection?: RegistrarDetailSelection,
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
    if (domains.length === total) {
      const candidates = selectRegistrarDetails(domains, detailSelection);
      const warnings = await enrichNameSiloDomains(candidates, credentials.apiKey, context);
      return { domains, warnings };
    }
    if (items.length !== size) throw invalidResponse(`namesilo`);
  }
  throw new RegistrarRelayError(422, `NameSilo Pagination Exceeds The Sync Limit`);
};
