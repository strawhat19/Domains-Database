export interface FeatureFlags {
  ads: boolean;
  contact: boolean;
  nameSwitch: boolean;
  pricingTable: boolean;
  themeToggle: boolean;
  domainMarquee: boolean;
  notifications: boolean;
}
export type FeatureFlagKey = keyof FeatureFlags;
export interface FeatureAudience { roles: string[] | null; plans: string[] | null; planMode?: `minimum` }
export type FeatureAudienceDimension = `roles` | `plans`;
export type FeatureAudiences = Record<FeatureFlagKey, FeatureAudience>;
export const featurePlanLimit = 200;
export interface FeatureSettings {
  id: string;
  number: 1;
  version: 1;
  name: `Global`;
  created: string;
  updated: string;
  flags: FeatureFlags;
  audiences: FeatureAudiences;
  type: `FeatureSettings`;
}
export const defaultFeatureFlags: FeatureFlags = {
  ads: false,
  contact: true,
  nameSwitch: true,
  pricingTable: true,
  themeToggle: true,
  domainMarquee: true,
  notifications: true,
};
export const featureFlagKeys = Object.keys(defaultFeatureFlags) as FeatureFlagKey[];
