import type { PlanCurrency, PlanBillingInterval } from '../plans/types';

export interface SubscriptionRequest {
  userId: string;
  planId: string;
  planSlug: string;
  priceCents: number;
  requestedAt: string;
  currency: PlanCurrency;
  status: `awaiting-payment-setup`;
  billingInterval: PlanBillingInterval;
}
