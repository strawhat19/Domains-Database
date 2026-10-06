import { XMLParser } from 'fast-xml-parser';
import { listVercelExtensions } from './vercel';
import { SyntaxValidator } from 'fast-xml-validator';
import { readLimitedText } from '../registrars/request';
import { readSearchCredentials, type SearchCredentials } from './environment';
import type { DomainSearchProvider } from '../../shared/domainSearch/types';
import { providerLabels, upstreamError, RegistrarRelayError } from '../registrars/errors';
import { checkRequest, responseHeaders, readRequestRecord } from '../registrars/http';

interface ExtensionCatalog {
  note?: string;
  extensions: string[];
}

const maximumCatalogBytes = 2 * 1024 * 1024;
const maximumExtensions = 5_000;
const catalogTargets: Record<DomainSearchProvider, string> = {
  vercel: `https://api.vercel.com/v1/registrar/tlds/supported`,
  godaddy: `https://api.godaddy.com/v1/domains/tlds`,
  namecheap: `https://api.namecheap.com/xml.response`,
  namesilo: `https://www.namesilo.com/apibatch/getPrices`,
  porkbun: `https://api.porkbun.com/api/json/v3/pricing/get`,
  hostinger: `https://developers.hostinger.com/api/billing/v1/catalog`,
};

const invalid = (provider: DomainSearchProvider) =>
  new RegistrarRelayError(502, `${provider === `vercel` ? `Vercel` : providerLabels[provider]} Returned An Invalid Extension Catalog`);

const record = (value: unknown, provider: DomainSearchProvider): Record<string, unknown> => {
  if (!value || typeof value !== `object` || Array.isArray(value)) throw invalid(provider);
  return value as Record<string, unknown>;
};

const json = (value: string, provider: DomainSearchProvider): unknown => {
  try { return JSON.parse(value) as unknown; }
  catch { throw invalid(provider); }
};

const normalizeExtension = (value: unknown): string | undefined => {
  if (typeof value !== `string`) return undefined;
  const name = value.trim().replace(/^\./, ``).toLowerCase();
  if (!name || name.length > 250 || /[\s:/\\@?#%]/.test(name)) return undefined;
  try {
    const hostname = new URL(`https://search.${name}`).hostname;
    if (!hostname.startsWith(`search.`)) return undefined;
    const extension = hostname.slice(7);
    if (extension.length > 189 || /^\d+$/.test(extension.split(`.`).at(-1) ?? ``)
      || extension.split(`.`).some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return undefined;
    return extension;
  } catch { return undefined; }
};

const catalog = (values: unknown[], provider: DomainSearchProvider, note?: string): ExtensionCatalog => {
  if (values.length > maximumExtensions) throw invalid(provider);
  const extensions = [...new Set(values.map(normalizeExtension).filter((value): value is string => !!value))].sort();
  if (!extensions.length) throw invalid(provider);
  return { extensions, ...(note ? { note } : {}) };
};

const requestCatalog = async (
  provider: DomainSearchProvider,
  url: URL,
  signal: AbortSignal,
  headers: Record<string, string> = {},
) => {
  if (`${url.origin}${url.pathname}` !== catalogTargets[provider] || url.username || url.password || url.hash) throw invalid(provider);
  if (provider === `namecheap` && url.searchParams.get(`Command`) !== `namecheap.domains.getTldList`) throw invalid(provider);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener(`abort`, abort, { once: true });
  if (signal.aborted) abort();
  const timeout = setTimeout(abort, 20_000);
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
      throw upstreamError(provider, response.status);
    }
    const size = response.headers.get(`content-length`);
    if (size && (!/^\d+$/.test(size) || Number(size) > maximumCatalogBytes)) {
      void response.body?.cancel().catch(() => undefined);
      throw invalid(provider);
    }
    return await readLimitedText(response.body, maximumCatalogBytes, controller.signal, invalid(provider));
  } catch (failure) {
    if (failure instanceof RegistrarRelayError) throw failure;
    throw new RegistrarRelayError(controller.signal.aborted ? 504 : 502,
      `${providerLabels[provider]} Extension Catalog ${controller.signal.aborted ? `Timed Out Or Was Cancelled` : `Is Unavailable`}`);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener(`abort`, abort);
  }
};

const namecheapExtensions = async (auth: Extract<SearchCredentials, { provider: `namecheap` }>, signal: AbortSignal) => {
  const url = new URL(catalogTargets.namecheap);
  Object.entries({
    ApiKey: auth.apiKey,
    ApiUser: auth.username,
    UserName: auth.username,
    ClientIp: auth.clientIp,
    Command: `namecheap.domains.getTldList`,
  }).forEach(([key, value]) => url.searchParams.set(key, value));
  const text = await requestCatalog(`namecheap`, url, signal);
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(text) || SyntaxValidator.validate(text) !== true) throw invalid(`namecheap`);
  const parser = new XMLParser({ parseTagValue: false, ignoreAttributes: false, removeNSPrefix: true, processEntities: false, attributeNamePrefix: ``, parseAttributeValue: false });
  let parsed: unknown;
  try { parsed = parser.parse(text); }
  catch { throw invalid(`namecheap`); }
  const response = record(record(parsed, `namecheap`).ApiResponse, `namecheap`);
  if (response.Status !== `OK`) throw new RegistrarRelayError(403, `Namecheap Requires Valid Credentials, API Access, And A Whitelisted Server IPv4`);
  const command = record(response.CommandResponse, `namecheap`);
  if (command.Type !== `namecheap.domains.getTldList`) throw invalid(`namecheap`);
  const tlds = record(command.Tlds, `namecheap`).Tld;
  const entries = tlds == null ? [] : Array.isArray(tlds) ? tlds : [tlds];
  return catalog(entries.map(value => record(value, `namecheap`).Name), `namecheap`,
    `Some Extensions Require Eligibility Details Or Registration Through Namecheap's Website`);
};

