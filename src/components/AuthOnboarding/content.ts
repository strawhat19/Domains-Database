export type AuthOnboardingProps = { mode: `signin` | `signup` };

export const onboardingCopy = {
  signin: {
    title: `Your domains.`,
    accent: `Your next move.`,
    description: `Return to your names, notes, and next ideas. Keep the whole portfolio in one place.`,
  },
  signup: {
    title: `Good ideas.`,
    accent: `Start with a name.`,
    description: `Build a home for your domains. Search new names, organize your portfolio, and connect your registrars.`,
  },
};
export const onboardingBenefits = [
  { id: `search`, label: `Search`, copy: `Compare registrar quotes` },
  { id: `organize`, label: `Organize`, copy: `Notes, groups, and collections` },
  { id: `connect`, label: `Connect`, copy: `Import from your registrars` },
] as const;
export const workspacePreview = [
  { id: `studio`, label: `Website`, name: `studio.example`, note: `Design studio` },
  { id: `launch`, label: `Project`, name: `launch.example`, note: `Product launch` },
  { id: `next`, label: `Idea`, name: `next.example`, note: `What comes next` },
] as const;
