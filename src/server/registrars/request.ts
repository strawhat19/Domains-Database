import { MAX_REQUEST_BYTES, MAX_RESPONSE_BYTES } from './validation';
import type { ConnectionProvider } from '../../shared/connections/types';
import { providerLabels, RegistrarRelayError, upstreamError } from './errors';

export interface RegistrarRequestContext {
  deadline: number;
  signal: AbortSignal;
  provider: ConnectionProvider;
  operation?: `appraisal`;
}

interface RegistrarRequestOptions {
  body: string;
  method: `POST`;
}

const upstreamPaths = {
  vercel: `https://api.vercel.com/v5/domains`,
  godaddy: `https://api.godaddy.com/v1/domains`,
  namecheap: `https://api.namecheap.com/xml.response`,
  namesilo: `https://www.namesilo.com/apibatch/listDomains`,
  porkbun: `https://api.porkbun.com/api/json/v3/domain/listAll`,
  hostinger: `https://developers.hostinger.com/api/domains/v1/portfolio`,
  squarespace: `https://api.squarespace.com/reseller/v1/domains`,
};

const goDaddyDetailPath = /^\/v2\/customers\/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\/domains\/[a-z0-9.-]+$/i;
const goDaddyShopperPath = /^\/v1\/shoppers\/(?:MY|\d{1,10})$/;
const hostingerDetailPath = /^\/api\/domains\/v1\/portfolio\/(?=[a-z0-9.-]{1,253}$)[a-z0-9-]+(?:\.[a-z0-9-]+)+$/;
const squarespaceDetailPath = /^\/reseller\/v1\/domains\/(?=[a-z0-9.-]{1,253}$)[a-z0-9-]+(?:\.[a-z0-9-]+)+$/;

