import { readLimitedText } from '../registrars/request';
import { RegistrarRelayError } from '../registrars/errors';
import { asRecord, providerName } from '../registrars/validation';
import { getEnvironmentGoDaddyV3Authorization } from '../domainSearch/environment';
import type { ExternalMarketListing, ExternalMarketResult } from '../../shared/marketplace/externalListings';

const pageSize = 24;
const minute = 60_000;
const maxListings = 16;
const browseSeed = `technology business`;
const requestTimes: number[] = [];
const pending = new Map<string, Promise<ExternalMarketResult>>();
const cache = new Map<string, { expires: number; result: ExternalMarketResult }>();
let providerRetryAt = 0;

const unavailable = (message = `Afternic Premium Listings Are Temporarily Unavailable`): ExternalMarketResult => ({ status: `unavailable`, listings: [], message });
const busy: ExternalMarketResult = { status: `rate-limited`, listings: [], message: `Afternic Premium Search Is Busy — Try Again Shortly` };
const reply = (result: ExternalMarketResult, status = 200, retryAt = 0) => {
  const headers = new Headers({ 'Cache-Control': `no-store`, 'X-Content-Type-Options': `nosniff` });
  if (retryAt) headers.set(`Retry-After`, String(Math.max(1, Math.ceil((retryAt - Date.now()) / 1_000))));
  return Response.json(result, { headers, status });
};

const domainName = (input: unknown) => {
  try { return providerName(input, `godaddy`); }
  catch { return undefined; }
};

const record = (value: unknown) => value && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const cents = (value: unknown) => typeof value === `number` && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
const listingPrice = (prices: unknown): Pick<ExternalMarketListing, `currency` | `indicativeTotalCents`> => {
  const missing = { currency: null, indicativeTotalCents: null };
  const term = Array.isArray(prices) ? prices.map(record).find(option => option?.term === `YEAR` && option.period === 1) : undefined;
  const base = record(term?.price);
  const currency = base?.currencyCode;
  let total = cents(base?.value);
  const fees = term?.fees;
  if (typeof currency !== `string` || !/^[A-Z]{3}$/.test(currency) || total === undefined || !Array.isArray(fees)) return missing;
  let premium = false;
  for (const raw of fees) {
    const entry = record(raw);
    const fee = record(entry?.fee);
    const value = cents(fee?.value);
    if (typeof entry?.type !== `string` || value === undefined || fee?.currencyCode !== currency) return missing;
    if (entry.type === `ONE_TIME_PREMIUM_DOMAIN_PURCHASE`) {
      if (premium || value === 0) return missing;
      premium = true;
    }
    total += value;
  }
  return premium && Number.isSafeInteger(total) ? { currency, indicativeTotalCents: total } : missing;
};

const invalidResponse = () => new RegistrarRelayError(502, `GoDaddy Returned Invalid Premium Listings`);
const readListings = (value: unknown, exact?: string): ExternalMarketListing[] => {
  const root = asRecord(value, `godaddy`);
  if (exact && (domainName(root.domain) !== exact || typeof root.available !== `boolean`)) throw invalidResponse();
  const items = exact ? (root.available === true ? [root] : []) : root.items;
  if (!Array.isArray(items) || items.length > 50) throw invalidResponse();
  const listings = new Map<string, ExternalMarketListing>();
  for (const raw of items) {
    const item = record(raw);
    if (item?.inventory !== `PREMIUM` || item.available === false) continue;
    const domain = domainName(item.domain);
    if (!domain || listings.has(domain)) continue;
    listings.set(domain, { domain, ...listingPrice(item.prices) });
    if (listings.size >= maxListings) break;
  }
  return [...listings.values()];
};

const retryTime = (header: string | null) => {
  const now = Date.now();
  const seconds = header && /^\d+$/.test(header) ? Number(header) : undefined;
  const retryAt = seconds === undefined ? Date.parse(header ?? ``) : now + seconds * 1_000;
  return Number.isSafeInteger(retryAt) && retryAt > now ? retryAt : now + minute;
};

const discover = async (query: string, exact: string | undefined, authorization: string): Promise<ExternalMarketResult> => {
  const url = new URL(exact ? `https://api.godaddy.com/v3/domains/check-availability` : `https://api.godaddy.com/v3/domains/suggestions`);
  url.search = new URLSearchParams(exact ? { domain: exact } : { query, sources: `PREMIUM`, pageSize: String(pageSize) }).toString();
  const signal = AbortSignal.timeout(8_000);
  try {
    const headers = { Accept: `application/json`, Authorization: authorization };
    const response = await fetch(url, { headers, signal, cache: `no-store`, redirect: `error`, credentials: `omit` });
    if (!response.ok) {
      void response.body?.cancel().catch(() => undefined);
      if (response.status !== 429) return unavailable();
      providerRetryAt = Math.max(providerRetryAt, retryTime(response.headers.get(`Retry-After`)));
      return busy;
    }
    const body = await readLimitedText(response.body, 512 * 1024, signal, invalidResponse());
    return { status: `ready`, listings: readListings(JSON.parse(body) as unknown, exact) };
  } catch { return unavailable(); }
};

export const handleExternalMarket = async (request: Request): Promise<Response> => {
  const values = new URL(request.url).searchParams.getAll(`query`);
  const input = values?.[0] ?? ``;
  const invalidQuery = () => reply(unavailable(`Enter A Domain Name Or Search Keywords`), 400);
  if (values.length > 1 || input.length > 253) return invalidQuery();
  const query = input.trim().normalize(`NFC`).toLowerCase().replace(/ +/g, ` `);
  if (query && (!/^[\p{L}\p{M}\p{N}.'’& -]+$/u.test(query) || !/[\p{L}\p{N}]/u.test(query))) return invalidQuery();
  const exact = domainName(query);
  if (!exact && query.length > 100) return invalidQuery();
  const authorization = getEnvironmentGoDaddyV3Authorization();
  if (!authorization) return reply({ status: `unconfigured`, listings: [], message: `Afternic Premium Search Is Unavailable In This Environment` });
  if (request.signal.aborted) return reply(unavailable());

  const key = exact ?? (query || browseSeed);
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expires > now) return reply(cached.result);
  let lookup = pending.get(key);
  if (!lookup) {
    while (requestTimes.length && requestTimes[0] + minute <= now) requestTimes.shift();
    if (providerRetryAt > now) return reply(busy, 429, providerRetryAt);
    if (requestTimes.length >= 20) return reply(busy, 429, requestTimes[0] + minute);
    if (pending.size >= 4) return reply(busy, 429, now + 3_000);
    requestTimes.push(now);
    lookup = discover(key, exact, authorization).then(result => {
      if (result.status === `ready`) {
        cache.delete(key);
        cache.set(key, { result, expires: Date.now() + 3 * minute });
        if (cache.size > 128) {
          const oldest = cache.keys().next().value;
          if (oldest !== undefined) cache.delete(oldest);
        }
      }
      return result;
    }).finally(() => pending.delete(key));
    pending.set(key, lookup);
  }
  const result = await lookup;
  return result.status === `rate-limited` ? reply(result, 429, providerRetryAt) : reply(result);
};
