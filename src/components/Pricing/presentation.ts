import type { Plan } from '../../shared/models/plans/Plan';

export const getPricingAmountParts = (plan: Plan): Intl.NumberFormatPart[] => {
  const whole = Math.floor(plan.priceCents / 100);
  const cents = plan.priceCents % 100;
  const fractionDigits = cents ? 2 : 0;
  try {
    const localizedFraction = new Intl.NumberFormat(undefined, { minimumIntegerDigits: 2, useGrouping: false }).format(cents);
    return new Intl.NumberFormat(undefined, { style: `currency`, currency: plan.currency, minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).formatToParts(whole).map(part => part.type === `fraction` ? { ...part, value: localizedFraction } : part);
  }
  catch { return [{ type: `currency`, value: plan.currency }, { type: `literal`, value: ` ` }, { type: `integer`, value: `${whole}` }, ...(cents ? [{ type: `decimal` as const, value: `.` }, { type: `fraction` as const, value: `${cents}`.padStart(2, `0`) }] : [])]; }
};
export const getPricingAmount = (plan: Plan) => getPricingAmountParts(plan).map(part => part.value).join(``);
export const getPricingPeriod = (plan: Plan) => plan.priceCents === 0 ? `` : plan.billingInterval === `month` ? ` / Month` : plan.billingInterval === `year` ? ` / Year` : ` / One Time`;
export const getPricingPriceLabel = (plan: Plan) => `${getPricingAmount(plan)} ${plan.currency}${getPricingPeriod(plan)}`;
export const pricingDescription = `Explore the plans and features for your next idea. Contact us to discuss the option that fits your portfolio.`;
