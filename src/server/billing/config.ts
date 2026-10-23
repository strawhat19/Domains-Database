import Stripe from 'stripe';
import { BillingError } from './types';

let client: Stripe | undefined;
export const getBillingOrigin = () => {
  const value = process.env.EXPO_PUBLIC_SITE_URL?.trim().replace(/\/+$/, ``);
  if (value !== `https://domaindatabases.com`) throw new BillingError(503, `billing_origin_unavailable`, `Configure The Production Billing Site URL`);
  return value;
};
export const getBillingStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || !/^(?:sk|rk)_live_[A-Za-z0-9]+$/.test(key)) throw new BillingError(503, `billing_stripe_unavailable`, `Live Stripe Billing Is Not Configured`);
  return client ??= new Stripe(key, { timeout: 20_000, maxNetworkRetries: 1 });
};
export const getStarterPriceId = () => {
  const id = process.env.STRIPE_STARTER_PRICE_ID?.trim();
  if (!id || !/^price_[A-Za-z0-9]{1,200}$/.test(id)) throw new BillingError(503, `billing_price_unavailable`, `The Live Starter Price Is Not Configured`);
  return id;
};
export const getWebhookSecret = () => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || !/^whsec_[A-Za-z0-9]{1,256}$/.test(secret)) throw new BillingError(503, `billing_webhook_unavailable`, `Stripe Subscription Confirmation Is Not Configured`);
  return secret;
};
export const getPortalConfigurationId = () => {
  const id = process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID?.trim();
  if (id && !/^bpc_[A-Za-z0-9]{1,200}$/.test(id)) throw new BillingError(503, `billing_portal_unavailable`, `The Billing Portal Configuration Is Invalid`);
  return id;
};
export const requireStarterPrice = async () => {
  const price = await getBillingStripe().prices.retrieve(getStarterPriceId());
  if (!price.livemode || !price.active || price.currency !== `usd` || price.unit_amount !== 133
    || price.type !== `recurring` || price.recurring?.interval !== `month` || price.recurring.interval_count !== 1) {
    throw new BillingError(503, `billing_price_mismatch`, `The Live Stripe Price Must Match Starter At $1.33 Per Month`);
  }
  return price;
};
export const hostedStripeUrl = (value: string | null | undefined, portal = false) => {
  if (!value) throw new BillingError(503, `billing_redirect_unavailable`, `Stripe Did Not Return A Checkout URL`);
  const url = new URL(value);
  if (url.protocol !== `https:` || url.username || url.password || url.port
    || url.hostname !== (portal ? `billing.stripe.com` : `checkout.stripe.com`)) throw new BillingError(503, `billing_redirect_unavailable`, `Stripe Returned An Unexpected Checkout URL`);
  return url.href;
};
