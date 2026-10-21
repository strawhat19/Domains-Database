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
  current: { id: `current`, label: `Current`, description: `Already implemented; existing account access and provider requirements apply` },
  proposed: { id: `proposed`, label: `Proposed`, description: `Display-only feature idea; not available through this pricing plan` },
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
  'porkbun & namesilo imports': { status: `current`, origin: `competitor`, sources: [`domainmod`] },
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

// Presentation ideas stay separate from persisted plans and account entitlements.
const previewFeatures: Record<string, readonly PricingFeature[]> = {
  free: [
    { id: `cloud-portfolio`, status: `current`, label: `Private portfolio across signed-in devices` },
    { id: `portfolio-views`, status: `current`, origin: `competitor`, label: `Search, filters & flexible portfolio views`, sources: [`domainmod`] },
    { id: `project-stages`, status: `current`, origin: `highlight`, label: `Idea-to-launch stages & collection progress` },
    { id: `launch-links`, status: `current`, origin: `highlight`, label: `GitHub, preview & production links` },
  ],
  pro: [
    { id: `whois-monitoring`, status: `proposed`, origin: `competitor`, label: `WHOIS changes & domain status monitoring`, sources: [`trydomainio`] },
    { id: `sales-pages`, status: `proposed`, origin: `competitor`, label: `For-sale landing pages & a domain shop`, sources: [`efty`] },
  ],
  team: [
    { id: `branded-reports`, status: `proposed`, origin: `competitor`, label: `Branded reports & alerts`, sources: [`trydomainio`] },
    { id: `workflow-integrations`, status: `proposed`, origin: `competitor`, label: `Zapier & marketing integrations`, sources: [`efty`] },
  ],
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

const getPlanFeatureLabels = (plan: Pick<Plan, `slug` | `features`>): string[] => {
  if (plan.slug !== `free`) return plan.features;
  const features = plan.features.filter(feature => normalizeLabel(feature) !== `remove ads`);
  if (!features.some(feature => normalizeLabel(feature) === `domain search with trending domains`)) {
    features.push(`Domain Search with Trending Domains`);
  }
  return features;
};

export const getPricingFeatureLabels = (plan: Pick<Plan, `slug` | `features`>, formatLabel = (label: string) => label): string[] =>
  positionFreeFeatures(plan.slug, orderPricingFeatures(getPlanFeatureLabels(plan), formatLabel), label => label);

export const getPricingFeatures = (plan: Pick<Plan, `slug` | `features`>, formatLabel = (label: string) => label): PricingFeature[] => {
  const features = getPlanFeatureLabels(plan).map((savedLabel, index): PricingFeature => {
    const proposed = /^planned:\s*/i.test(savedLabel);
    const label = savedLabel.replace(/^planned:\s*/i, ``).trim();
    const details = catalogDetails[normalizeLabel(label)];
    return { id: `catalog-${index}`, label, ...details, status: proposed ? `proposed` : details?.status ?? `catalog` };
  });
  const labels = new Set(features.map(feature => normalizeLabel(feature.label)));
  const additions = Object.prototype.hasOwnProperty.call(previewFeatures, plan.slug) ? previewFeatures[plan.slug] : [];
  const orderedFeatures = orderPricingFeatures([...features, ...additions.filter(feature => !labels.has(normalizeLabel(feature.label)))], feature => formatLabel(feature.label));
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
