import { createHash } from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';
import { searchVercel } from './vercel';
import type { SearchCredentials } from './environment';
import { SyntaxValidator } from 'fast-xml-validator';
import { readLimitedText } from '../registrars/request';
import { registrarPurchaseUrl } from '../../shared/domainSearch/types';
import type { DomainSearchResult, DomainSearchPrice, DomainSearchProvider } from '../../shared/domainSearch/types';
import { providerLabels, upstreamError, RegistrarRelayError } from '../registrars/errors';

const invalid = () => new RegistrarRelayError(502, `Registrar Returned Invalid Availability Or Pricing`);
const hostingerPrices = new Map<string, { expiresAt: number; registration?: DomainSearchPrice; renewal?: DomainSearchPrice }>();
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== `object` || Array.isArray(value)) throw invalid();
  return value as Record<string, unknown>;
};
const list = (value: unknown): unknown[] => value == null || value === `` ? [] : Array.isArray(value) ? value : [value];
const amount = (value: unknown, maximum = 1_000_000_000): number | undefined => {
  if (value == null || value === ``) return undefined;
  if (typeof value !== `number` && (typeof value !== `string` || !/^\d+(?:\.\d+)?$/.test(value))) throw invalid();
  const result = Number(value);
  if (!Number.isFinite(result) || result < 0 || result > maximum) throw invalid();
  return result;
};
const years = (value: unknown): number | undefined => {
  if (value == null) return undefined;
  const result = amount(value);
  if (!result || !Number.isInteger(result) || result > 10) throw invalid();
  return result;
};
const price = (value: unknown, currency: unknown, period?: unknown, divisor = 1): DomainSearchPrice | undefined => {
  const cost = amount(value, 1_000_000_000 * divisor);
  if (cost === undefined) return undefined;
  if (divisor > 1 && !Number.isSafeInteger(cost)) throw invalid();
  if (typeof currency !== `string` || !/^(?:[A-Z]{3})?$/.test(currency)) throw invalid();
  return { amount: cost / divisor, currency, ...(period == null ? {} : { years: years(period) }) };
};

const requestSearch = async (provider: DomainSearchProvider, url: URL, signal: AbortSignal, init: RequestInit = {}) => {
  const method = init.method ?? `GET`;
  const allowed = provider === `godaddy` ? url.origin === `https://api.godaddy.com`
    && (url.pathname === `/v1/domains/available` && method === `GET`
      || url.pathname === `/v3/domains/check-availability` && (method === `GET` || method === `POST` && !url.search))
    : provider === `hostinger` ? url.origin === `https://developers.hostinger.com`
      && (url.pathname === `/api/domains/v1/availability` && method === `POST`
        || url.pathname === `/api/billing/v1/catalog` && method === `GET` && url.searchParams.get(`category`) === `DOMAIN`)
    : provider === `namecheap` ? url.origin === `https://api.namecheap.com` && url.pathname === `/xml.response` && [`namecheap.domains.check`, `namecheap.users.getPricing`].includes(url.searchParams.get(`Command`) ?? ``) && method === `GET`
    : provider === `namesilo` ? url.origin === `https://www.namesilo.com` && [`/apibatch/checkRegisterAvailability`, `/apibatch/getPrices`].includes(url.pathname) && method === `GET`
    : provider === `porkbun` && url.origin === `https://api.porkbun.com` && /^\/api\/json\/v3\/domain\/checkDomain\/[a-z0-9.-]+$/.test(url.pathname) && method === `POST`;
  if (!allowed || url.username || url.password || url.hash) throw invalid();
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener(`abort`, abort, { once: true });
  if (signal.aborted) abort();
  const timeout = setTimeout(abort, 20_000);
  try {
    const response = await fetch(url, { ...init, method, redirect: `error`, cache: `no-store`, credentials: `omit`, signal: controller.signal });
    if (!response.ok) { await response.body?.cancel(); throw upstreamError(provider, response.status); }
    const size = response.headers.get(`content-length`);
    if (size && Number(size) > 2 * 1024 * 1024) { await response.body?.cancel(); throw invalid(); }
    return await readLimitedText(response.body, 2 * 1024 * 1024, controller.signal, invalid());
  } catch (failure) {
    if (failure instanceof RegistrarRelayError) throw failure;
    throw new RegistrarRelayError(502, controller.signal.aborted ? `${providerLabels[provider]} Search Timed Out Or Cancelled` : `${providerLabels[provider]} Search Is Unavailable`);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener(`abort`, abort);
  }
};
const json = (text: string) => { try { return JSON.parse(text) as unknown; } catch { throw invalid(); } };
const xmlParser = new XMLParser({ parseTagValue: false, ignoreAttributes: false, removeNSPrefix: true, processEntities: false, attributeNamePrefix: ``, parseAttributeValue: false });
const namecheapCommand = (text: string, command: string) => {
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(text) || SyntaxValidator.validate(text) !== true) throw invalid();
  let value: unknown;
  try { value = xmlParser.parse(text); } catch { throw invalid(); }
  const response = record(record(value).ApiResponse);
  if (response.Status !== `OK`) throw new RegistrarRelayError(403, `Namecheap Requires Valid Credentials, API Access, And A Whitelisted Server IPv4`);
  const result = record(response.CommandResponse);
  if (result.Type !== command) throw invalid();
  return result;
};

