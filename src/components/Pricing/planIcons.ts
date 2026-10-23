import type { Plan } from '../../shared/models/plans/Plan';

const planVisuals = {
  free: { icon: `Globe2`, tone: `muted` },
  pro: { icon: `Zap`, tone: `accent` },
  team: { icon: `UsersRound`, tone: `success` },
  enterprise: { icon: `Building2`, tone: `danger` },
} as const;
const customVisuals = [
  { icon: `Gem`, tone: `accent` },
  { icon: `Compass`, tone: `success` },
  { icon: `Layers3`, tone: `muted` },
  { icon: `Puzzle`, tone: `danger` },
] as const;
export const getPricingPlanVisual = (plan: Pick<Plan, `slug` | `number` | `icon`>) => {
  const visual = Object.prototype.hasOwnProperty.call(planVisuals, plan.slug) ? planVisuals[plan.slug as keyof typeof planVisuals] : undefined;
  const fallback = visual ?? customVisuals[Math.max(0, plan.number - 1) % customVisuals.length] ?? planVisuals.free;
  return { ...fallback, icon: plan.icon ?? fallback.icon };
};
