export type MarketplacePaymentMode = `sandbox` | `live`;
export type MarketplaceOrderStatus = `pending` | `paid` | `expired` | `failed`;
export type MarketplaceOrderSide = `buying` | `selling`;
export type MarketplaceSellerFundsStatus = `transferred` | `review_required` | null;

export interface MarketplacePayoutStatus {
  mode: MarketplacePaymentMode | null;
  status: `unavailable` | `setup_required` | `pending` | `ready`;
}

export interface MarketplaceOrder {
  id: string;
  number: number;
  domain: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  threadId: string;
  paidAt: string | null;
  createdAt: string;
  amountCents: number;
  offerId: string | null;
  commissionCents: number;
  currency: `usd`;
  status: MarketplaceOrderStatus;
  mode: MarketplacePaymentMode;
  sellerFundsStatus: MarketplaceSellerFundsStatus;
  transferStatus: `awaiting_transfer` | null;
}

export interface MarketplaceCheckout {
  order: MarketplaceOrder;
  url: string | null;
}
