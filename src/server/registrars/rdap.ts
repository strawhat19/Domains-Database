import type { Registrar } from '../../shared/types';
import { invalidResponse, RegistrarRelayError } from './errors';
import { asRecord, parseJson, providerName } from './validation';
import { readLimitedText, type RegistrarRequestContext } from './request';

const MAX_RDAP_BYTES = 1024 * 1024;
let registryBootstrap: { checkedAt: number; endpoints: Map<string, string> } | undefined;
const registrarNames: [RegExp, Registrar][] = [
  [/godaddy/i, `GoDaddy`],
  [/porkbun/i, `Porkbun`],
  [/namesilo/i, `NameSilo`],
  [/hostinger/i, `Hostinger`],
  [/namecheap/i, `Namecheap`],
  [/squarespace/i, `Squarespace`],
];

export interface DomainRegistration {
  registered?: boolean;
  registrar: Registrar | ``;
  registrarName?: string;
  registrarIanaId?: string;
}

const readPublicJSON = async (url: URL, context: RegistrarRequestContext) => {
  const remaining = context.deadline - Date.now();
  if (context.signal.aborted || remaining <= 0) throw new RegistrarRelayError(504, `Registry Lookup Was Cancelled`);
  const controller = new AbortController();
  const abort = () => controller.abort();
  context.signal.addEventListener(`abort`, abort, { once: true });
  if (context.signal.aborted) abort();
  const timeout = setTimeout(abort, Math.min(6000, remaining));
  try {
    const response = await fetch(url, {
      method: `GET`,
      cache: `no-store`,
      redirect: `error`,
      credentials: `omit`,
      signal: controller.signal,
      headers: { Accept: `application/rdap+json, application/json` },
    });
    if (response.status === 404) { void response.body?.cancel().catch(() => undefined); return undefined; }
    if (!response.ok) { void response.body?.cancel().catch(() => undefined); throw new RegistrarRelayError(502, `Registry Lookup Is Unavailable`); }
    const text = await readLimitedText(response.body, MAX_RDAP_BYTES, controller.signal, new RegistrarRelayError(502, `Registry Response Exceeds The Size Limit`));
    return asRecord(parseJson(text, context.provider), context.provider);
  } catch (failure) {
    if (failure instanceof RegistrarRelayError) throw failure;
    throw new RegistrarRelayError(502, `Registry Lookup Is Unavailable`);
  } finally {
    clearTimeout(timeout);
    context.signal.removeEventListener(`abort`, abort);
  }
};

const getRegistryEndpoints = async (context: RegistrarRequestContext) => {
  if (registryBootstrap && Date.now() - registryBootstrap.checkedAt < 86_400_000) return registryBootstrap.endpoints;
  const bootstrap = await readPublicJSON(new URL(`https://data.iana.org/rdap/dns.json`), context);
  if (!Array.isArray(bootstrap?.services)) throw new RegistrarRelayError(502, `Registry Directory Is Unavailable`);
  const endpoints = new Map<string, string>();
  for (const service of bootstrap.services) {
    if (!Array.isArray(service) || !Array.isArray(service[0]) || !Array.isArray(service[1])) continue;
    for (const endpoint of service[1]) {
      if (typeof endpoint !== `string`) continue;
      let url: URL;
      try { url = new URL(endpoint); } catch { continue; }
      const publicHost = /^[a-z0-9.-]+$/i.test(url.hostname) && url.hostname.includes(`.`) && !/^[\d.]+$/.test(url.hostname)
        && !/(?:^|\.)(?:localhost|local|internal|test)$/i.test(url.hostname);
      if (!publicHost || url.protocol !== `https:` || (url.port && url.port !== `443`) || url.username || url.password || url.search || url.hash || !url.pathname.endsWith(`/`)) continue;
      for (const tld of service[0]) if (typeof tld === `string` && /^[a-z0-9-]+$/i.test(tld) && !endpoints.has(tld)) endpoints.set(tld.toLowerCase(), url.href);
      break;
    }
  }
  registryBootstrap = { endpoints, checkedAt: Date.now() };
  return endpoints;
};

export const getDomainRegistration = async (name: string, context: RegistrarRequestContext): Promise<DomainRegistration> => {
  const endpoints = await getRegistryEndpoints(context);
  const tld = name.split(`.`).at(-1) ?? ``;
  const endpoint = endpoints.get(tld);
  if (!endpoint) return { registrar: `` };
  const record = await readPublicJSON(new URL(`domain/${encodeURIComponent(name)}`, endpoint), context);
  if (!record) return { registrar: ``, registered: false };
  if (record.objectClassName !== `domain` || providerName(record.ldhName, context.provider) !== name) throw invalidResponse(context.provider);
  const entities = Array.isArray(record.entities) ? record.entities : [];
  const entity = entities.find(value => value && typeof value === `object` && Array.isArray(value.roles) && value.roles.includes(`registrar`));
  if (!entity) return { registrar: ``, registered: true };
  const card = Array.isArray(entity.vcardArray) ? entity.vcardArray[1] : undefined;
  const label = Array.isArray(card) ? card.find(value => Array.isArray(value) && value[0] === `fn`)?.[3] : undefined;
  const registrarName = typeof label === `string` && label.length <= 200 && !/[\u0000-\u001f\u007f]/.test(label) ? label.trim() : undefined;
  const publicIds: unknown[] = Array.isArray(entity.publicIds) ? entity.publicIds : [];
  const identifier = publicIds.find((value): value is { identifier?: unknown } => value !== null && typeof value === `object`
    && `type` in value && value.type === `IANA Registrar ID`)?.identifier;
  const registrarIanaId = typeof identifier === `string` && /^\d{1,10}$/.test(identifier) ? identifier : undefined;
  const registrar = registrarName ? registrarNames.find(([pattern]) => pattern.test(registrarName))?.[1] ?? `` : ``;
  return { registrar, registrarName, registrarIanaId, registered: true };
};
