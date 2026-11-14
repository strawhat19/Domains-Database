import { getGoDaddyDns } from './provider';
import { getBillingDatabase } from '../billing/firebase';
import { RegistrarRelayError } from '../registrars/errors';
import { parseCredentials } from '../registrars/credentials';
import { requireRegistrarAccess } from '../featureAccess/auth';
import { getAppCollectionIDNumber } from '../../shared/common/ids';
import { checkRequest, readRequestRecord, responseHeaders } from '../registrars/http';

const headers = { ...responseHeaders, Vary: `Authorization` };
const pending = new Set<string>();
const recent = new Map<string, number>();
const readId = (id: unknown, type: `Connection` | `Domain`) => typeof id === `string` && id.length <= 240 && !id.includes(`/`) && !id.includes(`\\`)
  ? getAppCollectionIDNumber(id, type) : 0;

export const handleDomainDns = async (request: Request): Promise<Response> => {
  const error = (message: string, status: number) => Response.json({ error: message }, { headers, status });
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(23_000)]);
  try {
    checkRequest(request);
    const { actor } = await requireRegistrarAccess(request, `godaddy`);
    if (!actor) return error(`Sign In To View GoDaddy DNS Records`, 401);
    const input = await readRequestRecord(new Request(request, { signal }));
    const id = input.domainId;
    const number = readId(id, `Domain`);
    if (Object.keys(input).length !== 1 || !number) return error(`Choose A Saved GoDaddy Domain`, 400);
    if (signal.aborted) return error(`GoDaddy DNS Request Timed Out`, 504);
    const now = Date.now();
    for (const [key, time] of recent) if (time <= now) recent.delete(key);
    if (pending.size >= 8 || pending.has(actor.id) || recent.has(actor.id) || recent.size >= 256) {
      return error(`Too Many DNS Lookups — Try Again Shortly`, 429);
    }
    pending.add(actor.id);
    recent.set(actor.id, now + 60_000);
    try {
      const account = getBillingDatabase().doc(`users/${actor.id}`);
      const domainRef = account.collection(`domains`).doc(String(id));
      const savedDomain = await domainRef.get();
      const domain = savedDomain.data();
      const connectionId = domain?.meta?.registrarConnectionId;
      const connectionNumber = readId(connectionId, `Connection`);
      if (domain?.uid !== actor.id || domain.id !== id || domain.number !== number || domain.type !== `Domain` || domain.isSample === true) {
        return error(`This Saved Domain Could Not Be Found`, 404);
      }
      if (domain.registrar !== `GoDaddy` || domain.meta?.domainSource !== `registrar` || domain.meta?.registrarProvider !== `godaddy`
        || domain.meta?.externalRegistration === true || !connectionNumber || typeof domain.name !== `string`
        || typeof domain.providerId !== `string` || !/^[1-9]\d{0,15}$/.test(domain.providerId) || !Number.isSafeInteger(Number(domain.providerId))) {
        return error(`Sync This Domain Through Its GoDaddy Registration Connection First`, 409);
      }
      const connectionRef = account.collection(`connections`).doc(String(connectionId));
      if (signal.aborted) return error(`GoDaddy DNS Request Timed Out`, 504);
      const savedConnection = await connectionRef.get();
      const connection = savedConnection.data();
      if (connection?.provider !== `godaddy` || connection.id !== connectionId || connection.number !== connectionNumber || typeof connection.values !== `string`) {
        return error(`This Saved GoDaddy Connection Is Unavailable`, 404);
      }
      const credentials = parseCredentials(`godaddy`, connection.values);
      if (credentials.provider !== `godaddy` || !credentials.authorization.startsWith(`Bearer `)) {
        return error(`Save A GoDaddy Personal Access Token With Domain Read Access To View DNS Records`, 403);
      }
      if (signal.aborted) return error(`GoDaddy DNS Request Timed Out`, 504);
      const result = await getGoDaddyDns(domain.name, domain.providerId, credentials.authorization, signal);
      const [currentDomain, currentConnection] = await Promise.all([domainRef.get(), connectionRef.get()]);
      if (!savedDomain.updateTime || !currentDomain.updateTime?.isEqual(savedDomain.updateTime)
        || !savedConnection.updateTime || !currentConnection.updateTime?.isEqual(savedConnection.updateTime)) {
        return error(`The Saved Domain Or Connection Changed — Try Again`, 409);
      }
      if (signal.aborted) return error(`GoDaddy DNS Request Timed Out`, 504);
      return Response.json(result, { headers });
    } finally { pending.delete(actor.id); }
  } catch (failure) {
    if (signal.aborted) return error(`GoDaddy DNS Request Timed Out`, 504);
    if (failure instanceof RegistrarRelayError) return error(failure.message, failure.status);
    return error(`GoDaddy DNS Records Could Not Be Loaded`, 502);
  }
};
