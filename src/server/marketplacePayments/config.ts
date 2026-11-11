import Stripe from 'stripe';
import { BillingError } from '../billing/types';
import { routes } from '../../shared/routes';
import { getBillingOrigin } from '../billing/config';
import type { MarketplacePaymentMode } from '../../shared/marketplace/paymentTypes';

export const marketplaceStripeApp = `domains-database-marketplace`;
let saved: { key: string; stripe: Stripe } | undefined;

const readMarketplaceStripeSettings = () => {
  const key = process.env.STRIPE_MARKETPLACE_SECRET_KEY?.trim();
  const keyMode = key && /^(?:sk|rk)_(test|live)_[A-Za-z0-9]+$/.exec(key)?.[1];
  const secret = process.env.STRIPE_MARKETPLACE_WEBHOOK_SECRET?.trim();
  if (!key || !keyMode || !secret || !/^whsec_[A-Za-z0-9]{1,256}$/.test(secret)) return null;
  const mode: MarketplacePaymentMode = keyMode === `live` ? `live` : `sandbox`;
  return { key, secret, mode };
};

export const getMarketplaceStripe = () => {
  const settings = readMarketplaceStripeSettings();
  if (!settings) return null;
  const { key, secret, mode } = settings;
  if (!saved || saved.key !== key) saved = { key, stripe: new Stripe(key, { timeout: 12_000, maxNetworkRetries: 1 }) };
  return { mode, secret, stripe: saved.stripe };
};

export const checkMarketplacePaymentOrigin = (request: Request, mode = readMarketplaceStripeSettings()?.mode) => {
  const url = new URL(request.url);
  const origin = request.headers.get(`origin`);
  const fetchSite = request.headers.get(`sec-fetch-site`);
  const local = process.env.NODE_ENV !== `production` && [`localhost`, `127.0.0.1`, `[::1]`].includes(url.hostname);
  const returnOrigin = local && mode === `sandbox` ? url.origin : getBillingOrigin();
  if (!local && url.origin !== returnOrigin || origin && origin !== url.origin || fetchSite && ![`same-origin`, `none`].includes(fetchSite)) {
    throw new BillingError(403, `marketplace_origin_forbidden`, `Use The Domains Database Site To Manage Marketplace Payments`);
  }
  return returnOrigin;
};

export const getMarketplaceCheckoutReadiness = (request: Request): { mode: MarketplacePaymentMode | null } => {
  const mode = readMarketplaceStripeSettings()?.mode;
  if (!mode) return { mode: null };
  try { checkMarketplacePaymentOrigin(request, mode); return { mode }; }
  catch { return { mode: null }; }
};

export type MarketplaceStripe = NonNullable<ReturnType<typeof getMarketplaceStripe>>;
export const requireMarketplaceStripe = () => {
  const config = getMarketplaceStripe();
  if (!config) throw new BillingError(503, `marketplace_stripe_unavailable`, `Stripe Marketplace Payments Are Not Configured`);
  return config;
};

export const getMarketplaceCountry = () => {
  const country = process.env.STRIPE_MARKETPLACE_COUNTRY?.trim().toLowerCase();
  return country && /^[a-z]{2}$/.test(country) ? country : null;
};

export const marketplaceReturnUrl = (query: Record<string, string>, origin = getBillingOrigin()) => {
  const url = new URL(routes.market.href, origin);
  url.search = new URLSearchParams(query).toString();
  return url.href;
};

export const marketplaceStripeUrl = (value: unknown, host: `checkout.stripe.com` | `connect.stripe.com`) => {
  try {
    const url = new URL(typeof value === `string` ? value : ``);
    if (url.protocol === `https:` && url.hostname === host && !url.port && !url.username && !url.password) return url.href;
  } catch { /* Treat malformed provider links as unavailable. */ }
  throw new BillingError(503, `marketplace_redirect_unavailable`, `Stripe Returned An Unexpected Marketplace Link`);
};
