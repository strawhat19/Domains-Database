import { Platform } from 'react-native';
import { absoluteSiteUrl } from '../seo';
import type { MarketStatus, DomainRatingResult, SearchInterestInput, SearchInterestResult } from './types';
import { MARKET_RANGE, normalizeMarketDomain, normalizeMarketKeyword, normalizeMarketCountry } from './values';

const MAX_CACHE_ENTRIES = 128;
const MAX_RESPONSE_BYTES = 128 * 1024;
const MAX_CACHE_MS = 7 * 24 * 60 * 60 * 1000;
const ratings = new Map<string, DomainRatingResult>();
const interests = new Map<string, SearchInterestResult>();
const statuses: MarketStatus[] = [`ready`, `quota`, `unavailable`, `unconfigured`, `insufficient`];
const invalid = () => new Error(`Market Data Returned An Invalid Response`);
const cancelled = () => new Error(`Market Data Request Cancelled`);
const objectValue = (value: unknown): Record<string, unknown> | null => value !== null
  && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : null;
const textValue = (value: unknown, maximum: number) => typeof value === `string`
  && !!value.trim() && value.length <= maximum && !/[\u0000-\u001f\u007f]/.test(value);

const readTimestamp = (value: unknown) => {
  if (typeof value !== `string` || !/^\d{4}-\d{2}-\d{2}T/.test(value)
    || value.length > 32 || !Number.isFinite(Date.parse(value))) throw invalid();
  return new Date(value).toISOString();
};

const readMetadata = (input: Record<string, unknown>) => {
  if (!statuses.includes(input.status as MarketStatus)) throw invalid();
  const checkedAt = readTimestamp(input.checkedAt);
  const expiresAt = input.expiresAt === undefined ? undefined : readTimestamp(input.expiresAt);
  if (expiresAt && (Date.parse(expiresAt) <= Date.parse(checkedAt)
    || Date.parse(expiresAt) - Date.parse(checkedAt) > MAX_CACHE_MS)) throw invalid();
  if (input.message !== undefined && !textValue(input.message, 280)) throw invalid();
  return {
    checkedAt,
    status: input.status as MarketStatus,
    ...(expiresAt ? { expiresAt } : {}),
    ...(typeof input.message === `string` ? { message: input.message } : {}),
  };
};

const readRating = (value: unknown, domain: string): DomainRatingResult => {
  const input = objectValue(value);
  if (!input || input.domain !== domain || input.source !== `Ahrefs`) throw invalid();
  const metadata = readMetadata(input);
  if (metadata.status === `ready`) {
    if (typeof input.rating !== `number` || !Number.isFinite(input.rating)
      || input.rating < 0 || input.rating > 100) throw invalid();
    return { domain, ...metadata, source: `Ahrefs`, rating: input.rating };
  }
  if (input.rating !== undefined) throw invalid();
  return { domain, ...metadata, source: `Ahrefs` };
};

const normalizeInterest = (input: SearchInterestInput): SearchInterestInput => ({
  domain: normalizeMarketDomain(input.domain),
  keyword: normalizeMarketKeyword(input.keyword),
  country: normalizeMarketCountry(input.country),
});

const readInterest = (value: unknown, query: SearchInterestInput): SearchInterestResult => {
  const input = objectValue(value);
  if (!input || input.domain !== query.domain || input.keyword !== query.keyword
    || input.country !== query.country || input.range !== MARKET_RANGE
    || input.source !== `Google Trends via SerpApi` || !Array.isArray(input.points)
    || input.points.length > 400) throw invalid();
  const metadata = readMetadata(input);
  let previousTimestamp = 0;
  const points = input.points.map(value => {
    const point = objectValue(value);
    if (!point || !textValue(point.date, 80) || typeof point.value !== `number`
      || !Number.isFinite(point.value) || point.value < 0 || point.value > 100
      || typeof point.timestamp !== `number` || !Number.isSafeInteger(point.timestamp)
      || point.timestamp <= previousTimestamp || point.timestamp > 4_000_000_000) throw invalid();
    previousTimestamp = point.timestamp;
    return { date: point.date as string, value: point.value, timestamp: point.timestamp };
  });
  if (metadata.status === `ready` ? !points.length : !!points.length) throw invalid();
  return { ...query, ...metadata, points, range: MARKET_RANGE, source: `Google Trends via SerpApi` };
};

