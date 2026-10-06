import { XMLParser } from 'fast-xml-parser';
import { searchVercel } from './vercel';
import type { SearchCredentials } from './environment';
import { SyntaxValidator } from 'fast-xml-validator';
import { readLimitedText } from '../registrars/request';
import { registrarPurchaseUrl } from '../../shared/domainSearch/types';
import type { DomainSearchResult, DomainSearchPrice, DomainSearchProvider } from '../../shared/domainSearch/types';
import { providerLabels, upstreamError, RegistrarRelayError } from '../registrars/errors';

const invalid = () => new RegistrarRelayError(502, `Registrar Returned Invalid Availability Or Pricing`);
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
  const allowed = provider === `godaddy` ? url.origin === `https://api.godaddy.com` && [`/v1/domains/available`, `/v3/domains/check-availability`].includes(url.pathname) && method === `GET`
    : provider === `hostinger` ? url.origin === `https://developers.hostinger.com` && url.pathname === `/api/domains/v1/availability` && method === `POST`
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

const goDaddy = async (auth: Extract<SearchCredentials, { provider: `godaddy` }>, domain: string, signal: AbortSignal): Promise<Partial<DomainSearchResult>> => {
  const modern = auth.authorization.startsWith(`Bearer `);
  const url = new URL(`https://api.godaddy.com/${modern ? `v3/domains/check-availability` : `v1/domains/available`}`);
  url.searchParams.set(`domain`, domain);
  const result = record(json(await requestSearch(`godaddy`, url, signal, { headers: { Authorization: auth.authorization, Accept: `application/json` } })));
  if (result.domain !== domain || typeof result.available !== `boolean`) throw invalid();
  if (!modern) return {
    available: result.available,
    registration: price(result.price, result.currency ?? ``, result.period, 1_000_000),
    note: `Indicative Prices Exclude Taxes And Fees — This GoDaddy API Does Not Supply Renewal Pricing; Confirm Checkout Pricing`,
  };
  const options = list(result.prices).map(record).filter(option => option.term === `YEAR`);
  options.sort((first, second) => (years(first.period) ?? 99) - (years(second.period) ?? 99));
  const option = options?.[0];
  const registration = option?.price ? record(option.price) : undefined;
  const renewal = option?.renewalPrice ? record(option.renewalPrice) : result.available ? registration : undefined;
  return {
    available: result.available,
    registration: registration ? price(registration.value, registration.currencyCode, option?.period, 100) : undefined,
    renewal: renewal ? price(renewal.value, renewal.currencyCode, option?.period, 100) : undefined,
    note: `Indicative GoDaddy API Prices — Retail Checkout Uses Standard Rates And May Differ; Taxes And Fees May Apply`,
  };
};

const hostinger = async (auth: Extract<SearchCredentials, { provider: `hostinger` }>, domain: string, signal: AbortSignal): Promise<Partial<DomainSearchResult>> => {
  const dot = domain.indexOf(`.`);
  const text = await requestSearch(`hostinger`, new URL(`https://developers.hostinger.com/api/domains/v1/availability`), signal, {
    method: `POST`,
    headers: { Authorization: auth.authorization, 'Content-Type': `application/json` },
    body: JSON.stringify({ domain: domain.slice(0, dot), tlds: [domain.slice(dot + 1)], with_alternatives: false }),
  });
  const items = json(text);
  if (!Array.isArray(items) || items.length > 100) throw invalid();
  const result = items.map(record).find(item => item.domain === domain);
  if (!result || typeof result.is_available !== `boolean`) throw invalid();
  return { available: result.is_available, note: `Hostinger Returns Availability Without A Price — See Hostinger For Pricing And Registration Restrictions` };
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
  const minimum = years(result.minDuration);
  return {
    retryAfterMs,
    available: result.avail === `yes`,
    registration: price(result.price, `USD`, 1),
    renewal: price(renewal?.price, `USD`, 1),
    note: `Porkbun Prices Are Per Year${minimum ? ` — Minimum Registration ${minimum} Year(s)` : ``}${result.firstYearPromo === `yes` ? ` — First-Year Promotion` : ``} — Confirm Checkout Totals`,
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
    registration = await findPrice(`REGISTER`);
    renewal = await findPrice(`RENEW`);
  } catch {
    if (signal.aborted) throw new RegistrarRelayError(504, `Namecheap Search Timed Out Or Cancelled`);
    note = `Availability Checked — Namecheap Pricing Was Unavailable; See Registrar For Prices`;
  }
  if (result.IsPremiumName === `true`) {
    const currency = registration?.currency ?? renewal?.currency ?? ``;
    const renewalCurrency = renewal?.currency ?? currency;
    registration = price(result.PremiumRegistrationPrice, currency, 1);
    renewal = price(result.PremiumRenewalPrice, renewalCurrency, 1);
    note = `Premium Domain — Currency Uses The TLD Pricing Response When Available; Confirm All Fees And Pricing At Checkout`;
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
