import { requestGoValue } from './provider';
import { BillingError } from '../billing/types';
import { providerName } from '../registrars/validation';
import { RegistrarRelayError } from '../registrars/errors';
import { parseCredentials } from '../registrars/credentials';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { getBillingDatabase, requireBillingActor } from '../billing/firebase';
import type { DomainAppraisalResult } from '../../shared/domainAppraisal/types';
import { checkRequest, readRequestRecord, responseHeaders } from '../registrars/http';
import { getAppCollectionIDNumber, isAppCollectionID } from '../../shared/common/ids';

const minute = 60_000;
const cacheLifetime = 24 * 60 * minute;
const results = new Map<string, { expires: number; result: DomainAppraisalResult }>();
const usage = new Map<string, { expires: number; count: number }>();
const pending = new Set<string>();
let activeRequests = 0;

const unavailable = (message: string): DomainAppraisalResult => ({ status: `unavailable`, message });
const busy = (retryAt?: string): DomainAppraisalResult => ({ status: `rate-limited`, retryAt, message: `Too Many Appraisal Requests — Try Again Shortly` });
const reply = (result: DomainAppraisalResult, status = result.status === `rate-limited` ? 429 : 200) => {
  const retryAfter = result.status === `rate-limited` && result.retryAt ? Math.max(1, Math.ceil((Date.parse(result.retryAt) - Date.now()) / 1_000)) : undefined;
  return Response.json(result, { status, headers: retryAfter ? { ...responseHeaders, 'Retry-After': String(retryAfter) } : responseHeaders });
};

const saveResult = (key: string, result: DomainAppraisalResult, expires: number) => {
  results.delete(key);
  results.set(key, { result, expires });
  if (results.size > 512) results.delete(results.keys().next().value!);
};

const readSavedResult = (key: string, now: number) => {
  const saved = results.get(key);
  if (saved && saved.expires > now) return saved.result;
  results.delete(key);
};

const validConnection = (connection: DocumentSnapshot) => {
  const data = connection.data();
  const number = getAppCollectionIDNumber(connection.id, `Connection`);
  return number > 0 && data?.provider === `godaddy` && data.id === connection.id && data.number === number
    && typeof data.values === `string` && Boolean(data.values.trim());
};

const reserveLookup = (userId: string, now: number) => {
  for (const [id, entry] of usage) if (entry.expires <= now) usage.delete(id);
  const current = usage.get(userId);
  if (current && current.count >= 8) return busy(new Date(current.expires).toISOString());
  if (!current && usage.size >= 256 || pending.has(userId)) return busy();
  usage.set(userId, { count: (current?.count ?? 0) + 1, expires: current?.expires ?? now + minute });
  pending.add(userId);
};

export const handleDomainAppraisal = async (request: Request): Promise<Response> => {
  if (activeRequests >= 8) return reply(busy());
  activeRequests += 1;
  try {
    checkRequest(request);
    const actor = await requireBillingActor(request);
    const input = await readRequestRecord(request);
    const id = input.domainId;
    if (Object.keys(input).some(key => key !== `domainId`) || typeof id !== `string` || id.length > 240 || id.includes(`/`) || !isAppCollectionID(id, `Domain`)) {
      return reply(unavailable(`Choose A Saved Domain To Check Its Appraisal`), 400);
    }
    const account = getBillingDatabase().doc(`users/${actor.id}`);
    const saved = (await account.collection(`domains`).doc(id).get()).data();
    if (saved?.uid !== actor.id || saved.id !== id || saved.type !== `Domain` || saved.isSample === true
      || saved.number !== getAppCollectionIDNumber(id, `Domain`)) return reply(unavailable(`This Saved Domain Could Not Be Found`), 404);

    const domain = providerName(saved.name, `godaddy`);
    const connections = account.collection(`connections`);
    const registrarConnectionId = saved.meta?.registrarConnectionId;
    const preferred = typeof registrarConnectionId === `string` && registrarConnectionId.length <= 240 && !registrarConnectionId.includes(`/`)
      && isAppCollectionID(registrarConnectionId, `Connection`) ? await connections.doc(registrarConnectionId).get() : undefined;
    const connection = preferred && validConnection(preferred) ? preferred : (await connections.where(`provider`, `==`, `godaddy`)
      .select(`provider`, `id`, `number`, `values`).limit(100).get()).docs.filter(validConnection).sort((left, right) => left.get(`number`) - right.get(`number`))?.[0];
    if (!connection) return reply({ status: `connection-required`, message: `Save A GoDaddy Connection To Check Its GoValue Estimate` });

    let credentials: ReturnType<typeof parseCredentials>;
    try { credentials = parseCredentials(`godaddy`, connection.get(`values`)); }
    catch { return reply({ status: `access-required`, message: `Check The Saved GoDaddy Token Or API Credentials` }); }
    if (credentials.provider !== `godaddy`) return reply(unavailable(`GoDaddy GoValue Is Temporarily Unavailable — Try Again`), 503);

    const scope = [actor.id, connection.id, connection.updateTime?.seconds, connection.updateTime?.nanoseconds];
    const key = JSON.stringify([...scope, domain]);
    const cooldownKey = JSON.stringify(scope);
    const now = Date.now();
    if (request.signal.aborted) return reply(unavailable(`Appraisal Request Was Cancelled`), 504);
    const cached = readSavedResult(key, now) ?? readSavedResult(cooldownKey, now);
    if (cached) return reply(cached);

    const limited = reserveLookup(actor.id, now);
    if (limited) return reply(limited);
    try {
      const result = await requestGoValue(domain, credentials.authorization, request.signal);
      if (result.status === `available` || result.status === `not-found` || result.status === `unsupported-tld`) saveResult(key, result, now + cacheLifetime);
      if (result.status === `rate-limited` && result.retryAt) saveResult(cooldownKey, result, Date.parse(result.retryAt));
      return reply(result, result.status === `unavailable` ? 502 : undefined);
    } finally { pending.delete(actor.id); }
  } catch (failure) {
    if (failure instanceof BillingError && failure.status === 401) return reply(unavailable(`Sign In To Check Domain Appraisals`), 401);
    if (failure instanceof BillingError && failure.status === 403) return reply(unavailable(`This Account Is Unavailable`), 403);
    const status = failure instanceof RegistrarRelayError ? failure.status : 503;
    return reply(unavailable(`Domain Appraisal Could Not Be Loaded — Try Again`), status);
  } finally { activeRequests -= 1; }
};
