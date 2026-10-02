import type { RegistrarSyncResult } from './types';
import type { ConnectionProvider } from '../connections/types';

export const getRegistrarDomains = async (provider: ConnectionProvider, values: string, signal: AbortSignal): Promise<RegistrarSyncResult> => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener(`abort`, abort, { once: true });
  if (signal.aborted) controller.abort();
  const timeout = setTimeout(abort, 240_000);
  try {
    const response = await fetch(`/api/registrars/sync`, {
      method: `POST`,
      credentials: `omit`,
      signal: controller.signal,
      headers: { 'Content-Type': `application/json` },
      body: JSON.stringify({ provider, values }),
    });
    const result = await response.json().catch(() => null) as (RegistrarSyncResult & { error?: string }) | null;
    if (!response.ok) throw new Error(result?.error || `Registrar Sync Is Unavailable — Restart Expo And Try Again`);
    if (!Array.isArray(result?.domains) || result.domains.length > 10000) throw new Error(`Registrar Returned An Invalid Domain List`);
    if (result.discoveredDomains !== undefined && (!Array.isArray(result.discoveredDomains) || result.discoveredDomains.length > 10000)) throw new Error(`Registrar Returned Invalid Discovered Domains`);
    return { domains: result.domains, discoveredDomains: result.discoveredDomains,
      warnings: Array.isArray(result?.warnings) ? result.warnings.filter(message => typeof message === `string`) : [] };
  } catch (failure) {
    if (controller.signal.aborted) throw new Error(signal.aborted ? `Registrar Sync Cancelled` : `Registrar Request Timed Out`);
    if (failure instanceof TypeError) throw new Error(`Could Not Reach Registrar Sync — Restart Expo And Try Again`);
    throw failure;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener(`abort`, abort);
  }
};
