import './styles.scss';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import type { PricingPlanVotesProps } from './types';

const PricingPlanVotes = ({ id, name, state, onVote }: PricingPlanVotesProps) => <div id={id} className={`pricing-plan-votes`} role={`group`} aria-label={`${name} Plan Feedback`} aria-busy={state.pending}>
  {([`up`, `down`] as const).map(direction => {
    const Icon = direction === `up` ? ThumbsUp : ThumbsDown;
    const label = direction === `up` ? `Upvote` : `Downvote`;
    const selected = state.ready && state.vote === direction;
    return <button
      type={`button`}
      key={direction}
      id={`${id}-${direction}`}
      aria-pressed={selected}
      className={`pricing-plan-vote`}
      disabled={!state.ready || state.pending}
      aria-label={`${selected ? `Remove` : label} ${name}${selected ? ` ${label}` : ``}`}
      onClick={() => onVote(direction)}
    ><Icon id={`${id}-${direction}-icon`} size={15} aria-hidden /><span id={`${id}-${direction}-label`} className={`pricing-plan-vote-label`}>{label}</span></button>;
  })}
</div>;

export default PricingPlanVotes;
