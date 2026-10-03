import { searchRegistrar } from './providers';
import { RegistrarRelayError } from '../registrars/errors';
import { normalizeDomainName } from '../../shared/domainUtils';
import { readSearchCredentials, getEnvironmentSearchProviders } from './environment';
import { checkRequest, responseHeaders, readRequestRecord } from '../registrars/http';

export const handleDomainSearchProviders = (request: Request): Response => {
  try {
    checkRequest(request, false);
    return Response.json({ providers: getEnvironmentSearchProviders() }, { headers: responseHeaders });
  } catch (failure) {
    const error = failure instanceof RegistrarRelayError ? failure
      : new RegistrarRelayError(502, `Domain Search Providers Could Not Be Loaded`);
    return Response.json({ error: error.message }, { status: error.status, headers: responseHeaders });
  }
};

export const handleDomainSearch = async (request: Request) => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  request.signal.addEventListener(`abort`, abort, { once: true });
  if (request.signal.aborted) abort();
  const timeout = setTimeout(abort, 60_000);
  try {
    checkRequest(request);
    const record = await readRequestRecord(request);
    if (Object.keys(record).some(key => ![`domain`, `provider`, `values`].includes(key))) throw new RegistrarRelayError(400, `Enter Valid Search Values`);
    if (typeof record.domain !== `string` || record.domain.length > 500) throw new RegistrarRelayError(400, `Enter A Valid Domain Name`);
    let domain: string;
    try { domain = normalizeDomainName(record.domain); }
    catch { throw new RegistrarRelayError(400, `Enter A Domain Name Without A Path Or Login`); }
    const credentials = readSearchCredentials(record);
    const result = await searchRegistrar(credentials, domain, controller.signal);
    if (controller.signal.aborted) throw new RegistrarRelayError(504, `Domain Search Timed Out Or Cancelled`);
    return Response.json(result, { headers: responseHeaders });
  } catch (failure) {
    const error = failure instanceof RegistrarRelayError ? failure
      : new RegistrarRelayError(502, controller.signal.aborted ? `Domain Search Timed Out Or Cancelled` : `Domain Search Could Not Be Completed`);
    return Response.json({ error: error.message }, { status: error.status, headers: responseHeaders });
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener(`abort`, abort);
  }
};
