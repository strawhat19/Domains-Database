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
  included: { id: `included`, label: `Included`, description: `Includes the Free features listed in this catalog` },
  current: { id: `current`, label: `Current`, description: `Already implemented; existing account access and provider requirements apply` },
  proposed: { id: `proposed`, label: `Proposed`, description: `Display-only feature idea; not available through this pricing plan` },
};

type FeatureDetails = Omit<PricingFeature, `id` | `label`> & { label?: string };

const catalogDetails: Record<string, FeatureDetails> = {
  'domain portfolio': { status: `current`, origin: `competitor`, sources: [`trydomainio`, `domainmod`] },
  'everything in free': { status: `included` },
  'csv import & export': { status: `current`, origin: `competitor`, sources: [`trydomainio`, `domainmod`] },
  'projects, groups & tags': { status: `current`, origin: `highlight`, label: `Projects, groups, collections & tags` },
  'registrar & renewal tracking': { status: `current`, origin: `competitor`, sources: [`trydomainio`, `domainmod`], label: `Registrar, renewal dates & annual/monthly costs` },
  'scheduled registrar sync': { status: `proposed`, origin: `competitor`, sources: [`domainmod`], label: `Configurable background sync schedules` },
  'advanced portfolio insights': { status: `proposed`, origin: `competitor`, sources: [`efty`] },
  'automated renewal reminders': { status: `proposed`, origin: `competitor`, sources: [`trydomainio`, `domainmod`] },
  'pro features': { status: `proposed` },
  'team features': { status: `proposed` },
  'priority support': { status: `proposed`, origin: `competitor`, sources: [`efty`] },
  'shared team workspaces': { status: `proposed`, origin: `competitor`, sources: [`trydomainio`] },
  'member roles & permissions': { status: `proposed`, origin: `competitor`, sources: [`trydomainio`] },
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
    { id: `provider-imports`, status: `current`, origin: `competitor`, label: `GoDaddy, Hostinger, Namecheap & Vercel imports`, sources: [`domainmod`] },
    { id: `hosting-discovery`, status: `current`, origin: `highlight`, label: `Hosted-domain discovery & registrar lookup` },
    { id: `domain-search`, status: `current`, origin: `highlight`, label: `Registrar availability & price comparison` },
    { id: `domain-research`, status: `current`, origin: `highlight`, label: `Domain research, mobile performance & Tranco rank` },
  ],
  pro: [
    { id: `pro-imports`, status: `current`, origin: `competitor`, label: `Porkbun & NameSilo imports (existing Pro access)`, sources: [`domainmod`] },
    { id: `whois-monitoring`, status: `proposed`, origin: `competitor`, label: `WHOIS changes & domain status monitoring`, sources: [`trydomainio`] },
    { id: `sales-pages`, status: `proposed`, origin: `competitor`, label: `For-sale landing pages & a domain shop`, sources: [`efty`] },
    { id: `ownership-verification`, status: `proposed`, origin: `competitor`, label: `Bulk TXT ownership verification`, sources: [`aftermarket`] },
  ],
  team: [
    { id: `branded-reports`, status: `proposed`, origin: `competitor`, label: `Branded reports & alerts`, sources: [`trydomainio`] },
    { id: `workflow-integrations`, status: `proposed`, origin: `competitor`, label: `Zapier & marketing integrations`, sources: [`efty`] },
  ],
  enterprise: [
    { id: `custom-fields`, status: `proposed`, origin: `competitor`, label: `Custom portfolio fields`, sources: [`domainmod`] },
    { id: `asset-tracking`, status: `proposed`, origin: `competitor`, label: `SSL, hosting, DNS & IP asset tracking`, sources: [`domainmod`] },
    { id: `currency-preferences`, status: `proposed`, origin: `competitor`, label: `Per-user currency preferences`, sources: [`domainmod`] },
    { id: `server-imports`, status: `proposed`, origin: `competitor`, label: `WHM/cPanel server data imports`, sources: [`domainmod`] },
  ],
};

const normalizeLabel = (label: string) => label.trim().toLowerCase();

export const getPricingFeatures = (plan: Pick<Plan, `slug` | `features`>): PricingFeature[] => {
  const features = plan.features.map((savedLabel, index): PricingFeature => {
    const proposed = /^planned:\s*/i.test(savedLabel);
    const label = savedLabel.replace(/^planned:\s*/i, ``).trim();
    const details = catalogDetails[normalizeLabel(label)];
    return { id: `catalog-${index}`, label, ...details, status: proposed ? `proposed` : details?.status ?? `catalog` };
  });
  const labels = new Set(features.map(feature => normalizeLabel(feature.label)));
  const additions = Object.prototype.hasOwnProperty.call(previewFeatures, plan.slug) ? previewFeatures[plan.slug] : [];
  return [...features, ...additions.filter(feature => !labels.has(normalizeLabel(feature.label)))];
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
