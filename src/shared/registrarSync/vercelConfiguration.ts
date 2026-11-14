import { Domain } from '../models/domains/Domain';
import { normalizeDomainName } from '../domainUtils';
import type { JSONValue, DomainRecord } from '../types';
import type { VercelDomainConfiguration } from './types';

export interface VercelConfigurationSnapshot {
  connectionId: string;
  records: readonly VercelDomainConfiguration[];
}

const metadataObject = (value: JSONValue | undefined) => value && typeof value === `object` && !Array.isArray(value) ? value : {};
const nameservers = (values: unknown) => {
  if (!Array.isArray(values) || values.length > 32 || values.some(value => typeof value !== `string`)) return undefined;
  try { return [...new Set(values.map(normalizeDomainName))]; }
  catch { return undefined; }
};

export const mergeVercelConfigurations = (domains: DomainRecord[], { connectionId, records }: VercelConfigurationSnapshot, userId: string, checkedAt: string) => {
  const invalid = () => new Error(`Vercel Returned Invalid Domain Configuration`);
  if (!Array.isArray(records) || records.length > 10_000 || typeof connectionId !== `string` || !connectionId || connectionId.length > 240) throw invalid();
  const configurations = new Map<string, VercelDomainConfiguration>();
  for (const configuration of records) {
    const name = normalizeDomainName(configuration?.name);
    if (name !== configuration.name || typeof configuration.verified !== `boolean`
      || ![`external`, `zeit.world`, `na`].includes(configuration.dnsService) || configurations.has(name)) throw invalid();
    configurations.set(name, configuration);
  }
  let changed = false;
  for (const [index, domain] of domains.entries()) {
    if (domain.isSample || domain.uid !== userId) continue;
    const previous = metadataObject(domain.meta?.vercelDomainConfiguration);
    const configuration = configurations.get(domain.name);
    if (!configuration && previous.connectionId !== connectionId) continue;
    const meta = { ...domain.meta };
    if (configuration) {
      const { verified, dnsService, echMode, observedNameservers, intendedNameservers } = configuration;
      const observed = nameservers(observedNameservers);
      const intended = nameservers(intendedNameservers);
      const { checkedAt: previousCheckedAt, ...previousValues } = previous;
      const sameConnection = previous.connectionId === connectionId;
      const details: Record<string, JSONValue> = { verified, dnsService, connectionId };
      const mode = echMode ?? (sameConnection ? previous.echMode : undefined);
      if (mode === `auto` || mode === `disabled` || mode === `enabled`) details.echMode = mode;
      const savedObserved = observed ?? (sameConnection ? nameservers(previous.observedNameservers) : undefined);
      const savedIntended = intended ?? (sameConnection ? nameservers(previous.intendedNameservers) : undefined);
      if (savedObserved) details.observedNameservers = savedObserved;
      if (savedIntended) details.intendedNameservers = savedIntended;
      if (previousCheckedAt && JSON.stringify(previousValues) === JSON.stringify(details)) continue;
      meta.vercelDomainConfiguration = { ...details, checkedAt };
    } else delete meta.vercelDomainConfiguration;
    domains[index] = new Domain({ ...domain, meta });
    changed = true;
  }
  return changed;
};
