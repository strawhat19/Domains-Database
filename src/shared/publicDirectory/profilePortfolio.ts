import type { Roles } from '../../types/types';

export type PublicProfileCardMetadata = {
  id: string;
  role: Roles | null;
  totalDomains: number | null;
};

export type PublicProfilePortfolio = {
  totalDomains: number;
  domains: { id: string; name: string }[];
};
