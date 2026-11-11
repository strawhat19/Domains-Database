import type { Firestore, Transaction } from 'firebase-admin/firestore';
import { genID, getAppCollectionIDNumber } from '../../shared/common/ids';
import { featureSettingsId, readFeatureAudience } from '../../shared/featureFlags/values';
import { defaultMarketplaceSellerPolicy, type MarketplaceSellerPolicy } from '../../shared/marketplace/sellerPolicy';

const { id } = genID(`MarketplacePolicy`, 1, `Listings`, new Date(`2026-11-11T18:00:00Z`), `2fab27260ec647919e4f1cab9f9ed517`);
const policyType = `MarketplacePolicy`;
export const marketplacePolicyId = id;

export const loadMarketplaceSellerPolicy = async (transaction: Transaction, database: Firestore) => {
  const reference = database.doc(`marketplacePolicies/${id}`);
  const snapshot = await transaction.get(reference);
  if (snapshot.exists) {
    const saved = snapshot.data();
    if (saved?.id !== id || saved.number !== 1 || saved.type !== policyType || saved.version !== 1 || typeof saved.enabled !== `boolean`
      || typeof saved.createdAt?.toDate !== `function` || typeof saved.updatedAt?.toDate !== `function`) throw new Error(`Saved Marketplace Policy Is Unavailable`);
    return { reference, exists: true, policy: { enabled: saved.enabled, audience: readFeatureAudience(saved.audience) } as MarketplaceSellerPolicy };
  }
  const legacy = database.doc(`featureSettings/${featureSettingsId}`);
  const staged = (await transaction.get(legacy)).data();
  const enabled: unknown = staged?.flags?.marketplaceListings;
  const audience: unknown = staged?.audiences?.marketplaceListings;
  const stagedFields = [...(enabled === undefined ? [] : [`flags.marketplaceListings`]), ...(audience === undefined ? [] : [`audiences.marketplaceListings`])];
  if (enabled !== undefined && typeof enabled !== `boolean`) throw new Error(`Saved Marketplace Policy Is Unavailable`);
  const policy: MarketplaceSellerPolicy = {
    enabled: enabled ?? defaultMarketplaceSellerPolicy.enabled,
    audience: audience === undefined ? defaultMarketplaceSellerPolicy.audience : readFeatureAudience(audience),
  };
  return { reference, exists: false, policy, legacy, stagedFields };
};

export const readMarketplacePlanTier = async (transaction: Transaction, database: Firestore, slug: string) => {
  const tier = (await transaction.get(database.doc(`planSlugs/${slug}`))).data();
  if (!tier || tier.slug !== slug || !Number.isSafeInteger(tier.number) || tier.number < 1 || getAppCollectionIDNumber(tier.id, `Plan`) !== tier.number
    || !Number.isSafeInteger(tier.displayOrder) || tier.displayOrder < 0) return null;
  const catalog = (await transaction.get(database.doc(`plans/${tier.id}`))).data();
  if (catalog?.slug !== slug || catalog.number !== tier.number || catalog.displayOrder !== tier.displayOrder) return null;
  return { number: tier.number as number, displayOrder: tier.displayOrder as number };
};
