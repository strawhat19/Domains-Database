import './styles.scss';
import type { PricingPlanPriceProps } from './types';
import { getPricingPeriod, getPricingPriceLabel, getPricingAmountParts } from '../Pricing/presentation';

const PricingPlanPrice = ({ id, plan, color }: PricingPlanPriceProps) => {
  const period = getPricingPeriod(plan);
  return <p id={id} className={`pricing-plan-price`}>
    <span id={`${id}-label`} className={`pricing-plan-price-label`}>{getPricingPriceLabel(plan)}</span>
    <span id={`${id}-amount`} className={`pricing-plan-price-amount`} dir={`auto`} aria-hidden>
      {getPricingAmountParts(plan).map((part, index) => <span
        key={index}
        id={`${id}-part-${index}`}
        style={part.type === `currency` && color ? { color } : undefined}
        className={`pricing-plan-price-${part.type === `currency` ? `currency` : part.type === `literal` ? `literal` : `number`}`}
      >{part.value}</span>)}
    </span>
    {period ? <span id={`${id}-period`} className={`pricing-plan-price-period`} aria-hidden>{period}</span> : null}
  </p>;
};

export default PricingPlanPrice;
