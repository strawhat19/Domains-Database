export const liveAuctionMetrics = {
  bids: [`Bids`, `count`],
  buyNow: [`Buy Now`, `money`],
  renewal: [`Renewal`, `money`],
  transfer: [`Transfer`, `money`],
  age: [`Domain Age (Years)`, `count`],
  currentBid: [`Current Bid`, `money`],
  nextBid: [`Next Minimum Bid`, `money`],
  proxyBid: [`Your Proxy Bid`, `money`],
  monthlyVisits: [`GoDaddy Monthly Visits`, `count`],
  estimatedValue: [`GoDaddy Estimate`, `money`],
  parkingRevenue: [`GoDaddy Parking Revenue (Last Period)`, `money`],
  exactMatches: [`Estibot Registered Extensions`, `count`],
  developedMatches: [`Estibot Developed Extensions`, `count`],
  similarRegistered: [`Estibot Similar Registrations`, `count`],
  similarDeveloped: [`Estibot Similar Developed Domains`, `count`],
  authorityScore: [`Semrush Authority Score`, `count`],
  semrushBacklinks: [`Semrush Backlinks`, `count`],
  semrushReferringDomains: [`Semrush Referring Domains`, `count`],
  semrushReferringUrls: [`Semrush Referring URLs`, `count`],
  keywordVolume: [`Semrush Monthly Keyword Searches`, `count`],
  keywordCost: [`Semrush Cost Per Click`, `money`],
  trustFlow: [`Majestic Trust Flow`, `count`],
  citationFlow: [`Majestic Citation Flow`, `count`],
  majesticBacklinks: [`Majestic Backlinks`, `count`],
  majesticReferringDomains: [`Majestic Referring Domains`, `count`],
} as const;

export interface LiveAuction {
  domain: string;
  available: boolean;
  checkedAt: string;
  endsAt?: string;
  beginsAt?: string;
  expiresAt?: string;
  createdAt?: string;
  listingId?: number;
  transfersAt?: string;
  listingType?: string;
  memberStatus?: string;
  characterPattern?: string;
  watching?: boolean;
  extended?: boolean;
  referers?: { domain: string; links: number }[];
  metrics: Partial<Record<keyof typeof liveAuctionMetrics, number>>;
}

export const isLiveAuctionListingId = (value: unknown): value is number => typeof value === `number` && Number.isSafeInteger(value) && value > 0;
export const isLiveAuctionCode = (value: unknown): value is string => typeof value === `string` && /^[A-Z_]{1,48}$/.test(value);
export const isLiveAuctionPattern = (value: unknown): value is string => typeof value === `string` && /^[vc]{1,63}$/.test(value);
