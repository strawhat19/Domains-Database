import './styles.scss';
import { ThumbsUp } from 'lucide-react';
import type { PricingPlanVotesProps } from './types';

const PricingPlanVotes = ({ id, name, state, onVote }: PricingPlanVotesProps) => {
  const selected = state.ready && state.vote === `up`;
  return <div id={id} className={`pricing-plan-votes`} role={`group`} aria-label={`${name} Plan Upvote`} aria-busy={state.pending}>
    <button
      type={`button`}
      id={`${id}-up`}
      onClick={onVote}
      aria-pressed={selected}
      className={`pricing-plan-vote`}
      disabled={!state.ready || state.pending}
      aria-label={`${selected ? `Remove Upvote For` : `Upvote`} ${name}`}
    ><ThumbsUp id={`${id}-up-icon`} size={15} aria-hidden /><span id={`${id}-up-label`} className={`pricing-plan-vote-label`}>{selected ? `Remove Upvote` : `Upvote`}</span></button>
  </div>;
};

export default PricingPlanVotes;
