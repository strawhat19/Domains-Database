import { createHash } from 'node:crypto';
import { DomainMarketError, MarketSourceError, requestMarketJson } from './request';
import { MARKET_RANGE } from '../../shared/domainMarket/values';
import type { DomainRatingResult, SearchInterestResult } from '../../shared/domainMarket/types';

export type DomainMarketInput = { provider: `ahrefs`; domain: string }
  | { provider: `serpapi`; domain: string; keyword: string; country: string };
type MarketResult = DomainRatingResult | SearchInterestResult;
type CachedResult = { expires: number; result: MarketResult };
type SourceFailure = { expires: number; status: `quota` | `unavailable` | `unconfigured`; message: string };

const cache = new Map<string, CachedResult>();
const failures = new Map<string, SourceFailure>();
const pending = new Map<string, Promise<MarketResult>>();
const CACHE_LIMIT = 512;
const SUCCESS_TTL = 7 * 86_400_000;
const ERROR_TTL = 60_000;
const QUOTA_TTL = 300_000;

const recordOf = (value: unknown): Record<string, unknown> | undefined => value && typeof value === `object` && !Array.isArray(value)
  ? value as Record<string, unknown> : undefined;

const baseResult = (input: DomainMarketInput) => input.provider === `ahrefs`
  ? { domain: input.domain, source: `Ahrefs` as const, checkedAt: new Date().toISOString() }
  : { domain: input.domain, keyword: input.keyword, country: input.country, range: MARKET_RANGE, source: `Google Trends via SerpApi` as const, checkedAt: new Date().toISOString(), points: [] };

const unavailableResult = (input: DomainMarketInput, status: SourceFailure['status'], message: string): MarketResult => ({
  ...baseResult(input), status, message,
});

const loadRating = async (input: Extract<DomainMarketInput, { provider: `ahrefs` }>, key: string, signal: AbortSignal): Promise<DomainRatingResult> => {
  const url = new URL(`https://api.ahrefs.com/v3/public/domain-rating-free`);
  url.searchParams.set(`target`, input.domain);
  url.searchParams.set(`output`, `json`);
  const data = recordOf(await requestMarketJson(url, signal, `Bearer ${key}`));
  const rating = recordOf(data?.domain_rating)?.domain_rating;
  if (typeof rating !== `number` || !Number.isFinite(rating) || rating < 0 || rating > 100) throw new MarketSourceError();
  return { domain: input.domain, source: `Ahrefs`, checkedAt: new Date().toISOString(), status: `ready`, rating };
};

const loadInterest = async (input: Extract<DomainMarketInput, { provider: `serpapi` }>, key: string, signal: AbortSignal): Promise<SearchInterestResult> => {
  const insufficientResult = (): SearchInterestResult => ({
    domain: input.domain,
    keyword: input.keyword,
    country: input.country,
    range: MARKET_RANGE,
    source: `Google Trends via SerpApi`,
    checkedAt: new Date().toISOString(),
    status: `insufficient`,
    points: [],
    message: `Google Trends Has Insufficient Search Interest For This Keyword And Region`,
  });
  const accountUrl = new URL(`https://serpapi.com/account.json`);
  accountUrl.searchParams.set(`api_key`, key);
  const account = recordOf(await requestMarketJson(accountUrl, signal));
  if (account?.plan_monthly_price !== 0 || account?.extra_credits !== 0) {
    return { ...baseResult(input), status: `unconfigured`, message: `Search Interest Requires A SerpApi Free Plan Without Extra Credits` } as SearchInterestResult;
  }
  if (typeof account.plan_searches_left !== `number` || !Number.isFinite(account.plan_searches_left)) throw new MarketSourceError();
  if (account.plan_searches_left < 1) throw new MarketSourceError(true);
  const url = new URL(`https://serpapi.com/search.json`);
  for (const [name, value] of Object.entries({
    q: input.keyword,
    hl: `en`,
    tz: `0`,
    geo: input.country,
    date: MARKET_RANGE,
    engine: `google_trends`,
    api_key: key,
    data_type: `TIMESERIES`,
  })) url.searchParams.set(name, value);
  const data = recordOf(await requestMarketJson(url, signal));
  if (data?.error === `Google Trends hasn't returned any results for this query.`) return insufficientResult();
  if (!data || data.error) throw new MarketSourceError();
  const timeline = recordOf(data.interest_over_time)?.timeline_data;
  if (!Array.isArray(timeline) || timeline.length > 400) throw new MarketSourceError();
  const points: SearchInterestResult['points'] = [];
  for (const value of timeline) {
    const point = recordOf(value);
    const metric = Array.isArray(point?.values) && point.values.length === 1 ? recordOf(point.values[0])?.extracted_value : undefined;
    const timestamp = typeof point?.timestamp === `string` && /^\d{1,12}$/.test(point.timestamp) ? Number(point.timestamp) : Number.NaN;
    if (typeof point?.date !== `string` || !point.date.trim() || point.date.length > 80 || /[\u0000-\u001f\u007f]/.test(point.date)
      || !Number.isSafeInteger(timestamp) || timestamp < 1 || timestamp * 1_000 > Date.now() + 86_400_000
      || typeof metric !== `number` || !Number.isFinite(metric) || metric < 0 || metric > 100) throw new MarketSourceError();
    points.push({ date: point.date, timestamp, value: metric });
  }
  points.sort((first, second) => first.timestamp - second.timestamp);
  if (points.some((point, index) => index > 0 && point.timestamp === points[index - 1].timestamp)) throw new MarketSourceError();
  const base = insufficientResult();
  return points.some(point => point.value > 0)
    ? { ...base, status: `ready`, points, message: undefined }
    : base;
};

