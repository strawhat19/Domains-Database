import { XMLParser } from 'fast-xml-parser';
import { SyntaxValidator } from 'fast-xml-validator';
import { selectRegistrarDetails } from './detailSelection';
import { invalidResponse, RegistrarRelayError } from './errors';
import type { RegistrarCredentials } from './credentials';
import { pauseRequests, requestRegistrar, type RegistrarRequestContext } from './request';
import type { RegistrarDomain, RegistrarDetailSelection, RegistrarSyncResult } from '../../shared/registrarSync/types';
import {
  asRecord, MAX_PAGES, MAX_DOMAINS, appendDomains, providerId, providerName,
  providerDate, optionalText, providerBoolean, providerInteger,
} from './validation';

const PAGE_SIZE = 100;
const MAX_DNS_READS = 30;
const DNS_INTERVAL = 1600;
const DNS_TIME_LIMIT = 65_000;
const DNS_REQUEST_RESERVE = 15_000;
const PRICING_COMMAND = `namecheap.users.getPricing`;
const INVENTORY_COMMAND = `namecheap.domains.getList`;
const NAMESERVERS_COMMAND = `namecheap.domains.dns.getList`;
const CONTACTS_COMMAND = `namecheap.domains.getContacts`;
const parser = new XMLParser({
  parseTagValue: false,
  ignoreAttributes: false,
  removeNSPrefix: true,
  processEntities: false,
  attributeNamePrefix: ``,
  parseAttributeValue: false,
  isArray: (tag, _path, _isLeaf, isAttribute) => !isAttribute && [`Domain`, `Error`].includes(tag),
});

const xmlError = (response: Record<string, unknown>, command: string) => {
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
  if (command === NAMESERVERS_COMMAND) return new RegistrarRelayError(502, `Namecheap Could Not Read Nameservers For This Domain`);
  if (command === CONTACTS_COMMAND) return new RegistrarRelayError(502, `Namecheap Could Not Read Registrant For This Domain`);
  return new RegistrarRelayError(403, `Namecheap Requires Valid Credentials, Enabled API Access, And A Whitelisted Server IPv4`);
};

const parseCommand = (text: string, commandName: string) => {
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
  const failure = xmlError(response, commandName);
  if (failure) throw failure;
  if (response.Status !== `OK`) throw invalidResponse(`namecheap`);
  const command = asRecord(response.CommandResponse, `namecheap`);
  if (typeof command.Type !== `string` || command.Type.toLowerCase() !== commandName.toLowerCase()) throw invalidResponse(`namecheap`);
  return command;
};

const parseResponse = (text: string) => {
  const command = parseCommand(text, INVENTORY_COMMAND);
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
  const premium = typeof record.IsPremium === `string` && /^(?:true|false)$/i.test(record.IsPremium)
    ? record.IsPremium.toLowerCase() === `true` : undefined;
  const usesProviderDns = typeof record.IsOurDNS === `string` && /^(?:true|false)$/i.test(record.IsOurDNS)
    ? record.IsOurDNS.toLowerCase() === `true` : undefined;
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
    meta: {
      source: `Namecheap Registration API`,
      ...(premium !== undefined ? { premium } : {}),
      ...(usesProviderDns !== undefined ? { usesProviderDns } : {}),
    },
  };
};

const getNamecheap = async (
  credentials: Extract<RegistrarCredentials, { provider: `namecheap` }>,
  context: RegistrarRequestContext,
  command: string,
  parameters: Record<string, string>,
) => {
  const url = new URL(`https://api.namecheap.com/xml.response`);
  Object.entries({
    ...parameters,
    Command: command,
    ApiKey: credentials.apiKey,
    ApiUser: credentials.username,
    UserName: credentials.username,
    ClientIp: credentials.clientIp,
  }).forEach(([key, value]) => url.searchParams.set(key, value));
  return requestRegistrar(url, { Accept: `application/xml` }, context);
};

const asList = (value: unknown) => value == null || value === `` ? [] : Array.isArray(value) ? value : [value];

