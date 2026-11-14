import type { DomainRecord } from '../types';
import type { RegistrarDetailSelection } from './types';
import type { ConnectionAccount, ConnectionProvider } from '../connections/types';

export const MAX_DETAIL_SELECTION_BYTES = 6_000;
const DETAIL_FRESHNESS_MS = 86_400_000;

export const usesRegistrarDetailSelection = (provider: ConnectionProvider) => [`godaddy`, `hostinger`, `namecheap`, `namesilo`, `porkbun`, `squarespace`, `vercel`].some(value => value === provider);

const dateTime = (value: unknown, now: number) => {
  const parsed = typeof value === `string` ? Date.parse(value) : NaN;
  return parsed > 0 && parsed <= now ? parsed : 0;
};

export const getRegistrarDetailSelection = (records: readonly DomainRecord[], account: ConnectionAccount): RegistrarDetailSelection => {
  const now = Date.now();
  const cutoff = now - DETAIL_FRESHNESS_MS;
  const candidates = records.filter(domain => domain.meta?.registrarProvider === account.provider
    && domain.meta?.registrarConnectionId === account.id && domain.meta?.externalRegistration !== true
    && domain.name.length <= 253 && /^[a-z0-9.-]+$/.test(domain.name)).map(domain => {
    const metadata = domain.meta?.registrarSync;
    const sync = metadata && typeof metadata === `object` && !Array.isArray(metadata) ? metadata : undefined;
    const checkedAt = dateTime(sync?.detailsCheckedAt, now);
    return { domain, checkedAt, attemptedAt: Math.max(checkedAt, dateTime(sync?.detailsAttemptedAt, now)) };
  }).sort((first, second) => first.attemptedAt - second.attemptedAt || first.domain.name.localeCompare(second.domain.name));
  const selection: RegistrarDetailSelection = { start: candidates[0]?.domain.name, recent: [] };
  let remaining = MAX_DETAIL_SELECTION_BYTES - JSON.stringify(selection).length;
  for (const { domain, checkedAt } of candidates.sort((first, second) => second.checkedAt - first.checkedAt)) {
    if (checkedAt <= cutoff) continue;
    const id = domain.providerId;
    if (id && !/^[a-z0-9_-]{1,100}$/i.test(id)) continue;
    const entry: RegistrarDetailSelection[`recent`][number] = id ? [domain.name, id] : [domain.name];
    const bytes = JSON.stringify(entry).length + 1;
    if (bytes > remaining) continue;
    selection.recent.push(entry);
    remaining -= bytes;
  }
  return selection;
};
