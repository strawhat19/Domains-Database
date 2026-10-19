export type OverviewPreviewKind = `inventory` | `renewals` | `projects` | `discovery`;

export const overviewPreviewPanels = {
  inventory: { title: `Domain Portfolio`, search: `Search domains`, label: `Sample domain portfolio with placeholder domains, registrar names, and active status indicators` },
  renewals: { title: `Domain Portfolio`, search: `Renewal date`, label: `Sample renewal view with placeholder domains, renewal dates, and illustrative annual costs` },
  projects: { title: `Collections`, search: `Search collections`, label: `Sample collection with placeholder domains grouped into In Development and Done projects` },
  discovery: { title: `Explore Domains`, search: `new idea`, label: `Sample domain discovery results with placeholder names and illustrative registration quotes` },
} satisfies Record<OverviewPreviewKind, { title: string; search: string; label: string }>;

export const overviewPreviewDomains = [
  { id: `sprout`, name: `sprout.example`, registrar: `GoDaddy`, renewal: `Nov 08, 2026`, cost: `$12.99` },
  { id: `folio`, name: `folio.example`, registrar: `Hostinger`, renewal: `Dec 14, 2026`, cost: `$14.99` },
  { id: `orbit`, name: `orbit.example`, registrar: `GoDaddy`, renewal: `Feb 21, 2027`, cost: `$10.99` },
] as const;

export const overviewPreviewGroups = [
  { id: `building`, name: `In Development`, domain: `sprout.example`, tag: `App` },
  { id: `launched`, name: `Done`, domain: `folio.example`, tag: `Site` },
] as const;

export const overviewPreviewQuotes = [
  { id: `newidea`, name: `newidea.example`, cost: `$12.99`, category: `Trending` },
  { id: `getidea`, name: `getidea.example`, cost: `$14.99`, category: `New` },
] as const;
