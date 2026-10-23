import { Roles } from '../types/types';
import type { PlanTier } from './plans/types';
import { minRole, type User } from './models/users/User';

export const getPlanDisplayName = (plan: string) => plan.trim().toLowerCase() === `team` ? `Dom` : plan;
export const hasUnlimitedPlanAccess = (user?: Pick<User, `role`> | null) => Boolean(user && minRole(user.role, Roles.Administrator));
export const hasProPlanAccess = (user?: Pick<User, `role` | `plan`> | null) => hasUnlimitedPlanAccess(user) || user?.plan?.trim().toLowerCase() === `pro`;

export const hasStarterPlanAccess = (user?: Pick<User, `id` | `role` | `plan` | `active`> | null, tiers: readonly PlanTier[] = []) => {
  if (!user?.id || user.active !== true) return false;
  if (user.role === Roles.Owner) return true;
  const plan = typeof user?.plan === `string` ? user.plan.trim().toLowerCase() : ``;
  if (!plan || plan === `free`) return false;
  const minimum = tiers.find(tier => tier.slug === `starter`);
  const current = tiers.find(tier => tier.slug === plan);
  return !!minimum && !!current && (current.displayOrder > minimum.displayOrder
    || (current.displayOrder === minimum.displayOrder && current.number >= minimum.number));
};
