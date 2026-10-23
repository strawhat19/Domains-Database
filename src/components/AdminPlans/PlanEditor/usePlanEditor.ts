import { useRef, useState } from 'react';
import { formatPlanAmount, parsePlanAmount } from '../values';
import { getPricingPlanVisual } from '../../Pricing/planIcons';
import type { PlanEditorProps, PlanEditorValues, PlanEditorFeature } from './types';
import { planIcons, planLimits, planCurrencies, planBillingIntervals } from '../../../shared/plans/types';

const normalizeFeatureLabel = (label: string) => label.trim().replace(/^(?:planned:\s*)+/i, ``).trim();

export const usePlanEditor = ({ busy, record, onSave }: Pick<PlanEditorProps, `busy` | `record` | `onSave`>) => {
  const [error, setError] = useState(``);
  const nextFeatureId = useRef(record?.features?.length ?? 0);
  const [values, setValues] = useState<PlanEditorValues>(() => ({
    name: record?.name ?? ``,
    slug: record?.slug ?? ``,
    icon: record ? getPricingPlanVisual(record).icon : `Gem`,
    active: record?.active ?? false,
    currency: record?.currency ?? `USD`,
    description: record?.description ?? ``,
    displayOrder: String(record?.displayOrder ?? 0),
    features: record?.features?.map((feature, id) => ({ id, label: normalizeFeatureLabel(feature), planned: /^planned:\s*/i.test(feature.trim()) })) ?? [],
    billingInterval: record?.billingInterval ?? `month`,
    amount: record ? formatPlanAmount(record.priceCents) : `0.00`,
  }));
  const setField = <K extends keyof PlanEditorValues>(key: K, value: PlanEditorValues[K]) => {
    setError(``);
    setValues(current => ({ ...current, [key]: value }));
  };
  const addFeature = () => {
    if (busy) return;
    const id = nextFeatureId.current++;
    setError(``);
    setValues(current => current.features.length >= planLimits.features ? current : { ...current, features: [...current.features, { id, label: ``, planned: false }] });
  };
  const updateFeature = (id: number, update: Partial<Pick<PlanEditorFeature, `label` | `planned`>>) => {
    if (busy) return;
    setError(``);
    setValues(current => ({ ...current, features: current.features.map(feature => feature.id === id ? { ...feature, ...update } : feature) }));
  };
  const removeFeature = (id: number) => {
    if (busy) return;
    setError(``);
    setValues(current => ({ ...current, features: current.features.filter(feature => feature.id !== id) }));
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
      const icon = planIcons.find(value => value === values.icon);
      const billingInterval = planBillingIntervals.find(value => value === values.billingInterval);
      if (!currency || !billingInterval) throw new Error(`Choose A Supported Currency And Billing Interval`);
      if (!icon) throw new Error(`Choose A Supported Plan Icon`);
      const features = values.features.map(feature => {
        const label = normalizeFeatureLabel(feature.label);
        if (!label) throw new Error(`Enter A Label For Each Feature Or Remove It`);
        return `${feature.planned ? `Planned: ` : ``}${label}`;
      });
      if (features.length > planLimits.features || features.some(feature => feature.length > planLimits.feature)) throw new Error(`Use Up To ${planLimits.features} Features With ${planLimits.feature} Characters Each`);
      if (!/^(?:0|[1-9]\d*)$/.test(values.displayOrder) || !Number.isSafeInteger(Number(values.displayOrder))) throw new Error(`Enter A Nonnegative Whole Number For Display Order`);
      const priceCents = parsePlanAmount(values.amount);
      const includeIcon = !record || !!record.icon || icon !== getPricingPlanVisual(record).icon;
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
        ...(includeIcon ? { icon } : {}),
        displayOrder: Number(values.displayOrder),
      }, record?.id);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : `Plan Could Not Be Saved`);
      return false;
    }
  };
  return { error, values, submit, setField, addFeature, updateFeature, removeFeature };
};
