import type { Plan } from '../../../shared/models/plans/Plan';

export interface PlanRowProps {
  busy: boolean;
  record: Plan;
  saving: boolean;
  confirming: boolean;
  onEdit: (record: Plan) => void;
  onCancelArchive: () => void;
  onRequestArchive: (record: Plan) => void;
  onArchive: (record: Plan) => Promise<boolean>;
  onStatus: (record: Plan) => Promise<boolean>;
}
