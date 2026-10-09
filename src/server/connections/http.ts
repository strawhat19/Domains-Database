import { RegistrarRelayError } from '../registrars/errors';
import { importEnvironmentConnections } from './environment';
import { checkRequest, readRequestRecord, responseHeaders } from '../registrars/http';
import { connectionFields, type ConnectionProvider } from '../../shared/connections/types';
import { requireSignedInUser, verifyFirebaseToken, type ImportFirebaseContext } from './firebase';

export const handleEnvironmentConnectionImport = async (request: Request): Promise<Response> => {
  const token = /^Bearer ([A-Za-z0-9._-]{1,8192})$/i.exec(request.headers.get(`authorization`) ?? ``)?.[1];
  const context: ImportFirebaseContext = {
    token: token ?? ``,
    readVersions: new Map(),
    signal: AbortSignal.any([request.signal, AbortSignal.timeout(30_000)]),
  };
  try {
    checkRequest(request);
    if (!token) throw new RegistrarRelayError(401, `Sign In To Import Connections`);
    const record = await readRequestRecord(request);
    const selected = record.providers ?? connectionFields.map(field => field.id);
    if (Object.keys(record).some(key => key !== `providers`) || !Array.isArray(selected) || !selected.length
      || selected.length > connectionFields.length || new Set(selected).size !== selected.length
      || selected.some(provider => !connectionFields.some(field => field.id === provider))) throw new RegistrarRelayError(400, `Choose Supported Connection Providers`);
    const firebaseUid = await verifyFirebaseToken(context);
    const userId = await requireSignedInUser(firebaseUid, context);
    const result = importEnvironmentConnections(userId, selected as ConnectionProvider[]);
    return Response.json(result, { headers: responseHeaders });
  } catch (failure) {
    const error = failure instanceof RegistrarRelayError ? failure : new RegistrarRelayError(context.signal.aborted ? 504 : 503,
      context.signal.aborted ? `Connection Import Timed Out Or Was Cancelled` : `Connection Import Could Not Be Completed`);
    return Response.json({ error: error.message }, { status: error.status, headers: responseHeaders });
  }
};
