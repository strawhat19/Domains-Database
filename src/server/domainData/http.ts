import { fetchDomainData } from './service';
import { isAppCollectionID } from '../../shared/common/ids';
import { RegistrarRelayError } from '../registrars/errors';
import { DomainDataError, MAX_DOMAIN_DATA_BYTES } from './request';
import type { DomainDataQuery } from '../../shared/domainData/types';

const headers = {
  Vary: `Authorization`,
  Pragma: `no-cache`,
  'Referrer-Policy': `no-referrer`,
  'X-Content-Type-Options': `nosniff`,
  'Cache-Control': `no-store, private, max-age=0`,
};
let activeRequests = 0;
const validId = (value: string, type: string) => value.length <= 512 && !/[\u0000-\u001f\u007f/]/.test(value) && isAppCollectionID(value, type);
const parseQuery = (url: URL): DomainDataQuery => {
  const allowed = [`userId`, `visibility`, `limit`, `cursor`, `domainId`];
  for (const key of url.searchParams.keys()) if (!allowed.includes(key) || url.searchParams.getAll(key).length !== 1) throw new DomainDataError(400, `Send Only Supported Domain Query Options Once`);
  const userId = url.searchParams.get(`userId`) ?? undefined;
  const cursor = url.searchParams.get(`cursor`) ?? undefined;
  const domainId = url.searchParams.get(`domainId`) ?? undefined;
  const visibility = url.searchParams.get(`visibility`) ?? `accessible`;
  const rawLimit = url.searchParams.get(`limit`);
  if (userId !== undefined && !validId(userId, `User`) || cursor !== undefined && !validId(cursor, `Domain`) || domainId !== undefined && !validId(domainId, `Domain`)) throw new DomainDataError(400, `Choose Valid User And Domain Record IDs`);
  if (![`public`, `accessible`].includes(visibility) || rawLimit !== null && (!/^\d{1,3}$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > 100)
    || cursor !== undefined && domainId !== undefined) throw new DomainDataError(400, `Use A Limit From 1 To 100 And Either A Cursor Or Domain ID`);
  return { userId, cursor, domainId, limit: rawLimit === null ? 50 : Number(rawLimit), visibility: visibility as DomainDataQuery[`visibility`] };
};
export const handleDomainData = async (request: Request): Promise<Response> => {
  if (request.method !== `GET`) return Response.json({ error: `Use GET To Fetch Domain Data` }, { status: 405, headers: { ...headers, Allow: `GET` } });
  const controller = new AbortController();
  const abort = () => controller.abort();
  request.signal.addEventListener(`abort`, abort, { once: true });
  if (request.signal.aborted) abort();
  const timeout = setTimeout(abort, 25_000);
  let admitted = false;
  try {
    const url = new URL(request.url);
    const site = request.headers.get(`sec-fetch-site`);
    const origin = request.headers.get(`origin`);
    if (site && ![`same-origin`, `none`].includes(site) || origin && origin !== url.origin) throw new DomainDataError(403, `Cross-Origin Domain Data Requests Are Not Allowed`);
    if (request.body || Number(request.headers.get(`content-length`) ?? 0) > 0) throw new DomainDataError(400, `Send Domain Options In The URL`);
    const authorization = request.headers.get(`authorization`);
    if (authorization !== null && (!/^Bearer [A-Za-z0-9._-]+$/.test(authorization) || authorization.length > 8_192)) throw new DomainDataError(401, `Send A Valid Firebase Bearer Token`);
    const query = parseQuery(url);
    if (activeRequests >= 8) throw new DomainDataError(429, `Domain Data Is Busy — Try Again Later`);
    activeRequests += 1;
    admitted = true;
    const result = await fetchDomainData(query, authorization?.slice(7), controller.signal);
    if (controller.signal.aborted) throw new DomainDataError(504, `Domain Data Request Timed Out Or Was Cancelled`);
    const text = JSON.stringify(result);
    if (new TextEncoder().encode(text).byteLength > MAX_DOMAIN_DATA_BYTES) throw new DomainDataError(413, `Domain Data Exceeds The Size Limit — Request Fewer Records`);
    return new Response(text, { headers: { ...headers, 'Content-Type': `application/json; charset=utf-8` } });
  } catch (failure) {
    const error = failure instanceof DomainDataError ? failure : failure instanceof RegistrarRelayError ? new DomainDataError(failure.status, failure.status === 401 ? `Sign In Again To Fetch Domain Data` : failure.status === 403 ? `Your Account Does Not Have Access To This Domain Data` : `Account Access Could Not Be Confirmed`)
      : new DomainDataError(controller.signal.aborted ? 504 : 502, controller.signal.aborted ? `Domain Data Request Timed Out Or Was Cancelled` : `Domain Data Could Not Be Loaded`);
    return Response.json({ error: error.message }, { status: error.status, headers });
  } finally {
    if (admitted) activeRequests -= 1;
    clearTimeout(timeout);
    request.signal.removeEventListener(`abort`, abort);
  }
};
