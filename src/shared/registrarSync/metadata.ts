import type { DomainInput } from '../types';

export const markDomainFieldsKnown = (input: DomainInput, fields: (`autoRenew` | `renewalPrice`)[]): DomainInput => {
  const sync = input.meta?.registrarSync;
  if (!sync || typeof sync !== `object` || Array.isArray(sync)) return input;
  return { ...input, meta: { ...input.meta, registrarSync: {
    ...sync,
    ...Object.fromEntries(fields.map(field => [`${field}Known`, true])),
  } } };
};
