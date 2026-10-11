import { useRef, useMemo } from 'react';
import { useModalFocus } from '../DomainEditor/useDomainEditor';
import type { usePortfolio } from '../DomainPortfolio/usePortfolio';

export interface PortfolioFiltersProps {
  onClose: () => void;
  portfolio: ReturnType<typeof usePortfolio>;
}

export const usePortfolioFilters = ({ portfolio, onClose }: PortfolioFiltersProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const registrarTotals = useMemo(() => [
    ...portfolio.summary.registrarCounts,
    ...portfolio.connectedSyncRegistrars
      .filter(({ label }) => !portfolio.summary.registrarCounts.some(({ registrar }) => registrar === label))
      .map(({ label }) => ({ count: 0, registrar: label })),
  ], [portfolio.summary.registrarCounts, portfolio.connectedSyncRegistrars]);
  const filterCount = portfolio.activeFilterCount + Number(Boolean(portfolio.query.trim()));
  const manualSyncBlocked = portfolio.loading || portfolio.syncing || portfolio.manualSyncWaitSeconds > 0;
  const clearFilters = () => {
    portfolio.clearSummaryFilters();
    portfolio.setQuery(``);
  };
  useModalFocus(modalRef, true, onClose, true);
  return { modalRef, filterCount, clearFilters, registrarTotals, manualSyncBlocked };
};
