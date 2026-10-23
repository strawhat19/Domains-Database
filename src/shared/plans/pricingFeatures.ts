import type { Plan } from '../models/plans/Plan';

type FeatureStatus = `current` | `proposed` | `included` | `catalog`;
type FeatureOrigin = `competitor` | `highlight`;
type MarketSource = `trydomainio` | `aftermarket` | `domainmod` | `efty`;

export interface PricingFeature {
  id: string;
  label: string;
  status: FeatureStatus;
  origin?: FeatureOrigin;
  sources?: readonly MarketSource[];
}

interface PricingFeatureBadge {
  id: FeatureStatus | FeatureOrigin;
  label: string;
  description: string;
}

export const pricingMarketSources = {
  efty: { name: `Efty`, url: `https://efty.com/pricing/` },
  domainmod: { name: `DomainMOD`, url: `https://domainmod.org/` },
  trydomainio: { name: `TryDomainio`, url: `https://www.trydomain.io/` },
  aftermarket: { name: `Aftermarket`, url: `https://aftermarket.com/register` },
} satisfies Record<MarketSource, { name: string; url: string }>;

const statusBadges: Record<FeatureStatus, PricingFeatureBadge> = {
  catalog: { id: `catalog`, label: `Catalog`, description: `Listed in the published catalog; availability is not classified` },
  included: { id: `included`, label: `Included`, description: `Includes features from the referenced plan in this catalog` },
  current: { id: `current`, label: `Included`, description: `Included in the published plan; account access and provider requirements apply` },
  proposed: { id: `proposed`, label: `Planned`, description: `Planned in the published catalog; not available through this pricing plan` },
};

type FeatureDetails = Omit<PricingFeature, `id` | `label`> & { label?: string };

const catalogDetails: Record<string, FeatureDetails> = {
  'remove ads': { status: `proposed` },
  'domains market': { status: `proposed` },
  'domain auctions': { status: `proposed` },
  'domains community': { status: `proposed` },
  'access to domains developer api': { status: `proposed` },
  'access to domains connections markets': { status: `proposed` },
  'domain portfolio': { status: `current`, origin: `competitor`, sources: [`trydomainio`, `domainmod`] },
  'everything in free': { status: `included` },
  'everything in enterprise': { status: `included` },
  'domain search with trending domains': { status: `current`, origin: `highlight` },
  'registrar availability & price comparison': { status: `current`, origin: `highlight` },
  'hosted-domain discovery & registrar lookup': { status: `current`, origin: `highlight` },
  'research, performance & tranco rank': { status: `current`, origin: `highlight` },
  'godaddy & hostinger connections': { status: `current`, origin: `competitor`, sources: [`domainmod`] },
  'porkbun & namesilo connections': { status: `current`, origin: `competitor`, sources: [`domainmod`] },
  'squarespace, namecheap & vercel connections': { status: `catalog`, origin: `competitor`, sources: [`domainmod`] },
  'csv import & export': { status: `current`, origin: `competitor`, sources: [`trydomainio`, `domainmod`] },
  'annual/monthly costs': { status: `current`, origin: `competitor`, sources: [`trydomainio`, `domainmod`] },
  'registrar & renewal dates': { status: `current`, origin: `competitor`, sources: [`trydomainio`, `domainmod`] },
  'projects, groups & tags': { status: `current`, origin: `highlight`, label: `Projects, groups, collections & tags` },
  'registrar & renewal tracking': { status: `current`, origin: `competitor`, sources: [`trydomainio`, `domainmod`], label: `Registrar & renewal dates` },
  'scheduled registrar sync': { status: `proposed`, origin: `competitor`, sources: [`domainmod`], label: `Configurable background sync schedules` },
  'advanced portfolio insights': { status: `proposed`, origin: `competitor`, sources: [`efty`] },
  'automated renewal reminders': { status: `proposed`, origin: `competitor`, sources: [`trydomainio`, `domainmod`] },
  'pro features': { status: `proposed` },
  'dom features': { status: `proposed` },
  'team features': { status: `proposed`, label: `Dom features` },
  'priority support': { status: `proposed`, origin: `competitor`, sources: [`efty`] },
  'custom portfolio fields': { status: `proposed`, origin: `competitor`, sources: [`domainmod`] },
  'shared team workspaces': { status: `proposed`, origin: `competitor`, sources: [`trydomainio`] },
  'member roles & permissions': { status: `proposed`, origin: `competitor`, sources: [`trydomainio`] },
  'bulk txt ownership verification': { status: `proposed`, origin: `competitor`, sources: [`aftermarket`] },
  'per-user currency preferences': { status: `proposed`, origin: `competitor`, sources: [`domainmod`] },
  'whm/cpanel server data imports': { status: `proposed`, origin: `competitor`, sources: [`domainmod`] },
  'ssl, hosting, dns & ip asset tracking': { status: `proposed`, origin: `competitor`, sources: [`domainmod`] },
  'portfolio activity history': { status: `proposed`, origin: `highlight` },
  'configurable renewal workflows': { status: `proposed`, origin: `highlight` },
  'organization-wide activity history': { status: `proposed`, origin: `highlight` },
  'consolidated multi-portfolio reports': { status: `proposed`, origin: `highlight` },
};

