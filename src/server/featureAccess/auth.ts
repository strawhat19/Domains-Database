import { BillingError } from '../billing/types';
import { RegistrarRelayError } from '../registrars/errors';
import { getBillingDatabase, requireBillingActor } from '../billing/firebase';
import { hasPaidBillingAccess, canUseConnectionProvider } from '../../shared/accountPlans';

export class FeatureAccessError extends RegistrarRelayError {
  constructor(status: number, public code: string, message: string) { super(status, message); }
}
export const getRequestPlanAccess = async (request: Request, allowGuest = false) => {
  if (allowGuest && !request.headers.has(`authorization`)) return { actor: null, owner: false, paid: false };
  try {
    const actor = await requireBillingActor(request);
    const mirror = actor.owner ? undefined : (await getBillingDatabase().doc(`billingUsers/${actor.id}`).get()).data();
    const accessUntil = mirror?.accessUntil?.toMillis?.();
    const paid = actor.owner || hasPaidBillingAccess({ plan: mirror?.plan === `starter` ? `starter` : `free`, subscriptionStatus: typeof mirror?.subscriptionStatus === `string` ? mirror.subscriptionStatus : null, accessUntil: typeof accessUntil === `number` ? accessUntil : null });
    return { actor, paid, owner: actor.owner };
  } catch (failure) {
    if (failure instanceof BillingError) throw new FeatureAccessError(failure.status, failure.code, failure.message);
    throw new FeatureAccessError(503, `plan_access_unavailable`, `Plan Access Could Not Be Confirmed — Try Again`);
  }
};
export const requirePaidFeatureAccess = async (request: Request) => {
  const access = await getRequestPlanAccess(request);
  if (!access.paid) throw new FeatureAccessError(403, `starter_plan_required`, `Choose Starter To Unlock This Feature`);
  return access;
};
export const requireRegistrarAccess = async (request: Request, provider: string, allowGuest = false) => {
  const access = await getRequestPlanAccess(request, allowGuest);
  if (!canUseConnectionProvider(provider, access.paid)) throw new FeatureAccessError(403, `starter_plan_required`, `Choose Starter To Connect This Registrar`);
  return access;
};
export const requireStarterFeatureAccess = async (request: Request, _signal: AbortSignal) => {
  const access = await getRequestPlanAccess(request);
  if (!access.owner) throw new FeatureAccessError(403, `auction_preview_only`, `Domain Auctions Are Planned — Owner Preview Only`);
};

