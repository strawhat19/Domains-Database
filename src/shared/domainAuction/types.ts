export type AuctionSource = `godaddy` | `dynadot` | `namecheap`;
export type AuctionType = `bid` | `offer` | `expiring` | `public` | `closeout` | `buy-now`;
export type AuctionSort = `ending` | `price-low` | `price-high` | `bids` | `name` | `age`;
export type AuctionMatch = `contains` | `starts` | `ends` | `exact`;

export interface AuctionInventoryMetrics {
  isAdult?: boolean;
  pageviews?: number;
  valuationUsd?: number;
  majesticTf?: number;
  majesticCf?: number;
  semrushAs?: number;
  semrushCpc?: number;
  developedTlds?: number;
  exactMatchTlds?: number;
  majesticBacklinks?: number;
  semrushBacklinks?: number;
  semrushSearchVolume?: number;
  keywordRegistrations?: number;
  semrushIndexedPages?: number;
  majesticReferringDomains?: number;
  semrushReferringDomains?: number;
  monthlyParkingRevenueUsd?: number;
  semrushTopReferringDomains?: string[];
}

export interface AuctionRecord {
  id: string;
  domain: string;
  preview: boolean;
  type: AuctionType;
  source: AuctionSource;
  bids: number | null;
  endsAt: string | null;
  priceUsd: number | null;
  ageYears: number | null;
  sourceHref: string;
  listingHref?: string;
  number?: number;
  importedAt?: string;
  sourceCheckedAt?: string;
  dataSource?: `inventory` | `preview`;
  inventoryMetrics?: AuctionInventoryMetrics;
}

export interface AuctionFilters {
  query: string;
  keyword: string;
  excludes: string;
  minAge: string;
  minBids: string;
  minPrice: string;
  maxPrice: string;
  minLength: string;
  maxLength: string;
  extensions: string;
  noDigits: boolean;
  noHyphens: boolean;
  sort: AuctionSort;
  match: AuctionMatch;
  type: AuctionType | `all`;
  source: AuctionSource | `all`;
  endsWithin: `all` | `24` | `72` | `168`;
}
