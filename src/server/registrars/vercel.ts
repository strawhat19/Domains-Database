import type { RegistrarCredentials } from './credentials';
import { selectRegistrarDetails } from './detailSelection';
import { invalidResponse, RegistrarRelayError } from './errors';
import { pauseRequests, requestRegistrar, type RegistrarRequestContext } from './request';
import type { RegistrarDomain, RegistrarDetailSelection, RegistrarSyncResult, VercelDomainConfiguration } from '../../shared/registrarSync/types';
import { asRecord, parseJson, MAX_PAGES, MAX_DOMAINS, appendDomains, requiredText, providerName, providerBoolean, providerInteger } from './validation';

const PAGE_SIZE = 100;
const RENEWAL_BATCH_SIZE = 50;
const MAX_RENEWAL_NAMES = 200;
const RENEWAL_TIME_LIMIT = 30_000;
const echModes = [`auto`, `disabled`, `enabled`] as const;
const dnsServices = [`external`, `zeit.world`, `na`] as const;
const timestamp = (value: unknown) => {
  if (value == null) return undefined;
  const milliseconds = providerInteger(value, `vercel`);
  if (!milliseconds) return undefined;
  if (milliseconds > 253_402_300_799_999) throw invalidResponse(`vercel`);
  return new Date(milliseconds).toISOString();
};
const nameservers = (value: unknown) => {
  if (value == null) return undefined;
  if (!Array.isArray(value) || value.length > 32) throw invalidResponse(`vercel`);
  return [...new Set(value.map(name => providerName(name, `vercel`)))];
};
const readAdditionalMetadata = <T,>(read: () => T) => {
  try { return read(); }
  catch { return undefined; }
};

const enrichRenewalEstimates = async (
  domains: readonly RegistrarDomain[],
  credentials: Extract<RegistrarCredentials, { provider: `vercel` }>,
  context: RegistrarRequestContext,
  warnings: string[],
) => {
  const url = new URL(`https://api.vercel.com/v1/registrar/domains/price`);
  if (credentials.teamId) url.searchParams.set(`teamId`, credentials.teamId);
  const deadline = Math.min(context.deadline, Date.now() + RENEWAL_TIME_LIMIT);
  const priceContext = { ...context, deadline };
  const candidates = domains.slice(0, MAX_RENEWAL_NAMES);
  const headers = { Accept: `application/json`, Authorization: credentials.authorization, 'Content-Type': `application/json` };
  let updated = 0;
  for (let index = 0; index < candidates.length && Date.now() < deadline && !context.signal.aborted; index += RENEWAL_BATCH_SIZE) {
    const batch = candidates.slice(index, index + RENEWAL_BATCH_SIZE);
    const byName = new Map(batch.map(domain => [domain.name, domain]));
    try {
      if (index) await pauseRequests(1250, priceContext);
      const attemptedAt = new Date().toISOString();
      for (const domain of batch) domain.detailsAttemptedAt = attemptedAt;
      const body = JSON.stringify({ domains: [...byName.keys()] });
      const text = await requestRegistrar(url, headers, priceContext, { body, method: `POST` });
      const response = asRecord(parseJson(text, `vercel`), `vercel`);
      if (!Array.isArray(response.results) || response.results.length > batch.length) break;
      for (const value of response.results) {
        const quote = readAdditionalMetadata(() => asRecord(value, `vercel`));
        if (!quote || typeof quote.domain !== `string`) continue;
        const domain = byName.get(quote.domain.toLowerCase());
        const { years, renewalPrice } = quote;
        if (!domain || typeof years !== `number` || !Number.isInteger(years) || years < 1 || years > 10) continue;
        const amount = typeof renewalPrice === `string` && /^\d{1,9}(?:\.\d{1,2})?$/.test(renewalPrice)
          ? Number(renewalPrice) : renewalPrice;
        if (typeof amount !== `number` || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) continue;
        domain.renewalEstimate = { years, amount, currency: `USD` };
        domain.detailsCheckedAt = new Date().toISOString();
        byName.delete(domain.name);
        updated++;
      }
    } catch { break; }
  }
  if (updated < domains.length) warnings.push(`${domains.length - updated} Vercel Renewal Estimate(s) Unavailable This Sync`);
};

