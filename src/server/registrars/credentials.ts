import { RegistrarRelayError } from './errors';
import { normalizeConnections } from '../../shared/connections/values';
import { EMPTY_CONNECTIONS, type ConnectionProvider } from '../../shared/connections/types';

export type RegistrarCredentials =
  | { provider: `godaddy`; authorization: string }
  | { provider: `hostinger`; authorization: string }
  | { provider: `namecheap`; apiKey: string; username: string; clientIp: string };

export const parseCredentials = (provider: ConnectionProvider, input: string): RegistrarCredentials => {
  let normalized: string;
  try {
    normalized = normalizeConnections({ ...EMPTY_CONNECTIONS, [provider]: input })[provider];
  } catch {
    throw new RegistrarRelayError(400, `Enter Valid Registrar Connection Values`);
  }
  if (!normalized) throw new RegistrarRelayError(400, `Enter Registrar Connection Values Before Syncing`);
  const fields: Record<string, string> = {};
  for (const line of normalized.split(`\n`)) {
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    if (!match?.[1] || !match?.[2]) throw new RegistrarRelayError(400, `Enter Valid Registrar Connection Values`);
    let value = match[2];
    if ((value.startsWith(`'`) && value.endsWith(`'`)) || (value.startsWith(`"`) && value.endsWith(`"`))) value = value.slice(1, -1);
    if (!/^[\x21-\x7e]{1,8192}$/.test(value)) throw new RegistrarRelayError(400, `Enter Valid Registrar Connection Values`);
    fields[match[1]] = value;
  }
  if (provider === `godaddy`) {
    const token = fields.GODADDY_PAT;
    const key = fields.GODADDY_API_KEY;
    const secret = fields.GODADDY_API_SECRET;
    if (!token && (!key || !secret || key.includes(`:`) || secret.includes(`:`))) throw new RegistrarRelayError(400, `Enter A GoDaddy Token Or Key And Secret`);
    return { provider, authorization: token ? `Bearer ${token}` : `sso-key ${key}:${secret}` };
  }
  if (provider === `hostinger`) {
    const token = fields.HOSTINGER_API_TOKEN;
    if (!token) throw new RegistrarRelayError(400, `Enter A Hostinger API Token`);
    return { provider, authorization: `Bearer ${token}` };
  }
  const apiKey = fields.NAMECHEAP_API_KEY;
  const username = fields.NAMECHEAP_USERNAME;
  const clientIp = fields.NAMECHEAP_CLIENT_IP;
  if (!apiKey || apiKey.length > 50 || !username || !/^[a-z0-9._-]{1,20}$/i.test(username) || !clientIp) {
    throw new RegistrarRelayError(400, `Enter Valid Namecheap API, Username, And Server IPv4 Values`);
  }
  return { provider, apiKey, username, clientIp };
};
