import { fetchDomainAnalytics } from './sync';
import { readLimitedText } from '../registrars/request';
import { RegistrarRelayError } from '../registrars/errors';
import { responseHeaders } from '../registrars/http';

let activeRequests = 0;

export const handleDomainAnalytics = async (request: Request): Promise<Response> => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  let admitted = false;
  request.signal.addEventListener(`abort`, abort, { once: true });
  if (request.signal.aborted) abort();
  const timeout = setTimeout(abort, 25_000);
  try {
    const site = request.headers.get(`sec-fetch-site`);
    const origin = request.headers.get(`origin`);
    if (site && ![`same-origin`, `none`].includes(site) || origin && origin !== new URL(request.url).origin) {
      throw new RegistrarRelayError(403, `Cross-Origin Analytics Requests Are Not Allowed`);
    }
    if (request.headers.get(`content-type`)?.split(`;`)?.[0]?.trim()?.toLowerCase() !== `application/json`) {
      throw new RegistrarRelayError(415, `Send A Domain Name As JSON`);
    }
    const encoding = request.headers.get(`content-encoding`);
    const length = request.headers.get(`content-length`);
    if (encoding && encoding.toLowerCase() !== `identity` || length && (!/^\d+$/.test(length) || Number(length) > 1024)) {
      throw new RegistrarRelayError(413, `Analytics Request Exceeds The Size Limit`);
    }
    if (activeRequests >= 4) throw new RegistrarRelayError(429, `Domain Analytics Are Busy — Try Again`);
    admitted = true;
    activeRequests += 1;
    const bodyTimeout = setTimeout(abort, 10_000);
    let input: unknown;
    try {
      input = JSON.parse(await readLimitedText(request.body, 1024, controller.signal,
        new RegistrarRelayError(413, `Analytics Request Exceeds The Size Limit`)));
    } catch (failure) {
      if (failure instanceof RegistrarRelayError) throw failure;
      throw new RegistrarRelayError(400, `Send A Valid Domain Name`);
    } finally { clearTimeout(bodyTimeout); }
    const record = input && typeof input === `object` && !Array.isArray(input) ? input as Record<string, unknown> : undefined;
    if (!record || Object.keys(record).some(key => key !== `domain`)) throw new RegistrarRelayError(400, `Send A Valid Domain Name`);
    return Response.json(await fetchDomainAnalytics(record.domain, controller.signal), { headers: responseHeaders });
  } catch (failure) {
    const error = failure instanceof RegistrarRelayError ? failure : new RegistrarRelayError(502, `Domain Analytics Could Not Be Completed`);
    return Response.json({ error: error.message }, { status: error.status, headers: responseHeaders });
  } finally {
    if (admitted) activeRequests -= 1;
    clearTimeout(timeout);
    request.signal.removeEventListener(`abort`, abort);
  }
};
