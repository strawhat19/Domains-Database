import { getGoDaddyParkingMetrics } from './provider';
import { getBillingDatabase } from '../billing/firebase';
import { requireRegistrarAccess } from '../featureAccess/auth';
import { RegistrarRelayError } from '../registrars/errors';
import { parseCredentials } from '../registrars/credentials';
import { providerName } from '../registrars/validation';
import { getAppCollectionIDNumber } from '../../shared/common/ids';
import { checkRequest, readRequestRecord, responseHeaders } from '../registrars/http';

const headers = { ...responseHeaders, Vary: `Authorization` };
const usage = new Map<string, { count: number; expires: number }>();
const pending = new Set<string>();
const readId = (id: unknown, type: `Connection` | `Domain`) => typeof id === `string` && id.length <= 240 && !id.includes(`/`) ? getAppCollectionIDNumber(id, type) : 0;

export const handleDomainParking = async (request: Request): Promise<Response> => {
  const error = (message: string, status: number) => Response.json({ error: message }, { headers, status });
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]);
  try {
    checkRequest(request);
    const { actor } = await requireRegistrarAccess(request, `godaddy`);
    if (!actor) return error(`Sign In To Check GoDaddy Parking Metrics`, 401);
    const input = await readRequestRecord(request);
    const { domainId, connectionId } = input;
    const domainNumber = readId(domainId, `Domain`);
    const connectionNumber = readId(connectionId, `Connection`);
    if (Object.keys(input).length !== 2 || !domainNumber || !connectionNumber) return error(`Choose A Saved Domain And GoDaddy Connection`, 400);
    if (signal.aborted) return error(`Parking Metrics Request Timed Out`, 504);
    const now = Date.now();
    for (const [id, entry] of usage) if (entry.expires <= now) usage.delete(id);
    const previous = usage.get(actor.id);
    if (pending.size >= 8 || pending.has(actor.id) || (previous?.count ?? 0) >= 6 || (!previous && usage.size >= 256)) {
      return error(`Too Many Parking Lookups — Try Again Shortly`, 429);
    }
    pending.add(actor.id);
    usage.set(actor.id, { count: (previous?.count ?? 0) + 1, expires: previous?.expires ?? now + 60_000 });
    try {
      const account = getBillingDatabase().doc(`users/${actor.id}`);
      const domainRef = account.collection(`domains`).doc(String(domainId));
      const connectionRef = account.collection(`connections`).doc(String(connectionId));
      const [savedDomain, savedConnection] = await Promise.all([domainRef.get(), connectionRef.get()]);
      const domain = savedDomain.data();
      const connection = savedConnection.data();
      if (domain?.uid !== actor.id || domain.id !== domainId || domain.number !== domainNumber || domain.type !== `Domain` || domain.isSample === true) {
        return error(`This Saved Domain Could Not Be Found`, 404);
      }
      if (connection?.provider !== `godaddy` || connection.id !== connectionId || connection.number !== connectionNumber || typeof connection.values !== `string`) {
        return error(`This Saved GoDaddy Connection Is Unavailable`, 404);
      }
      const credentials = parseCredentials(`godaddy`, connection.values);
      if (credentials.provider !== `godaddy` || !credentials.lookupAuthorization) return error(`Save A GoDaddy Classic Key And Secret To Check Parking Metrics`, 403);
      const result = await getGoDaddyParkingMetrics(providerName(domain.name, `godaddy`), credentials.lookupAuthorization, signal);
      const [currentDomain, currentConnection] = await Promise.all([domainRef.get(), connectionRef.get()]);
      if (currentDomain.get(`name`) !== domain.name || currentDomain.get(`uid`) !== actor.id || !savedConnection.updateTime || !currentConnection.updateTime?.isEqual(savedConnection.updateTime)) {
        return error(`The Saved Domain Or Connection Changed — Try Again`, 409);
      }
      if (signal.aborted) return error(`Parking Metrics Request Timed Out`, 504);
      return Response.json(result, { headers });
    } finally { pending.delete(actor.id); }
  } catch (failure) {
    if (signal.aborted) return error(`Parking Metrics Request Timed Out`, 504);
    if (failure instanceof RegistrarRelayError) return error(failure.message, failure.status);
    return error(`GoDaddy Parking Metrics Could Not Be Loaded`, 502);
  }
};
