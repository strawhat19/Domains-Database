import { absoluteSiteUrl } from '../../shared/seo';
import { sellerProfilePath } from '../../shared/marketplace/paths';
import type { MarketplaceListing } from '../../shared/marketplace/types';

export const sellerProfileUrl = (username: string) => absoluteSiteUrl(sellerProfilePath(username));

export const formatSellerJoinDate = (value?: string) => {
  const date = new Date(value ?? ``);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString(undefined, { year: `numeric`, month: `long` }) : ``;
};

const dollars = new Intl.NumberFormat(`en-US`, { style: `currency`, currency: `USD` });
export const formatSellerListingPrice = (listing: MarketplaceListing) =>
  listing.priceCents !== null ? dollars.format(listing.priceCents / 100) : listing.acceptOffers ? `Make An Offer` : `Sale Pending`;

export const sellerStatus = (privatePage: boolean, missing: boolean, error: string) => privatePage ? {
  title: `This Seller Profile Is Private`,
  detail: `The seller's details and listings are hidden on this page.`,
} : missing ? {
  title: `Seller Profile Not Found`,
  detail: `The profile address may have changed, or the seller may no longer be available.`,
} : {
  title: `Seller Profile Unavailable`,
  detail: error || `The profile could not be loaded. Please try again.`,
};