const enrichNamecheapDetails = async (
  domains: readonly RegistrarDomain[],
  credentials: Extract<RegistrarCredentials, { provider: `namecheap` }>,
  context: RegistrarRequestContext,
) => {
  const deadline = Math.min(context.deadline, Date.now() + DNS_TIME_LIMIT);
  const dnsContext = { ...context, deadline };
  let attempted = 0;
  let failed = 0;
  let contactsAttempted = 0;
  let contactsFailed = 0;
  let requestStartedAt = Date.now();
  const canStart = () => !context.signal.aborted && Date.now() + DNS_INTERVAL + DNS_REQUEST_RESERVE < deadline;
  const start = async () => {
    const delay = Math.max(0, DNS_INTERVAL - (Date.now() - requestStartedAt));
    if (delay) await pauseRequests(delay, dnsContext);
    requestStartedAt = Date.now();
  };
  const blocked = (failure: unknown) => context.signal.aborted
    || failure instanceof RegistrarRelayError && [401, 403, 429, 504].includes(failure.status);
  for (const domain of domains.slice(0, MAX_DNS_READS)) {
    if (!canStart()) break;
    let nameserversChecked = false;
    try {
      await start();
      attempted++;
      domain.detailsAttemptedAt = new Date(requestStartedAt).toISOString();
      const dot = domain.name.indexOf(`.`);
      const text = await getNamecheap(credentials, dnsContext, NAMESERVERS_COMMAND, {
        SLD: domain.name.slice(0, dot), TLD: domain.name.slice(dot + 1),
      });
      const command = parseCommand(text, NAMESERVERS_COMMAND);
      const result = asRecord(command.DomainDNSGetListResult, `namecheap`);
      if (providerName(result.Domain, `namecheap`) !== domain.name) throw invalidResponse(`namecheap`);
      const entries = asList(result.Nameserver);
      if (!entries.length || entries.length > 32) throw invalidResponse(`namecheap`);
      const usesDefaultNameservers = providerBoolean(result.IsUsingOurDNS, `namecheap`, true);
      domain.nameservers = [...new Set(entries.map(server => providerName(server, `namecheap`)))];
      if (usesDefaultNameservers !== undefined) domain.meta = { ...domain.meta, usesDefaultNameservers };
      nameserversChecked = true;
    } catch (failure) {
      failed++;
      if (blocked(failure)) break;
    }
    if (domain.name.length <= 70) {
      if (!canStart()) break;
      try {
        await start();
        contactsAttempted++;
        const text = await getNamecheap(credentials, dnsContext, CONTACTS_COMMAND, { DomainName: domain.name });
        const result = asRecord(parseCommand(text, CONTACTS_COMMAND).DomainContactsResult, `namecheap`);
        if (providerName(result.Domain, `namecheap`) !== domain.name
          || providerId(result.domainnameid ?? result.DomainnameID, `namecheap`) !== domain.providerId) throw invalidResponse(`namecheap`);
        const contact = asRecord(result.Registrant, `namecheap`);
        const first = optionalText(contact.FirstName, `namecheap`);
        const last = optionalText(contact.LastName, `namecheap`);
        const email = optionalText(contact.EmailAddress, `namecheap`, 254);
        const country = optionalText(contact.Country, `namecheap`, 2);
        const organization = optionalText(contact.OrganizationName, `namecheap`, 200);
        const name = [first, last].filter(Boolean).join(` `);
        domain.registrant = { ...(name ? { name } : {}), ...(email ? { email } : {}),
          ...(country && /^[a-z]{2}$/i.test(country) ? { country: country.toUpperCase() } : {}), ...(organization ? { organization } : {}) };
      } catch (failure) {
        contactsFailed++;
        if (blocked(failure)) break;
        continue;
      }
    }
    if (nameserversChecked) domain.detailsCheckedAt = new Date().toISOString();
  }
  const warnings: string[] = [];
  const contactsEligible = domains.filter(domain => domain.name.length <= 70).length;
  if (failed) warnings.push(`${failed} Namecheap Nameserver Read(s) Unavailable`);
  if (attempted < domains.length) warnings.push(`${domains.length - attempted} Namecheap Nameserver Read(s) Deferred`);
  if (contactsFailed) warnings.push(`${contactsFailed} Namecheap Registrant Read(s) Unavailable`);
  if (contactsAttempted < contactsEligible) warnings.push(`${contactsEligible - contactsAttempted} Namecheap Registrant Read(s) Deferred`);
  return warnings;
};

