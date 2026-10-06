import { providerName } from './validation';
import { RegistrarRelayError } from './errors';
import { normalizeConnections } from '../../shared/connections/values';
import { EMPTY_CONNECTIONS, type ConnectionProvider } from '../../shared/connections/types';

export type RegistrarCredentials =
  | { provider: `namesilo`; apiKey: string }
  | { provider: `porkbun`; apiKey: string; secretKey: string }
  | { provider: `vercel`; authorization: string; teamId?: string }
  | { provider: `hostinger`; authorization: string; externalDomains?: string[] }
  | { provider: `namecheap`; apiKey: string; username: string; clientIp: string }
  | { provider: `godaddy`; authorization: string; shopperId?: string; customerId?: string; lookupAuthorization?: string };

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
  if (provider === `vercel`) {
    const token = fields.VERCEL_API_TOKEN;
    const teamId = fields.VERCEL_TEAM_ID;
    if (!token) throw new RegistrarRelayError(400, `Enter A Vercel API Token`);
    if (teamId && (teamId.length > 100 || !/^team_[a-z0-9]+$/i.test(teamId))) throw new RegistrarRelayError(400, `Enter VERCEL_TEAM_ID As A Team ID Starting With team_`);
    return { provider, teamId, authorization: `Bearer ${token}` };
  }
  if (provider === `godaddy`) {
    const token = fields.GODADDY_PAT;
    const key = fields.GODADDY_API_KEY;
    const secret = fields.GODADDY_API_SECRET;
    const shopperId = fields.GODADDY_SHOPPER_ID;
    const customerId = fields.GODADDY_CUSTOMER_ID;
    if (!token && (!key || !secret)) throw new RegistrarRelayError(400, `Enter A GoDaddy Token Or Key And Secret`);
    if (key?.includes(`:`) || secret?.includes(`:`)) throw new RegistrarRelayError(400, `Enter Valid GoDaddy API Key And Secret Values`);
    if (customerId && !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(customerId)) throw new RegistrarRelayError(400, `Enter GODADDY_CUSTOMER_ID As The Account UUID`);
    if (shopperId && !/^\d{1,10}$/.test(shopperId)) throw new RegistrarRelayError(400, `Enter GODADDY_SHOPPER_ID As Up To 10 Digits`);
    if (customerId && shopperId) throw new RegistrarRelayError(400, `Enter A GoDaddy Customer UUID Or Shopper ID`);
    const lookupAuthorization = key && secret ? `sso-key ${key}:${secret}` : undefined;
    return { provider, shopperId, customerId, lookupAuthorization, authorization: token ? `Bearer ${token}` : `sso-key ${key}:${secret}` };
  }
  if (provider === `hostinger`) {
    const token = fields.HOSTINGER_API_TOKEN;
    if (!token) throw new RegistrarRelayError(400, `Enter A Hostinger API Token`);
    let externalDomains: string[] | undefined;
    try { externalDomains = fields.HOSTINGER_EXTERNAL_DOMAINS?.split(`,`).map(name => providerName(name, provider)); }
    catch { throw new RegistrarRelayError(400, `Enter Confirmed External Domain Names Separated By Commas`); }
    return { provider, externalDomains, authorization: `Bearer ${token}` };
  }
  if (provider === `namesilo`) {
    const apiKey = fields.NAMESILO_API_KEY;
    if (!apiKey || apiKey.length > 256) throw new RegistrarRelayError(400, `Enter A Valid NameSilo API Key`);
    return { provider, apiKey };
  }
  if (provider === `porkbun`) {
    const apiKey = fields.PORKBUN_API_KEY;
    const secretKey = fields.PORKBUN_SECRET_API_KEY;
    if (!apiKey || !secretKey || apiKey.length > 256 || secretKey.length > 256) throw new RegistrarRelayError(400, `Enter Both Valid Porkbun API Keys`);
    return { provider, apiKey, secretKey };
  }
  const apiKey = fields.NAMECHEAP_API_KEY;
  const username = fields.NAMECHEAP_USERNAME;
  const clientIp = fields.NAMECHEAP_CLIENT_IP;
  if (!apiKey || apiKey.length > 50 || !username || !/^[a-z0-9._-]{1,20}$/i.test(username) || !clientIp) {
    throw new RegistrarRelayError(400, `Enter Valid Namecheap API, Username, And Server IPv4 Values`);
  }
  return { provider, apiKey, username, clientIp };
};
