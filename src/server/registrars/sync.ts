import { getVercelDomains } from './vercel';
import { getGoDaddyDomains } from './godaddy';
import { getPorkbunDomains } from './porkbun';
import { getNameSiloDomains } from './namesilo';
import { RegistrarRelayError } from './errors';
import { getHostingerDomains } from './hostinger';
import { getNamecheapDomains } from './namecheap';
import { getSquarespaceDomains } from './squarespace';
import type { RegistrarCredentials } from './credentials';
import type { RegistrarRequestContext } from './request';
import type { RegistrarSyncResult } from '../../shared/registrarSync/types';

const SYNC_TIMEOUT = 180_000;

export const syncRegistrar = async (credentials: RegistrarCredentials, signal: AbortSignal): Promise<RegistrarSyncResult> => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener(`abort`, abort, { once: true });
  if (signal.aborted) abort();
  const timeout = setTimeout(abort, SYNC_TIMEOUT);
  const context: RegistrarRequestContext = {
    signal: controller.signal,
    provider: credentials.provider,
    deadline: Date.now() + SYNC_TIMEOUT,
  };
  try {
    if (controller.signal.aborted) throw new RegistrarRelayError(408, `Registrar Sync Was Cancelled`);
    if (credentials.provider === `vercel`) return await getVercelDomains(credentials, context);
    if (credentials.provider === `godaddy`) return await getGoDaddyDomains(credentials.authorization, context, credentials.customerId, credentials.lookupAuthorization, credentials.shopperId);
    if (credentials.provider === `hostinger`) return await getHostingerDomains(credentials.authorization, context, credentials.externalDomains);
    if (credentials.provider === `porkbun`) return await getPorkbunDomains(credentials, context);
    if (credentials.provider === `namesilo`) return await getNameSiloDomains(credentials, context);
    if (credentials.provider === `squarespace`) return await getSquarespaceDomains(credentials, context);
    return await getNamecheapDomains(credentials, context);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener(`abort`, abort);
  }
};
