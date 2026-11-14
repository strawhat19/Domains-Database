import { domainToUnicode } from 'node:url';
import { selectRegistrarDetails } from './detailSelection';
import { invalidResponse, RegistrarRelayError } from './errors';
import { pauseRequests, requestRegistrar, type RegistrarRequestContext } from './request';
import { normalizeGoDaddyLifecycleActions } from '../../shared/registrarSync/godaddyActions';
import type { RegistrarDomain, RegistrarSyncResult, RegistrarDetailSelection } from '../../shared/registrarSync/types';
import {
  asRecord, parseJson, MAX_PAGES, optionalText, appendDomains, providerId, providerName,
  providerDate, providerBoolean, providerStatus,
} from './validation';

const PAGE_SIZE = 1000;
const MAX_DETAIL_READS = 120;
const DETAIL_INTERVAL = 1000;
const DETAIL_REQUEST_RESERVE = 15_000;
const customerIdPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const icannVerificationStatuses = [`PENDING`, `COMPLETED`, `UNABLE_TO_RETRIEVE_STATUS`];
const registrationVerificationStatuses = [`PENDING`, `APPROVED`, `REJECTED`, `UNABLE_TO_RETRIEVE_STATUS`];
const realNameRejections = new Set([
  `REJECTED_UNABLE_TO_OPEN`, `REJECTED_UNKNOWN_ERROR`, `REJECTED_INVALID_DOCUMENT`,
  `REJECTED_UNABLE_TO_VERIFY`, `REJECTED_DOCUMENT_OUTDATED`, `REJECTED_MISMATCH_BUSINESS_ID`,
  `REJECTED_MISMATCH_DOCUMENT_ID`, `REJECTED_MISMATCH_BUSINESS_NAME`, `REJECTED_MISMATCH_DOCUMENT_NAME`,
  `REJECTED_MISMATCH_DOCUMENT_TYPE`, `REJECTED_EXPIRED_BUSINESS_LICENSE`, `REJECTED_EXPIRED_ORGANIZATION_CODE`,
  `REJECTED_MISMATCH_REGISTRANT_INFO`, `REJECTED_MISMATCH_REGISTRANT_NAME`, `REJECTED_ILLEGIBLE_DOCUMENT_NAME`,
  `REJECTED_ILLEGIBLE_IDENTIFICATION`, `REJECTED_MISMATCH_REGISTRANT_LOCALITY`, `REJECTED_INCONSISTENT_IDENTITY_CARD`,
  `REJECTED_INCONSISTENT_REGISTRANT_NAME`, `REJECTED_INCOMPLETE_IDENTIFICATION`, `REJECTED_INCONSISTENT_ORGANIZATION_CODE`,
  `REJECTED_INCOMPLETE_REGISTRATION_LETTER`, `REJECTED_INVALID_BUSINESS_LICENSE_OR_ORGANIZATION_CODE`,
]);

const readOptional = <T>(value: unknown, read: (value: unknown, provider: `godaddy`) => T): T | undefined => {
  if (value == null) return undefined;
  try { return read(value, `godaddy`); }
  catch { return undefined; }
};

const readRegistrant = (value: unknown, preservePartialName = false): RegistrarDomain[`registrant`] => {
  const record = readOptional(value, asRecord);
  if (!record || record._deleted === true) return undefined;
  const address = readOptional(record.addressMailing, asRecord);
  const firstName = readOptional(record.nameFirst, optionalText);
  const lastName = readOptional(record.nameLast, optionalText);
  const middleName = readOptional(record.nameMiddle, optionalText);
  const name = preservePartialName && (!firstName || !lastName) ? `` : [firstName, middleName, lastName].filter(Boolean).join(` `);
  const email = readOptional(record.email, (email, provider) => optionalText(email, provider, 254));
  const country = readOptional(address?.country, optionalText)?.toUpperCase();
  const organization = readOptional(record.organization, (organization, provider) => optionalText(organization, provider, 200));
  return {
    ...(name ? { name } : {}),
    ...(country && /^[A-Z]{2}$/.test(country) ? { country } : {}),
    ...(email && /^[^\s@]+@[^\s@]+$/.test(email) ? { email } : {}),
    ...(organization ? { organization } : {}),
  };
};

