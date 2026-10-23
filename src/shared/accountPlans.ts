import { Roles } from '../types/types';
import type { PlanTier } from './plans/types';
import type { User } from './models/users/User';

export interface BillingAccess { plan: `free` | `starter`; subscriptionStatus: string | null; accessUntil: number | null }
type Account = Pick<User, `role`> & Partial<Pick<User, `id` | `active` | `plan`>>;
export const getPlanDisplayName = (plan: string) => plan.trim().toLowerCase() === `team` ? `Dom` : plan;
export const hasUnlimitedPlanAccess = (user?: Account | null) => user?.active === true && user.role === Roles.Owner;
export const hasPaidBillingAccess = (billing?: BillingAccess | null, now = Date.now()) => billing?.plan === `starter`
  && [`active`, `trialing`].includes(billing.subscriptionStatus ?? ``) && typeof billing.accessUntil === `number` && billing.accessUntil > now;
export const hasStarterPlanAccess = (user?: Account | null, _tiers: readonly PlanTier[] = [], billing?: BillingAccess | null) =>
  !!user?.id && user.active === true && (hasUnlimitedPlanAccess(user) || hasPaidBillingAccess(billing));
export const hasProPlanAccess = (user?: Account | null, billing?: BillingAccess | null) => hasStarterPlanAccess(user, [], billing);
export const freeConnectionProviders = [`godaddy`, `hostinger`] as const;
export const canUseConnectionProvider = (provider: string, paid: boolean) => paid || freeConnectionProviders.some(value => value === provider);
export const getDomainLimit = (user?: Account | null, billing?: BillingAccess | null) => hasUnlimitedPlanAccess(user) ? null : hasStarterPlanAccess(user, [], billing) ? 333 : 33;

