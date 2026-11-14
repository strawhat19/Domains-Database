import { Buffer } from 'node:buffer';
import { selectRegistrarDetails } from './detailSelection';
import type { RegistrarCredentials } from './credentials';
import { invalidResponse, RegistrarRelayError } from './errors';
import { pauseRequests, requestRegistrar, type RegistrarRequestContext } from './request';
import type { RegistrarDomain, RegistrarDetailSelection, RegistrarSyncResult } from '../../shared/registrarSync/types';
import { asRecord, parseJson, MAX_PAGES, appendDomains, optionalText, requiredText, providerName, providerDate, providerBoolean } from './validation';

const PAGE_SIZE = 100;
const MAX_DETAIL_READS = 40;
const DETAIL_TIME_LIMIT = 65_000;
const DETAIL_REQUEST_RESERVE = 15_000;
const USER_AGENT = `Domains-Database/0.0.1.3 Squarespace Registrar Sync`;
const INVENTORY_URL = `https://api.squarespace.com/reseller/v1/domains`;
const resoldStatuses = [`ACTIVE`, `EXPIRED`, `CANCELLED`, `INACTIVE`];
const registrationStatuses = [
  `ACTIVE`,
  `PENDING`,
  `EXPIRED`,
  `SUSPENDED`,
  `PENDING_RENEWAL`,
  `REDEMPTION_PERIOD`,
  `SUSPENDED_BY_REGISTRY`,
];

const readStatus = (value: unknown, allowed: readonly string[]) => {
  const status = optionalText(value, `squarespace`);
  if (status && !allowed.includes(status)) throw invalidResponse(`squarespace`);
  return status;
};

const readDate = (value: unknown) => {
  const text = optionalText(value, `squarespace`, 64);
  if (!text) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|\+00:00)$/.test(text)) throw invalidResponse(`squarespace`);
  return providerDate(text, `squarespace`);
};

const readNextOffset = (value: unknown) => {
  if (value == null) return undefined;
  const text = requiredText(value, `squarespace`, 4096);
  let url: URL;
  try { url = new URL(text, INVENTORY_URL); }
  catch { throw invalidResponse(`squarespace`); }
  if (url.origin !== `https://api.squarespace.com` || url.username || url.password || url.hash
    || ![`/reseller/v1/domains`, `/reseller/v1/public/domains`].includes(url.pathname)) throw invalidResponse(`squarespace`);
  const offsets = url.searchParams.getAll(`offset`);
  if (offsets.length !== 1) throw invalidResponse(`squarespace`);
  const offset = requiredText(offsets[0], `squarespace`, 2048);
  if (/\s/.test(offset) || offset !== offsets[0]) throw invalidResponse(`squarespace`);
  return offset;
};

const getAccessToken = async (
  credentials: Extract<RegistrarCredentials, { provider: `squarespace` }>,
  context: RegistrarRequestContext,
) => {
  const url = new URL(`https://login.squarespace.com/api/1/login/oauth/provider/tokens`);
  const text = await requestRegistrar(url, {
    Accept: `application/json`,
    'User-Agent': USER_AGENT,
    'Content-Type': `application/json`,
    Authorization: `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString(`base64`)}`,
  }, context, {
    method: `POST`,
    body: JSON.stringify({ grant_type: `client_credentials`, scope: [`DOMAINS_SEARCH`] }),
  });
  const response = asRecord(parseJson(text, `squarespace`), `squarespace`);
  const token = requiredText(response.access_token, `squarespace`, 8192);
  if (!/^[a-z0-9._~+/-]+=*$/i.test(token) || requiredText(response.token_type, `squarespace`).toLowerCase() !== `bearer`) {
    throw new RegistrarRelayError(502, `Squarespace Returned An Invalid Access Token`);
  }
  return token;
};

const readDomainDetail = (text: string, domain: RegistrarDomain): Partial<RegistrarDomain> => {
  const detail = asRecord(parseJson(text, `squarespace`), `squarespace`);
  if (providerName(detail.name, `squarespace`) !== domain.name
    || (domain.providerId && detail.domainId != null && detail.domainId !== domain.providerId)) throw invalidResponse(`squarespace`);
  const servers = detail.nameservers;
  if (servers != null && (!Array.isArray(servers) || servers.length > 32)) throw invalidResponse(`squarespace`);
  const nameservers = Array.isArray(servers) ? [...new Set(servers.map(name => providerName(name, `squarespace`)))] : undefined;
  const statuses = detail.statuses;
  const registryStatusCodes = Array.isArray(statuses) && statuses.length <= 64
    && statuses.every(status => typeof status === `string` && /^[a-z][a-z0-9 _-]{0,99}$/i.test(status)) ? statuses : undefined;
  const registrantEmailVerified = providerBoolean(detail.registrantEmailVerified, `squarespace`);
  return {
    nameservers,
    locked: providerBoolean(detail.locked, `squarespace`),
    autoRenew: providerBoolean(detail.autoRenew, `squarespace`),
    privacy: providerBoolean(detail.whoisPrivacy, `squarespace`),
    dnssec: providerBoolean(detail.dnssecSigned, `squarespace`),
    updatedAt: readDate(detail.updatedOn) ?? domain.updatedAt,
    createdAt: domain.createdAt ?? readDate(detail.registeredOn),
    expiresAt: domain.expiresAt ?? readDate(detail.expiresOn)?.slice(0, 10),
    detailsCheckedAt: new Date().toISOString(),
    meta: {
      ...domain.meta,
      ...(registryStatusCodes ? { registryStatusCodes } : {}),
      ...(registrantEmailVerified !== undefined ? { registrantEmailVerified } : {}),
    },
  };
};

