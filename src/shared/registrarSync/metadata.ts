import type { DomainInput } from '../types';

export const markDomainFieldsKnown = (input: DomainInput, fields: (`autoRenew` | `renewalPrice`)[]): DomainInput => {
  const sync = input.meta?.registrarSync;
  const previous = sync && typeof sync === `object` && !Array.isArray(sync) ? sync : undefined;
  if (!fields.length || (!previous && input.meta?.domainSource !== `registrar`)) return input;
  return { ...input, meta: { ...input.meta, registrarSync: {
    ...previous,
    ...Object.fromEntries(fields.map(field => [`${field}Known`, true])),
  } } };
};