const readHostnames = (value: unknown) => {
  if (!Array.isArray(value) || value.length > 64) return undefined;
  const hostnames = value.map(host => readOptional(host, providerName));
  if (!hostnames.every((host): host is string => host !== undefined)) return undefined;
  return [...new Set(hostnames)];
};

const readRegistrarDetails = (record: Record<string, unknown>) => {
  const details: NonNullable<RegistrarDomain[`meta`]> = {};
  for (const field of [`deletedAt`, `renewDeadline`, `registrarCreatedAt`, `transferAwayEligibleAt`] as const) {
    const value = readOptional(record[field], providerDate);
    if (value !== undefined) details[field] = value;
  }
  for (const field of [`renewable`, `exposeWhois`, `holdRegistrar`, `transferProtected`, `expirationProtected`] as const) {
    const value = readOptional(record[field], providerBoolean);
    if (value !== undefined) details[field] = value;
  }
  const renewal = readOptional(record.renewal, asRecord);
  const renewable = readOptional(renewal?.renewable, providerBoolean);
  if (renewable !== undefined) details.renewable = renewable;
  if (Array.isArray(record.registryStatusCodes) && record.registryStatusCodes.length <= 64) {
    const statuses = record.registryStatusCodes.map(status => readOptional(status, providerStatus));
    if (statuses.every((status): status is string => status !== undefined)) details.registryStatusCodes = [...new Set(statuses)];
  }
  return details;
};

const normalizeDomain = (value: unknown): RegistrarDomain => {
  const record = asRecord(value, `godaddy`);
  const status = providerStatus(record.status, `godaddy`);
  if (!status) throw invalidResponse(`godaddy`);
  const name = providerName(record.domain, `godaddy`);
  const unicodeName = domainToUnicode(name);
  const registrant = readRegistrant(record.contactRegistrant);
  const registrarDetails = readRegistrarDetails(record);
  return {
    name,
    status,
    registrar: `GoDaddy`,
    locked: providerBoolean(record.locked, `godaddy`),
    privacy: providerBoolean(record.privacy, `godaddy`),
    providerId: providerId(record.domainId, `godaddy`),
    autoRenew: providerBoolean(record.renewAuto, `godaddy`),
    createdAt: providerDate(record.createdAt, `godaddy`),
    expiresAt: providerDate(record.expires, `godaddy`, true),
    nameservers: readHostnames(record.nameServers),
    internationalName: unicodeName && unicodeName !== name ? unicodeName : undefined,
    ...(registrant && Object.keys(registrant).length ? { registrant } : {}),
    ...(Object.keys(registrarDetails).length ? { meta: { registrarDetails } } : {}),
  };
};

