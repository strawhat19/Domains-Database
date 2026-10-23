import { Types } from '../../../types/types';
import { Data, type JSONValue } from '../Data';
import type { PlanIcon, PlanCurrency, PlanBillingInterval } from '../../plans/types';

export class Plan extends Data {
  slug: string;
  icon?: PlanIcon;
  active: boolean;
  features: string[];
  priceCents: number;
  displayOrder: number;
  currency: PlanCurrency;
  billingInterval: PlanBillingInterval;

  constructor(data: Partial<Plan> = {}) {
    super({ ...data, type: Types.Plan });
    this.slug = data.slug ?? ``;
    this.icon = data.icon;
    this.active = data.active ?? false;
    this.priceCents = data.priceCents ?? 0;
    this.currency = data.currency ?? `USD`;
    this.features = [...(data.features ?? [])];
    this.displayOrder = data.displayOrder ?? 0;
    this.billingInterval = data.billingInterval ?? `month`;
    this.refreshProperties();
  }

  toRecord(): Record<string, JSONValue> {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      type: this.type,
      number: this.number,
      active: this.active,
      ...(this.icon === undefined ? {} : { icon: this.icon }),
      created: this.created,
      updated: this.updated,
      currency: this.currency,
      features: [...this.features],
      priceCents: this.priceCents,
      displayOrder: this.displayOrder,
      description: this.description,
      billingInterval: this.billingInterval,
    };
  }
}
