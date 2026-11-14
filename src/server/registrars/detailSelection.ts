import { RegistrarRelayError } from './errors';
import { providerName } from './validation';
import type { ConnectionProvider } from '../../shared/connections/types';
import type { RegistrarDomain, RegistrarDetailSelection } from '../../shared/registrarSync/types';
import { MAX_DETAIL_SELECTION_BYTES, usesRegistrarDetailSelection } from '../../shared/registrarSync/detailSelection';

export const readRegistrarDetailSelection = (value: unknown, provider: ConnectionProvider): RegistrarDetailSelection | undefined => {
  if (value === undefined) return undefined;
  const invalid = new RegistrarRelayError(400, `Enter Valid Registrar Detail Selection`);
  if (!usesRegistrarDetailSelection(provider) || !value || typeof value !== `object` || Array.isArray(value)
    || JSON.stringify(value).length > MAX_DETAIL_SELECTION_BYTES) throw invalid;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some(key => ![`start`, `recent`].includes(key)) || !Array.isArray(record.recent)) throw invalid;
  try {
    const start = record.start === undefined ? undefined : providerName(record.start, provider);
    const recent = record.recent.map((entry: unknown): RegistrarDetailSelection[`recent`][number] => {
      if (!Array.isArray(entry) || entry.length < 1 || entry.length > 2) throw invalid;
      const name = providerName(entry[0], provider);
      if (entry.length === 1) return [name];
      const id = entry[1];
      if (typeof id !== `string` || !/^[a-z0-9_-]{1,100}$/i.test(id)) throw invalid;
      return [name, id];
    });
    return { start, recent };
  } catch { throw invalid; }
};

export const selectRegistrarDetails = (domains: readonly RegistrarDomain[], selection?: RegistrarDetailSelection) => {
  if (!selection) return domains;
  const recent = new Map(selection.recent.map(([name, providerId]) => [name, providerId]));
  const needsCheck = domains.filter(domain => !recent.has(domain.name) || recent.get(domain.name) !== domain.providerId);
  const start = selection.start;
  return start ? needsCheck.sort((first, second) => {
    const wrapOrder = Number(first.name.localeCompare(start) < 0) - Number(second.name.localeCompare(start) < 0);
    return wrapOrder || first.name.localeCompare(second.name);
  }) : needsCheck;
};
