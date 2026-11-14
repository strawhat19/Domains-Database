import { getVercelDomains } from './vercel';
import { getGoDaddyDomains } from './godaddy';
import { getPorkbunDomains } from './porkbun';
import { RegistrarRelayError } from './errors';
import { getNameSiloDomains } from './namesilo';
import { getHostingerDomains } from './hostinger';
import { getNamecheapDomains } from './namecheap';
import { getSquarespaceDomains } from './squarespace';
import type { RegistrarRequestContext } from './request';
import type { RegistrarCredentials } from './credentials';
import type { RegistrarDetailSelection, RegistrarSyncResult } from '../../shared/registrarSync/types';

const SYNC_TIMEOUT = 180_000;

export const syncRegistrar = async (
  credentials: RegistrarCredentials, signal: AbortSignal, includeDiscovery = false, detailSelection?: RegistrarDetailSelection,
): Promise<RegistrarSyncResult> => {
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
    if (credentials.provider === `vercel`) return await getVercelDomains(credentials, context, detailSelection);
    if (credentials.provider === `godaddy`) return await getGoDaddyDomains(credentials.authorization, context, credentials.customerId, credentials.lookupAuthorization, credentials.shopperId, detailSelection);
    if (credentials.provider === `hostinger`) return await getHostingerDomains(credentials.authorization, context, credentials.externalDomains, includeDiscovery, detailSelection);
    if (credentials.provider === `porkbun`) return await getPorkbunDomains(credentials, context, detailSelection);
    if (credentials.provider === `namesilo`) return await getNameSiloDomains(credentials, context, detailSelection);
    if (credentials.provider === `squarespace`) return await getSquarespaceDomains(credentials, context, detailSelection);
    return await getNamecheapDomains(credentials, context, detailSelection);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener(`abort`, abort);
  }
};
