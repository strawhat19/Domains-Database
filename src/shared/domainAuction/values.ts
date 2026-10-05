import type { AuctionFilters } from './types';

export const auctionSources = [
  { id: `godaddy`, label: `GoDaddy`, href: `https://auctions.godaddy.com/` },
  { id: `dynadot`, label: `Dynadot`, href: `https://www.dynadot.com/market/auction` },
  { id: `namecheap`, label: `Namecheap`, href: `https://www.namecheap.com/market/auctions/` },
] as const;

export const auctionTypes = [
  { id: `bid`, label: `Bid Auction` },
  { id: `offer`, label: `Make Offer` },
  { id: `public`, label: `Public Auction` },
  { id: `buy-now`, label: `Buy Now` },
  { id: `closeout`, label: `Closeout` },
  { id: `expiring`, label: `Expiring` },
] as const;

export const auctionSortOptions = [
  { id: `name`, label: `Name A–Z` },
  { id: `bids`, label: `Most Bids` },
  { id: `age`, label: `Oldest Domain` },
  { id: `ending`, label: `Ending Soonest` },
  { id: `price-low`, label: `Price: Low To High` },
  { id: `price-high`, label: `Price: High To Low` },
] as const;

export const auctionMatchOptions = [
  { id: `exact`, label: `Exact Name` },
  { id: `ends`, label: `Ends With` },
  { id: `starts`, label: `Starts With` },
  { id: `contains`, label: `Contains` },
] as const;

export const auctionEndOptions = [
  { id: `24`, label: `Next 24 Hours` },
  { id: `72`, label: `Next 3 Days` },
  { id: `168`, label: `Next 7 Days` },
] as const;

export const defaultAuctionFilters: AuctionFilters = {
  query: ``,
  keyword: ``,
  minAge: ``,
  excludes: ``,
  minBids: ``,
  minPrice: ``,
  maxPrice: ``,
  minLength: ``,
  maxLength: ``,
  extensions: ``,
  type: `all`,
  source: `all`,
  sort: `ending`,
  noDigits: false,
  match: `contains`,
  noHyphens: false,
  endsWithin: `all`,
};

export const auctionNumericFields = [
  { key: `minAge`, label: `Minimum Age (Years)` },
  { key: `minBids`, label: `Minimum Bids` },
  { key: `minPrice`, label: `Minimum Price (USD)` },
  { key: `maxPrice`, label: `Maximum Price (USD)` },
  { key: `minLength`, label: `Minimum Name Length` },
  { key: `maxLength`, label: `Maximum Name Length` },
] as const;

export const auctionTextFields = [
  { key: `keyword`, label: `Keyword`, placeholder: `e.g. cloud` },
  { key: `excludes`, label: `Exclude Words`, placeholder: `e.g. free, cheap` },
  { key: `extensions`, label: `Extensions`, placeholder: `e.g. com, net, io` },
] as const;
