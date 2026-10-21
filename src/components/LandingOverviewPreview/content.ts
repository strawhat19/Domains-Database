export type OverviewPreviewKind = `inventory` | `renewals` | `projects` | `discovery`;

export const overviewPreviewPanels = {
  inventory: { title: `Domain Portfolio`, search: `Search Domains`, label: `Sample portfolio showing fictional domains, registrars, project statuses, and illustrative annual costs` },
  renewals: { title: `Renewals & Costs`, search: `Search Domains`, label: `Sample renewal table showing fictional domains, renewal dates, and illustrative annual costs` },
  projects: { title: `Collections & Projects`, search: `Search Collections`, label: `Sample collection showing fictional domains grouped by project status, with tags and project links` },
  discovery: { title: `Domain Search`, search: `Search Domain Names`, label: `Sample domain search with colorful Hot, Trending, and New cards, fictional names, and illustrative provider price comparisons` },
} satisfies Record<OverviewPreviewKind, { title: string; search: string; label: string }>;

export const overviewPreviewDomains = [
  { id: `sprout`, name: `sprout.example`, registrar: `GoDaddy`, renewal: `Nov 08, 2026`, cost: `$12.99`, project: `In Development`, tag: `App` },
  { id: `folio`, name: `folio.example`, registrar: `Hostinger`, renewal: `Dec 14, 2026`, cost: `$14.99`, project: `Done`, tag: `Portfolio` },
  { id: `orbit`, name: `orbit.example`, registrar: `GoDaddy`, renewal: `Feb 21, 2027`, cost: `$10.99`, project: `Planning`, tag: `Tool` },
] as const;

export const overviewPreviewGroups = [
  { id: `building`, name: `In Development`, domain: `sprout.example`, tag: `App`, link: `Preview` },
  { id: `launched`, name: `Done`, domain: `folio.example`, tag: `Portfolio`, link: `Production` },
] as const;

export const overviewPreviewQuotes = [
  { id: `embernook`, name: `embernook.example`, category: `Hot`, tone: `warning`, cost: `$12.99`, alternative: `$14.99` },
  { id: `agentfern`, name: `agentfern.example`, category: `Trending`, tone: `accent`, cost: `$14.99`, alternative: `$16.99` },
  { id: `quietorbit`, name: `quietorbit.example`, category: `New`, tone: `success`, cost: `$10.99`, alternative: `$12.99` },
] as const;

export const overviewPreviewCategories = [`All`, `Hot`, `Trending`, `New`, `Value`, `Short`] as const;