const enrichSquarespaceDomains = async (
  domains: readonly RegistrarDomain[], headers: Record<string, string>, context: RegistrarRequestContext, warnings: string[],
) => {
  const deadline = Math.min(context.deadline, Date.now() + DETAIL_TIME_LIMIT);
  const detailContext = { ...context, deadline };
  let attempted = 0;
  let failed = 0;
  for (const domain of domains.slice(0, MAX_DETAIL_READS)) {
    if (context.signal.aborted || Date.now() + DETAIL_REQUEST_RESERVE + 1250 >= deadline) break;
    try {
      await pauseRequests(1250, detailContext);
      attempted++;
      domain.detailsAttemptedAt = new Date().toISOString();
      const text = await requestRegistrar(new URL(`${INVENTORY_URL}/${domain.name}`), headers, detailContext);
      Object.assign(domain, readDomainDetail(text, domain));
    } catch (failure) {
      failed++;
      const status = failure instanceof RegistrarRelayError ? failure.status : undefined;
      if (status === 401 || status === 403 || status === 429 || status === 504 || context.signal.aborted) break;
    }
  }
  if (failed) warnings.push(`${failed} Squarespace Registration Detail Read(s) Unavailable`);
  if (attempted < domains.length) warnings.push(`${domains.length - attempted} Squarespace Domain(s) Synced With Inventory Fields Only`);
};

export const getSquarespaceDomains = async (
  credentials: Extract<RegistrarCredentials, { provider: `squarespace` }>,
  context: RegistrarRequestContext,
  detailSelection?: RegistrarDetailSelection,
): Promise<RegistrarSyncResult> => {
  let pending = 0;
  let inactive = 0;
  let offset: string | undefined;
  const seen = new Set<string>();
  const cursors = new Set<string>();
  const domains: RegistrarDomain[] = [];
  const token = await getAccessToken(credentials, context);
  const headers = { Accept: `application/json`, 'User-Agent': USER_AGENT, Authorization: `Bearer ${token}` };
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(INVENTORY_URL);
    url.searchParams.set(`limit`, String(PAGE_SIZE));
    if (offset) url.searchParams.set(`offset`, offset);
    const text = await requestRegistrar(url, headers, context);
    const response = asRecord(parseJson(text, `squarespace`), `squarespace`);
    if (!Array.isArray(response.domains) || response.domains.length > PAGE_SIZE) throw invalidResponse(`squarespace`);
    const incoming: RegistrarDomain[] = [];
    for (const value of response.domains) {
      const record = asRecord(value, `squarespace`);
      const resoldStatus = readStatus(record.resoldStatus, resoldStatuses);
      const registrationStatus = readStatus(record.registrationStatus, registrationStatuses);
      if (resoldStatus === `CANCELLED` || resoldStatus === `INACTIVE`) { inactive++; continue; }
      if (registrationStatus === `PENDING`) { pending++; continue; }
      const domainId = optionalText(record.domainId, `squarespace`, 256);
      const customerId = optionalText(record.customerId, `squarespace`, 256);
      const subscriptionId = optionalText(record.subscriptionId, `squarespace`, 256);
      const registeredOn = readDate(record.registeredOn);
      const expiresOn = readDate(record.expiresOn);
      const updatedOn = readDate(record.updatedOn);
      incoming.push({
        providerId: domainId,
        updatedAt: updatedOn,
        createdAt: registeredOn,
        registrar: `Squarespace`,
        expiresAt: expiresOn?.slice(0, 10),
        status: registrationStatus ?? resoldStatus,
        name: providerName(record.name, `squarespace`),
        meta: {
          source: `Squarespace Reseller API`,
          ...(domainId ? { domainId } : {}),
          ...(expiresOn ? { expiresOn } : {}),
          ...(updatedOn ? { updatedOn } : {}),
          ...(customerId ? { customerId } : {}),
          ...(resoldStatus ? { resoldStatus } : {}),
          ...(registeredOn ? { registeredOn } : {}),
          ...(subscriptionId ? { subscriptionId } : {}),
          ...(registrationStatus ? { registrationStatus } : {}),
        },
      });
    }
    appendDomains(domains, incoming, `squarespace`, seen);
    const next = readNextOffset(response.nextPageUrl);
    if (!next) {
      const warnings: string[] = [];
      if (pending) warnings.push(`${pending} Pending Squarespace Registration(s) Excluded From Registered Inventory`);
      if (inactive) warnings.push(`${inactive} Cancelled Or Inactive Squarespace Reseller Record(s) Excluded From Registered Inventory`);
      await enrichSquarespaceDomains(selectRegistrarDetails(domains, detailSelection), headers, context, warnings);
      return { domains, warnings };
    }
    if (!response.domains.length || cursors.has(next)) throw invalidResponse(`squarespace`);
    cursors.add(next);
    offset = next;
  }
  throw new RegistrarRelayError(422, `Squarespace Pagination Exceeds The Sync Limit`);
};
