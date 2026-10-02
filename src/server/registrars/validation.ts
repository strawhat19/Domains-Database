import { invalidResponse, RegistrarRelayError } from './errors';
import type { RegistrarDomain } from '../../shared/registrarSync/types';
import type { ConnectionProvider } from '../../shared/connections/types';

export const MAX_PAGES = 100;
export const MAX_DOMAINS = 10_000;
export const MAX_REQUEST_BYTES = 32 * 1024;
export const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;

export const asRecord = (value: unknown, provider: ConnectionProvider): Record<string, unknown> => {
  if (!value || typeof value !== `object` || Array.isArray(value)) throw invalidResponse(provider);
  return value as Record<string, unknown>;
};

export const optionalText = (value: unknown, provider: ConnectionProvider, maximum = 100) => {
  if (value == null || value === ``) return undefined;
  if (typeof value !== `string` || value.length > maximum || /[\u0000-\u001f\u007f]/.test(value)) throw invalidResponse(provider);
  return value.trim() || undefined;
};

export const requiredText = (value: unknown, provider: ConnectionProvider, maximum = 100) => {
  const text = optionalText(value, provider, maximum);
  if (!text) throw invalidResponse(provider);
  return text;
};

export const providerInteger = (value: unknown, provider: ConnectionProvider) => {
  if (typeof value !== `number` && (typeof value !== `string` || !/^\d+$/.test(value))) throw invalidResponse(provider);
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw invalidResponse(provider);
  return number;
};

export const providerId = (value: unknown, provider: ConnectionProvider) => {
  const number = providerInteger(value, provider);
  if (!number) throw invalidResponse(provider);
  return String(number);
};

export const providerBoolean = (value: unknown, provider: ConnectionProvider, allowText = false) => {
  if (value == null) return undefined;
  if (typeof value === `boolean`) return value;
  if (allowText && typeof value === `string` && /^(?:true|false)$/i.test(value)) return value.toLowerCase() === `true`;
  throw invalidResponse(provider);
};

export const providerStatus = (value: unknown, provider: ConnectionProvider) => {
  const text = optionalText(value, provider, 100);
  if (text && !/^[a-z][a-z0-9 _-]*$/i.test(text)) throw invalidResponse(provider);
  return text;
};

export const providerName = (value: unknown, provider: ConnectionProvider) => {
  const candidate = requiredText(value, provider, 253).toLowerCase();
  if (/[\s/:?#@\\%]/.test(candidate)) throw invalidResponse(provider);
  let name: string;
  try {
    name = new URL(`https://${candidate}`).hostname.replace(/\.$/, ``);
  } catch {
    throw invalidResponse(provider);
  }
  const labels = name.split(`.`);
  if (name.length > 253 || labels.length < 2 || /^\d+$/.test(labels[labels.length - 1] ?? ``)) throw invalidResponse(provider);
  if (labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) throw invalidResponse(provider);
  return name;
};

export const providerDate = (value: unknown, provider: ConnectionProvider, dateOnly = false, american = false) => {
  let text = optionalText(value, provider, 64);
  if (!text) return undefined;
  if (american) {
    const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
    if (!parts) throw invalidResponse(provider);
    text = `${parts[3]}-${parts[1]}-${parts[2]}`;
  }
  const parts = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})?)?$/.exec(text);
  if (!parts) throw invalidResponse(provider);
  const day = parts[1];
  const calendar = new Date(`${day}T00:00:00Z`);
  if (!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== day) throw invalidResponse(provider);
  if (parts[2] === undefined) return day;
  if (Number(parts[2]) > 23 || Number(parts[3]) > 59 || Number(parts[4] ?? 0) > 59) throw invalidResponse(provider);
  const timestamp = `${day}T${parts[2]}:${parts[3]}:${parts[4] ?? `00`}${parts[5] ?? ``}${parts[6] ?? `Z`}`;
  const parsed = new Date(timestamp);
  if (!Number.isFinite(parsed.getTime())) throw invalidResponse(provider);
  return dateOnly ? day : parsed.toISOString();
};

export const appendDomains = (target: RegistrarDomain[], incoming: RegistrarDomain[], provider: ConnectionProvider, seen: Set<string>) => {
  if (target.length + incoming.length > MAX_DOMAINS) throw new RegistrarRelayError(422, `Portfolio Exceeds The 10,000 Domain Sync Limit`);
  for (const domain of incoming) {
    if (seen.has(domain.name)) throw invalidResponse(provider);
    seen.add(domain.name);
    target.push(domain);
  }
};

export const parseJson = (text: string, provider: ConnectionProvider): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    throw invalidResponse(provider);
  }
};