const enrichRenewalEstimates = async (
  domains: RegistrarDomain[],
  credentials: Extract<RegistrarCredentials, { provider: `namecheap` }>,
  context: RegistrarRequestContext,
): Promise<RegistrarSyncResult> => {
  const standard = domains.filter(domain => domain.meta?.premium === false && domain.status === `Active`);
  if (!standard.length) return { domains };
  let updated = 0;
  try {
    const text = await getNamecheap(credentials, context, PRICING_COMMAND, {
      ActionName: `RENEW`, ProductType: `DOMAIN`, ProductCategory: `DOMAINS`,
    });
    const command = parseCommand(text, PRICING_COMMAND);
    const result = asRecord(command.UserGetPricingResult, `namecheap`);
    const types = asList(result.ProductType).map(value => asRecord(value, `namecheap`));
    const categories = types.filter(type => type.Name === `DOMAIN`).flatMap(type => asList(type.ProductCategory));
    const products = categories.map(value => asRecord(value, `namecheap`)).filter(category => category.Name === `RENEW`)
      .flatMap(category => asList(category.Product));
    const quotes = new Map<string, NonNullable<RegistrarDomain[`renewalEstimate`]>>();
    for (const value of products) {
      const product = asRecord(value, `namecheap`);
      if (typeof product.Name !== `string`) continue;
      const tld = product.Name.toLowerCase();
      for (const item of asList(product.Price)) {
        const quote = asRecord(item, `namecheap`);
        if (quote.DurationType !== `YEAR` || typeof quote.Duration !== `string` || !/^(?:[1-9]|10)$/.test(quote.Duration)
          || typeof quote.Price !== `string` || !/^\d{1,9}(?:\.\d{1,4})?$/.test(quote.Price)
          || typeof quote.Currency !== `string` || !/^[A-Z]{3}$/.test(quote.Currency)) continue;
        const years = Number(quote.Duration);
        const current = quotes.get(tld);
        if (current?.years && current.years <= years) continue;
        quotes.set(tld, { years, amount: Number(quote.Price), currency: quote.Currency });
      }
    }
    for (const domain of standard) {
      const estimate = quotes.get(domain.name.slice(domain.name.indexOf(`.`) + 1));
      if (!estimate) continue;
      domain.renewalEstimate = estimate;
      updated++;
    }
  } catch {
    return { domains, warnings: [`Namecheap Renewal Catalog Unavailable — Registration Inventory Synced`] };
  }
  return { domains, warnings: updated === standard.length ? [] : [`${standard.length - updated} Namecheap Standard Renewal Estimate(s) Unavailable This Sync`] };
};

export const getNamecheapDomains = async (
  credentials: Extract<RegistrarCredentials, { provider: `namecheap` }>,
  context: RegistrarRequestContext,
  detailSelection?: RegistrarDetailSelection,
): Promise<RegistrarSyncResult> => {
  let expectedTotal: number | undefined;
  let expectedSize: number | undefined;
  const seen = new Set<string>();
  const domains: RegistrarDomain[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    if (page > 1) await pauseRequests(1250, context);
    const text = await getNamecheap(credentials, context, INVENTORY_COMMAND, {
      ListType: `ALL`,
      SortBy: `NAME`,
      Page: String(page),
      PageSize: String(PAGE_SIZE),
    });
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
    if (domains.length === result.total) {
      const pricing = await enrichRenewalEstimates(domains, credentials, context);
      const candidates = selectRegistrarDetails(domains.filter(domain => domain.status === `Active`
        && domain.name.slice(domain.name.indexOf(`.`) + 1).length <= 10), detailSelection);
      const warnings = await enrichNamecheapDetails(candidates, credentials, context);
      return { domains, warnings: [...(pricing.warnings ?? []), ...warnings] };
    }
    if (incoming.length !== result.size) throw invalidResponse(`namecheap`);
  }
  throw new RegistrarRelayError(422, `Namecheap Pagination Exceeds The Sync Limit`);
};
