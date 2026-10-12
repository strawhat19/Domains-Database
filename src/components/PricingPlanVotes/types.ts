import type { PricingInterestState } from '../Pricing/usePricingInterest';

export interface PricingPlanVotesProps {
  id: string;
  name: string;
  state: PricingInterestState;
  onVote: (direction: `up` | `down`) => void;
}
