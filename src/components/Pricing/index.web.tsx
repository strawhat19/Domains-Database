import '../LandingSections/styles.scss';
import './styles.scss';
import { Link } from 'expo-router';
import { usePricing } from './usePricing';
import RouterAnchor from '../RouterAnchor';
import PricingFeature from '../PricingFeature';
import PricingSkeleton from '../PricingSkeleton';
import { routes } from '../../shared/routes';
import StackPillShape from '../StackPillShape';
import { Check, ArrowUpRight, RefreshCw } from 'lucide-react';
import { getPricingFeatures } from '../../shared/plans/pricingFeatures';
import { getPricingAmount, getPricingPeriod, pricingDescription } from './presentation';

const Pricing = () => {
  const state = usePricing();
  return <section id={`landing-pricing`} className={`landing-section landing-pricing`} aria-labelledby={`landing-pricing-title`} aria-busy={state.loading}>
    <div id={`landing-pricing-inner`} className={`landing-section-inner`}>
      <div id={`landing-pricing-heading`} className={`landing-section-heading landing-pricing-heading`}>
        <div id={`landing-pricing-copy`} className={`landing-heading-copy`}>
          <p id={`landing-pricing-eyebrow`} className={`landing-eyebrow`}>{`Room To Grow`}</p>
          <h2 id={`landing-pricing-title`} className={`landing-section-title`}>{`Plans for your next idea.`}</h2>
          <p id={`landing-pricing-description`} className={`landing-section-description`}>{pricingDescription}</p>
        </div>
      </div>
      {state.loading ? <PricingSkeleton expanded={state.showFeaturePreview} /> : state.error ? <div id={`pricing-error`} className={`pricing-feedback pricing-error`} role={`alert`}>
        <p id={`pricing-error-description`} className={`pricing-feedback-copy`}>{state.error}</p>
        <button id={`pricing-retry`} className={`landing-button`} type={`button`} onClick={state.refresh}><RefreshCw id={`pricing-retry-icon`} className={`landing-link-icon`} size={15} aria-hidden />{`Try Again`}</button>
      </div> : state.plans.length ? <div id={`landing-pricing-grid`} className={`landing-pricing-grid`}>
        {state.plans.map(plan => <article key={plan.id} id={`landing-plan-${plan.id}`} className={`landing-plan${plan.highlighted ? ` landing-plan-featured` : ``}`}>
          <div aria-hidden id={`landing-plan-${plan.id}-backing`} className={`landing-card-backing`}><StackPillShape id={`landing-plan-${plan.id}-backing`} /></div>
          <StackPillShape id={`landing-plan-${plan.id}-foreground`} />
          {plan.highlighted ? <span id={`landing-plan-label-${plan.id}`} className={`landing-plan-label`}>{`Featured Plan`}</span> : null}
          <h3 id={`landing-plan-name-${plan.id}`} className={`landing-card-title`}>{plan.name}</h3>
          <p id={`landing-plan-description-${plan.id}`} className={`landing-card-description`}>{plan.description}</p>
          <p id={`landing-plan-price-${plan.id}`} className={`landing-plan-price`}>{getPricingAmount(plan)}<span id={`landing-plan-period-${plan.id}`} className={`landing-plan-period`}>{getPricingPeriod(plan)}</span></p>
          <ul id={`landing-plan-features-${plan.id}`} className={`landing-plan-features`}>
            {state.showFeaturePreview ? getPricingFeatures(plan).map(feature => <PricingFeature
              key={feature.id}
              feature={feature}
              id={`landing-plan-feature-${plan.id}-${feature.id}`}
            />) : plan.features.map((feature, index) => <li
              key={`${plan.id}-${index}`}
              className={`landing-plan-feature`}
              id={`landing-plan-feature-${plan.id}-${index}`}
            >
              <Check size={14} aria-hidden className={`landing-feature-icon`} id={`landing-plan-feature-icon-${plan.id}-${index}`} />
              <span className={`landing-feature-label`} id={`landing-plan-feature-label-${plan.id}-${index}`}>{feature}</span>
            </li>)}
          </ul>
          <Link asChild href={plan.priceCents === 0 && plan.slug === `free` ? routes.domains.href : routes.contact.href}><RouterAnchor id={`landing-plan-action-${plan.id}`} className={`landing-button${plan.highlighted ? ` landing-button-primary` : ``}`}><span id={`landing-plan-action-label-${plan.id}`} className={`landing-link-label`}>{plan.priceCents === 0 && plan.slug === `free` ? `Open Your Portfolio` : `Ask About ${plan.name}`}</span><ArrowUpRight size={15} aria-hidden id={`landing-plan-action-arrow-${plan.id}`} className={`landing-link-icon`} /></RouterAnchor></Link>
        </article>)}
      </div> : <div id={`pricing-empty`} className={`pricing-feedback`}>
        <p id={`pricing-empty-description`} className={`pricing-feedback-copy`}>{`Plan details will be available here soon. You can start organizing your domains today.`}</p>
        <Link asChild href={routes.domains.href}><RouterAnchor id={`pricing-empty-action`} className={`landing-button`}><ArrowUpRight id={`pricing-empty-action-icon`} className={`landing-link-icon`} size={15} aria-hidden />{`Explore Domains`}</RouterAnchor></Link>
      </div>}
    </div>
  </section>;
};

export default Pricing;