export const getVercelDomains = async (
  credentials: Extract<RegistrarCredentials, { provider: `vercel` }>,
  context: RegistrarRequestContext,
  detailSelection?: RegistrarDetailSelection,
): Promise<RegistrarSyncResult> => {
  let unavailable = 0;
  let external = 0;
  let cursor: number | undefined;
  const seen = new Set<string>();
  const domains: RegistrarDomain[] = [];
  const configurations = new Map<string, VercelDomainConfiguration>();
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
      const transferredAt = timestamp(record.transferredAt);
      const echMode = echModes.find(value => value === record.echMode);
      const serviceType = dnsServices.find(value => value === record.serviceType);
      const intendedNameservers = readAdditionalMetadata(() => nameservers(record.intendedNameservers));
      if (!boughtAt && !transferredAt) {
        external++;
        const name = readAdditionalMetadata(() => providerName(record.name, `vercel`));
        const verified = readAdditionalMetadata(() => providerBoolean(record.verified, `vercel`));
        if (!name || verified === undefined || !serviceType) { unavailable++; continue; }
        const observedNameservers = readAdditionalMetadata(() => nameservers(record.nameservers));
        if (configurations.has(name)) { unavailable++; continue; }
        configurations.set(name, {
          name,
          echMode,
          verified,
          observedNameservers,
          intendedNameservers,
          dnsService: serviceType,
        });
        continue;
      }
      const verified = providerBoolean(record.verified, `vercel`);
      if (verified === undefined || !serviceType) throw invalidResponse(`vercel`);
      const transferStartedAt = readAdditionalMetadata(() => timestamp(record.transferStartedAt));
      const customNameservers = readAdditionalMetadata(() => nameservers(record.customNameservers));
      incoming.push({
        registrar: `Vercel`,
        name: providerName(record.name, `vercel`),
        providerId: requiredText(record.id, `vercel`),
        createdAt: timestamp(record.createdAt),
        autoRenew: providerBoolean(record.renew, `vercel`),
        nameservers: nameservers(record.nameservers),
        expiresAt: timestamp(record.expiresAt)?.slice(0, 10),
        meta: {
          verified,
          serviceType,
          ...(echMode ? { echMode } : {}),
          source: `Vercel Registration API`,
          ...(boughtAt ? { boughtAt } : {}),
          ...(transferredAt ? { transferredAt } : {}),
          ...(customNameservers ? { customNameservers } : {}),
          ...(intendedNameservers ? { intendedNameservers } : {}),
          ...(transferStartedAt ? { transferStartedAt } : {}),
        },
      });
    }
    appendDomains(domains, incoming, `vercel`, seen);
    const pagination = asRecord(response.pagination, `vercel`);
    providerInteger(pagination.count, `vercel`);
    if (pagination.next === null) {
      const warnings = external ? [`${external} External Vercel Domain(s) Checked For Existing Portfolio Matches`] : [];
      if (unavailable) warnings.push(`${unavailable} Vercel Domain Configuration(s) Unavailable`);
      if (configurations.size > MAX_DOMAINS) warnings.push(`Vercel Domain Configuration Exceeds The Sync Limit`);
      await enrichRenewalEstimates(selectRegistrarDetails(domains, detailSelection), credentials, context, warnings);
      const vercelConfigurations = unavailable || configurations.size > MAX_DOMAINS ? undefined : [...configurations.values()].filter(domain => !seen.has(domain.name));
      return { domains, warnings, vercelConfigurations };
    }
    const next = providerInteger(pagination.next, `vercel`);
    if (!response.domains.length || (cursor !== undefined && next >= cursor)) throw invalidResponse(`vercel`);
    cursor = next;
  }
  throw new RegistrarRelayError(422, `Vercel Pagination Exceeds The Sync Limit`);
};
