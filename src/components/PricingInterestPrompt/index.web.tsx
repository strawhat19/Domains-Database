import './styles.scss';
import PricingPlanVotes from '../PricingPlanVotes';
import type { PricingInterestPromptProps } from './types';
import EditorModal from '../AdminPlans/EditorModal/index.web';
import { useAppBrand } from '../../shared/branding/useAppBrand';
import { X, Check, LogIn, UserPlus, ThumbsUp, RefreshCw } from 'lucide-react';

const PricingInterestPrompt = ({ plan, local, state, signedIn, onClose, onConfirm, onRefresh, onVote, onAuth }: PricingInterestPromptProps) => {
  const brand = useAppBrand();
  const name = brand.formatText(plan.name);
  const id = `pricing-interest-${plan.id}`;
  return <EditorModal id={id} busy={state.pending} onClose={onClose} labelledBy={`${id}-title`}>
    {dismiss => <article id={`${id}-body`} className={`pricing-interest-prompt`}>
      <div id={`${id}-heading`} className={`pricing-interest-heading`}>
        <h2 id={`${id}-title`} className={`pricing-interest-title`}><ThumbsUp id={`${id}-icon`} size={22} aria-hidden />{state.interested ? `Interest Saved` : `Interested In ${name}?`}</h2>
        <button id={`${id}-close`} className={`pricing-interest-close`} type={`button`} disabled={state.pending} onClick={dismiss} aria-label={`Close Plan Interest`}><X id={`${id}-close-icon`} size={18} aria-hidden /></button>
      </div>
      <p id={`${id}-description`} className={`pricing-interest-description`}>{state.interested ? `Your interest in ${name} has been saved.` : signedIn ? `Let the dev team know you are interested in ${name}.` : `Sign in or create an account to let the dev team know you are interested in ${name}.`}</p>
      {!state.interested && <div id={`${id}-actions`} className={`pricing-interest-actions`}>
        {signedIn ? <button id={`${id}-confirm`} className={`landing-button landing-button-primary`} type={`button`} disabled={!state.ready || state.pending} onClick={onConfirm}><Check id={`${id}-confirm-icon`} size={15} aria-hidden />{state.pending ? `Saving…` : `Save My Interest`}</button> : <>
          <button id={`${id}-signin`} className={`landing-button landing-button-primary`} type={`button`} disabled={state.pending} onClick={() => onAuth(`signin`)}><LogIn id={`${id}-signin-icon`} size={15} aria-hidden />{`Sign In`}</button>
          <button id={`${id}-signup`} className={`landing-button`} type={`button`} disabled={state.pending} onClick={() => onAuth(`signup`)}><UserPlus id={`${id}-signup-icon`} size={15} aria-hidden />{`Create Account`}</button>
        </>}
      </div>}
      {!signedIn && <div id={`${id}-guest`} className={`pricing-interest-guest`}>
        <p id={`${id}-guest-description`} className={`pricing-interest-description`}>{`Prefer to skip signup? Upvote without an account.`}</p>
        <PricingPlanVotes id={`${id}-votes`} name={name} state={state} onVote={onVote} />
        {!local ? <p id={`${id}-guest-account-note`} className={`pricing-interest-note`}>{`Guest votes stay separate from account feedback.`}</p> : null}
      </div>}
      {local ? <p id={`${id}-source`} className={`pricing-interest-note`}>{`Saved On This Device`}</p> : null}
      {state.loading ? <p id={`${id}-loading`} className={`pricing-interest-note`} role={`status`}>{`Loading Your Feedback…`}</p> : null}
      {state.notice ? <p id={`${id}-notice`} className={`pricing-interest-success`} role={`status`}>{state.notice}</p> : null}
      {state.error ? <div id={`${id}-feedback`} className={`pricing-interest-feedback`}><p id={`${id}-error`} className={`pricing-interest-error`} role={`alert`}>{state.error}</p>{!state.ready ? <button id={`${id}-retry`} className={`landing-button`} type={`button`} onClick={onRefresh}><RefreshCw id={`${id}-retry-icon`} size={14} aria-hidden />{`Try Again`}</button> : null}</div> : null}
    </article>}
  </EditorModal>;
};

export default PricingInterestPrompt;
