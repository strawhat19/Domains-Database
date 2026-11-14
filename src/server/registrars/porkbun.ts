import type { RegistrarCredentials } from './credentials';
import { selectRegistrarDetails } from './detailSelection';
import { enrichPorkbunPaidRenewals } from './porkbunInvoices';
import { invalidResponse, RegistrarRelayError } from './errors';
import { pauseRequests, requestRegistrar, type RegistrarRequestContext } from './request';
import type { RegistrarDomain, RegistrarDetailSelection, RegistrarSyncResult } from '../../shared/registrarSync/types';
import { asRecord, parseJson, MAX_PAGES, appendDomains, providerName, providerDate, providerStatus, providerInteger } from './validation';

const PAGE_SIZE = 1000;
const RENEWAL_BATCH_SIZE = 25;
const MAX_RENEWAL_NAMES = 100;
const RENEWAL_TIME_LIMIT = 30_000;
const binaryFlag = (value: unknown) => {
  if (value == null) return undefined;
  const number = providerInteger(value, `porkbun`);
  if (number > 1) throw invalidResponse(`porkbun`);
  return number === 1;
};

const readRenewalEstimate = (value: unknown): RegistrarDomain[`renewalEstimate`] => {
  if (value == null) return undefined;
  const result = asRecord(value, `porkbun`);
  if (result.inYourAccount !== true || result.avail !== `no` || result.additional == null) return undefined;
  const additional = asRecord(result.additional, `porkbun`);
  if (additional.renewal == null) return undefined;
  const renewal = asRecord(additional.renewal, `porkbun`);
  if (typeof renewal.price !== `string` || !/^\d{1,9}(?:\.\d{1,2})?$/.test(renewal.price)) return undefined;
  const amount = Number(renewal.price);
  return amount > 0 ? { amount, years: 1, currency: `USD` } : undefined;
};

const enrichRenewalEstimates = async (domains: readonly RegistrarDomain[], headers: Record<string, string>, context: RegistrarRequestContext, warnings: string[]) => {
  const deadline = Math.min(context.deadline, Date.now() + RENEWAL_TIME_LIMIT);
  const candidates = domains.slice(0, MAX_RENEWAL_NAMES);
  const url = new URL(`https://api.porkbun.com/api/json/v3/domain/checkDomain`);
  let updated = 0;
  for (let index = 0; index < candidates.length && Date.now() < deadline && !context.signal.aborted;) {
    const batch: RegistrarDomain[] = [];
    let germanDomains = 0;
    while (index < candidates.length && batch.length < RENEWAL_BATCH_SIZE) {
      const domain = candidates[index]!;
      if (domain.name.endsWith(`.de`) && germanDomains++ === 4) break;
      batch.push(domain);
      index++;
    }
    try {
      const attemptedAt = new Date().toISOString();
      for (const domain of batch) domain.detailsAttemptedAt = attemptedAt;
      const body = JSON.stringify({ domains: batch.map(domain => domain.name) });
      const text = await requestRegistrar(url, { ...headers, 'Content-Type': `application/json` }, { ...context, deadline }, { body, method: `POST` });
      const response = asRecord(parseJson(text, `porkbun`), `porkbun`);
      if (response.status !== `SUCCESS`) break;
      const quotes = asRecord(response.domains, `porkbun`);
      for (const domain of batch) {
        try {
          const estimate = readRenewalEstimate(quotes[domain.name]);
          if (!estimate) continue;
          domain.renewalEstimate = estimate;
          domain.detailsCheckedAt = new Date().toISOString();
          updated++;
        } catch { continue; }
      }
    } catch { break; }
  }
  if (updated < domains.length) warnings.push(`${domains.length - updated} Porkbun Renewal Estimate(s) Unavailable This Sync`);
};

export const getPorkbunDomains = async (
  credentials: Extract<RegistrarCredentials, { provider: `porkbun` }>,
  context: RegistrarRequestContext,
  detailSelection?: RegistrarDetailSelection,
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
    if (response.domains.length < PAGE_SIZE) {
      const warnings = external ? [`${external} Externally Managed Porkbun Record(s) Excluded From Registered Inventory`] : [];
      await enrichRenewalEstimates(selectRegistrarDetails(domains, detailSelection), headers, context, warnings);
      if (!credentials.apiKey.startsWith(`pk1_sb_`)) await enrichPorkbunPaidRenewals(domains, headers, context, warnings);
      return { domains, warnings };
    }
  }
  throw new RegistrarRelayError(422, `Porkbun Pagination Exceeds The Sync Limit`);
};
