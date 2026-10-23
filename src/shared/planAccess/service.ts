import { authAPI } from '../../api/auth';
import type { PlanTier } from '../plans/types';
import { subscribePlanTiers } from '../plans/service';
import { hasStarterPlanAccess } from '../accountPlans';

const getPlanTiers = () => new Promise<PlanTier[]>((resolve, reject) => {
  let settled = false;
  let stop = () => {};
  const finish = (tiers?: PlanTier[], failure?: Error) => {
    if (settled) return;
    settled = true;
    stop();
    if (failure) reject(failure);
    else resolve(tiers ?? []);
  };
  stop = subscribePlanTiers(tiers => finish(tiers), failure => finish(undefined, failure));
  if (settled) stop();
});

export const requireStarterAccess = async (expectedUserId?: string | null) => {
  const user = (await authAPI.restoreSession())?.user;
  if (!user?.id) throw new Error(`Sign In And Choose Starter Or Higher To Unlock This Feature`);
  if (!user.active) throw new Error(`This Account Is Deactivated`);
  if (expectedUserId !== undefined && user.id !== expectedUserId) throw new Error(`Your Account Changed — Try Again`);
  if (hasStarterPlanAccess(user)) return user;
  const tiers = await getPlanTiers();
  const current = (await authAPI.restoreSession())?.user;
  if (!current || current.id !== user.id) throw new Error(`Your Account Changed — Try Again`);
  if (!hasStarterPlanAccess(current, tiers)) throw new Error(`Choose Starter Or Higher To Unlock Auction And Community`);
  return current;
};
