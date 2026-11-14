import { isIP } from 'node:net';
import { RegistrarRelayError } from '../registrars/errors';
import { readLimitedText, pauseRequests, type RegistrarRequestContext } from '../registrars/request';
import { asRecord, parseJson, providerId, providerName, providerStatus } from '../registrars/validation';
import { DOMAIN_DNS_LIMIT_PER_TYPE, DOMAIN_DNS_SOURCE, DOMAIN_DNS_TYPES, type DomainDnsRecord, type DomainDnsRecordType, type DomainDnsSnapshot } from '../../shared/domainDns/types';

const origin = `https://api.godaddy.com`;
const invalid = () => new RegistrarRelayError(502, `GoDaddy Returned Invalid DNS Data`);

const isGoDaddyDelegation = (value: unknown) => {
  if (!Array.isArray(value) || value.length < 2 || value.length > 64) return false;
  try {
    const servers = new Set(value.map(server => providerName(server, `godaddy`)));
    return servers.size >= 2 && [...servers].every(server => server.endsWith(`.domaincontrol.com`));
  } catch { return false; }
};

const readGoDaddy = async (url: URL, authorization: string, signal: AbortSignal) => {
  const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(3_000)]);
  const response = await fetch(url, {
    method: `GET`, signal: requestSignal, cache: `no-store`, redirect: `error`, credentials: `omit`,
    headers: { Accept: `application/json`, Authorization: authorization },
  });
  if (!response.ok) {
    void response.body?.cancel().catch(() => undefined);
    if (response.status === 401 || response.status === 403) throw new RegistrarRelayError(403, `GoDaddy Requires A Personal Access Token With Domain Read Access`);
    if (response.status === 404) throw new RegistrarRelayError(404, `GoDaddy Could Not Find This Registration Or DNS Zone`);
    if (response.status === 429) throw new RegistrarRelayError(429, `GoDaddy Rate Limit Reached — Try Later`);
    throw new RegistrarRelayError(502, `GoDaddy Could Not Complete The DNS Request`);
  }
  return asRecord(parseJson(await readLimitedText(response.body, 64_000, requestSignal, invalid()), `godaddy`), `godaddy`);
};

const readRecord = (value: unknown, type: DomainDnsRecordType, domain: string): DomainDnsRecord => {
  const { name, ttl, data, priority, type: returnedType } = asRecord(value, `godaddy`);
  if (returnedType !== type || typeof ttl !== `number` || !Number.isInteger(ttl) || ttl < 600 || ttl > 86_400
    || typeof name !== `string` || !name || name.length > 253 || name !== name.trim()
    || typeof data !== `string` || !data || data !== data.trim()) throw invalid();
  const rawHost = name.startsWith(`*.`) ? name.slice(2) : name;
  const owner = name === `@` || name === `*` ? name : providerName(`${rawHost}.${domain}`, `godaddy`).slice(0, -(domain.length + 1));
  if (!owner) throw invalid();
  const recordName = name.startsWith(`*.`) ? `*.${owner}` : owner;
  let address = data;
  if (type === `A` || type === `AAAA`) {
    if (isIP(data) !== (type === `A` ? 4 : 6)) throw invalid();
  } else if (data !== `.` || type !== `MX`) address = providerName(data, `godaddy`);
  if (type === `MX` && (typeof priority !== `number` || !Number.isInteger(priority) || priority < 0 || priority > 65_535
    || (data === `.` && priority !== 0))) throw invalid();
  return { ttl, type, name: recordName, value: address, ...(type === `MX` ? { priority: priority as number } : {}) };
};

export const getGoDaddyDns = async (name: string, registrationId: string, authorization: string, signal: AbortSignal): Promise<DomainDnsSnapshot> => {
  const domain = providerName(name, `godaddy`);
  const registration = await readGoDaddy(new URL(`/v1/domains/${domain}`, origin), authorization, signal);
  const status = providerStatus(registration.status, `godaddy`)?.toUpperCase();
  if (providerName(registration.domain, `godaddy`) !== domain || providerId(registration.domainId, `godaddy`) !== registrationId
    || !status || [`TRANSFERRED`, `TRANSFERRED_OUT`, `OWNERSHIP_CHANGED`, `CANCELLED`, `CANCELLED_REDEEMABLE`, `DELETED_REDEEMABLE`, `REPOSSESSED`, `FAILED`].includes(status)) {
    throw new RegistrarRelayError(409, `The GoDaddy Registration Changed — Sync Your Domains And Try Again`);
  }
  if (!isGoDaddyDelegation(registration.nameServers)) {
    throw new RegistrarRelayError(422, `GoDaddy Authoritative Nameservers Could Not Be Confirmed For This Domain`);
  }

  const records: DomainDnsRecord[] = [];
  const coverage: DomainDnsSnapshot[`coverage`] = [];
  const context: RegistrarRequestContext = { signal, provider: `godaddy`, deadline: Date.now() + 20_000 };
  let requestStarted = Date.now();
  for (const type of DOMAIN_DNS_TYPES) {
    try {
      const delay = Math.max(0, 1_050 - (Date.now() - requestStarted));
      if (delay) await pauseRequests(delay, context);
      requestStarted = Date.now();
      const url = new URL(`/v3/domains/zones/${domain}/dns-records`, origin);
      url.search = new URLSearchParams({ type, pageSize: String(DOMAIN_DNS_LIMIT_PER_TYPE), fields: `name,type,data,ttl,priority` }).toString();
      const { items, links } = await readGoDaddy(url, authorization, signal);
      if (!Array.isArray(items) || items.length > DOMAIN_DNS_LIMIT_PER_TYPE || !Array.isArray(links) || links.length > 16) throw invalid();
      const truncated = links.map(link => asRecord(link, `godaddy`)).some(link => link.rel === `next`);
      const response = items.map(record => readRecord(record, type, domain));
      records.push(...response);
      coverage.push({ type, status: truncated ? `truncated` : `complete` });
    } catch (failure) {
      if (signal.aborted) throw failure;
      if (failure instanceof RegistrarRelayError && [403, 404, 429].includes(failure.status)) {
        if (!coverage.some(item => item.status !== `unavailable`)) throw failure;
        break;
      }
      coverage.push({ type, status: `unavailable` });
    }
  }
  if (!coverage.some(item => item.status !== `unavailable`)) throw new RegistrarRelayError(502, `GoDaddy DNS Records Could Not Be Loaded`);
  for (const type of DOMAIN_DNS_TYPES.slice(coverage.length)) coverage.push({ type, status: `unavailable` });
  return { domain, records, coverage, source: DOMAIN_DNS_SOURCE, checkedAt: new Date().toISOString() };
};
