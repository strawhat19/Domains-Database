export type ListingStatus = `draft` | `active` | `paused` | `sold`;
export type OfferStatus = `pending` | `accepted` | `declined` | `withdrawn` | `paid`;

export interface MarketplaceListing {
  id: string;
  number: number;
  domain: string;
  status: ListingStatus;
  currency: `usd`;
  createdAt: string;
  description: string;
  acceptOffers: boolean;
  sellerName?: string;
  sellerPhotoURL?: string;
  sellerUsername: string;
  priceCents: number | null;
}

export interface SellerListing extends MarketplaceListing {
  afternicHold?: boolean;
  ownershipVerifiedAt: string | null;
  verification: { host: string; value: string } | null;
}

export interface MarketplaceSellerProfile {
  state: `public` | `private` | `not-found`;
  canEdit: boolean;
  canonicalUsername?: string;
  profile?: { id?: string; name: string; username: string; photoURL?: string; description?: string; joinedAt?: string; profilePrivacy: `public` | `private` };
  listings: MarketplaceListing[];
  nextCursor: string | null;
}

export interface MarketplacePage {
  listings: MarketplaceListing[];
  nextCursor: string | null;
}

export interface MarketplaceSellerTools {
  eligible: boolean;
  reason: string;
  username: string | null;
  listings: SellerListing[];
  nextCursor: string | null;
  profilePrivacy: `public` | `private`;
}

export interface ListingInput {
  domain: string;
  description: string;
  acceptOffers: boolean;
  priceCents: number | null;
}

export interface MarketplaceOffer {
  id: string;
  number: number;
  buyerId: string;
  sellerId: string;
  threadId: string;
  listingId: string;
  status: OfferStatus;
  currency: `usd`;
  amountCents: number;
  createdAt: string;
}

export interface MarketplaceThread {
  id: string;
  number: number;
  domain: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  updatedAt: string;
  otherName: string;
  hasUnread?: boolean;
  otherPhotoURL?: string;
  offer: MarketplaceOffer | null;
}

export interface MarketplaceMessage {
  id: string;
  text: string;
  number: number;
  senderId: string;
  createdAt: string;
}
