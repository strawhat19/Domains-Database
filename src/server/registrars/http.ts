import { syncRegistrar } from './sync';
import { readLimitedText } from './request';
import { RegistrarRelayError } from './errors';
import { MAX_REQUEST_BYTES } from './validation';
import { parseCredentials } from './credentials';
import type { ConnectionProvider } from '../../shared/connections/types';

export const responseHeaders = {
  Pragma: `no-cache`,
  'Referrer-Policy': `no-referrer`,
  'X-Content-Type-Options': `nosniff`,
  'Cache-Control': `no-store, private, max-age=0`,
};

export const checkRequest = (request: Request, requireJson = true) => {
  const site = request.headers.get(`sec-fetch-site`);
  const origin = request.headers.get(`origin`);
  if (site && ![`same-origin`, `none`].includes(site)) throw new RegistrarRelayError(403, `Cross-Site Registrar Requests Are Not Allowed`);
  if (origin && origin !== new URL(request.url).origin) throw new RegistrarRelayError(403, `Cross-Origin Registrar Requests Are Not Allowed`);
  const contentType = request.headers.get(`content-type`)?.split(`;`)?.[0]?.trim()?.toLowerCase();
  if (requireJson && contentType !== `application/json`) throw new RegistrarRelayError(415, `Send Registrar Connection Values As JSON`);
  const encoding = request.headers.get(`content-encoding`);
  if (encoding && encoding.toLowerCase() !== `identity`) throw new RegistrarRelayError(415, `Compressed Registrar Requests Are Not Supported`);
  const size = request.headers.get(`content-length`);
  if (size && (!/^\d+$/.test(size) || Number(size) > MAX_REQUEST_BYTES)) throw new RegistrarRelayError(413, `Registrar Request Exceeds The Size Limit`);
};

export const readRequestRecord = async (request: Request): Promise<Record<string, unknown>> => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  request.signal.addEventListener(`abort`, abort, { once: true });
  if (request.signal.aborted) abort();
  const timeout = setTimeout(abort, 15_000);
  try {
    const text = await readLimitedText(request.body, MAX_REQUEST_BYTES, controller.signal,
      new RegistrarRelayError(413, `Registrar Request Exceeds The Size Limit`));
    let input: unknown;
    try {
      input = JSON.parse(text);
    } catch {
      throw new RegistrarRelayError(400, `Enter Valid Registrar Request Values`);
    }
    if (!input || typeof input !== `object` || Array.isArray(input)) throw new RegistrarRelayError(400, `Enter Valid Registrar Request Values`);
    return input as Record<string, unknown>;
  } catch (failure) {
    if (failure instanceof RegistrarRelayError) throw failure;
    throw new RegistrarRelayError(400, `Enter Valid Registrar Request Values`);
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener(`abort`, abort);
  }
};

export const readConnectionInput = (record: Record<string, unknown>) => {
  const provider = record.provider;
  const values = record.values;
  if (provider !== `godaddy` && provider !== `hostinger` && provider !== `namecheap` && provider !== `porkbun` && provider !== `namesilo`) {
    throw new RegistrarRelayError(400, `Choose A Supported Registrar`);
  }
  if (typeof values !== `string` || !values.trim() || values.length > 12_000) throw new RegistrarRelayError(400, `Enter Valid Registrar Connection Values`);
  return { values, provider: provider as ConnectionProvider };
};

export const handleRegistrarSync = async (request: Request): Promise<Response> => {
  try {
    checkRequest(request);
    const record = await readRequestRecord(request);
    if (Object.keys(record).some(key => ![`provider`, `values`].includes(key))) throw new RegistrarRelayError(400, `Enter Valid Registrar Request Values`);
    const input = readConnectionInput(record);
    const credentials = parseCredentials(input.provider, input.values);
    const result = await syncRegistrar(credentials, request.signal);
    return Response.json(result, { headers: responseHeaders });
  } catch (failure) {
    const error = failure instanceof RegistrarRelayError
      ? failure : new RegistrarRelayError(502, `Registrar Sync Could Not Be Completed`);
    return Response.json({ error: error.message }, { status: error.status, headers: responseHeaders });
  }
};
