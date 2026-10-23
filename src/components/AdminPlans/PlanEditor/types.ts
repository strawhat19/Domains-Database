import type { PlanInput } from '../../../api/plans';
import type { PlanIcon } from '../../../shared/plans/types';
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
  icon: PlanIcon;
  amount: string;
  active: boolean;
  currency: string;
  description: string;
  displayOrder: string;
  billingInterval: string;
  features: PlanEditorFeature[];
}
export interface PlanEditorFeature { id: number; label: string; planned: boolean }
