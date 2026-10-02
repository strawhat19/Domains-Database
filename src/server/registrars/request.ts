import { MAX_RESPONSE_BYTES } from './validation';
import type { ConnectionProvider } from '../../shared/connections/types';
import { providerLabels, RegistrarRelayError, upstreamError } from './errors';

export interface RegistrarRequestContext {
  deadline: number;
  signal: AbortSignal;
  provider: ConnectionProvider;
}

const upstreamPaths = {
  godaddy: `https://api.godaddy.com/v1/domains`,
  namecheap: `https://api.namecheap.com/xml.response`,
  namesilo: `https://www.namesilo.com/apibatch/listDomains`,
  porkbun: `https://api.porkbun.com/api/json/v3/domain/listAll`,
  hostinger: `https://developers.hostinger.com/api/domains/v1/portfolio`,
};

const goDaddyDetailPath = /^\/v2\/customers\/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\/domains\/[a-z0-9.-]+$/i;

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

export const requestRegistrar = async (url: URL, headers: Record<string, string>, context: RegistrarRequestContext) => {
  const target = `${url.origin}${url.pathname}`;
  const goDaddyRead = context.provider === `godaddy` && url.origin === `https://api.godaddy.com`
    && (url.pathname === `/v1/shoppers/MY` || goDaddyDetailPath.test(url.pathname));
  const hostingerRead = context.provider === `hostinger` && target === `https://developers.hostinger.com/api/hosting/v1/websites`;
  if ((target !== upstreamPaths[context.provider] && !goDaddyRead && !hostingerRead) || url.username || url.password || url.hash) {
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
      method: `GET`,
      cache: `no-store`,
      redirect: `error`,
      credentials: `omit`,
      signal: controller.signal,
    });
    if (!response.ok) {
      void response.body?.cancel().catch(() => undefined);
      throw upstreamError(context.provider, response.status);
    }
    const contentLength = response.headers.get(`content-length`);
    if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_RESPONSE_BYTES)) {
      void response.body?.cancel().catch(() => undefined);
      throw new RegistrarRelayError(502, `${providerLabels[context.provider]} Response Exceeds The Sync Size Limit`);
    }
    return await readLimitedText(response.body, MAX_RESPONSE_BYTES, controller.signal,
      new RegistrarRelayError(502, `${providerLabels[context.provider]} Response Exceeds The Sync Size Limit`));
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
