import type { PlanInput } from '../../../api/plans';
import type { Plan } from '../../../shared/models/plans/Plan';

export interface PlanEditorProps {
  busy: boolean;
  record: Plan | null;
  onClose: () => void;
  onSave: (input: PlanInput, id?: string) => Promise<boolean>;
}
export interface PlanEditorValues {
  name: string;
  slug: string;
  amount: string;
  active: boolean;
  features: string;
  currency: string;
  description: string;
  displayOrder: string;
  billingInterval: string;
}