const goDaddyResult = (result: Record<string, unknown>, domain: string, modern: boolean): Partial<DomainSearchResult> => {
  if (result.domain !== domain || typeof result.available !== `boolean`) throw invalid();
  if (!result.available) return { available: false, note: `GoDaddy Reports This Domain Unavailable` };
  if (!modern) return {
    available: result.available,
    registration: price(result.price, result.currency ?? ``, result.period, 1_000_000),
    note: `Indicative Prices Exclude Taxes And Fees — This GoDaddy API Does Not Supply Renewal Pricing; Confirm Checkout Pricing`,
  };
  const options = list(result.prices).map(record).filter(option => option.term === `YEAR`);
  options.sort((first, second) => (years(first.period) ?? 99) - (years(second.period) ?? 99));
  const option = options?.[0];
  const registration = option?.price ? record(option.price) : undefined;
  const renewal = option?.renewalPrice ? record(option.renewalPrice) : undefined;
  return {
    available: result.available,
    registration: registration ? price(registration.value, registration.currencyCode, option?.period, 100) : undefined,
    renewal: renewal ? price(renewal.value, renewal.currencyCode, option?.period, 100) : undefined,
    note: `Indicative GoDaddy API Prices — Retail Checkout Uses Standard Rates And May Differ; Taxes And Fees May Apply`,
  };
};

const goDaddy = async (auth: Extract<SearchCredentials, { provider: `godaddy` }>, domain: string, signal: AbortSignal) => {
  const modern = auth.authorization.startsWith(`Bearer `);
  const url = new URL(`https://api.godaddy.com/${modern ? `v3/domains/check-availability` : `v1/domains/available`}`);
  url.searchParams.set(`domain`, domain);
  if (modern) url.searchParams.set(`optimizeFor`, `ACCURACY`);
  const result = record(json(await requestSearch(`godaddy`, url, signal, { headers: { Authorization: auth.authorization, Accept: `application/json` } })));
  return goDaddyResult(result, domain, modern);
};

export const searchGoDaddyBatch = async (auth: Extract<SearchCredentials, { provider: `godaddy` }>, domains: string[], signal: AbortSignal) => {
  if (!auth.authorization.startsWith(`Bearer `)) throw new RegistrarRelayError(501, `GoDaddy Batch Search Requires A Personal Access Token`);
  const url = new URL(`https://api.godaddy.com/v3/domains/check-availability`);
  const response = record(json(await requestSearch(`godaddy`, url, signal, {
    method: `POST`,
    body: JSON.stringify({ domains }),
    headers: { Authorization: auth.authorization, Accept: `application/json`, 'Content-Type': `application/json` },
  })));
  const items = response.items;
  if (!Array.isArray(items) || items.length !== domains.length) throw invalid();
  return domains.map((domain, index): DomainSearchResult => {
    const base = { domain, label: `GoDaddy`, provider: `godaddy` as const, purchaseUrl: registrarPurchaseUrl(`godaddy`, domain) };
    try {
      const result = record(items[index]);
      if (result.error == null) return { ...base, ...goDaddyResult(result, domain, true) };
    } catch { return { ...base, error: `GoDaddy Returned Invalid Availability Or Pricing` }; }
    return { ...base, error: `GoDaddy Could Not Check This Domain` };
  });
};

