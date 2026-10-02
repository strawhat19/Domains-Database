import { invalidResponse, RegistrarRelayError } from './errors';
import { pauseRequests, requestRegistrar, type RegistrarRequestContext } from './request';
import type { RegistrarDomain, RegistrarSyncResult } from '../../shared/registrarSync/types';
import {
  asRecord, parseJson, MAX_PAGES, appendDomains, providerId, providerName,
  providerDate, providerBoolean, providerStatus,
} from './validation';

const PAGE_SIZE = 1000;
const MAX_RENEWAL_READS = 120;
const RENEWAL_INTERVAL = 1000;
const RENEWAL_REQUEST_RESERVE = 15_000;
const customerIdPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

const normalizeDomain = (value: unknown): RegistrarDomain => {
  const record = asRecord(value, `godaddy`);
  const status = providerStatus(record.status, `godaddy`);
  if (!status) throw invalidResponse(`godaddy`);
  return {
    status,
    registrar: `GoDaddy`,
    name: providerName(record.domain, `godaddy`),
    locked: providerBoolean(record.locked, `godaddy`),
    privacy: providerBoolean(record.privacy, `godaddy`),
    providerId: providerId(record.domainId, `godaddy`),
    autoRenew: providerBoolean(record.renewAuto, `godaddy`),
    createdAt: providerDate(record.createdAt, `godaddy`),
    expiresAt: providerDate(record.expires, `godaddy`, true),
  };
};

const readRenewalEstimate = (text: string, name: string): RegistrarDomain[`renewalEstimate`] => {
  const detail = asRecord(parseJson(text, `godaddy`), `godaddy`);
  if (detail.domain != null && providerName(detail.domain, `godaddy`) !== name) throw invalidResponse(`godaddy`);
  if (detail.renewal == null) return undefined;
  const renewal = asRecord(detail.renewal, `godaddy`);
  if (providerBoolean(renewal.renewable, `godaddy`) === false) return undefined;
  const price = renewal.price;
  const currency = renewal.currency;
  if (price == null || currency == null) return undefined;
  if (typeof currency !== `string` || !/^[A-Z]{3}$/.test(currency)) throw invalidResponse(`godaddy`);
  if (typeof price !== `number` || !Number.isSafeInteger(price) || price < 0) throw invalidResponse(`godaddy`);
  return { currency, amount: price / 1_000_000 };
};

const enrichRenewalEstimates = async (
  domains: RegistrarDomain[],
  authorization: string,
  context: RegistrarRequestContext,
  customerId?: string,
  lookupAuthorization?: string,
): Promise<RegistrarSyncResult> => {
  if (!domains.length) return { domains };
  const warnings: string[] = [];
  let resolvedCustomerId = customerId;
  if (!resolvedCustomerId) {
    try {
      const url = new URL(`https://api.godaddy.com/v1/shoppers/MY`);
      url.searchParams.set(`includes`, `customerId`);
      const headers = { Accept: `application/json`, Authorization: lookupAuthorization ?? authorization };
      const text = await requestRegistrar(url, headers, context);
      const shopper = asRecord(parseJson(text, `godaddy`), `godaddy`);
      if (typeof shopper.customerId !== `string` || !customerIdPattern.test(shopper.customerId)) throw invalidResponse(`godaddy`);
      resolvedCustomerId = shopper.customerId;
    } catch {
      warnings.push(`${domains.length} GoDaddy Renewal Estimate(s) Unavailable — Customer ID Lookup Failed; Add GODADDY_CUSTOMER_ID Or Enable Shopper Read Access`);
      return { domains, warnings };
    }
  }
  if (!customerIdPattern.test(resolvedCustomerId)) {
    warnings.push(`${domains.length} GoDaddy Renewal Estimate(s) Unavailable — GODADDY_CUSTOMER_ID Must Be A Customer UUID`);
    return { domains, warnings };
  }
  let failed = 0;
  let limited = 0;
  let unavailable = 0;
  let stopReason = ``;
  let requestStartedAt = Date.now();
  const headers = { Accept: `application/json`, Authorization: authorization };
  for (const [index, domain] of domains.entries()) {
    const delay = Math.max(0, RENEWAL_INTERVAL - (Date.now() - requestStartedAt));
    if (index >= MAX_RENEWAL_READS || context.signal.aborted || Date.now() + delay + RENEWAL_REQUEST_RESERVE >= context.deadline) {
      limited = domains.length - index;
      stopReason = index >= MAX_RENEWAL_READS ? `120 Domain Read Limit` : `Sync Time Limit Or Cancellation`;
      break;
    }
    try {
      if (delay) await pauseRequests(delay, context);
      requestStartedAt = Date.now();
      const url = new URL(`https://api.godaddy.com/v2/customers/${resolvedCustomerId}/domains/${domain.name}`);
      const text = await requestRegistrar(url, headers, context);
      const estimate = readRenewalEstimate(text, domain.name);
      if (estimate) domain.renewalEstimate = estimate;
      else unavailable++;
    } catch (failure) {
      failed++;
      const status = failure instanceof RegistrarRelayError ? failure.status : undefined;
      if (status === 401 || status === 403 || status === 429 || status === 504 || context.signal.aborted) {
        limited = domains.length - index - 1;
        stopReason = status === 429 ? `Rate Limit Reached` : status === 401 || status === 403 ? `Renewal Read Access Unavailable` : `Sync Time Limit Or Cancellation`;
        break;
      }
    }
  }
  if (failed) warnings.push(`${failed} GoDaddy Renewal Estimate Read(s) Failed${stopReason ? ` — ${stopReason}` : ``}`);
  if (unavailable) warnings.push(`${unavailable} GoDaddy Domain(s) Have No Available Renewal Estimate`);
  if (limited) warnings.push(`${limited} GoDaddy Renewal Estimate(s) Not Checked — ${stopReason}`);
  return { domains, warnings };
};

export const getGoDaddyDomains = async (
  authorization: string,
  context: RegistrarRequestContext,
  customerId?: string,
  lookupAuthorization?: string,
): Promise<RegistrarSyncResult> => {
  let marker = ``;
  const seen = new Set<string>();
  const domains: RegistrarDomain[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = new URL(`https://api.godaddy.com/v1/domains`);
    url.searchParams.set(`limit`, String(PAGE_SIZE));
    if (marker) url.searchParams.set(`marker`, marker);
    const text = await requestRegistrar(url, { Accept: `application/json`, Authorization: authorization }, context);
    const response = parseJson(text, `godaddy`);
    if (!Array.isArray(response) || response.length > PAGE_SIZE) throw invalidResponse(`godaddy`);
    const incoming = response.map(normalizeDomain);
    appendDomains(domains, incoming, `godaddy`, seen);
    if (incoming.length < PAGE_SIZE) return enrichRenewalEstimates(domains, authorization, context, customerId, lookupAuthorization);
    const nextMarker = incoming[incoming.length - 1]?.name;
    if (!nextMarker || nextMarker === marker) throw invalidResponse(`godaddy`);
    marker = nextMarker;
  }
  throw new RegistrarRelayError(422, `GoDaddy Pagination Exceeds The Sync Limit`);
};
