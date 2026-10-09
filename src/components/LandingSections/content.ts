export const domainBasics = [
  {
    id: `domain`,
    label: `01 / The Address`,
    title: `Domain`,
    example: `your-idea.com`,
    description: `The memorable name people type to find you. Register it with a registrar and keep the registration renewed.`,
  },
  {
    id: `hosting`,
    label: `02 / The Space`,
    title: `Hosting`,
    example: `A place to run your site`,
    description: `The infrastructure that stores your files and serves them online. Your domain points visitors to this destination.`,
  },
  {
    id: `website`,
    label: `03 / The Experience`,
    title: `Website`,
    example: `What your visitors see`,
    description: `The pages, content, and features you build. A domain gives them an address; hosting makes them available.`,
  },
];

export const landingPlans = [
  {
    id: `free`,
    name: `Free`,
    price: `$0`,
    label: `Available Now`,
    action: `Open Your Portfolio`,
    description: `A home for your names and next ideas.`,
    features: [`Domain portfolio`, `Registrar & renewal tracking`, `Projects, groups & tags`, `CSV import & export`],
    plannedFeatures: [],
  },
  {
    id: `pro`,
    name: `Pro`,
    price: `Coming Soon`,
    label: `For Growing Portfolios`,
    action: `Ask About Pro`,
    description: `More insight for your next decision.`,
    features: [`Everything in Free`],
    plannedFeatures: [`Automated renewal reminders`, `Advanced portfolio insights`, `Scheduled registrar sync`],
  },
  {
    id: `team`,
    name: `Team`,
    price: `Coming Soon`,
    label: `For Working Together`,
    action: `Talk About Team`,
    description: `Shared clarity from idea to launch.`,
    features: [`Everything in Pro`],
    plannedFeatures: [`Shared team workspaces`, `Member roles & permissions`, `Portfolio activity history`, `Priority support`],
  },
];

export const activityCells = Array.from({ length: 196 }, (_, index) => {
  const row = index % 7;
  const column = Math.floor(index / 7);
  const seed = row * 31 + column * 17;
  return {
    index,
    level: (seed % 11 < 3 ? 0 : seed % 4 + 1),
    delay: -(seed % 67) / 10,
    duration: 5 + seed % 5,
  };
});

export const ctaActivityCells = activityCells.filter(cell => cell.index % 7 < 4);