const readRenewalEstimate = (detail: Record<string, unknown>): RegistrarDomain[`renewalEstimate`] => {
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

const readDnssec = (value: unknown) => {
  if (!Array.isArray(value) || value.length > 64) return undefined;
  if (!value.length) return false;
  return value.some(item => {
    const entry = readOptional(item, asRecord);
    return Boolean(readOptional(entry?.digest, optionalText) || readOptional(entry?.publicKey, (key, provider) => optionalText(key, provider, 4096)));
  }) ? true : undefined;
};

const requireMatchingDetail = (domain: RegistrarDomain, detail: Record<string, unknown>) => {
  if (providerName(detail.domain, `godaddy`) !== domain.name) throw invalidResponse(`godaddy`);
  const rawId = detail.domainId;
  if (typeof rawId === `number` || typeof rawId === `string` && /^\d+$/.test(rawId)) {
    if (providerId(rawId, `godaddy`) !== domain.providerId) throw invalidResponse(`godaddy`);
  }
};

const applyDomainDetail = (domain: RegistrarDomain, detail: Record<string, unknown>) => {
  const contacts = readOptional(detail.contacts, asRecord);
  const contact = readOptional(contacts?.registrant, asRecord);
  const registrant = readRegistrant(contact, Boolean(domain.registrant?.name));
  const registrarDetails = readRegistrarDetails(detail);
  const lifecycleActions = normalizeGoDaddyLifecycleActions(detail.actions);
  if (lifecycleActions !== undefined) registrarDetails.lifecycleActions = lifecycleActions;
  const verifications = readOptional(detail.verifications, asRecord);
  const icann = icannVerificationStatuses.find(status => status === verifications?.icann);
  const domainName = registrationVerificationStatuses.find(status => status === verifications?.domainName);
  const realName = typeof verifications?.realName === `string` && realNameRejections.has(verifications.realName)
    ? `REJECTED` : registrationVerificationStatuses.find(status => status === verifications?.realName);
  const hosts = readHostnames(detail.hostnames);
  if (icann) registrarDetails.icannVerification = icann;
  if (realName) registrarDetails.realNameVerification = realName;
  if (domainName) registrarDetails.domainNameVerification = domainName;
  if (hosts?.every(host => host.endsWith(`.${domain.name}`))) registrarDetails.registeredHostnames = hosts;
  if (contact?._deleted !== true) {
    for (const field of [`exposeWhois`, `exposeRegistrantOrganization`] as const) {
      const value = readOptional(contact?.[field], providerBoolean);
      if (value !== undefined) registrarDetails[field] = value;
    }
  }
  domain.dnssec = readDnssec(detail.dnssecRecords);
  domain.status = readOptional(detail.status, providerStatus) ?? domain.status;
  domain.locked = readOptional(detail.locked, providerBoolean) ?? domain.locked;
  domain.privacy = readOptional(detail.privacy, providerBoolean) ?? domain.privacy;
  domain.autoRenew = readOptional(detail.renewAuto, providerBoolean) ?? domain.autoRenew;
  domain.createdAt = readOptional(detail.createdAt, providerDate) ?? domain.createdAt;
  domain.expiresAt = readOptional(detail.expiresAt, (value, provider) => providerDate(value, provider, true)) ?? domain.expiresAt;
  domain.updatedAt = readOptional(detail.modifiedAt, providerDate);
  domain.nameservers = readHostnames(detail.nameServers) ?? domain.nameservers;
  if (registrant && Object.keys(registrant).length) domain.registrant = { ...domain.registrant, ...registrant };
  if (Object.keys(registrarDetails).length) {
    const previous = domain.meta?.registrarDetails;
    const saved = previous && typeof previous === `object` && !Array.isArray(previous) ? previous : {};
    domain.meta = { ...domain.meta, registrarDetails: { ...saved, ...registrarDetails } };
  }
};

const enrichDomainDetails = async (
  domains: RegistrarDomain[],
  candidates: readonly RegistrarDomain[],
  authorization: string,
  context: RegistrarRequestContext,
  customerId?: string,
  lookupAuthorization?: string,
  shopperId?: string,
): Promise<RegistrarSyncResult> => {
  if (!candidates.length) return { domains };
  const warnings: string[] = [];
  let resolvedCustomerId = customerId;
  if (!resolvedCustomerId) {
    try {
      const url = new URL(`https://api.godaddy.com/v1/shoppers/${shopperId ?? `MY`}`);
      url.searchParams.set(`includes`, `customerId`);
      const headers = { Accept: `application/json`, Authorization: lookupAuthorization ?? authorization };
      const text = await requestRegistrar(url, headers, context);
      const shopper = asRecord(parseJson(text, `godaddy`), `godaddy`);
      if (typeof shopper.customerId !== `string` || !customerIdPattern.test(shopper.customerId)) throw invalidResponse(`godaddy`);
      resolvedCustomerId = shopper.customerId;
    } catch {
      warnings.push(`${candidates.length} GoDaddy Domain Detail(s) Unavailable — Customer ID Lookup Failed; Check Your Customer UUID Or Shopper ID And Shopper Read Access`);
      return { domains, warnings };
    }
  }
  if (!customerIdPattern.test(resolvedCustomerId)) {
    warnings.push(`${candidates.length} GoDaddy Domain Detail(s) Unavailable — GODADDY_CUSTOMER_ID Must Be A Customer UUID`);
    return { domains, warnings };
  }
  let failed = 0;
  let limited = 0;
  let unavailable = 0;
  let invalidEstimates = 0;
  let stopReason = ``;
  let requestStartedAt = Date.now();
  const headers = { Accept: `application/json`, Authorization: authorization };
  for (const [index, domain] of candidates.entries()) {
    const delay = Math.max(0, DETAIL_INTERVAL - (Date.now() - requestStartedAt));
    if (index >= MAX_DETAIL_READS || context.signal.aborted || Date.now() + delay + DETAIL_REQUEST_RESERVE >= context.deadline) {
      limited = candidates.length - index;
      stopReason = index >= MAX_DETAIL_READS ? `${MAX_DETAIL_READS} Domain Read Limit` : `Sync Time Limit Or Cancellation`;
      break;
    }
    try {
      if (delay) await pauseRequests(delay, context);
      requestStartedAt = Date.now();
      domain.detailsAttemptedAt = new Date(requestStartedAt).toISOString();
      const url = new URL(`https://api.godaddy.com/v2/customers/${resolvedCustomerId}/domains/${domain.name}`);
      url.searchParams.set(`includes`, `actions,contacts,dnssecRecords,registryStatusCodes`);
      const text = await requestRegistrar(url, headers, context);
      const detail = asRecord(parseJson(text, `godaddy`), `godaddy`);
      requireMatchingDetail(domain, detail);
      applyDomainDetail(domain, detail);
      try {
        const estimate = readRenewalEstimate(detail);
        if (estimate) domain.renewalEstimate = estimate;
        else unavailable++;
        domain.detailsCheckedAt = new Date().toISOString();
      } catch { invalidEstimates++; }
    } catch (failure) {
      failed++;
      const status = failure instanceof RegistrarRelayError ? failure.status : undefined;
      if (status === 401 || status === 403 || status === 429 || status === 504 || context.signal.aborted) {
        limited = candidates.length - index - 1;
        stopReason = status === 429 ? `Rate Limit Reached` : status === 401 || status === 403 ? `Domain Detail Access Unavailable` : `Sync Time Limit Or Cancellation`;
        break;
      }
    }
  }
  if (failed) warnings.push(`${failed} GoDaddy Domain Detail Read(s) Failed${stopReason ? ` — ${stopReason}` : ``}`);
  if (invalidEstimates) warnings.push(`${invalidEstimates} GoDaddy Domain(s) Returned An Invalid Renewal Estimate`);
  if (unavailable) warnings.push(`${unavailable} GoDaddy Domain(s) Have No Available Renewal Estimate`);
  if (limited) warnings.push(`${limited} GoDaddy Domain Detail(s) Not Checked — ${stopReason}`);
  return { domains, warnings };
};

export const getGoDaddyDomains = async (
  authorization: string,
  context: RegistrarRequestContext,
  customerId?: string,
  lookupAuthorization?: string,
  shopperId?: string,
  detailSelection?: RegistrarDetailSelection,
): Promise<RegistrarSyncResult> => {
  let marker = ``;
  let includeDetails = true;
  const seen = new Set<string>();
  const domains: RegistrarDomain[] = [];
  const headers = { Accept: `application/json`, Authorization: authorization };
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = new URL(`https://api.godaddy.com/v1/domains`);
    url.searchParams.set(`limit`, String(PAGE_SIZE));
    if (marker) url.searchParams.set(`marker`, marker);
    if (includeDetails) url.searchParams.set(`includes`, `nameServers,contacts`);
    const text = await requestRegistrar(url, headers, context).catch(failure => {
      if (!includeDetails || !(failure instanceof RegistrarRelayError) || ![403, 502].includes(failure.status)) throw failure;
      includeDetails = false;
      url.searchParams.delete(`includes`);
      return requestRegistrar(url, headers, context);
    });
    const response = parseJson(text, `godaddy`);
    if (!Array.isArray(response) || response.length > PAGE_SIZE) throw invalidResponse(`godaddy`);
    const incoming = response.map(normalizeDomain);
    appendDomains(domains, incoming, `godaddy`, seen);
    if (incoming.length < PAGE_SIZE) {
      const candidates = selectRegistrarDetails(domains, detailSelection);
      const result = await enrichDomainDetails(domains, candidates, authorization, context, customerId, lookupAuthorization, shopperId);
      if (!includeDetails) result.warnings = [`GoDaddy Inventory Details Expansion Unavailable`, ...(result.warnings ?? [])];
      return result;
    }
    const nextMarker = asRecord(response.at(-1), `godaddy`).domain;
    if (typeof nextMarker !== `string` || nextMarker === marker) throw invalidResponse(`godaddy`);
    marker = nextMarker;
  }
  throw new RegistrarRelayError(422, `GoDaddy Pagination Exceeds The Sync Limit`);
};
