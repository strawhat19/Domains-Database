import { Buffer } from 'node:buffer';
import type { RegistrarCredentials } from './credentials';
import { invalidResponse, RegistrarRelayError } from './errors';
import { requestRegistrar, type RegistrarRequestContext } from './request';
import type { RegistrarDomain, RegistrarSyncResult } from '../../shared/registrarSync/types';
import { asRecord, parseJson, MAX_PAGES, appendDomains, optionalText, requiredText, providerName, providerDate } from './validation';

const PAGE_SIZE = 100;
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

export const getSquarespaceDomains = async (
  credentials: Extract<RegistrarCredentials, { provider: `squarespace` }>,
  context: RegistrarRequestContext,
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
      return { domains, warnings };
    }
    if (!response.domains.length || cursors.has(next)) throw invalidResponse(`squarespace`);
    cursors.add(next);
    offset = next;
  }
  throw new RegistrarRelayError(422, `Squarespace Pagination Exceeds The Sync Limit`);
};