export const readLimitedText = async (
  body: ReadableStream<Uint8Array> | null,
  maximum: number,
  signal: AbortSignal,
  exceeded: RegistrarRelayError,
): Promise<string> => {
  if (!body) return ``;
  let size = 0;
  let text = ``;
  let complete = false;
  const reader = body.getReader();
  const decoder = new TextDecoder(`utf-8`, { fatal: true });
  const abort = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener(`abort`, abort, { once: true });
  if (signal.aborted) abort();
  try {
    while (true) {
      if (signal.aborted) throw new RegistrarRelayError(504, `Registrar Request Timed Out Or Was Cancelled`);
      const result = await reader.read();
      if (signal.aborted) throw new RegistrarRelayError(504, `Registrar Request Timed Out Or Was Cancelled`);
      if (result.done) {
        text += decoder.decode();
        complete = true;
        return text;
      }
      size += result.value.byteLength;
      if (size > maximum) throw exceeded;
      text += decoder.decode(result.value, { stream: true });
    }
  } finally {
    signal.removeEventListener(`abort`, abort);
    if (!complete) void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
};

export const requestRegistrar = async (
  url: URL,
  headers: Record<string, string>,
  context: RegistrarRequestContext,
  options?: RegistrarRequestOptions,
) => {
  const target = `${url.origin}${url.pathname}`;
  const goDaddyRead = context.provider === `godaddy` && url.origin === `https://api.godaddy.com`
    && (goDaddyShopperPath.test(url.pathname) || goDaddyDetailPath.test(url.pathname));
  const appraisal = context.operation === `appraisal`;
  const appraisalDomain = url.searchParams.get(`domainName`) ?? ``;
  const goDaddyAppraisal = context.provider === `godaddy` && target === `https://api.godaddy.com/v1/domains/govalues`
    && /^[a-z0-9.-]{1,253}$/.test(appraisalDomain) && url.searchParams.toString() === `domainName=${appraisalDomain}`;
  const hostingerRead = context.provider === `hostinger` && url.origin === `https://developers.hostinger.com`
    && (url.pathname === `/api/hosting/v1/websites`
      || (!url.search && hostingerDetailPath.test(url.pathname)));
  const nameSiloRead = context.provider === `namesilo` && target === `https://www.namesilo.com/apibatch/getDomainInfo`;
  const squarespaceRead = context.provider === `squarespace` && url.origin === `https://api.squarespace.com`
    && !url.search && squarespaceDetailPath.test(url.pathname);
  const squarespaceToken = context.provider === `squarespace`
    && target === `https://login.squarespace.com/api/1/login/oauth/provider/tokens` && !url.search;
  const porkbunPriceCheck = context.provider === `porkbun`
    && target === `https://api.porkbun.com/api/json/v3/domain/checkDomain` && !url.search;
  const porkbunInvoiceRead = context.provider === `porkbun` && url.origin === `https://api.porkbun.com`
    && ((url.pathname === `/api/json/v3/account/invoices` && /^start=(?:0|[1-9]\d{0,3})&limit=(?:[1-9]\d?|100)$/.test(url.searchParams.toString()))
      || (!url.search && /^\/api\/json\/v3\/account\/invoice\/[1-9]\d{0,15}$/.test(url.pathname)));
  const vercelPriceCheck = context.provider === `vercel`
    && target === `https://api.vercel.com/v1/registrar/domains/price`
    && (!url.search || /^teamId=team_[a-z0-9]+$/i.test(url.searchParams.toString()));
  const inventoryRead = target === upstreamPaths[context.provider] && (context.provider !== `namecheap`
    || [`namecheap.domains.getList`, `namecheap.users.getPricing`, `namecheap.domains.dns.getList`, `namecheap.domains.getContacts`].includes(url.searchParams.get(`Command`) ?? ``));
  const permitted = options
    ? (squarespaceToken || porkbunPriceCheck || vercelPriceCheck) && options.method === `POST` && typeof options.body === `string`
      && new TextEncoder().encode(options.body).byteLength <= MAX_REQUEST_BYTES
    : inventoryRead || goDaddyRead || hostingerRead || nameSiloRead || squarespaceRead || porkbunInvoiceRead;
  if (!(appraisal ? goDaddyAppraisal && !options : permitted) || url.username || url.password || url.hash) {
    throw new RegistrarRelayError(500, `Registrar Request Is Unavailable`);
  }
  const remaining = context.deadline - Date.now();
  if (remaining <= 0 || context.signal.aborted) throw new RegistrarRelayError(504, `Registrar Sync Timed Out Or Was Cancelled`);
  const controller = new AbortController();
  const abort = () => controller.abort();
  context.signal.addEventListener(`abort`, abort, { once: true });
  if (context.signal.aborted) abort();
  const timeout = setTimeout(abort, Math.min(15_000, remaining));
  try {
    const response = await fetch(url, {
      headers,
      body: options?.body,
      cache: `no-store`,
      redirect: `error`,
      credentials: `omit`,
      method: options?.method ?? `GET`,
      signal: controller.signal,
    });
    if (!response.ok) {
      void response.body?.cancel().catch(() => undefined);
      if (appraisal) throw new RegistrarRelayError(response.status, `GoDaddy GoValue Request Failed`);
      throw upstreamError(context.provider, response.status);
    }
    const contentLength = response.headers.get(`content-length`);
    const maximum = appraisal ? 64_000 : MAX_RESPONSE_BYTES;
    const tooLarge = new RegistrarRelayError(502, appraisal ? `GoDaddy GoValue Response Exceeds The Size Limit` : `${providerLabels[context.provider]} Response Exceeds The Sync Size Limit`);
    if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > maximum)) {
      void response.body?.cancel().catch(() => undefined);
      throw tooLarge;
    }
    return await readLimitedText(response.body, maximum, controller.signal, tooLarge);
  } catch (failure) {
    if (failure instanceof RegistrarRelayError) throw failure;
    if (controller.signal.aborted) throw new RegistrarRelayError(504, `${providerLabels[context.provider]} Request Timed Out Or Was Cancelled`);
    throw new RegistrarRelayError(502, `${providerLabels[context.provider]} Could Not Complete The Domain Request`);
  } finally {
    clearTimeout(timeout);
    context.signal.removeEventListener(`abort`, abort);
  }
};

export const pauseRequests = (milliseconds: number, context: RegistrarRequestContext) => new Promise<void>((resolve, reject) => {
  if (context.signal.aborted || Date.now() + milliseconds >= context.deadline) {
    reject(new RegistrarRelayError(504, `Registrar Sync Timed Out Or Was Cancelled`));
    return;
  }
  const abort = () => {
    clearTimeout(timer);
    context.signal.removeEventListener(`abort`, abort);
    reject(new RegistrarRelayError(504, `Registrar Sync Timed Out Or Was Cancelled`));
  };
  const timer = setTimeout(() => {
    context.signal.removeEventListener(`abort`, abort);
    resolve();
  }, milliseconds);
  context.signal.addEventListener(`abort`, abort, { once: true });
  if (context.signal.aborted) abort();
});
