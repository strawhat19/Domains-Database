import type { DomainRecord } from '../../shared/types';
import type { PortfolioColumn } from '../../shared/portfolioColumns';

export type TableSettingsTab = `general` | `columns`;

export interface TableSettingsProps {
  onFit: () => void;
  onClose: () => void;
  onReset: () => void;
  fitDisabled?: boolean;
  domains: DomainRecord[];
  onToggleManualOrder: () => void;
  sortField: PortfolioColumn | null;
  visibleColumns: PortfolioColumn[];
  onToggle: (column: PortfolioColumn) => void;
  columnCounts: Record<PortfolioColumn, number>;
}
