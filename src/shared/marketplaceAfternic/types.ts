import type { SellerListing } from '../marketplace/types';

export interface AfternicListing {
  domain: string;
  status: string;
  canImport: boolean;
  priceCents: number | null;
  acceptOffers: boolean;
  floorPriceCents: number | null;
  fastTransferStatus: string | null;
  minimumOfferCents: number | null;
  estimatedValueCents: number | null;
}

export interface AfternicPortfolioPage {
  listings: AfternicListing[];
  nextOffset: number | null;
  skipped: number;
}

export interface AfternicPublishReview {
  domain: string;
  listingId: string;
  acceptOffers: boolean;
  priceCents: number | null;
  minimumOfferCents: number | null;
  providerListing: AfternicListing | null;
}

export interface AfternicActionResult {
  created: boolean;
  providerListing: AfternicListing | null;
}

export interface AfternicConnectionStatus {
  configured: boolean;
  canConfigure: boolean;
}

export interface AfternicSyncProgress {
  done: boolean;
  count: number;
  skipped: number;
  attemptId: string;
  syncedAt: string | null;
}

export interface AfternicSnapshotPage extends AfternicPortfolioPage {
  syncedAt: string | null;
  generationId: string | null;
}

export type AfternicCredentialField = `key` | `secret`;

export interface AfternicActions {
  status: { input: Record<never, never>; output: AfternicConnectionStatus };
  configure: { input: { key: string; secret: string }; output: AfternicConnectionStatus };
  reveal: { input: { field: AfternicCredentialField }; output: { value: string } };
  check: { input: { listingId: string }; output: AfternicActionResult };
  import: { input: { domain: string }; output: SellerListing };
  portfolio: { input: { offset: number }; output: AfternicPortfolioPage };
  sync: { input: { attemptId: string | null }; output: AfternicSyncProgress };
  review: { input: { listingId: string }; output: AfternicPublishReview };
  snapshot: { input: { offset: number; generationId: string | null }; output: AfternicSnapshotPage };
  publish: { input: Pick<AfternicPublishReview, `listingId` | `acceptOffers` | `priceCents`>; output: AfternicActionResult };
}
