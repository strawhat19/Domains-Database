import './styles.scss';
import { Link } from 'expo-router';
import RouterAnchor from '../RouterAnchor';
import { routes } from '../../shared/routes';
import PricingPlanPrice from '../PricingPlanPrice';
import { getPricingPlanVisual } from '../Pricing/planIcons';
import { useSubscriptionFlow } from './useSubscriptionFlow';
import { Gem, Zap, Check, Clock3, LogIn, Globe2, Puzzle, Compass, Layers3, RefreshCw, UserPlus, Building2, CreditCard, UsersRound, ArrowUpRight } from 'lucide-react';

const planIcons = { Gem, Zap, Globe2, Puzzle, Compass, Layers3, Building2, UsersRound };
const subscriptionSteps = [`Account`, `Review`, `Payment`] as const;

const SubscriptionFlow = () => {
  const state = useSubscriptionFlow();
  const steps = state.owner ? [`Account`, `Owner Access`] : subscriptionSteps;
  const visual = state.plan ? getPricingPlanVisual(state.plan) : null;
  const PlanIcon = visual ? planIcons[visual.icon] : Gem;
  const StatusIcon = state.existingAccess ? Check : state.paymentProcessing ? Clock3 : CreditCard;
  const loading = state.auth.loading || state.planLoading || state.billingLoading;
  return <article id={`subscription-page`} className={`subscription-page`} aria-labelledby={`subscription-title`} aria-busy={loading || state.saving}>
    <header id={`subscription-heading`} className={`subscription-heading`} data-scroll-hero>
      <Link asChild href={routes.pricing.href}><RouterAnchor id={`subscription-back`} className={`subscription-back`}><ArrowUpRight size={14} aria-hidden id={`subscription-back-icon`} className={`subscription-back-icon`} />{`All Plans`}</RouterAnchor></Link>
      <p id={`subscription-eyebrow`} className={`subscription-eyebrow`}>{`YOUR NEXT STEP`}</p>
      <h1 id={`subscription-title`} className={`subscription-title`}>{`A little more room to grow.`}</h1>
      <p id={`subscription-description`} className={`subscription-description`}>{`Create an account or sign in, then review your plan and continue to secure payment.`}</p>
    </header>
    <ol id={`subscription-steps`} className={`subscription-steps`} aria-label={`Subscription Progress`}>
      {steps.map((label, index) => <li key={label} id={`subscription-step-${index}`} className={`subscription-step${state.activeStep === index ? ` is-current` : state.activeStep > index ? ` is-complete` : ``}`} aria-current={state.activeStep === index ? `step` : undefined}>
        <span id={`subscription-step-number-${index}`} className={`subscription-step-number`}>{state.activeStep > index ? <Check size={13} aria-hidden id={`subscription-step-icon-${index}`} className={`subscription-step-icon`} /> : index + 1}</span>
        <span id={`subscription-step-label-${index}`} className={`subscription-step-label`}>{label}</span>
      </li>)}
    </ol>
    {!state.validPlan ? <section id={`subscription-invalid`} className={`subscription-feedback`}>
      <h2 id={`subscription-invalid-title`} className={`subscription-section-title`}>{`Choose A Plan`}</h2>
      <p id={`subscription-invalid-copy`} className={`subscription-copy`}>{`Open a published plan to review its subscription.`}</p>
      <Link asChild href={routes.pricing.href}><RouterAnchor id={`subscription-choose-plan`} className={`subscription-button`}><Gem size={16} aria-hidden id={`subscription-choose-plan-icon`} className={`subscription-action-icon`} />{`View Plans`}</RouterAnchor></Link>
    </section> : <div id={`subscription-content`} className={`subscription-content`}>
      <section id={`subscription-plan`} className={`subscription-plan`} aria-labelledby={`subscription-plan-title`}>
        {state.planLoading ? <p id={`subscription-loading-copy`} className={`subscription-copy`} role={`status`}>{`Loading Plan…`}</p> : state.planError || !state.plan ? <>
          <h2 id={`subscription-plan-title`} className={`subscription-section-title`}>{state.planError ? `Plan Could Not Be Loaded` : `Plan Is Unavailable`}</h2>
          <p id={`subscription-plan-error-copy`} className={`subscription-copy`} role={state.planError ? `alert` : `status`}>{state.planError || `Starter is not currently published. You can still manage an existing subscription.`}</p>
          <button id={`subscription-plan-retry`} className={`subscription-button`} type={`button`} disabled={state.saving} onClick={state.refresh}><RefreshCw size={16} aria-hidden id={`subscription-plan-retry-icon`} className={`subscription-action-icon`} />{`Try Again`}</button>
        </> : <>
          <p id={`subscription-plan-label`} className={`subscription-eyebrow`}>{`SELECTED PLAN`}</p>
          <h2 id={`subscription-plan-title`} className={`subscription-plan-title`}><PlanIcon size={26} aria-hidden id={`subscription-plan-icon`} className={`subscription-plan-icon`} style={{ color: `var(--${visual?.tone ?? `accent`})` }} />{state.brand.formatText(state.plan.name)}</h2>
          <p id={`subscription-plan-description`} className={`subscription-copy`}>{state.brand.formatText(state.plan.description)}</p>
          <PricingPlanPrice plan={state.plan} id={`subscription-plan-price`} color={`var(--${visual?.tone ?? `accent`})`} />
          <ul id={`subscription-plan-features`} className={`subscription-features`}>{state.features.map(feature => {
            const FeatureIcon = feature.planned ? Clock3 : Check;
            return <li key={feature.id} id={`subscription-feature-${feature.id}`} className={`subscription-feature`}><FeatureIcon size={15} aria-hidden id={`subscription-feature-icon-${feature.id}`} className={`subscription-feature-icon${feature.planned ? ` is-planned` : ``}`} /><span id={`subscription-feature-label-${feature.id}`} className={`subscription-feature-label`}>{state.brand.formatText(feature.label)}{feature.planned ? <span id={`subscription-feature-status-${feature.id}`} className={`subscription-feature-status`}>{`Planned`}</span> : null}</span></li>;
          })}</ul>
        </>}
      </section>
      <section id={`subscription-account`} className={`subscription-account`} aria-label={`Subscription Account And Billing`}>
        {state.auth.loading ? <p id={`subscription-auth-loading`} className={`subscription-copy`} role={`status`}>{`Loading Your Account…`}</p> : !state.signedIn ? <>
          <h2 id={`subscription-account-title`} className={`subscription-section-title`}>{`Start With Your Account`}</h2>
          <p id={`subscription-account-copy`} className={`subscription-copy`}>{`Your plan selection will stay with you when you create an account or sign in.`}</p>
          {state.auth.error ? <p id={`subscription-auth-error`} className={`subscription-error`} role={`alert`}>{state.auth.error}</p> : null}
          <div id={`subscription-auth-actions`} className={`subscription-actions`}>
            <Link asChild href={state.signUpHref}><RouterAnchor id={`subscription-signup`} className={`subscription-button`}><UserPlus size={16} aria-hidden id={`subscription-signup-icon`} className={`subscription-action-icon`} />{`Create Account`}</RouterAnchor></Link>
            <Link asChild href={state.signInHref}><RouterAnchor id={`subscription-signin`} className={`subscription-button is-secondary`}><LogIn size={16} aria-hidden id={`subscription-signin-icon`} className={`subscription-action-icon`} />{`Sign In`}</RouterAnchor></Link>
          </div>
          <p id={`subscription-guest-payment-note`} className={`subscription-note`}>{state.paymentNotice}</p>
        </> : <>
          <h2 id={`subscription-account-title`} className={`subscription-section-title`}>{state.owner ? `Your Owner Account Has Access` : state.existingAccess ? `Your Subscription` : `Review Your Subscription`}</h2>
          <p id={`subscription-account-email`} className={`subscription-email`}>{state.auth.user?.email}</p>
          {state.notice ? <p id={`subscription-return-notice`} className={`subscription-copy`} role={`status`}>{state.notice}</p> : null}
          {state.billingLoading && !state.owner ? <p id={`subscription-billing-loading`} className={`subscription-copy`} role={`status`}>{`Confirming Your Subscription With Stripe…`}</p> : <>
            {state.status || state.owner ? <div id={`subscription-billing-status`} className={`subscription-saved`} role={`status`}>
              <p id={`subscription-billing-status-label`} className={`subscription-saved-status${state.existingAccess ? ` is-active` : ``}`}><StatusIcon size={17} aria-hidden id={`subscription-billing-status-icon`} className={`subscription-action-icon`} />{state.billingLabel}</p>
              <p id={`subscription-billing-status-copy`} className={`subscription-copy`}>{state.billingCopy}</p>
              {state.accessSyncing ? <p id={`subscription-access-syncing`} className={`subscription-note`}>{state.access.error || `Syncing Your Feature Access…`}</p> : null}
            </div> : null}
            {state.portalAvailable ? <button id={`subscription-manage-billing`} className={`subscription-button${state.existingAccess ? ` is-secondary` : ``}`} type={`button`} disabled={state.saving || state.auth.busy} onClick={() => { void state.manageBilling(); }}><CreditCard size={16} aria-hidden id={`subscription-manage-billing-icon`} className={`subscription-action-icon`} />{state.action === `portal` ? `Opening Billing…` : `Manage Billing`}</button> : null}
            {state.existingAccess ? <Link asChild href={routes.domains.href}><RouterAnchor id={`subscription-current-portfolio`} className={`subscription-button`}><Globe2 size={16} aria-hidden id={`subscription-current-portfolio-icon`} className={`subscription-action-icon`} />{`Open Your Portfolio`}</RouterAnchor></Link> : state.showCheckout ? <>
              <div id={`subscription-payment-note`} className={`subscription-payment-note`}><CreditCard size={19} aria-hidden id={`subscription-payment-icon`} className={`subscription-payment-icon`} /><p id={`subscription-payment-copy`} className={`subscription-copy`}>{state.paymentNotice}</p></div>
              {state.status && !state.status.checkoutAvailable ? <p id={`subscription-checkout-unavailable`} className={`subscription-note`} role={`status`}>{`Checkout is currently unavailable. Please try again later.`}</p> : null}
              <button id={`subscription-confirm`} className={`subscription-button`} type={`button`} disabled={!state.canConfirm} onClick={() => { void state.confirm(); }}><CreditCard size={16} aria-hidden id={`subscription-confirm-icon`} className={`subscription-action-icon`} />{state.action === `checkout` ? `Opening Secure Checkout…` : state.checkoutLabel}</button>
              <p id={`subscription-review-terms`} className={`subscription-note`}>{`Review our `}<Link asChild href={routes.terms.href}><RouterAnchor id={`subscription-terms-link`} className={`subscription-inline-link`}>{`Terms`}</RouterAnchor></Link>{` and `}<Link asChild href={routes.privacy.href}><RouterAnchor id={`subscription-privacy-link`} className={`subscription-inline-link`}>{`Privacy Policy`}</RouterAnchor></Link>{` before subscribing.`}</p>
            </> : null}
            {state.paymentProcessing || (!state.portalAvailable && !!state.status?.subscription && !state.existingAccess && !state.showCheckout) ? <button id={`subscription-payment-refresh`} className={`subscription-text-button`} type={`button`} disabled={state.saving} onClick={state.refresh}><RefreshCw size={14} aria-hidden id={`subscription-payment-refresh-icon`} className={`subscription-action-icon`} />{`Refresh Billing Status`}</button> : null}
          </>}
          {state.error ? <div id={`subscription-billing-feedback`} className={`subscription-request-feedback`}><p id={`subscription-billing-error`} className={`subscription-error`} role={`alert`}>{state.error}</p><button id={`subscription-billing-retry`} className={`subscription-text-button`} type={`button`} disabled={state.saving} onClick={state.refresh}><RefreshCw size={14} aria-hidden id={`subscription-billing-retry-icon`} className={`subscription-action-icon`} />{`Reload Billing Status`}</button></div> : null}
        </>}
      </section>
    </div>}
  </article>;
};

export default SubscriptionFlow;
