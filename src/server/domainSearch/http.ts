import { searchVercel } from './vercel';
import { RegistrarRelayError } from '../registrars/errors';
import { searchRegistrar, searchGoDaddyBatch } from './providers';
import { normalizeDomainName } from '../../shared/domainUtils';
import { getRequestPlanAccess, requireRegistrarAccess } from '../featureAccess/auth';
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
    if (Array.isArray(record.domains)) {
      if (record.provider !== `godaddy` || Object.keys(record).some(key => ![`domains`, `provider`, `values`].includes(key))
        || !record.domains.length || record.domains.length > 25 || record.domains.some(value => typeof value !== `string` || value.length > 500)) {
        throw new RegistrarRelayError(400, `Enter Between 1 And 25 GoDaddy Domains`);
      }
      let domains: string[];
      try { domains = [...new Set(record.domains.map(value => normalizeDomainName(value)))]; }
      catch { throw new RegistrarRelayError(400, `Enter Valid Domain Names Without Paths Or Logins`); }
      const access = await requireRegistrarAccess(request, `godaddy`, !Object.prototype.hasOwnProperty.call(record, `values`));
      const credentials = readSearchCredentials(record);
      if (credentials.provider !== `godaddy`) throw new RegistrarRelayError(400, `Choose GoDaddy For Batch Search`);
      const results = await searchGoDaddyBatch(credentials, domains, controller.signal);
      if (controller.signal.aborted) throw new RegistrarRelayError(504, `Domain Search Timed Out Or Cancelled`);
      return Response.json({ results: access.paid ? results : results.map(({ registration, renewal, ...availability }) => availability) }, { headers: responseHeaders });
    }
    if (Object.keys(record).some(key => ![`domain`, `provider`, `values`].includes(key))) throw new RegistrarRelayError(400, `Enter Valid Search Values`);
    if (typeof record.domain !== `string` || record.domain.length > 500) throw new RegistrarRelayError(400, `Enter A Valid Domain Name`);
    let domain: string;
    try { domain = normalizeDomainName(record.domain); }
    catch { throw new RegistrarRelayError(400, `Enter A Domain Name Without A Path Or Login`); }
    const publicVercel = record.provider === `vercel` && !Object.prototype.hasOwnProperty.call(record, `values`);
    const access = publicVercel ? await getRequestPlanAccess(request, true) : await requireRegistrarAccess(request, String(record.provider), !Object.prototype.hasOwnProperty.call(record, `values`));
    const result = record.provider === `vercel` && !Object.prototype.hasOwnProperty.call(record, `values`) ? await searchVercel(domain, controller.signal)
      : await searchRegistrar(readSearchCredentials(record), domain, controller.signal);
    if (controller.signal.aborted) throw new RegistrarRelayError(504, `Domain Search Timed Out Or Cancelled`);
    const { registration, renewal, ...availability } = result;
    return Response.json(access.paid ? result : availability, { headers: responseHeaders });
  } catch (failure) {
    const error = failure instanceof RegistrarRelayError ? failure
      : new RegistrarRelayError(502, controller.signal.aborted ? `Domain Search Timed Out Or Cancelled` : `Domain Search Could Not Be Completed`);
    return Response.json({ error: error.message }, { status: error.status, headers: responseHeaders });
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener(`abort`, abort);
  }
};
