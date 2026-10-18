import '../LandingSections/styles.scss';
import './styles.scss';
import { Link } from 'expo-router';
import { usePricing } from './usePricing';
import RouterAnchor from '../RouterAnchor';
import { routes } from '../../shared/routes';
import PricingFeature from '../PricingFeature';
import StackPillShape from '../StackPillShape';
import PricingSkeleton from '../PricingSkeleton';
import PricingPlanPrice from '../PricingPlanPrice';
import PricingPlanVotes from '../PricingPlanVotes';
import { pricingDescription } from './presentation';
import { getPricingPlanVisual } from './planIcons';
import { usePricingInterest } from './usePricingInterest';
import PricingInterestPrompt from '../PricingInterestPrompt';
import { useAppBrand } from '../../shared/branding/useAppBrand';
import { getPricingFeatures, getPricingFeatureLabels } from '../../shared/plans/pricingFeatures';
import { useFeatureFlags } from '../../shared/featureFlags/useFeatureFlags';
import { Gem, Zap, Check, Globe2, Puzzle, Compass, Layers3, ThumbsUp, RefreshCw, Building2, UsersRound, ArrowUpRight } from 'lucide-react';

const planIcons = { Gem, Zap, Globe2, Puzzle, Compass, Layers3, Building2, UsersRound };

