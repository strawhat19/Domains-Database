import { parseConnectionEnvironment } from './file';
import { getFirebaseAuth } from '../firebase/client';
import { connectionFields, type ConnectionProvider, type EnvironmentImportResult } from './types';

export const requestEnvironmentConnectionsImport = async (userId: string, firebaseUid: string, providers?: readonly ConnectionProvider[], signal?: AbortSignal): Promise<EnvironmentImportResult> => {
  const authUser = getFirebaseAuth().currentUser;
  if (!authUser || authUser.uid !== firebaseUid) throw new Error(`Sign In To Import Connections`);
  const token = await authUser.getIdToken();
  if (getFirebaseAuth().currentUser?.uid !== firebaseUid || signal?.aborted) throw new Error(`Your Account Changed — Try Again`);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener(`abort`, abort, { once: true });
  const timeout = setTimeout(abort, 60_000);
  try {
    const response = await fetch(`/api/connections/environment`, {
      method: `POST`,
      cache: `no-store`,
      credentials: `omit`,
      signal: controller.signal,
      body: JSON.stringify(providers ? { providers } : {}),
      headers: { 'Content-Type': `application/json`, Authorization: `Bearer ${token}` },
    });
    const result = await response.json().catch(() => null) as (EnvironmentImportResult & { error?: string }) | null;
    if (!response.ok) throw new Error(result?.error || `Could Not Import Connections From .env`);
    if (getFirebaseAuth().currentUser?.uid !== firebaseUid || signal?.aborted) throw new Error(`Your Account Changed — Try Again`);
    if (result?.userId !== userId || !Number.isSafeInteger(result.skipped) || result.skipped < 0
      || !Array.isArray(result.connections) || result.connections.length > connectionFields.length
      || new Set(result.connections.map(connection => connection?.provider)).size !== result.connections.length
      || result.connections.some(connection => !connection || typeof connection.values !== `string` || !connection.values.trim()
        || connection.values.length > 12_000 || (providers && !providers.includes(connection.provider))
        || !connectionFields.some(field => field.id === connection.provider))) {
      throw new Error(`Could Not Read The Connection Import Result`);
    }
    try {
      for (const connection of result.connections) {
        const parsed = parseConnectionEnvironment(connection.values, [connection.provider]);
        if (parsed.ignored || parsed.connections.length !== 1 || parsed.connections[0]?.provider !== connection.provider) throw new Error();
      }
    } catch { throw new Error(`Could Not Read The Connection Import Result`); }
    return { userId, skipped: result.skipped, connections: result.connections.map(({ values, provider }) => ({ values, provider })) };
  } catch (failure) {
    if (controller.signal.aborted) throw new Error(signal?.aborted ? `Connection Import Cancelled` : `Connection Import Timed Out — Try Again`);
    if (failure instanceof TypeError) throw new Error(`Could Not Reach Connection Import — Restart Expo And Try Again`);
    throw failure;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener(`abort`, abort);
  }
};
