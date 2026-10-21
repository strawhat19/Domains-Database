import { fetchDomainMarket } from './providers';
import { readMarketText, DomainMarketError } from './request';
import { normalizeMarketDomain, normalizeMarketCountry, normalizeMarketKeyword } from '../../shared/domainMarket/values';
import type { DomainMarketInput } from './providers';

const headers = {
  Pragma: `no-cache`,
  'Referrer-Policy': `no-referrer`,
  'X-Content-Type-Options': `nosniff`,
  'Cache-Control': `no-store, private, max-age=0`,
};
let activeRequests = 0;

const parseInput = (input: unknown): DomainMarketInput => {
  const record = input && typeof input === `object` && !Array.isArray(input) ? input as Record<string, unknown> : undefined;
  if (!record || ![`ahrefs`, `serpapi`].includes(String(record.provider))) throw new DomainMarketError(400, `Choose A Free Market Data Provider`);
  const keys = record.provider === `ahrefs` ? [`domain`, `provider`] : [`domain`, `keyword`, `country`, `provider`];
  if (Object.keys(record).some(key => !keys.includes(key)) || typeof record.domain !== `string` || record.domain.length > 253) throw new DomainMarketError(400, `Send A Valid Domain Name`);
  try {
    const domain = normalizeMarketDomain(record.domain);
    if (record.provider === `ahrefs`) return { domain, provider: `ahrefs` };
    if (typeof record.keyword !== `string` || record.keyword.length > 160 || typeof record.country !== `string` || record.country.length > 2) throw new Error();
    return { domain, provider: `serpapi`, keyword: normalizeMarketKeyword(record.keyword), country: normalizeMarketCountry(record.country) };
  } catch { throw new DomainMarketError(400, `Send A Valid Domain, Keyword, And Supported Country`); }
};

export const handleDomainMarket = async (request: Request): Promise<Response> => {
  if (request.method !== `POST`) return Response.json({ error: `Use POST To Load Free Market Data` }, { status: 405, headers: { ...headers, Allow: `POST` } });
  const controller = new AbortController();
  const abort = () => controller.abort();
  let admitted = false;
  request.signal.addEventListener(`abort`, abort, { once: true });
  if (request.signal.aborted) abort();
  const timeout = setTimeout(abort, 25_000);
  try {
    const site = request.headers.get(`sec-fetch-site`);
    const origin = request.headers.get(`origin`);
    if (site && ![`same-origin`, `none`].includes(site) || origin && origin !== new URL(request.url).origin) throw new DomainMarketError(403, `Cross-Origin Market Requests Are Not Allowed`);
    if (new URL(request.url).search) throw new DomainMarketError(400, `Send Market Options In The JSON Body`);
    if (request.headers.get(`content-type`)?.split(`;`)?.[0]?.trim()?.toLowerCase() !== `application/json`) throw new DomainMarketError(415, `Send Market Options As JSON`);
    const encoding = request.headers.get(`content-encoding`);
    const length = request.headers.get(`content-length`);
    if (encoding && encoding.toLowerCase() !== `identity` || length && (!/^\d+$/.test(length) || Number(length) > 1_024)) throw new DomainMarketError(413, `Market Request Exceeds The Size Limit`);
    if (activeRequests >= 2) throw new DomainMarketError(429, `Free Market Data Is Busy — Try Again Later`);
    admitted = true;
    activeRequests += 1;
    const bodyTimeout = setTimeout(abort, 5_000);
    let input: unknown;
    try { input = JSON.parse(await readMarketText(request.body, 1_024, controller.signal)); }
    catch (error) { if (error instanceof DomainMarketError) throw error; throw new DomainMarketError(400, `Send Valid Market Options As JSON`); }
    finally { clearTimeout(bodyTimeout); }
    const result = await fetchDomainMarket(parseInput(input), controller.signal);
    if (controller.signal.aborted) throw new DomainMarketError(504, `Market Request Timed Out Or Was Cancelled`);
    return Response.json(result, { headers });
  } catch (failure) {
    const error = failure instanceof DomainMarketError ? failure : new DomainMarketError(502, `Free Market Data Could Not Be Completed`);
    return Response.json({ error: error.message }, { headers, status: error.status });
  } finally {
    if (admitted) activeRequests -= 1;
    clearTimeout(timeout);
    request.signal.removeEventListener(`abort`, abort);
  }
};
