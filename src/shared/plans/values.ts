import { Types } from '../../types/types';
import { Plan } from '../models/plans/Plan';
import { Timestamp } from 'firebase/firestore';
import { getAppCollectionIDNumber } from '../common/ids';
import { planLimits, planCurrencies, planBillingIntervals, type PlanInput } from './types';

const planFields = [`id`, `name`, `slug`, `type`, `number`, `active`, `created`, `updated`, `currency`, `features`, `priceCents`, `displayOrder`, `description`, `billingInterval`];
const planText = (value: unknown, label: string, maximum: number, optional = false) => {
  if (typeof value !== `string` || value.length > maximum || (!optional && !value.trim())) throw new Error(`Enter A Valid ${label}`);
  return value.trim();
};
export const normalizePlan = (input: PlanInput): PlanInput => {
  const name = planText(input?.name, `Plan Name`, planLimits.name);
  const slug = planText(input?.slug, `Plan Slug`, planLimits.slug);
  const description = planText(input?.description, `Description`, planLimits.description, true);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Use Lowercase Letters, Numbers, And Hyphens For The Slug`);
  if (!Array.isArray(input?.features) || input.features.length > planLimits.features) throw new Error(`Use Up To ${planLimits.features} Features`);
  if (!planCurrencies.includes(input?.currency)) throw new Error(`Choose A Supported Currency`);
  if (!planBillingIntervals.includes(input?.billingInterval)) throw new Error(`Choose A Valid Billing Interval`);
  if (typeof input?.active !== `boolean`) throw new Error(`Choose A Valid Plan Status`);
  if (!Number.isSafeInteger(input?.priceCents) || input.priceCents < 0) throw new Error(`Enter A Valid Price In Cents`);
  if (!Number.isSafeInteger(input?.displayOrder) || input.displayOrder < 0) throw new Error(`Enter A Valid Display Order`);
  return { name, slug, description, currency: input.currency, priceCents: input.priceCents, billingInterval: input.billingInterval, active: input.active, displayOrder: input.displayOrder, features: input.features.map(feature => planText(feature, `Feature`, planLimits.feature)) };
};
export const planId = (id: unknown) => {
  if (typeof id !== `string` || id.length > 240 || id.includes(`/`) || !getAppCollectionIDNumber(id, Types.Plan)) throw new Error(`Choose A Valid Plan`);
  return id;
};
const timestamp = (value: unknown) => {
  const date = value instanceof Timestamp ? value.toDate() : typeof value === `string` ? new Date(value) : null;
  if (!date || !Number.isFinite(date.getTime())) throw new Error(`Saved Plan Date Needs Attention`);
  return date.toISOString();
};
export const readPlan = (data: Record<string, unknown> | undefined, id: string): Plan => {
  planId(id);
  if (!data || data.id !== id || data.type !== Types.Plan || planFields.some(field => !(field in data))
    || Object.keys(data).some(field => !planFields.includes(field) && field !== `highlighted`)
    || (`highlighted` in data && typeof data.highlighted !== `boolean`) || !Number.isSafeInteger(data.number)
    || data.number !== getAppCollectionIDNumber(id, Types.Plan)) throw new Error(`Saved Plan Data Needs Attention`);
  const values = normalizePlan(data as unknown as PlanInput);
  return new Plan({ ...values, id, number: Number(data.number), created: timestamp(data.created), updated: timestamp(data.updated) });
};
export const orderPublishedPlans = (plans: Plan[]) => [...plans].sort((first, second) => first.displayOrder - second.displayOrder || first.number - second.number).slice(0, planLimits.published);
