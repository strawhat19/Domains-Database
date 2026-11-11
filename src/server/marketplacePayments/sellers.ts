import { randomUUID } from 'node:crypto';
import { getBillingDatabase } from '../billing/firebase';
import { BillingError, type BillingActor } from '../billing/types';
import { assertSellerEligible, assertPublicSellerProfile, confirmMarketplaceActor } from '../marketplace/access';
import type { MarketplacePayoutStatus, MarketplacePaymentMode } from '../../shared/marketplace/paymentTypes';
import { getMarketplaceStripe, getMarketplaceCountry, marketplaceReturnUrl, marketplaceStripeApp, marketplaceStripeUrl, requireMarketplaceStripe, type MarketplaceStripe } from './config';

interface SellerBinding {
  createdAt: string;
  setupId: string;
  country: string;
  stripeAccountId: string | null;
}

export const marketplaceSellerPath = (sellerId: string, mode: MarketplacePaymentMode) => `marketplaceSellerPayments/${sellerId}/modes/${mode}`;
export const validStripeAccountId = (value: unknown): value is string => typeof value === `string` && /^acct_[A-Za-z0-9]{1,200}$/.test(value);
const loadStripeSeller = async (config: MarketplaceStripe, accountId: string, sellerId: string) => {
  const account = await config.stripe.v2.core.accounts.retrieve(accountId, { include: [`configuration.recipient`] });
  if (account.livemode !== (config.mode === `live`) || account.id !== accountId || account.metadata?.app !== marketplaceStripeApp
    || account.metadata?.seller_id !== sellerId || account.closed) {
    throw new BillingError(409, `marketplace_payout_mismatch`, `Your Stripe Seller Account Is Unavailable`);
  }
  return account;
};
const ready = (account: Awaited<ReturnType<typeof loadStripeSeller>>) => {
  const balance = account.configuration?.recipient?.capabilities?.stripe_balance;
  return balance?.stripe_transfers?.status === `active` && (!balance.payouts || balance.payouts.status === `active`);
};
export const assertStripeSellerReady = async (config: MarketplaceStripe, accountId: string, sellerId: string) => {
  if (!ready(await loadStripeSeller(config, accountId, sellerId))) throw new BillingError(409, `marketplace_seller_payouts_pending`, `The Seller Still Needs To Finish Stripe Setup`);
};

export const getSellerPayoutStatus = async (actor: BillingActor): Promise<MarketplacePayoutStatus> => {
  const config = getMarketplaceStripe();
  if (!config) return { status: `unavailable`, mode: null };
  const accountId = (await getBillingDatabase().doc(marketplaceSellerPath(actor.id, config.mode)).get()).data()?.stripeAccountId;
  if (!validStripeAccountId(accountId)) return { status: getMarketplaceCountry() ? `setup_required` : `unavailable`, mode: config.mode };
  return { status: ready(await loadStripeSeller(config, accountId, actor.id)) ? `ready` : `pending`, mode: config.mode };
};

const getOrCreateStripeSeller = async (actor: BillingActor, config: MarketplaceStripe) => {
  const database = getBillingDatabase();
  const reference = database.doc(marketplaceSellerPath(actor.id, config.mode));
  const binding = await database.runTransaction(async transaction => {
    const user = await confirmMarketplaceActor(transaction, database, actor);
    assertPublicSellerProfile(user.profilePrivacy);
    await assertSellerEligible(transaction, database, actor.id);
    const current = (await transaction.get(reference)).data() as SellerBinding | undefined;
    if (current) return current;
    const country = getMarketplaceCountry();
    if (!country) throw new BillingError(503, `marketplace_country_unavailable`, `Configure The Marketplace Seller Country`);
    const created: SellerBinding = { country, setupId: randomUUID(), createdAt: new Date().toISOString(), stripeAccountId: null };
    transaction.create(reference, created);
    return created;
  });
  if (validStripeAccountId(binding.stripeAccountId)) return binding.stripeAccountId;
  if (Date.now() - Date.parse(binding.createdAt) >= 29 * 86_400_000) {
    throw new BillingError(409, `marketplace_payout_review`, `Your Stripe Seller Setup Needs Review Before Retrying`);
  }
  const account = await config.stripe.v2.core.accounts.create({
    dashboard: `express`,
    identity: { country: binding.country },
    metadata: { app: marketplaceStripeApp, seller_id: actor.id },
    configuration: { recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } } },
    defaults: { responsibilities: { fees_collector: `application`, losses_collector: `application` } },
  }, { idempotencyKey: `marketplace-seller-${binding.setupId}` });
  if (!validStripeAccountId(account.id) || account.livemode !== (config.mode === `live`)) throw new BillingError(503, `marketplace_payout_mismatch`, `Stripe Did Not Confirm The Seller Account`);
  return database.runTransaction(async transaction => {
    const saved = (await transaction.get(reference)).data();
    if (!saved || saved.setupId !== binding.setupId || (saved.stripeAccountId && saved.stripeAccountId !== account.id)) {
      throw new BillingError(409, `marketplace_payout_mismatch`, `Your Stripe Seller Setup Changed — Try Again`);
    }
    if (!saved.stripeAccountId) transaction.update(reference, { stripeAccountId: account.id });
    return account.id;
  });
};

export const createSellerOnboarding = async (actor: BillingActor, origin: string) => {
  const config = requireMarketplaceStripe();
  const account = await getOrCreateStripeSeller(actor, config);
  await loadStripeSeller(config, account, actor.id);
  const link = await config.stripe.v2.core.accountLinks.create({
    account,
    use_case: {
      type: `account_onboarding`,
      account_onboarding: {
        collection_options: { fields: `eventually_due` },
        return_url: marketplaceReturnUrl({ marketplacePayout: `return` }, origin),
        refresh_url: marketplaceReturnUrl({ marketplacePayout: `refresh` }, origin),
      },
    },
  });
  return { url: marketplaceStripeUrl(link.url, `connect.stripe.com`) };
};

export const createSellerDashboard = async (actor: BillingActor) => {
  const config = requireMarketplaceStripe();
  const accountId = (await getBillingDatabase().doc(marketplaceSellerPath(actor.id, config.mode)).get()).data()?.stripeAccountId;
  if (!validStripeAccountId(accountId)) throw new BillingError(409, `marketplace_payouts_setup_required`, `Set Up Your Stripe Seller Account First`);
  const account = await loadStripeSeller(config, accountId, actor.id);
  if (!ready(account)) throw new BillingError(409, `marketplace_payouts_pending`, `Finish Setting Up Your Stripe Seller Account First`);
  const link = await config.stripe.accounts.createLoginLink(account.id);
  return { url: marketplaceStripeUrl(link.url, `connect.stripe.com`) };
};