export const fetchDomainMarket = async (input: DomainMarketInput, signal: AbortSignal): Promise<MarketResult> => {
  if (signal.aborted) throw new DomainMarketError(504, `Market Request Timed Out Or Was Cancelled`);
  const credential = (input.provider === `ahrefs` ? process.env.AHREFS_FREE_API_KEY : process.env.SERPAPI_API_KEY)?.trim();
  if (!credential || credential.length > 1_024 || /[\u0000-\u0020\u007f]/.test(credential)) return unavailableResult(input, `unconfigured`, input.provider === `ahrefs`
    ? `Add A Free Ahrefs API Key On The Server To Load Domain Rating`
    : `Add A Free SerpApi API Key On The Server To Load Search Interest`);
  const sourceKey = `${input.provider}:${createHash(`sha256`).update(credential).digest(`hex`)}`;
  const cacheKey = JSON.stringify(input.provider === `ahrefs` ? [sourceKey, input.domain] : [sourceKey, input.keyword, input.country, MARKET_RANGE]);
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > now) return { ...cached.result, domain: input.domain };
  const failure = failures.get(sourceKey);
  if (failure && failure.expires > now) return { ...unavailableResult(input, failure.status, failure.message), expiresAt: new Date(failure.expires).toISOString() };
  const waiting = pending.get(cacheKey);
  if (waiting) return { ...await waiting, domain: input.domain };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  const operation = (async () => {
    let result: MarketResult;
    try {
      result = input.provider === `ahrefs` ? await loadRating(input, credential, controller.signal) : await loadInterest(input, credential, controller.signal);
    } catch (error) {
      const quota = error instanceof MarketSourceError && error.quota;
      result = unavailableResult(input, quota ? `quota` : `unavailable`, quota
        ? `Free Provider Limit Reached — Try Again Later`
        : `Free Market Data Is Temporarily Unavailable — Try Again Later`);
    }
    const ttl = result.status === `ready` || result.status === `insufficient` ? SUCCESS_TTL : result.status === `quota` ? QUOTA_TTL : ERROR_TTL;
    const expires = Date.parse(result.checkedAt) + ttl;
    result = { ...result, expiresAt: new Date(expires).toISOString() };
    if (result.status !== `ready` && result.status !== `insufficient`) {
      failures.set(sourceKey, { expires, status: result.status, message: result.message ?? `Free Market Data Is Unavailable` });
      if (failures.size > 4) failures.delete(failures.keys().next().value ?? ``);
    }
    for (const [name, entry] of cache) if (entry.expires <= Date.now()) cache.delete(name);
    cache.delete(cacheKey);
    if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value ?? ``);
    cache.set(cacheKey, { expires, result });
    return result;
  })().finally(() => clearTimeout(timeout));
  pending.set(cacheKey, operation);
  try { return await operation; }
  finally { pending.delete(cacheKey); }
};
