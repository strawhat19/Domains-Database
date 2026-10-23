export const planCurrencies = [`USD`, `EUR`, `GBP`, `CAD`, `AUD`, `BDT`] as const;
export const planBillingIntervals = [`month`, `year`, `one-time`] as const;
export const planIcons = [`Gem`, `Zap`, `Globe2`, `Puzzle`, `Compass`, `Layers3`, `Building2`, `UsersRound`] as const;
export type PlanIcon = typeof planIcons[number];
export type PlanCurrency = typeof planCurrencies[number];
export type PlanBillingInterval = typeof planBillingIntervals[number];
export interface PlanTier { id: string; slug: string; number: number; displayOrder: number }
export const planTierLimit = 200;

export interface PlanInput {
  name: string;
  slug: string;
  icon?: PlanIcon;
  active: boolean;
  features: string[];
  priceCents: number;
  displayOrder: number;
  description: string;
  currency: PlanCurrency;
  billingInterval: PlanBillingInterval;
}
export const planLimits = { name: 100, slug: 100, feature: 200, features: 30, published: 100, description: 2000 } as const;
