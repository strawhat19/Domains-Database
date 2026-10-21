import type { CommunityProfile } from '../../../shared/social/types';

export interface PublicPortfolioDiscoveryProps {
  scope?: string;
  error?: string | null;
  profiles: CommunityProfile[];
  loading: boolean;
  onRefresh: () => void;
}
