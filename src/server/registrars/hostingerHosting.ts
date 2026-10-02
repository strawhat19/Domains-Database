import { getDomainRegistration } from './rdap';
import type { JSONValue } from '../../shared/types';
import { invalidResponse, RegistrarRelayError } from './errors';
import { pauseRequests, requestRegistrar, type RegistrarRequestContext } from './request';
import type { RegistrarDomain, RegistrarSyncResult } from '../../shared/registrarSync/types';
import { asRecord, parseJson, MAX_PAGES, MAX_DOMAINS, providerName, optionalText, providerInteger } from './validation';

const PAGE_SIZE = 100;
const MAX_DISCOVERIES = 200;
const temporaryDomains = [`hostingersite.com`, `builder-preview.com`];

const listHostedNames = async (authorization: string, context: RegistrarRequestContext) => {
  let received = 0;
  let skipped = 0;
  let expectedTotal: number | undefined;
  let expectedSize: number | undefined;
  const names = new Set<string>();
  const headers = { Accept: `application/json`, Authorization: authorization, 'Content-Type': `application/json` };
  for (let page = 1; page <= MAX_PAGES; page++) {
    if (page > 1) await pauseRequests(1250, context);
    const url = new URL(`https://developers.hostinger.com/api/hosting/v1/websites`);
    url.searchParams.set(`page`, String(page));
    url.searchParams.set(`per_page`, String(PAGE_SIZE));
    const text = await requestRegistrar(url, headers, context);
    const response = asRecord(parseJson(text, `hostinger`), `hostinger`);
    const meta = asRecord(response.meta, `hostinger`);
    const total = providerInteger(meta.total, `hostinger`);
    const size = providerInteger(meta.per_page, `hostinger`);
    if (total > MAX_DOMAINS) throw new RegistrarRelayError(422, `Hostinger Website Inventory Exceeds The Discovery Limit`);
    if (!Array.isArray(response.data) || providerInteger(meta.current_page, `hostinger`) !== page || size < 1 || size > PAGE_SIZE || response.data.length > size) throw invalidResponse(`hostinger`);
    if (expectedTotal !== undefined && (total !== expectedTotal || size !== expectedSize)) throw new RegistrarRelayError(502, `Hostinger Website Inventory Changed During Sync — Try Again`);
    expectedSize = size;
    expectedTotal = total;
    received += response.data.length;
    for (const item of response.data) {
      const record = asRecord(item, `hostinger`);
      if (record.domain == null || record.vhost_type === `subdomain`) { skipped++; continue; }
      let name: string;
      try { name = providerName(record.domain, `hostinger`); } catch { skipped++; continue; }
      if (temporaryDomains.some(suffix => name === suffix || name.endsWith(`.${suffix}`))) { skipped++; continue; }
      const parent = optionalText(record.parent_domain, `hostinger`, 253)?.toLowerCase();
      if (parent && name.endsWith(`.${parent}`)) { skipped++; continue; }
      names.add(name);
    }
    if (received > total) throw invalidResponse(`hostinger`);
    if (received === total) return { names: [...names], skipped };
    if (response.data.length !== size) throw invalidResponse(`hostinger`);
  }
  throw new RegistrarRelayError(422, `Hostinger Website Pagination Exceeds The Discovery Limit`);
};

export const discoverHostingerDomains = async (
  authorization: string,
  registeredNames: Set<string>,
  context: RegistrarRequestContext,
  confirmedNames: string[] = [],
): Promise<RegistrarSyncResult> => {
  const hosted = await listHostedNames(authorization, context);
  const confirmed = new Set(confirmedNames);
  const availableNames = hosted.names.filter(name => !registeredNames.has(name));
  availableNames.sort((left, right) => Number(confirmed.has(right)) - Number(confirmed.has(left)));
  const names = availableNames.slice(0, MAX_DISCOVERIES);
  let unregistered = 0;
  let unresolved = 0;
  let limitedLookups = 0;
  const warnings: string[] = [];
  const domains: RegistrarDomain[] = [];
  const discoveredDomains: RegistrarDomain[] = [];
  for (let index = 0; index < names.length; index += 4) {
    const batch = names.slice(index, index + 4);
    const results = await Promise.all(batch.map(async name => {
      const include = confirmed.has(name);
      let registration: Awaited<ReturnType<typeof getDomainRegistration>> = { registrar: `` };
      if (context.signal.aborted || Date.now() + 6000 >= context.deadline) limitedLookups++;
      else {
        try { registration = await getDomainRegistration(name, context); }
        catch { registration = { registrar: `` }; }
        if (registration.registered === undefined || (registration.registered && !registration.registrarName)) unresolved++;
      }
      if (registration.registered === false) { unregistered++; return undefined; }
      const meta: Record<string, JSONValue> = {
        externalRegistration: true,
        ownershipConfirmed: include,
        hostingProvider: `Hostinger`,
        source: `Hostinger Hosting API`,
      };
      if (registration.registrarName) meta.registrarName = registration.registrarName;
      if (registration.registrarIanaId) meta.registrarIanaId = registration.registrarIanaId;
      if (registration.registered) {
        meta.registrarSource = `Registry RDAP`;
        meta.registrarCheckedAt = new Date().toISOString();
      }
      return { name, meta, registrar: registration.registrar } satisfies RegistrarDomain;
    }));
    for (const record of results) {
      if (!record) continue;
      if (confirmed.has(record.name)) domains.push(record);
      else discoveredDomains.push(record);
    }
  }
  const missing = confirmedNames.filter(name => !hosted.names.includes(name) && !registeredNames.has(name)).length;
  if (missing) warnings.push(`${missing} Confirmed External Domain(s) Not Found In Accessible Hostinger Websites`);
  if (hosted.skipped) warnings.push(`${hosted.skipped} Temporary, Unnamed, Or Subdomain Hosting Record(s) Excluded`);
  if (unregistered) warnings.push(`${unregistered} Hosting Name(s) Have No Matching Registry Registration`);
  if (unresolved || limitedLookups) warnings.push(`${unresolved + limitedLookups} Hosted Domain Registrar(s) Could Not Be Verified — Review Before Importing`);
  if (availableNames.length > names.length) warnings.push(`${availableNames.length - names.length} Hosted Name(s) Exceed The 200 Domain Discovery Limit`);
  if (discoveredDomains.length) warnings.push(`${discoveredDomains.length} Externally Hosted Domain(s) Await Ownership Confirmation — Shared Websites May Be Included`);
  return { domains, warnings, discoveredDomains };
};
