import { readLimitedText } from '../registrars/request';
import { upstreamError, RegistrarRelayError } from '../registrars/errors';
import type { RegistrarCredentials } from '../registrars/credentials';
import { registrarPurchaseUrl, type DomainSearchPrice, type DomainSearchResult } from '../../shared/domainSearch/types';

const maximumResponseBytes = 2 * 1024 * 1024;
const invalid = () => new RegistrarRelayError(502, `Vercel Returned Invalid Domain Availability Or Pricing`);
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== `object` || Array.isArray(value)) throw invalid();
  return value as Record<string, unknown>;
};

type VercelCredentials = Extract<RegistrarCredentials, { provider: `vercel` }>;

const requestVercel = async (operation: `search` | `extensions`, signal: AbortSignal, domain?: string, credentials?: VercelCredentials): Promise<unknown> => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener(`abort`, abort, { once: true });
  if (signal.aborted) abort();
  const timeout = setTimeout(abort, 20_000);
  const search = operation === `search`;
  const url = new URL(search ? `https://api.vercel.com/v1/registrar/domains/search` : `https://api.vercel.com/v1/registrar/tlds/supported`);
  if (credentials?.teamId) url.searchParams.set(`teamId`, credentials.teamId);
  try {
    const response = await fetch(url, {
      redirect: `error`,
      cache: `no-store`,
      credentials: `omit`,
      signal: controller.signal,
      method: search ? `POST` : `GET`,
      body: search ? JSON.stringify({ domains: [domain] }) : undefined,
      headers: { Accept: `application/json`, ...(search ? { 'Content-Type': `application/json` } : {}), ...(credentials ? { Authorization: credentials.authorization } : {}) },
    });
    if (!response.ok) {
      void response.body?.cancel().catch(() => undefined);
      if (credentials) throw upstreamError(`vercel`, response.status);
      throw new RegistrarRelayError(response.status === 429 ? 429 : 502,
        response.status === 429 ? `Vercel Domain Search Rate Limit Reached — Try Again Later` : `Vercel Domain Service Is Unavailable`);
    }
    const size = response.headers.get(`content-length`);
    if (size && (!/^\d+$/.test(size) || Number(size) > maximumResponseBytes)) {
      void response.body?.cancel().catch(() => undefined);
      throw invalid();
    }
    const text = await readLimitedText(response.body, maximumResponseBytes, controller.signal, invalid());
    if (controller.signal.aborted) throw new RegistrarRelayError(504, `Vercel Domain Request Timed Out Or Cancelled`);
    try { return JSON.parse(text) as unknown; }
    catch { throw invalid(); }
  } catch (failure) {
    if (failure instanceof RegistrarRelayError) throw failure;
    throw new RegistrarRelayError(controller.signal.aborted ? 504 : 502,
      controller.signal.aborted ? `Vercel Domain Request Timed Out Or Cancelled` : `Vercel Domain Service Is Unavailable`);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener(`abort`, abort);
  }
};

const price = (value: unknown, years: number): DomainSearchPrice => {
  if (typeof value !== `number` || !Number.isFinite(value) || value < 0 || value > 1_000_000_000) throw invalid();
  return { years, amount: value, currency: `USD` };
};

export const searchVercel = async (domain: string, signal: AbortSignal, credentials?: VercelCredentials): Promise<DomainSearchResult> => {
  const response = record(await requestVercel(`search`, signal, domain, credentials));
  if (!Array.isArray(response.results) || response.results.length !== 1) throw invalid();
  const result = record(response.results?.[0]);
  if (result.domain !== domain || typeof result.available !== `boolean`) throw invalid();
  const base = { domain, label: `Vercel`, provider: `vercel` as const, purchaseUrl: registrarPurchaseUrl(`vercel`, domain) };
  if (!result.available) return { ...base, note: `Vercel Reports This Domain Unavailable Or Could Not Confirm Availability — Check At Vercel` };
  if (typeof result.premium !== `boolean` || typeof result.years !== `number`
    || !Number.isInteger(result.years) || result.years < 1 || result.years > 10) throw invalid();
  return {
    ...base,
    available: true,
    renewal: price(result.renewalPrice, result.years),
    registration: price(result.price, result.years),
    note: `${result.premium ? `Premium Domain — ` : ``}Vercel Prices Cover ${result.years} Year(s) In USD — Confirm Checkout Totals`,
  };
};

export const listVercelExtensions = async (signal: AbortSignal, credentials?: VercelCredentials): Promise<unknown[]> => {
  const result = await requestVercel(`extensions`, signal, undefined, credentials);
  if (!Array.isArray(result)) throw invalid();
  return result;
};