const hostingerCatalogPrices = async (tld: string, headers: Record<string, string>, signal: AbortSignal) => {
  const key = createHash(`sha256`).update(JSON.stringify([headers.Authorization, tld])).digest(`hex`);
  const saved = hostingerPrices.get(key);
  if (saved && saved.expiresAt > Date.now()) return { renewal: saved.renewal, registration: saved.registration };
  const url = new URL(`https://developers.hostinger.com/api/billing/v1/catalog`);
  url.searchParams.set(`category`, `DOMAIN`);
  url.searchParams.set(`name`, `.${tld.toUpperCase()}*`);
  const catalog = json(await requestSearch(`hostinger`, url, signal, { headers }));
  if (!Array.isArray(catalog) || catalog.length > 500) throw invalid();
  const items = catalog.map(record).filter(item => {
    if (item.category !== `DOMAIN` || typeof item.name !== `string`) return false;
    return item.name.trim().toLowerCase() === `.${tld} domain`;
  });
  const item = items.length === 1 ? items[0] : undefined;
  if (!Array.isArray(item?.prices) || item.prices.length > 100) return undefined;
  const options = item.prices.map(record).filter(option => option.period_unit === `year`
    && typeof option.period === `number` && Number.isInteger(option.period) && option.period >= 1 && option.period <= 10);
  options.sort((first, second) => Number(first.period) - Number(second.period));
  const option = options[0];
  if (!option || options[1]?.period === option.period || typeof option.currency !== `string` || !/^[A-Z]{3}$/.test(option.currency)
    || typeof option.first_period_price !== `number` || typeof option.price !== `number` || option.price <= 0) return undefined;
  const result = {
    renewal: price(option.price, option.currency, option.period, 100),
    registration: price(option.first_period_price, option.currency, option.period, 100),
  };
  hostingerPrices.delete(key);
  if (hostingerPrices.size >= 128) {
    const oldest = hostingerPrices.keys().next().value;
    if (oldest) hostingerPrices.delete(oldest);
  }
  hostingerPrices.set(key, { ...result, expiresAt: Date.now() + 5 * 60_000 });
  return result;
};

const hostinger = async (auth: Extract<SearchCredentials, { provider: `hostinger` }>, domain: string, signal: AbortSignal): Promise<Partial<DomainSearchResult>> => {
  const dot = domain.indexOf(`.`);
  const tld = domain.slice(dot + 1);
  const headers = { Authorization: auth.authorization, Accept: `application/json`, 'Content-Type': `application/json` };
  const text = await requestSearch(`hostinger`, new URL(`https://developers.hostinger.com/api/domains/v1/availability`), signal, {
    headers,
    method: `POST`,
    body: JSON.stringify({ domain: domain.slice(0, dot), tlds: [tld], with_alternatives: false }),
  });
  const items = json(text);
  if (!Array.isArray(items) || items.length > 100) throw invalid();
  const result = items.map(record).find(item => item.domain === domain && item.is_alternative !== true);
  if (!result || typeof result.is_available !== `boolean`) throw invalid();
  if (!result.is_available) return { available: false, note: `Hostinger Reports This Domain Unavailable` };
  if (result.is_premium === true) return { available: true, note: `Premium Domain — See Hostinger For Exact Registration And Renewal Prices` };
  const note = `Availability Checked — See Hostinger For Pricing And Registration Requirements`;
  if (result.is_premium !== false) return { note, available: true };
  try {
    const quote = await hostingerCatalogPrices(tld, headers, signal);
    if (quote) return { ...quote, available: true, note: `Hostinger Standard Extension Catalog Prices — Confirm Total And Registration Requirements At Checkout` };
  } catch {
    if (signal.aborted) throw new RegistrarRelayError(504, `Hostinger Search Timed Out Or Cancelled`);
  }
  return { note, available: true };
};

