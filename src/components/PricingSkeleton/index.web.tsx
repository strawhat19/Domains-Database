import '../LandingSections/styles.scss';
import './styles.scss';
import StackPillShape from '../StackPillShape';
import type { PricingSkeletonProps } from './skeleton';
import { pricingSkeletonCards, getPricingSkeletonRows } from './skeleton';

const PricingSkeleton = ({ expanded = false }: PricingSkeletonProps) => {
  const featureRows = getPricingSkeletonRows(expanded);

  return <div id={`pricing-loading`} className={`pricing-skeleton`} role={`status`}>
    <span id={`pricing-loading-label`} className={`pricing-skeleton-sr-only`}>{`Loading Plans…`}</span>
    <div aria-hidden id={`pricing-loading-grid`} className={`landing-pricing-grid`}>
      {pricingSkeletonCards.map(index => <article key={index} id={`pricing-skeleton-card-${index}`} className={`landing-plan pricing-skeleton-card`}>
        <div id={`pricing-skeleton-backing-${index}`} className={`landing-card-backing`}>
          <StackPillShape id={`pricing-skeleton-backing-${index}`} />
        </div>
        <StackPillShape id={`pricing-skeleton-foreground-${index}`} />
        <div id={`pricing-skeleton-content-${index}`} className={`pricing-skeleton-content`}>
          <span id={`pricing-skeleton-title-${index}`} className={`pricing-skeleton-placeholder pricing-skeleton-title`} />
          <div id={`pricing-skeleton-description-${index}`} className={`pricing-skeleton-description`}>
            {[0, 1, 2].map(line => <span key={line} id={`pricing-skeleton-description-${index}-${line}`} className={`pricing-skeleton-placeholder${line === 2 ? ` pricing-skeleton-short` : ``}`} />)}
          </div>
          <span id={`pricing-skeleton-price-${index}`} className={`pricing-skeleton-placeholder pricing-skeleton-price`} />
          <div id={`pricing-skeleton-features-${index}`} className={`landing-plan-features`}>
            {featureRows.map(row => <div key={row} id={`pricing-skeleton-feature-${index}-${row}`} className={`pricing-skeleton-feature`}>
              <span id={`pricing-skeleton-feature-icon-${index}-${row}`} className={`pricing-skeleton-placeholder pricing-skeleton-icon`} />
              <div id={`pricing-skeleton-feature-content-${index}-${row}`} className={`pricing-skeleton-feature-content`}>
                <span id={`pricing-skeleton-feature-label-${index}-${row}`} className={`pricing-skeleton-placeholder${row % 2 ? ` pricing-skeleton-short` : ``}`} />
              </div>
            </div>)}
          </div>
          <span id={`pricing-skeleton-action-${index}`} className={`pricing-skeleton-placeholder pricing-skeleton-action`} />
        </div>
      </article>)}
    </div>
  </div>;
};

export default PricingSkeleton;
