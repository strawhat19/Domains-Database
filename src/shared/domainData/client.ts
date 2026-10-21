import { Platform } from 'react-native';
import { absoluteSiteUrl } from '../seo';
import { firebaseEnabled } from '../firebase/config';
import { getFirebaseAuth } from '../firebase/client';
import { buildDomainDataResponse } from './serialize';
import type { DomainDataQuery, DomainDataResponse } from './types';

const MAX_RESPONSE_BYTES = 3_000_000;
const invalid = () => new Error(`Domain Data Returned An Invalid Response`);
const objectValue = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : null;
const readResponse = (value: unknown): DomainDataResponse => {
  const record = objectValue(value);
  const page = objectValue(record?.page);
  const coverage = objectValue(record?.coverage);
  if (!record || record.schemaVersion !== 1 || record.success !== true || record.source !== `firebase` || ![`own`, `owner`, `public`].includes(String(record.access))
    || typeof record.userId !== `string` || typeof record.fetchedAt !== `string` || !Number.isFinite(Date.parse(record.fetchedAt))
    || !Array.isArray(record.domains) || record.domains.length > 100 || !Array.isArray(record.groups) || record.groups.length > 1_000
    || !Array.isArray(record.collections) || record.collections.length > 1_000 || !page || !coverage || coverage.relationships !== `page`
    || !Array.isArray(coverage.warnings) || coverage.warnings.length > 20 || coverage.warnings.some(warning => typeof warning !== `string` || warning.length > 500)
    || !Number.isSafeInteger(page.limit) || (page.limit as number) < 1 || (page.limit as number) > 100
    || page.returned !== record.domains.length || (page.returned as number) > (page.limit as number) || typeof page.hasMore !== `boolean`
    || (page.hasMore ? typeof page.nextCursor !== `string` || !page.nextCursor : page.nextCursor !== null)) throw invalid();
  for (const domain of record.domains) if (!objectValue(domain) || typeof domain.id !== `string`) throw invalid();
  if (new Set(record.domains.map(domain => domain.id)).size !== record.domains.length
    || page.hasMore && page.nextCursor !== record.domains.at(-1)?.id) throw invalid();
  const safe = buildDomainDataResponse({
    source: `firebase`,
    userId: record.userId,
    domains: record.domains,
    groups: record.groups,
    collections: record.collections,
    warnings: coverage.warnings as string[],
    access: record.access as DomainDataResponse[`access`],
    page: page as DomainDataResponse[`page`],
  });
  if (safe.domains.length !== record.domains.length || safe.groups.length !== record.groups.length || safe.collections.length !== record.collections.length) throw invalid();
  return { ...safe, fetchedAt: record.fetchedAt };
};
const readText = async (response: Response, signal: AbortSignal) => {
  const tooLarge = () => new Error(`Domain Data Response Is Too Large — Request Fewer Records`);
  const length = response.headers.get(`content-length`);
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_RESPONSE_BYTES)) throw tooLarge();
  const reader = typeof response.body?.getReader === `function` ? response.body.getReader() : null;
  if (!reader) {
    const value = await response.text();
    let bytes = 0;
    for (const character of value) {
      const code = character.codePointAt(0) ?? 0;
      bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
      if (bytes > MAX_RESPONSE_BYTES) throw tooLarge();
    }
    return value;
  }
  let bytes = 0;
  let text = ``;
  const decoder = new TextDecoder(`utf-8`, { fatal: true });
  const abort = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener(`abort`, abort, { once: true });
  try {
    while (true) {
      if (signal.aborted) throw new Error(`Domain Data Request Cancelled`);
      const chunk = await reader.read();
      if (signal.aborted) throw new Error(`Domain Data Request Cancelled`);
      if (chunk.done) return text + decoder.decode();
      bytes += chunk.value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) throw tooLarge();
      text += decoder.decode(chunk.value, { stream: true });
    }
  } finally {
    signal.removeEventListener(`abort`, abort);
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
};

export const getDomains = async (query: DomainDataQuery = {}, signal?: AbortSignal): Promise<DomainDataResponse> => {
  if (!firebaseEnabled) throw new Error(`Connect Firebase To Fetch Saved Domain Data`);
  if (signal?.aborted) throw new Error(`Domain Data Request Cancelled`);
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const identity = auth.currentUser;
  const assertIdentity = () => {
    if (auth.currentUser !== identity) throw new Error(`Your Account Changed — Try Again`);
  };
  const token = identity && !identity.isAnonymous ? await identity.getIdToken() : undefined;
  assertIdentity();
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined) parameters.set(key, String(value));
  const path = `/api/domains${parameters.toString() ? `?${parameters}` : ``}`;
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener(`abort`, abort, { once: true });
  if (signal?.aborted) abort();
  const timeout = setTimeout(abort, 30_000);
  try {
    const response = await fetch(Platform.OS === `web` ? path : absoluteSiteUrl(path), {
      method: `GET`,
      cache: `no-store`,
      credentials: `omit`,
      signal: controller.signal,
      headers: { Accept: `application/json`, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const text = await readText(response, controller.signal);
    assertIdentity();
    if (controller.signal.aborted) throw new Error(`Domain Data Request Cancelled`);
    let input: unknown;
    try { input = JSON.parse(text); } catch { throw invalid(); }
    if (!response.ok) {
      const error = objectValue(input)?.error;
      throw new Error(typeof error === `string` && error.length < 500 ? error : `Domain Data Could Not Be Loaded`);
    }
    return readResponse(input);
  } catch (failure) {
    assertIdentity();
    if (controller.signal.aborted) throw new Error(signal?.aborted ? `Domain Data Request Cancelled` : `Domain Data Request Timed Out`);
    if (failure instanceof TypeError) throw new Error(`Could Not Reach Domain Data — The API Server Is Required`);
    throw failure;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener(`abort`, abort);
    controller.abort();
  }
};