const porkbun = async (auth: Extract<SearchCredentials, { provider: `porkbun` }>, domain: string, signal: AbortSignal): Promise<Partial<DomainSearchResult>> => {
  const value = record(json(await requestSearch(`porkbun`, new URL(`https://api.porkbun.com/api/json/v3/domain/checkDomain/${domain}`), signal, {
    method: `POST`,
    headers: { 'Content-Type': `application/json` },
    body: JSON.stringify({ apikey: auth.apiKey, secretapikey: auth.secretKey }),
  })));
  if (value.code === `RATE_LIMIT_EXCEEDED`) throw upstreamError(`porkbun`, 429);
  if (value.status !== `SUCCESS`) throw new RegistrarRelayError(502, `Porkbun Could Not Check This Domain — Check API Access Or Try Later`);
  let retryAfterMs: number | undefined;
  if (value.limits != null) {
    const limits = record(value.limits);
    const used = limits.used;
    const limit = limits.limit;
    const window = limits.TTL;
    if (typeof used !== `number` || !Number.isSafeInteger(used) || used < 0
      || typeof limit !== `number` || !Number.isSafeInteger(limit) || limit < 1
      || typeof window !== `number` || !Number.isSafeInteger(window) || window < 1) throw invalid();
    if (used >= limit) {
      const remaining = value.ttlRemaining ?? window;
      if (typeof remaining !== `number` || !Number.isSafeInteger(remaining) || remaining < 0 || remaining > window) throw invalid();
      if (remaining > 300) throw upstreamError(`porkbun`, 429);
      retryAfterMs = remaining * 1_000;
    }
  }
  const result = record(value.response);
  if (![`yes`, `no`].includes(String(result.avail))) throw invalid();
  const additional = result.additional == null ? undefined : record(result.additional);
  const renewal = additional?.renewal == null ? undefined : record(additional.renewal);
  const available = result.avail === `yes`;
  const owned = result.inYourAccount === true;
  const minimum = years(result.minDuration);
  return {
    available,
    retryAfterMs,
    renewal: available || owned ? price(renewal?.price, `USD`, 1) : undefined,
    registration: available ? price(result.price, `USD`, 1) : undefined,
    note: available
      ? `Porkbun Prices Are Per Year${minimum ? ` — Minimum Registration ${minimum} Year(s)` : ``}${result.firstYearPromo === `yes` ? ` — First-Year Promotion` : ``} — Confirm Checkout Totals`
      : owned ? `Already Registered In This Porkbun Account — Confirm Renewal At Checkout` : `Porkbun Reports This Domain Unavailable`,
  };
};

const namesilo = async (auth: Extract<SearchCredentials, { provider: `namesilo` }>, domain: string, signal: AbortSignal): Promise<Partial<DomainSearchResult>> => {
  const url = new URL(`https://www.namesilo.com/apibatch/checkRegisterAvailability`);
  Object.entries({ key: auth.apiKey, version: `1`, type: `json`, domains: domain }).forEach(([key, value]) => url.searchParams.set(key, value));
  const reply = record(record(json(await requestSearch(`namesilo`, url, signal))).reply);
  if (Number(reply.code) !== 300) throw new RegistrarRelayError(502, `NameSilo Could Not Check This Domain — Check API Access Or Try Later`);
  const match = (items: unknown) => list(items).map((item): Record<string, unknown> => typeof item === `string` ? { domain: item } : record(item)).find(item => item.domain === domain);
  const available = match(reply.available);
  if (available) return { available: true, registration: price(available.price, ``, available.duration), note: `NameSilo Does Not Supply Currency In This Response — Confirm Currency And Checkout Totals${available.duration == null ? ` — Registration Duration Was Not Supplied` : ``}` };
  if (match(reply.unavailable)) return { available: false, note: `NameSilo Reports This Domain Unavailable` };
  return { note: `NameSilo Did Not Return A Definitive Availability Result — Check At The Registrar` };
};

