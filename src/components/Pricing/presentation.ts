import type { Plan } from '../../shared/models/plans/Plan';

export const getPricingAmount = (plan: Plan) => {
  const whole = Math.floor(plan.priceCents / 100);
  const fraction = `${plan.priceCents % 100}`.padStart(2, `0`);
  try {
    const localizedFraction = new Intl.NumberFormat(undefined, { minimumIntegerDigits: 2, useGrouping: false }).format(plan.priceCents % 100);
    return new Intl.NumberFormat(undefined, { currency: plan.currency, style: `currency`, minimumFractionDigits: 2, maximumFractionDigits: 2 }).formatToParts(whole).map(part => part.type === `fraction` ? localizedFraction : part.value).join(``);
  }
  catch { return `${plan.currency} ${whole}.${fraction}`; }
};
export const getPricingPeriod = (plan: Plan) => plan.priceCents === 0 ? `` : plan.billingInterval === `month` ? ` / Month` : plan.billingInterval === `year` ? ` / Year` : ` / One Time`;
export const pricingDescription = `Explore the plans and features for your next idea. Contact us to discuss the option that fits your portfolio.`;
