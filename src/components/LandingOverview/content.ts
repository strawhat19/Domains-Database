export const overviewTitle = `What is Domains Database?`;
export const overviewDescription = `A planner and manager for the names you own and the ideas you want to build. Bring your domains into one portfolio, give them a purpose, and keep the details easy to find.`;
export const overviewFeatures = [
  {
    id: `inventory`,
    label: `Portfolio`,
    title: `Domain Portfolio`,
    description: `Search domains, registrars, and renewal dates.`,
  },
  {
    id: `renewals`,
    label: `Renewals`,
    title: `Renewals & Costs`,
    description: `Track renewals and compare annual costs.`,
  },
  {
    id: `projects`,
    label: `Projects`,
    title: `Projects & Collections`,
    description: `Group domains and track project stages.`,
  },
  {
    id: `discovery`,
    label: `Search`,
    title: `Domain Search w/ Trending Domains`,
    description: `Browse trending names and compare registrar quotes.`,
  },
] as const;

export const overviewSlides = [
  { id: `overview`, label: `Overview`, title: `Domain Portfolio Planning`, description: `Plan names, renewals, and next steps.` },
  ...overviewFeatures,
] as const;

export const overviewCarouselSlides = [
  overviewSlides[overviewSlides.length - 1] ?? overviewSlides[0],
  ...overviewSlides,
  overviewSlides[0],
];

