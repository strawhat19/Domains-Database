import type { PortfolioColumn } from '../../shared/portfolioColumns';

export interface TableSettingsProps {
  onFit: () => void;
  onClose: () => void;
  onReset: () => void;
  fitDisabled?: boolean;
  onToggleManualOrder: () => void;
  sortField: PortfolioColumn | null;
  visibleColumns: PortfolioColumn[];
  onToggle: (column: PortfolioColumn) => void;
  columnCounts: Record<PortfolioColumn, number>;
}
