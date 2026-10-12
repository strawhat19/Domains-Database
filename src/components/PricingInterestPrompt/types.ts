import type { Plan } from '../../shared/models/plans/Plan';
import type { PricingInterestState } from '../Pricing/usePricingInterest';

export interface PricingInterestPromptProps {
  plan: Plan;
  local: boolean;
  signedIn: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onRefresh: () => void;
  state: PricingInterestState;
  onVote: () => void;
  onAuth: (mode: `signin` | `signup`) => void;
}
