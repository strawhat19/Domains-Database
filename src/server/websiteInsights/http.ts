import { fetchWebsiteInsights } from './sync';
import { readInsightsText, WebsiteInsightsError } from './request';

const headers = {
  Pragma: `no-cache`,
  'Referrer-Policy': `no-referrer`,
  'X-Content-Type-Options': `nosniff`,
  'Cache-Control': `no-store, private, max-age=0`,
};
let activeRequests = 0;

export const handleWebsiteInsights = async (request: Request): Promise<Response> => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  let admitted = false;
  request.signal.addEventListener(`abort`, abort, { once: true });
  if (request.signal.aborted) abort();
  const timeout = setTimeout(abort, 90_000);
  try {
    const site = request.headers.get(`sec-fetch-site`);
    const origin = request.headers.get(`origin`);
    if (site && ![`same-origin`, `none`].includes(site) || origin && origin !== new URL(request.url).origin) throw new WebsiteInsightsError(403, `Cross-Origin Insights Requests Are Not Allowed`);
    if (request.headers.get(`content-type`)?.split(`;`)?.[0]?.trim()?.toLowerCase() !== `application/json`) throw new WebsiteInsightsError(415, `Send A Domain Name As JSON`);
    const encoding = request.headers.get(`content-encoding`);
    const length = request.headers.get(`content-length`);
    if (encoding && encoding.toLowerCase() !== `identity` || length && (!/^\d+$/.test(length) || Number(length) > 1_024)) throw new WebsiteInsightsError(413, `Insights Request Exceeds The Size Limit`);
    if (activeRequests >= 2) throw new WebsiteInsightsError(429, `Website Insights Are Busy — Try Later`);
    admitted = true;
    activeRequests += 1;
    const bodyTimeout = setTimeout(abort, 10_000);
    let input: unknown;
    try { input = JSON.parse(await readInsightsText(request.body, 1_024, controller.signal)); }
    catch (failure) { if (failure instanceof WebsiteInsightsError) throw failure; throw new WebsiteInsightsError(400, `Send A Valid Domain Name`); }
    finally { clearTimeout(bodyTimeout); }
    const record = input && typeof input === `object` && !Array.isArray(input) ? input as Record<string, unknown> : undefined;
    if (!record || Object.keys(record).some(key => key !== `domain`)) throw new WebsiteInsightsError(400, `Send A Valid Domain Name`);
    const result = await fetchWebsiteInsights(record.domain, controller.signal);
    if (controller.signal.aborted) throw new WebsiteInsightsError(504, `Website Insights Timed Out Or Were Cancelled`);
    return Response.json(result, { headers });
  } catch (failure) {
    const error = failure instanceof WebsiteInsightsError ? failure : new WebsiteInsightsError(502, `Website Insights Could Not Be Completed`);
    return Response.json({ error: error.message }, { headers, status: error.status });
  } finally {
    if (admitted) activeRequests -= 1;
    clearTimeout(timeout);
    request.signal.removeEventListener(`abort`, abort);
  }
};
