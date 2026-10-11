import { useState } from 'react';
import { formatPlanAmount, parsePlanAmount } from '../values';
import type { PlanEditorProps, PlanEditorValues } from './types';
import { planLimits, planCurrencies, planBillingIntervals } from '../../../shared/plans/types';

export const usePlanEditor = ({ busy, record, onSave }: Pick<PlanEditorProps, `busy` | `record` | `onSave`>) => {
  const [error, setError] = useState(``);
  const [values, setValues] = useState<PlanEditorValues>(() => ({
    name: record?.name ?? ``,
    slug: record?.slug ?? ``,
    active: record?.active ?? false,
    currency: record?.currency ?? `USD`,
    description: record?.description ?? ``,
    highlighted: record?.highlighted ?? false,
    displayOrder: String(record?.displayOrder ?? 0),
    features: record?.features.join(`\n`) ?? ``,
    billingInterval: record?.billingInterval ?? `month`,
    amount: record ? formatPlanAmount(record.priceCents) : `0.00`,
  }));
  const setField = <K extends keyof PlanEditorValues>(key: K, value: PlanEditorValues[K]) => {
    setError(``);
    setValues(current => ({ ...current, [key]: value }));
  };
  const submit = async () => {
    if (busy) return false;
    try {
      const name = values.name.trim();
      const description = values.description.trim();
      if (!name || name.length > planLimits.name) throw new Error(`Enter A Plan Name With Up To ${planLimits.name} Characters`);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug) || values.slug.length > planLimits.slug) throw new Error(`Use Lowercase Letters, Numbers, And Hyphens For The Slug`);
      if (description.length > planLimits.description) throw new Error(`Use Up To ${planLimits.description} Characters In The Description`);
      const currency = planCurrencies.find(value => value === values.currency);
      const billingInterval = planBillingIntervals.find(value => value === values.billingInterval);
      if (!currency || !billingInterval) throw new Error(`Choose A Supported Currency And Billing Interval`);
      const features = values.features.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
      if (features.length > planLimits.features || features.some(feature => feature.length > planLimits.feature)) throw new Error(`Use Up To ${planLimits.features} Features With ${planLimits.feature} Characters Each`);
      if (!/^(?:0|[1-9]\d*)$/.test(values.displayOrder) || !Number.isSafeInteger(Number(values.displayOrder))) throw new Error(`Enter A Nonnegative Whole Number For Display Order`);
      const priceCents = parsePlanAmount(values.amount);
      setError(``);
      return await onSave({
        name,
        currency,
        features,
        priceCents,
        description,
        billingInterval,
        slug: values.slug,
        active: values.active,
        highlighted: values.highlighted,
        displayOrder: Number(values.displayOrder),
      }, record?.id);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : `Plan Could Not Be Saved`);
      return false;
    }
  };
  return { error, values, submit, setField };
};