const normalizeLabel = (label: string) => label.trim().toLowerCase();

const orderPricingFeatures = <T>(features: readonly T[], getLabel: (feature: T) => string): T[] => [
  ...features.slice(0, 2),
  ...features.slice(2)
    .map((feature, index) => ({ index, feature, length: getLabel(feature).length }))
    .sort((first, second) => first.length - second.length || first.index - second.index)
    .map(({ feature }) => feature),
];

const positionFreeFeatures = <T>(slug: string, features: T[], getLabel: (feature: T) => string): T[] => {
  if (slug !== `free`) return features;
  const labels = new Set([
    `projects, groups & tags`,
    `github, preview & production links`,
    `projects, groups, collections & tags`,
    `search, filters & flexible portfolio views`,
  ]);
  const precedesConnections = (feature: T) => labels.has(normalizeLabel(getLabel(feature)));
  const movedFeatures = features.filter(precedesConnections);
  const otherFeatures = features.filter(feature => !precedesConnections(feature));
  const connectionsIndex = otherFeatures.findIndex(feature => normalizeLabel(getLabel(feature)) === `godaddy & hostinger connections`);
  if (connectionsIndex < 0) return features;
  const orderedFeatures = [...otherFeatures.slice(0, connectionsIndex), ...movedFeatures, ...otherFeatures.slice(connectionsIndex)];
  const orderedConnectionsIndex = connectionsIndex + movedFeatures.length;
  const searchIndex = orderedFeatures.findIndex(feature => normalizeLabel(getLabel(feature)) === `search, filters & flexible portfolio views`);
  const searchFeature = orderedFeatures[searchIndex];
  const connectionsFeature = orderedFeatures[orderedConnectionsIndex];
  if (searchFeature === undefined || connectionsFeature === undefined) return orderedFeatures;
  return orderedFeatures.map((feature, index) => index === searchIndex ? connectionsFeature : index === orderedConnectionsIndex ? searchFeature : feature);
};

export const getPricingFeatureLabels = (plan: Pick<Plan, `slug` | `features`>, formatLabel = (label: string) => label): string[] =>
  positionFreeFeatures(plan.slug, orderPricingFeatures(plan.features, label => formatLabel(getPricingFeaturePresentation(label).label)), label => getPricingFeaturePresentation(label).label);

export const getPricingFeaturePresentation = (savedLabel: string) => {
  const label = savedLabel.replace(/^planned:\s*/i, ``).trim();
  return { label, planned: /^planned:\s*/i.test(savedLabel) };
};

export const getPricingFeatures = (plan: Pick<Plan, `slug` | `features`>, formatLabel = (label: string) => label): PricingFeature[] => {
  const features = plan.features.map((savedLabel, index): PricingFeature => {
    const { label, planned } = getPricingFeaturePresentation(savedLabel);
    const details = catalogDetails[normalizeLabel(label)];
    return { ...details, label, id: `catalog-${index}`, status: planned ? `proposed` : `current` };
  });
  const orderedFeatures = orderPricingFeatures(features, feature => formatLabel(feature.label));
  return positionFreeFeatures(plan.slug, orderedFeatures, feature => feature.label);
};

export const getPricingFeatureBadges = (feature: PricingFeature): PricingFeatureBadge[] => {
  const badges: PricingFeatureBadge[] = [statusBadges[feature.status]];
  if (feature.origin === `highlight`) badges.push({ id: `highlight`, label: `App Highlight`, description: `A distinctive Domains Database workflow; not a claim of market exclusivity` });
  if (feature.origin === `competitor`) {
    const sources = feature.sources?.map(source => pricingMarketSources[source].name).join(`, `);
    badges.push({ id: `competitor`, label: `Competitor`, description: `Comparable feature advertised by ${sources || `a researched competitor`}` });
  }
  return badges;
};
