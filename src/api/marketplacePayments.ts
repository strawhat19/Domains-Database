import { Linking, Platform } from 'react-native';
import { absoluteSiteUrl } from '../shared/seo';
import { useLocalStorage } from '../shared/config';
import { firebaseEnabled } from '../shared/firebase/config';
import { getFirebaseAuth } from '../shared/firebase/client';
import type { MarketplaceCheckout, MarketplaceOrder, MarketplaceOrderSide, MarketplacePayoutStatus } from '../shared/marketplace/paymentTypes';

export class MarketplacePaymentError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

const invalidResponse = () => new MarketplacePaymentError(`marketplace_invalid_response`, `Marketplace Payments Returned An Unexpected Response`);
const objectValue = (value: unknown) => value && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : null;
const validDate = (value: unknown) => typeof value === `string` && Number.isFinite(Date.parse(value));
const assertHostedUrl = (value: unknown, hosts: readonly string[]) => {
  try {
    const url = new URL(typeof value === `string` ? value : ``);
    if (url.protocol === `https:` && hosts.includes(url.hostname) && !url.port && !url.username && !url.password) return url.href;
  } catch { /* Treat malformed URLs as invalid responses. */ }
  throw invalidResponse();
};

const requestPayments = async (path: string, body?: object, signal?: AbortSignal): Promise<unknown> => {
  if (!firebaseEnabled || useLocalStorage) throw new MarketplacePaymentError(`marketplace_not_connected`, `Connect Firebase To Use Marketplace Payments`);
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const identity = auth.currentUser;
  if (!identity || identity.isAnonymous) throw new MarketplacePaymentError(`marketplace_sign_in_required`, `Sign In To Use Marketplace Payments`);
  const assertIdentity = () => {
    if (auth.currentUser !== identity) throw new MarketplacePaymentError(`marketplace_account_changed`, `Your Account Changed — Try Again`);
  };
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeout = setTimeout(abort, 30_000);
  signal?.addEventListener(`abort`, abort, { once: true });
  if (signal?.aborted) abort();
  try {
    const token = await identity.getIdToken();
    assertIdentity();
    const route = `/api/marketplace/${path}`;
    const response = await fetch(Platform.OS === `web` ? route : absoluteSiteUrl(route), {
      cache: `no-store`,
      redirect: `error`,
      credentials: `omit`,
      signal: controller.signal,
      method: body ? `POST` : `GET`,
      ...(body ? { body: JSON.stringify(body) } : {}),
      headers: { Accept: `application/json`, Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': `application/json` } : {}) },
    });
    const result: unknown = await response.json().catch(() => null);
    assertIdentity();
    if (!response.ok) {
      const data = objectValue(result);
      const code = typeof data?.code === `string` ? data.code : `marketplace_payment_unavailable`;
      throw new MarketplacePaymentError(code, typeof data?.error === `string` ? data.error : `Marketplace Payments Are Unavailable — Try Again`);
    }
    return result;
  } catch (failure) {
    if (failure instanceof MarketplacePaymentError) throw failure;
    throw new MarketplacePaymentError(`marketplace_payment_unavailable`, controller.signal.aborted ? `Marketplace Payment Request Timed Out Or Was Cancelled` : `Could Not Reach Marketplace Payments — Try Again`);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener(`abort`, abort);
  }
};

const readOrder = (value: unknown): MarketplaceOrder => {
  const order = objectValue(value);
  if (!order || typeof order.id !== `string` || typeof order.domain !== `string` || typeof order.listingId !== `string` || typeof order.threadId !== `string`
    || typeof order.buyerId !== `string` || typeof order.sellerId !== `string` || !Number.isSafeInteger(order.number)
    || !Number.isSafeInteger(order.amountCents) || !Number.isSafeInteger(order.commissionCents) || order.currency !== `usd`
    || (order.offerId !== null && typeof order.offerId !== `string`) || !validDate(order.createdAt)
    || (order.paidAt !== null && !validDate(order.paidAt)) || (order.mode !== `sandbox` && order.mode !== `live`)
    || (order.sellerFundsStatus !== null && order.sellerFundsStatus !== `transferred` && order.sellerFundsStatus !== `review_required`)
    || (order.transferStatus !== null && order.transferStatus !== `awaiting_transfer`) || ![`pending`, `paid`, `expired`, `failed`].includes(String(order.status))) throw invalidResponse();
  return order as unknown as MarketplaceOrder;
};

export const getMarketplacePayoutStatus = async (signal?: AbortSignal): Promise<MarketplacePayoutStatus> => {
  const result = objectValue(await requestPayments(`seller`, undefined, signal));
  if (!result || (result.mode !== null && result.mode !== `sandbox` && result.mode !== `live`)
    || ![`unavailable`, `setup_required`, `pending`, `ready`].includes(String(result.status))) throw invalidResponse();
  return result as unknown as MarketplacePayoutStatus;
};
export const openMarketplacePayoutSetup = async (signal?: AbortSignal) => ({ url: assertHostedUrl(objectValue(await requestPayments(`seller`, { action: `setup` }, signal))?.url, [`connect.stripe.com`]) });
export const openMarketplacePayoutDashboard = async (signal?: AbortSignal) => ({ url: assertHostedUrl(objectValue(await requestPayments(`seller`, { action: `dashboard` }, signal))?.url, [`connect.stripe.com`]) });
export const startMarketplaceCheckout = async (listingId: string, offerId?: string, signal?: AbortSignal): Promise<MarketplaceCheckout> => {
  const result = objectValue(await requestPayments(`checkout`, { listingId, ...(offerId ? { offerId } : {}) }, signal));
  if (!result) throw invalidResponse();
  return { order: readOrder(result.order), url: result.url === null ? null : assertHostedUrl(result.url, [`checkout.stripe.com`]) };
};
export const getMarketplaceOrder = async (orderId: string, signal?: AbortSignal) => readOrder(await requestPayments(`checkout?${new URLSearchParams({ orderId })}`, undefined, signal));
export const cancelMarketplaceCheckout = async (orderId: string, signal?: AbortSignal) => readOrder(await requestPayments(`checkout`, { cancelOrderId: orderId }, signal));
export const listMarketplaceOrders = async (side: MarketplaceOrderSide, signal?: AbortSignal) => {
  const result = await requestPayments(`checkout?${new URLSearchParams({ side })}`, undefined, signal);
  if (!Array.isArray(result) || result.length > 50) throw invalidResponse();
  return result.map(readOrder);
};
export const openMarketplaceStripeUrl = async (value: string) => {
  const url = assertHostedUrl(value, [`checkout.stripe.com`, `connect.stripe.com`]);
  if (Platform.OS === `web` && typeof window !== `undefined`) window.location.assign(url);
  else await Linking.openURL(url);
};
