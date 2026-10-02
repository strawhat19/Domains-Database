import { XMLParser } from 'fast-xml-parser';
import { SyntaxValidator } from 'fast-xml-validator';
import { invalidResponse, RegistrarRelayError } from './errors';
import type { RegistrarCredentials } from './credentials';
import type { RegistrarDomain, RegistrarSyncResult } from '../../shared/registrarSync/types';
import { pauseRequests, requestRegistrar, type RegistrarRequestContext } from './request';
import {
  asRecord, MAX_PAGES, MAX_DOMAINS, appendDomains, providerId, providerName,
  providerDate, optionalText, providerBoolean, providerInteger,
} from './validation';

const PAGE_SIZE = 100;
const parser = new XMLParser({
  parseTagValue: false,
  ignoreAttributes: false,
  removeNSPrefix: true,
  processEntities: false,
  attributeNamePrefix: ``,
  parseAttributeValue: false,
  isArray: tag => [`Domain`, `Error`].includes(tag),
});

const xmlError = (response: Record<string, unknown>) => {
  const errors = response.Errors;
  if (!errors || errors === ``) return undefined;
  const entries = asRecord(errors, `namecheap`).Error;
  if (!entries) return undefined;
  if (!Array.isArray(entries) || !entries.length) throw invalidResponse(`namecheap`);
  const codes = entries.map(entry => providerInteger(asRecord(entry, `namecheap`).Number, `namecheap`));
  if (codes.some(code => [1011150, 1017150, 1017105].includes(code))) {
    return new RegistrarRelayError(403, `Namecheap Requires The Calling Server's Whitelisted Public IPv4`);
  }
  if (codes.some(code => [1010102, 1011102, 1030408].includes(code))) {
    return new RegistrarRelayError(401, `Namecheap Credentials Are Invalid Or Expired`);
  }
  if (codes.some(code => [1017411, 1017410].includes(code))) {
    return new RegistrarRelayError(429, `Namecheap Account Request Limit Reached — Try Again Later`);
  }
  return new RegistrarRelayError(403, `Namecheap Requires Valid Credentials, Enabled API Access, And A Whitelisted Server IPv4`);
};

const parseResponse = (text: string) => {
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(text)) throw invalidResponse(`namecheap`);
  let parsed: unknown;
  try {
    const valid = SyntaxValidator.validate(text, {
      multipleRoots: false,
      allowBooleanAttributes: false,
      invalidCharSequence: { attrLt: true, comment: true, tagValue: true },
    });
    if (valid !== true) throw invalidResponse(`namecheap`);
    parsed = parser.parse(text);
  } catch {
    throw invalidResponse(`namecheap`);
  }
  const response = asRecord(asRecord(parsed, `namecheap`).ApiResponse, `namecheap`);
  const failure = xmlError(response);
  if (failure) throw failure;
  if (response.Status !== `OK`) throw invalidResponse(`namecheap`);
  const command = asRecord(response.CommandResponse, `namecheap`);
  if (command.Type !== `namecheap.domains.getList`) throw invalidResponse(`namecheap`);
  const result = command.DomainGetListResult;
  const items = result === `` ? [] : asRecord(result, `namecheap`).Domain ?? [];
  if (!Array.isArray(items) || items.length > PAGE_SIZE) throw invalidResponse(`namecheap`);
  const paging = asRecord(command.Paging, `namecheap`);
  return {
    items,
    total: providerInteger(paging.TotalItems, `namecheap`),
    page: providerInteger(paging.CurrentPage, `namecheap`),
    size: providerInteger(paging.PageSize, `namecheap`),
  };
};

const normalizeDomain = (value: unknown): RegistrarDomain => {
  const record = asRecord(value, `namecheap`);
  const expired = providerBoolean(record.IsExpired, `namecheap`, true);
  const whoisGuard = optionalText(record.WhoisGuard, `namecheap`);
  if (whoisGuard && ![`ENABLED`, `DISABLED`, `NOTPRESENT`].includes(whoisGuard)) throw invalidResponse(`namecheap`);
  return {
    registrar: `Namecheap`,
    providerId: providerId(record.ID, `namecheap`),
    name: providerName(record.Name, `namecheap`),
    status: expired === undefined ? undefined : expired ? `Expired` : `Active`,
    locked: providerBoolean(record.IsLocked, `namecheap`, true),
    autoRenew: providerBoolean(record.AutoRenew, `namecheap`, true),
    privacy: whoisGuard === undefined ? undefined : whoisGuard === `ENABLED`,
    createdAt: providerDate(record.Created, `namecheap`, false, true),
    expiresAt: providerDate(record.Expires, `namecheap`, true, true),
  };
};

export const getNamecheapDomains = async (
  credentials: Extract<RegistrarCredentials, { provider: `namecheap` }>,
  context: RegistrarRequestContext,
): Promise<RegistrarSyncResult> => {
  let expectedTotal: number | undefined;
  let expectedSize: number | undefined;
  const seen = new Set<string>();
  const domains: RegistrarDomain[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    if (page > 1) await pauseRequests(1250, context);
    const url = new URL(`https://api.namecheap.com/xml.response`);
    const parameters = {
      ListType: `ALL`,
      SortBy: `NAME`,
      Page: String(page),
      PageSize: String(PAGE_SIZE),
      ApiKey: credentials.apiKey,
      ApiUser: credentials.username,
      UserName: credentials.username,
      ClientIp: credentials.clientIp,
      Command: `namecheap.domains.getList`,
    };
    Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, value));
    const text = await requestRegistrar(url, { Accept: `application/xml` }, context);
    const result = parseResponse(text);
    if (result.total > MAX_DOMAINS) throw new RegistrarRelayError(422, `Portfolio Exceeds The 10,000 Domain Sync Limit`);
    if (result.page !== page || result.size < 10 || result.size > PAGE_SIZE || result.items.length > result.size) throw invalidResponse(`namecheap`);
    if (expectedTotal !== undefined && (result.total !== expectedTotal || result.size !== expectedSize)) {
      throw new RegistrarRelayError(502, `Namecheap Portfolio Changed During Sync — Try Again`);
    }
    expectedSize = result.size;
    expectedTotal = result.total;
    const incoming = result.items.map(normalizeDomain);
    appendDomains(domains, incoming, `namecheap`, seen);
    if (domains.length > result.total) throw invalidResponse(`namecheap`);
    if (domains.length === result.total) return { domains };
    if (incoming.length !== result.size) throw invalidResponse(`namecheap`);
  }
  throw new RegistrarRelayError(422, `Namecheap Pagination Exceeds The Sync Limit`);
};