const namecheap = async (auth: Extract<SearchCredentials, { provider: `namecheap` }>, domain: string, signal: AbortSignal): Promise<Partial<DomainSearchResult>> => {
  const call = async (command: string, fields: Record<string, string>) => {
    const url = new URL(`https://api.namecheap.com/xml.response`);
    Object.entries({ ...fields, Command: command, ApiKey: auth.apiKey, ApiUser: auth.username, UserName: auth.username, ClientIp: auth.clientIp }).forEach(([key, value]) => url.searchParams.set(key, value));
    return namecheapCommand(await requestSearch(`namecheap`, url, signal), command);
  };
  const check = await call(`namecheap.domains.check`, { DomainList: domain });
  const result = list(check.DomainCheckResult).map(record).find(item => String(item.Domain).toLowerCase() === domain);
  if (!result || ![`true`, `false`].includes(String(result.Available)) || Number(result.ErrorNo) !== 0) throw invalid();
  const available = result.Available === `true`;
  if (!available) return { available, note: `Namecheap Reports This Domain Unavailable` };
  const premium = typeof result.IsPremiumName === `string` ? result.IsPremiumName.toLowerCase() : undefined;
  if (premium === `true`) {
    let earlyAccessFee: number | undefined;
    try { earlyAccessFee = amount(result.EapFee); } catch { earlyAccessFee = undefined; }
    const earlyAccess = earlyAccessFee !== undefined && earlyAccessFee > 0;
    const feeUnknown = result.EapFee != null && result.EapFee !== `` && earlyAccessFee === undefined;
    return {
      available,
      renewal: price(result.PremiumRenewalPrice, ``),
      registration: earlyAccess || feeUnknown ? undefined : price(result.PremiumRegistrationPrice, ``),
      note: earlyAccess ? `Premium Early-Access Domain — Namecheap Requires An Additional Fee And Does Not Support Early-Access Registration Through Its API; Check Namecheap For The Full Price`
        : feeUnknown ? `Premium Domain — Namecheap Did Not Provide A Usable Early-Access Fee; Check Namecheap For The Full Price`
          : `Premium Domain — This Quote Omits Currency And Term; Confirm ICANN Fees And The Total At Checkout`,
    };
  }
  if (premium !== `false`) return { available, note: `Availability Checked — Namecheap Did Not Confirm Standard Or Premium Pricing` };
  let registration: DomainSearchPrice | undefined;
  let renewal: DomainSearchPrice | undefined;
  let note = `Indicative Prices Exclude Additional Fees And Taxes — Confirm Checkout Totals`;
  try {
    const tld = domain.slice(domain.indexOf(`.`) + 1);
    const findPrice = async (action: string) => {
      const command = await call(`namecheap.users.getPricing`, { ProductType: `DOMAIN`, ProductCategory: `DOMAINS`, ActionName: action, ProductName: tld });
      const pricing = record(command.UserGetPricingResult);
      for (const type of list(pricing.ProductType).map(record)) {
        for (const category of list(type.ProductCategory).map(record).filter(item => item.Name === action)) {
          for (const product of list(category.Product).map(record).filter(item => String(item.Name).toLowerCase() === tld)) {
            const options = list(product.Price).map(record).filter(item => item.DurationType === `YEAR`);
            options.sort((first, second) => (years(first.Duration) ?? 99) - (years(second.Duration) ?? 99));
            const quote = options?.[0];
            if (quote) return price(quote.Price, quote.Currency, quote.Duration);
          }
        }
      }
      return undefined;
    };
    const [registrationResult, renewalResult] = await Promise.allSettled([findPrice(`REGISTER`), findPrice(`RENEW`)]);
    registration = registrationResult.status === `fulfilled` ? registrationResult.value : undefined;
    renewal = renewalResult.status === `fulfilled` ? renewalResult.value : undefined;
    if (registrationResult.status === `rejected` || renewalResult.status === `rejected`) throw invalid();
  } catch {
    if (signal.aborted) throw new RegistrarRelayError(504, `Namecheap Search Timed Out Or Cancelled`);
    note = registration || renewal
      ? `Availability Checked — Some Namecheap Prices Were Unavailable; Confirm Remaining Prices At Checkout`
      : `Availability Checked — Namecheap Pricing Was Unavailable; See Registrar For Prices`;
  }
  return { available, registration, renewal, note };
};

export const searchRegistrar = async (auth: SearchCredentials, domain: string, signal: AbortSignal): Promise<DomainSearchResult> => {
  const result = auth.provider === `vercel` ? await searchVercel(domain, signal, auth)
    : auth.provider === `godaddy` ? await goDaddy(auth, domain, signal)
    : auth.provider === `hostinger` ? await hostinger(auth, domain, signal)
    : auth.provider === `namecheap` ? await namecheap(auth, domain, signal)
    : auth.provider === `porkbun` ? await porkbun(auth, domain, signal) : await namesilo(auth, domain, signal);
  return { ...result, domain, provider: auth.provider, label: providerLabels[auth.provider], purchaseUrl: registrarPurchaseUrl(auth.provider, domain) };
};
