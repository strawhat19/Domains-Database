import { readConnectionInput } from '../registrars/http';
import { RegistrarRelayError } from '../registrars/errors';
import { parseCredentials } from '../registrars/credentials';
import type { RegistrarCredentials } from '../registrars/credentials';
import { connectionFields, type ConnectionProvider } from '../../shared/connections/types';

const inventoryKeys = [`GODADDY_SHOPPER_ID`, `GODADDY_CUSTOMER_ID`, `HOSTINGER_EXTERNAL_DOMAINS`];

const environmentCredentials = (provider: ConnectionProvider): RegistrarCredentials | undefined => {
  const field = connectionFields.find(field => field.search && field.id === provider);
  if (!field) return undefined;
  const groups = provider === `godaddy`
    ? [[`GODADDY_PAT`], [`GODADDY_API_KEY`, `GODADDY_API_SECRET`]]
    : [field.keys.filter(key => !inventoryKeys.includes(key))];
  for (const keys of groups) {
    const values = keys.map(key => process.env[key]?.trim());
    if (values.some(value => !value || /[\r\n\u0000]/.test(value))) continue;
    try {
      return parseCredentials(provider, keys.map((key, index) => `${key}=${values[index]}`).join(`\n`));
    } catch { continue; }
  }
  return undefined;
};

export const getEnvironmentSearchProviders = (): ConnectionProvider[] =>
  connectionFields.filter(field => field.search && environmentCredentials(field.id)).map(field => field.id);

export const readSearchCredentials = (record: Record<string, unknown>): RegistrarCredentials => {
  if (Object.prototype.hasOwnProperty.call(record, `values`)) {
    const connection = readConnectionInput(record);
    return parseCredentials(connection.provider, connection.values);
  }
  const field = connectionFields.find(field => field.search && field.id === record.provider);
  if (!field) throw new RegistrarRelayError(400, `Choose A Supported Registrar`);
  const credentials = environmentCredentials(field.id);
  if (!credentials) throw new RegistrarRelayError(400, `Domain Search Is Not Configured For This Registrar`);
  return credentials;
};
