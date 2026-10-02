import type { RegistrarCredentials } from './credentials';
import { invalidResponse, RegistrarRelayError } from './errors';
import { pauseRequests, requestRegistrar, type RegistrarRequestContext } from './request';
import type { RegistrarDomain, RegistrarSyncResult } from '../../shared/registrarSync/types';
import { asRecord, parseJson, MAX_PAGES, appendDomains, providerName, providerDate, providerStatus, providerInteger } from './validation';

const PAGE_SIZE = 1000;
const binaryFlag = (value: unknown) => {
  if (value == null) return undefined;
  const number = providerInteger(value, `porkbun`);
  if (number > 1) throw invalidResponse(`porkbun`);
  return number === 1;
};

export const getPorkbunDomains = async (
  credentials: Extract<RegistrarCredentials, { provider: `porkbun` }>,
  context: RegistrarRequestContext,
): Promise<RegistrarSyncResult> => {
  let external = 0;
  const seen = new Set<string>();
  const domains: RegistrarDomain[] = [];
  const headers = { Accept: `application/json`, 'X-API-Key': credentials.apiKey, 'X-Secret-API-Key': credentials.secretKey };
  for (let page = 0; page < MAX_PAGES; page++) {
    if (page) await pauseRequests(1250, context);
    const url = new URL(`https://api.porkbun.com/api/json/v3/domain/listAll`);
    url.searchParams.set(`start`, String(page * PAGE_SIZE));
    url.searchParams.set(`sortName`, `domain`);
    url.searchParams.set(`sortDirection`, `asc`);
    const text = await requestRegistrar(url, headers, context);
    const response = asRecord(parseJson(text, `porkbun`), `porkbun`);
    if (response.status !== `SUCCESS`) throw new RegistrarRelayError(403, `Porkbun Requires Valid API Keys And Account API Access`);
    if (!Array.isArray(response.domains) || response.domains.length > PAGE_SIZE) throw invalidResponse(`porkbun`);
    if (response.count != null && providerInteger(response.count, `porkbun`) !== response.domains.length) throw invalidResponse(`porkbun`);
    const incoming: RegistrarDomain[] = [];
    for (const value of response.domains) {
      const record = asRecord(value, `porkbun`);
      if (binaryFlag(record.notLocal)) { external++; continue; }
      incoming.push({
        registrar: `Porkbun`,
        name: providerName(record.domain, `porkbun`),
        meta: { source: `Porkbun Registration API` },
        status: providerStatus(record.status, `porkbun`),
        locked: binaryFlag(record.securityLock),
        privacy: binaryFlag(record.whoisPrivacy),
        autoRenew: binaryFlag(record.autoRenew),
        createdAt: providerDate(record.createDate, `porkbun`),
        expiresAt: providerDate(record.expireDate, `porkbun`, true),
      });
    }
    appendDomains(domains, incoming, `porkbun`, seen);
    if (response.domains.length < PAGE_SIZE) return { domains, warnings: external ? [`${external} Externally Managed Porkbun Record(s) Excluded From Registered Inventory`] : [] };
  }
  throw new RegistrarRelayError(422, `Porkbun Pagination Exceeds The Sync Limit`);
};
