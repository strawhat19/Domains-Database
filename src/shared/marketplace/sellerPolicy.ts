import type { FeatureAudience } from '../featureFlags/types';

export interface MarketplaceSellerPolicy { enabled: boolean; audience: FeatureAudience }
export type MarketplaceSellerPolicyChange =
  | { field: `enabled`; value: boolean }
  | { field: `role`; role: string; allowed: boolean }
  | { field: `minimumPlan`; value: string | null };

export const defaultMarketplaceSellerPolicy: MarketplaceSellerPolicy = {
  enabled: true,
  audience: { roles: null, plans: [`starter`], planMode: `minimum` },
};