const readResponseText = async (response: Response) => {
  const tooLarge = () => new Error(`Market Data Response Is Too Large`);
  const length = response.headers.get(`content-length`);
  if (length && Number(length) > MAX_RESPONSE_BYTES) throw tooLarge();
  const reader = typeof response.body?.getReader === `function` ? response.body.getReader() : null;
  if (!reader) {
    const text = await response.text();
    let bytes = 0;
    for (const character of text) {
      const code = character.codePointAt(0) ?? 0;
      bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
      if (bytes > MAX_RESPONSE_BYTES) throw tooLarge();
    }
    return text;
  }
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) throw tooLarge();
      chunks.push(value);
    }
  } catch (failure) {
    await reader.cancel().catch(() => undefined);
    throw failure;
  } finally {
    reader.releaseLock();
  }
  const combined = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(combined);
};

const requestMarket = async (body: Record<string, string>, signal?: AbortSignal): Promise<unknown> => {
  if (signal?.aborted) throw cancelled();
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener(`abort`, abort, { once: true });
  if (signal?.aborted) abort();
  const timeout = setTimeout(abort, 30_000);
  try {
    const response = await fetch(Platform.OS === `web` ? `/api/domain-market` : absoluteSiteUrl(`/api/domain-market`), {
      method: `POST`,
      credentials: `omit`,
      signal: controller.signal,
      body: JSON.stringify(body),
      headers: { Accept: `application/json`, 'Content-Type': `application/json` },
    });
    const text = await readResponseText(response);
    let input: unknown;
    try { input = JSON.parse(text); } catch { throw invalid(); }
    if (controller.signal.aborted) throw cancelled();
    if (!response.ok) {
      const message = objectValue(input)?.error;
      throw new Error(textValue(message, 280) ? message as string : `Market Data Is Temporarily Unavailable`);
    }
    return input;
  } catch (failure) {
    if (controller.signal.aborted) throw signal?.aborted ? cancelled() : new Error(`Market Data Timed Out`);
    if (failure instanceof TypeError) throw new Error(`Could Not Reach Market Data — The API Server Is Required`);
    throw failure;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener(`abort`, abort);
    controller.abort();
  }
};

const peekCached = <T extends { expiresAt?: string }>(cache: Map<string, T>, key: string): T | null => {
  const result = cache.get(key);
  if (!result) return null;
  const expiry = Date.parse(result.expiresAt ?? ``);
  if (!Number.isFinite(expiry) || expiry <= Date.now() || expiry - Date.now() > MAX_CACHE_MS) {
    cache.delete(key);
    return null;
  }
  return result;
};

const cacheResult = <T extends { expiresAt?: string }>(cache: Map<string, T>, key: string, result: T) => {
  const expiry = Date.parse(result.expiresAt ?? ``);
  if (!Number.isFinite(expiry) || expiry <= Date.now() || expiry - Date.now() > MAX_CACHE_MS) return;
  for (const existingKey of cache.keys()) peekCached(cache, existingKey);
  cache.delete(key);
  cache.set(key, result);
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
};

const interestKey = (input: SearchInterestInput) => JSON.stringify([input.domain, input.keyword, input.country, MARKET_RANGE]);

export const peekDomainRating = (value: string): DomainRatingResult | null => {
  const result = peekCached(ratings, normalizeMarketDomain(value));
  return result ? { ...result } : null;
};

export const peekSearchInterest = (input: SearchInterestInput): SearchInterestResult | null => {
  const result = peekCached(interests, interestKey(normalizeInterest(input)));
  return result ? { ...result, points: result.points.map(point => ({ ...point })) } : null;
};

export const getDomainRating = async (value: string, signal?: AbortSignal): Promise<DomainRatingResult> => {
  const domain = normalizeMarketDomain(value);
  if (signal?.aborted) throw cancelled();
  const cached = peekCached(ratings, domain);
  if (cached) return { ...cached };
  const result = readRating(await requestMarket({ domain, provider: `ahrefs` }, signal), domain);
  cacheResult(ratings, domain, result);
  return { ...result };
};

export const getSearchInterest = async (input: SearchInterestInput, signal?: AbortSignal): Promise<SearchInterestResult> => {
  const query = normalizeInterest(input);
  if (signal?.aborted) throw cancelled();
  const key = interestKey(query);
  const cached = peekCached(interests, key);
  if (cached) return { ...cached, points: cached.points.map(point => ({ ...point })) };
  const result = readInterest(await requestMarket({ ...query, provider: `serpapi` }, signal), query);
  cacheResult(interests, key, result);
  return { ...result, points: result.points.map(point => ({ ...point })) };
};
