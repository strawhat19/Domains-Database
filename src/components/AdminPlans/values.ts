import type { Plan } from '../../shared/models/plans/Plan';

export const billingLabels = { month: `Monthly`, year: `Yearly`, 'one-time': `One-Time` } as const;
export const formatPlanAmount = (cents: number) => {
  const value = String(cents).padStart(3, `0`);
  return `${value.slice(0, -2)}.${value.slice(-2)}`;
};
export const parsePlanAmount = (amount: string) => {
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount)) throw new Error(`Enter A Price With Up To Two Decimal Places`);
  const [whole, fraction = ``] = amount.split(`.`);
  const cents = Number(`${whole}${fraction.padEnd(2, `0`)}`);
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error(`Enter A Price Within The Supported Range`);
  return cents;
};
export const formatPlanPrice = (plan: Plan) => `${plan.currency} ${formatPlanAmount(plan.priceCents)} · ${billingLabels[plan.billingInterval]}`;
export const formatPlanDate = (value: string) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString(undefined, { day: `numeric`, year: `numeric`, month: `short` }) : `—`;
};