export const listRegistrarExtensions = async (auth: SearchCredentials, signal: AbortSignal): Promise<ExtensionCatalog> => {
  if (auth.provider === `vercel`) return catalog(await listVercelExtensions(signal, auth), `vercel`, `Vercel Supported Extensions — Availability And Checkout Pricing Are Checked Separately`);
  if (auth.provider === `namecheap`) return namecheapExtensions(auth, signal);
  const url = new URL(catalogTargets[auth.provider]);
  const headers: Record<string, string> = { Accept: `application/json` };
  if (auth.provider === `godaddy` || auth.provider === `hostinger`) headers.Authorization = auth.authorization;
  if (auth.provider === `hostinger`) {
    headers[`Content-Type`] = `application/json`;
    url.searchParams.set(`category`, `DOMAIN`);
  }
  if (auth.provider === `namesilo`) {
    Object.entries({ type: `json`, version: `1`, key: auth.apiKey }).forEach(([key, value]) => url.searchParams.set(key, value));
  }
  const value = json(await requestCatalog(auth.provider, url, signal, headers), auth.provider);
  if (auth.provider === `godaddy`) {
    if (!Array.isArray(value)) throw invalid(auth.provider);
    return catalog(value.map(item => record(item, auth.provider).name), auth.provider,
      `GoDaddy's Supported Extensions May Have Registration Eligibility Requirements`);
  }
  if (auth.provider === `hostinger`) {
    if (!Array.isArray(value)) throw invalid(auth.provider);
    const extensions = value.map(item => {
      const entry = record(item, auth.provider);
      if (entry.category !== `DOMAIN`) return undefined;
      const metadata = entry.metadata && typeof entry.metadata === `object` && !Array.isArray(entry.metadata)
        ? entry.metadata as Record<string, unknown> : undefined;
      return normalizeExtension(metadata?.tld)
        ?? (typeof entry.name === `string` ? /^\.([a-z0-9-]+(?:\.[a-z0-9-]+)*)/i.exec(entry.name)?.[1] : undefined);
    });
    return catalog(extensions, auth.provider,
      `Extensions Come From Hostinger's Domain Catalog — Availability And Registration Restrictions Are Checked Separately`);
  }
  const response = record(value, auth.provider);
  if (auth.provider === `porkbun`) {
    if (response.status !== `SUCCESS`) throw invalid(auth.provider);
    const pricing = record(response.pricing, auth.provider);
    const extensions = Object.entries(pricing).filter(([, item]) => {
      const quote = record(item, auth.provider);
      return quote.registration != null && quote.specialType == null;
    }).map(([extension]) => extension);
    return catalog(extensions, auth.provider);
  }
  const reply = record(response.reply, auth.provider);
  if (Number(reply.code) !== 300) throw new RegistrarRelayError(502, `NameSilo Could Not Load Its Extension Catalog`);
  const extensions = Object.entries(reply).filter(([, item]) =>
    !!item && typeof item === `object` && !Array.isArray(item) && (item as Record<string, unknown>).registration != null,
  ).map(([extension]) => extension);
  return catalog(extensions, auth.provider);
};

export const handleDomainExtensions = async (request: Request): Promise<Response> => {
  try {
    checkRequest(request);
    const input = await readRequestRecord(request);
    if (Object.keys(input).some(key => ![`values`, `provider`].includes(key))) throw new RegistrarRelayError(400, `Enter Valid Registrar Request Values`);
    const result = input.provider === `vercel` && !Object.prototype.hasOwnProperty.call(input, `values`)
      ? catalog(await listVercelExtensions(request.signal), `vercel`, `Vercel Supported Extensions — Availability And Checkout Pricing Are Checked Separately`)
      : await listRegistrarExtensions(readSearchCredentials(input), request.signal);
    return Response.json(result, { headers: responseHeaders });
  } catch (failure) {
    const error = failure instanceof RegistrarRelayError ? failure
      : new RegistrarRelayError(502, `Domain Extensions Could Not Be Loaded`);
    return Response.json({ error: error.message }, { status: error.status, headers: responseHeaders });
  }
};
