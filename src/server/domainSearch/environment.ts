import { readConnectionInput } from '../registrars/http';
import { RegistrarRelayError } from '../registrars/errors';
import { parseCredentials } from '../registrars/credentials';
import type { RegistrarCredentials } from '../registrars/credentials';
import { domainSearchFields, type DomainSearchProvider } from '../../shared/domainSearch/types';

export type SearchCredentials = Extract<RegistrarCredentials, { provider: DomainSearchProvider }>;

const inventoryKeys = [`GODADDY_SHOPPER_ID`, `GODADDY_CUSTOMER_ID`, `HOSTINGER_EXTERNAL_DOMAINS`];

const parseSearchCredentials = (provider: DomainSearchProvider, input: string): SearchCredentials => {
  const credentials = parseCredentials(provider, input);
  if (credentials.provider === `squarespace`) throw new RegistrarRelayError(400, `Choose A Supported Search Registrar`);
  return credentials;
};

const environmentCredentials = (provider: DomainSearchProvider): SearchCredentials | undefined => {
  const field = domainSearchFields.find(field => field.id === provider);
  if (!field) return undefined;
  const groups = provider === `godaddy`
    ? [[`GODADDY_PAT`], [`GODADDY_API_KEY`, `GODADDY_API_SECRET`]]
    : provider === `vercel` ? [[`VERCEL_API_TOKEN`]]
    : [field.keys.filter(key => !inventoryKeys.includes(key))];
  for (const keys of groups) {
    const values = keys.map(key => process.env[key]?.trim());
    if (values.some(value => !value || /[\r\n\u0000]/.test(value))) continue;
    try {
      const teamId = provider === `vercel` ? process.env.VERCEL_TEAM_ID?.trim() : undefined;
      const input = keys.map((key, index) => `${key}=${values[index]}`);
      if (teamId) input.push(`VERCEL_TEAM_ID=${teamId}`);
      return parseSearchCredentials(provider, input.join(`\n`));
    } catch { continue; }
  }
  return undefined;
};

export const getEnvironmentSearchProviders = (): DomainSearchProvider[] => [
  `vercel`,
  ...domainSearchFields.filter(field => field.id !== `vercel` && environmentCredentials(field.id)).map(field => field.id),
];

export const readSearchCredentials = (record: Record<string, unknown>): SearchCredentials => {
  const field = domainSearchFields.find(field => field.id === record.provider);
  if (!field) throw new RegistrarRelayError(400, `Choose A Supported Registrar`);
  if (Object.prototype.hasOwnProperty.call(record, `values`)) {
    const connection = readConnectionInput(record);
    return parseSearchCredentials(field.id, connection.values);
  }
  const credentials = environmentCredentials(field.id);
  if (!credentials) throw new RegistrarRelayError(400, `Domain Search Is Not Configured For This Registrar`);
  return credentials;
};
