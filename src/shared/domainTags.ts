export const DOMAIN_TAGS = [
  `ADULT`,
  `ADVERTISEMENTS`,
  `AGENCIES`,
  `AI`,
  `AMAZON`,
  `ANALYTICS`,
  `ANGULAR`,
  `APIS`,
  `APPS`,
  `AUTOMATIONS`,
  `BOTS`,
  `BUSINESSES`,
  `CALCULATORS`,
  `CODING`,
  `COLLECTIONS`,
  `COMMUNITIES`,
  `CONVERTERS`,
  `CSHARP`,
  `CSS`,
  `DATA`,
  `DATABASES`,
  `DESIGNS`,
  `DIRECTORIES`,
  `DOCS`,
  `ENGINEERING`,
  `EXPO`,
  `FIREBASE`,
  `GAMES`,
  `GENERATORS`,
  `GEOPOLITICS`,
  `GOOGLE`,
  `HTML`,
  `IDEAS`,
  `INFORMATIONAL`,
  `INTERESTING`,
  `JAVASCRIPT`,
  `JSON`,
  `MARKETING`,
  `MEDIA`,
  `META`,
  `MOBILE`,
  `NEXT`,
  `PORTFOLIOS`,
  `PRODUCTIVITY`,
  `PRODUCTS`,
  `PYTHON`,
  `RANDOM`,
  `REACT`,
  `RESEARCH`,
  `SCIENCE`,
  `SERVICES`,
  `SOCIALS`,
  `SOFTWARE`,
  `SQL`,
  `STUDIOS`,
  `SUPABASE`,
  `SVELTE`,
  `TECHNOLOGY`,
  `TESTS`,
  `TOOLS`,
  `TRAFFIC`,
  `TYPESCRIPT`,
  `VUE`,
  `WEBSITES`,
  `WORDPRESS`,
] as const;

export type DomainTag = typeof DOMAIN_TAGS[number];

const TAG_VALUES = new Set<string>(DOMAIN_TAGS);
const normalizeDomainTag = (value: unknown): DomainTag | undefined => {
  const tag = typeof value === `string` ? value.trim().toUpperCase() : ``;
  return TAG_VALUES.has(tag) ? tag as DomainTag : undefined;
};

export const normalizeDomainTags = (value: unknown): DomainTag[] => {
  if (!Array.isArray(value)) return [];
  const tags = value.flatMap(item => {
    const tag = normalizeDomainTag(item);
    return tag ? [tag] : [];
  });
  return [...new Set(tags)].sort();
};

export const validateDomainTags = (value: unknown): DomainTag[] => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`Tags Must Be A List`);
  if (value.some(item => !normalizeDomainTag(item))) throw new Error(`Choose A Valid Tag`);
  return normalizeDomainTags(value);
};