const Pricing = () => {
  const state = usePricing();
  const brand = useAppBrand();
  const { flags, ready } = useFeatureFlags();
  const contactEnabled = ready && flags.contact;
  const pricingEnabled = ready && flags.pricingTable;
  const interestEnabled = ready && !flags.pricingTable;
  const interest = usePricingInterest(state.plans, interestEnabled);
  return <section id={`landing-pricing`} className={`landing-section landing-pricing`} aria-labelledby={`landing-pricing-title`} aria-busy={state.loading}>
    <div id={`landing-pricing-inner`} className={`landing-section-inner`}>
      <div id={`landing-pricing-heading`} className={`landing-section-heading landing-pricing-heading`}>
        <div id={`landing-pricing-copy`} className={`landing-heading-copy`}>
          <p id={`landing-pricing-eyebrow`} className={`landing-eyebrow`}>{`Room To Grow`}</p>
          <h2 id={`landing-pricing-title`} className={`landing-section-title`}>{`Plans for your next idea.`}</h2>
          <p id={`landing-pricing-description`} className={`landing-section-description`}>{interestEnabled ? `Tell us which plans interest you. Sign in to share your interest or vote without creating an account.` : contactEnabled ? pricingDescription : `Explore the plans and features for your next idea.`}</p>
          {interestEnabled && interest.local ? <p id={`landing-pricing-interest-source`} className={`landing-section-note`}>{`Feedback Is Saved On This Device`}</p> : null}
        </div>
      </div>
      {state.loading ? <PricingSkeleton expanded={state.showFeaturePreview} /> : state.error ? <div id={`pricing-error`} className={`pricing-feedback pricing-error`} role={`alert`}>
        <p id={`pricing-error-description`} className={`pricing-feedback-copy`}>{state.error}</p>
        <button id={`pricing-retry`} className={`landing-button`} type={`button`} onClick={state.refresh}><RefreshCw id={`pricing-retry-icon`} className={`landing-link-icon`} size={15} aria-hidden />{`Try Again`}</button>
      </div> : state.plans.length ? <div id={`landing-pricing-grid`} className={`landing-pricing-grid`}>
        {state.plans.map(plan => {
          const visual = getPricingPlanVisual(plan);
          const PlanIcon = planIcons[visual.icon];
          const planInterest = interest.getState(plan.id);
          return <article key={plan.id} id={`landing-plan-${plan.id}`} className={`landing-plan`}>
          <div aria-hidden id={`landing-plan-${plan.id}-backing`} className={`landing-card-backing`}><StackPillShape id={`landing-plan-${plan.id}-backing`} /></div>
          <StackPillShape id={`landing-plan-${plan.id}-foreground`} />
          <h3 id={`landing-plan-name-${plan.id}`} className={`landing-card-title landing-plan-title`}><PlanIcon size={28} strokeWidth={1.8} aria-hidden id={`landing-plan-name-icon-${plan.id}`} className={`landing-plan-name-icon`} style={{ color: `var(--${visual.tone})` }} /><span id={`landing-plan-name-label-${plan.id}`} className={`landing-plan-name-label`}>{brand.formatText(plan.name)}</span></h3>
          <p id={`landing-plan-description-${plan.id}`} className={`landing-card-description`}>{brand.formatText(plan.description)}</p>
          <PricingPlanPrice plan={plan} id={`landing-plan-price-${plan.id}`} color={`var(--${visual.tone})`} />
          <ul id={`landing-plan-features-${plan.id}`} className={`landing-plan-features`}>
            {state.showFeaturePreview ? getPricingFeatures(plan).map(feature => <PricingFeature
              key={feature.id}
              feature={feature}
              id={`landing-plan-feature-${plan.id}-${feature.id}`}
            />) : getPricingFeatureLabels(plan).map((feature, index) => <li
              key={`${plan.id}-${index}`}
              className={`landing-plan-feature`}
              id={`landing-plan-feature-${plan.id}-${index}`}
            >
              <Check size={14} aria-hidden className={`landing-feature-icon`} id={`landing-plan-feature-icon-${plan.id}-${index}`} />
              <span className={`landing-feature-label`} id={`landing-plan-feature-label-${plan.id}-${index}`}>{brand.formatText(feature)}</span>
            </li>)}
          </ul>
          {pricingEnabled && (contactEnabled || (plan.priceCents === 0 && plan.slug === `free`)) && <Link asChild href={plan.priceCents === 0 && plan.slug === `free` ? routes.domains.href : routes.contact.href}><RouterAnchor id={`landing-plan-action-${plan.id}`} className={`landing-button landing-plan-action`}><span id={`landing-plan-action-label-${plan.id}`} className={`landing-link-label`}>{plan.priceCents === 0 && plan.slug === `free` ? `Open Your Portfolio` : `Ask About ${brand.formatText(plan.name)}`}</span><ArrowUpRight size={15} aria-hidden id={`landing-plan-action-arrow-${plan.id}`} className={`landing-link-icon`} /></RouterAnchor></Link>}
          {interestEnabled ? <div id={`landing-plan-interest-${plan.id}`} className={`pricing-plan-interest`}>
            <button
              type={`button`}
              id={`landing-plan-interest-action-${plan.id}`}
              aria-haspopup={interest.signedIn ? undefined : `dialog`}
              onClick={() => { void interest.register(plan.id); }}
              className={`landing-button landing-plan-action`}
              disabled={planInterest.pending || planInterest.interested || (interest.signedIn && !planInterest.ready)}
            >{planInterest.interested ? <Check id={`landing-plan-interest-icon-${plan.id}`} size={15} aria-hidden /> : <ThumbsUp id={`landing-plan-interest-icon-${plan.id}`} size={15} aria-hidden />}<span id={`landing-plan-interest-label-${plan.id}`} className={`landing-link-label`}>{planInterest.pending ? `Saving…` : planInterest.interested ? `Interest Saved` : `I'm Interested`}</span></button>
            <p id={`landing-plan-votes-label-${plan.id}`} className={`pricing-plan-interest-note`}>{interest.signedIn ? `Upvote This Plan` : `Upvote Without Signup`}</p>
            <PricingPlanVotes id={`landing-plan-votes-${plan.id}`} name={brand.formatText(plan.name)} state={planInterest} onVote={() => { void interest.vote(plan.id); }} />
            {planInterest.loading ? <p id={`landing-plan-interest-loading-${plan.id}`} className={`pricing-plan-interest-note`} role={`status`}>{`Loading Your Feedback…`}</p> : null}
            {planInterest.notice ? <p id={`landing-plan-interest-notice-${plan.id}`} className={`pricing-plan-interest-notice`} role={`status`}>{planInterest.notice}</p> : null}
            {planInterest.error ? <div id={`landing-plan-interest-feedback-${plan.id}`} className={`pricing-plan-interest-feedback`}><p id={`landing-plan-interest-error-${plan.id}`} className={`pricing-plan-interest-error`} role={`alert`}>{planInterest.error}</p>{!planInterest.ready ? <button id={`landing-plan-interest-retry-${plan.id}`} className={`landing-button`} type={`button`} onClick={interest.refresh}><RefreshCw id={`landing-plan-interest-retry-icon-${plan.id}`} size={14} aria-hidden />{`Try Again`}</button> : null}</div> : null}
          </div> : null}
        </article>; })}
      </div> : <div id={`pricing-empty`} className={`pricing-feedback`}>
        <p id={`pricing-empty-description`} className={`pricing-feedback-copy`}>{`Plan details will be available here soon. You can start organizing your domains today.`}</p>
        <Link asChild href={routes.domains.href}><RouterAnchor id={`pricing-empty-action`} className={`landing-button`}><ArrowUpRight id={`pricing-empty-action-icon`} className={`landing-link-icon`} size={15} aria-hidden />{`Explore Domains`}</RouterAnchor></Link>
      </div>}
    </div>
    {interest.prompt ? <PricingInterestPrompt
      key={interest.prompt.id}
      plan={interest.prompt}
      local={interest.local}
      signedIn={interest.signedIn}
      onClose={interest.closePrompt}
      onRefresh={interest.refresh}
      onAuth={interest.authenticate}
      state={interest.getState(interest.prompt.id)}
      onConfirm={() => { if (interest.prompt) void interest.register(interest.prompt.id); }}
      onVote={() => { if (interest.prompt) void interest.vote(interest.prompt.id); }}
    /> : null}
  </section>;
};

export default Pricing;
