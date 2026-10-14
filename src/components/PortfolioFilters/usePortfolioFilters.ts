import { useRef, useMemo, useState } from 'react';
import { FILTER_TABS, FILTER_TAB_FIELDS, type PortfolioFiltersTab } from './tabs';
import { useMobileSheet } from '../MobileSheet/useMobileSheet';
import { useModalFocus } from '../MobileSheet/useModalFocus';
import type { usePortfolio } from '../DomainPortfolio/usePortfolio';

export interface PortfolioFiltersProps {
  onClose: () => void;
  portfolio: ReturnType<typeof usePortfolio>;
}

export const usePortfolioFilters = ({ portfolio, onClose: onDismiss }: PortfolioFiltersProps) => {
  const sheet = useMobileSheet(onDismiss);
  const onClose = sheet.close;
  const modalRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<PortfolioFiltersTab>(`common`);
  const destinationBranches = portfolio.destinationBranches.filter(branch => branch.count > 0);
  const registrarTotals = useMemo(() => [
    ...portfolio.summary.registrarCounts,
    ...portfolio.connectedSyncRegistrars
      .filter(({ label }) => !portfolio.summary.registrarCounts.some(({ registrar }) => registrar === label))
      .map(({ label }) => ({ count: 0, registrar: label })),
  ], [portfolio.summary.registrarCounts, portfolio.connectedSyncRegistrars]);
  const filterCount = portfolio.activeFilterCount + Number(Boolean(portfolio.query.trim()));
  const activeSelections = [
    ...portfolio.extensionFilters.map(value => ({
      label: value,
      id: `extension-${value}`,
      onRemove: () => portfolio.toggleExtensionFilter(value),
    })),
    ...portfolio.registrarFilters.map(value => ({
      label: value,
      id: `registrar-${value}`,
      onRemove: () => portfolio.toggleRegistrarFilter(value),
    })),
    ...portfolio.collectionFilters.map(value => ({
      id: `collection-${value}`,
      label: portfolio.destinationBranches.find(branch => branch.id === value)?.name ?? `Collection`,
      onRemove: () => portfolio.toggleCollectionFilter(value),
    })),
    ...portfolio.groupFilters.map(value => {
      const branch = portfolio.destinationBranches.find(item => item.groups.some(group => group.id === value));
      const group = branch?.groups.find(item => item.id === value);
      return {
        id: `group-${value}`,
        label: `${branch?.name ?? `Database`} / ${group?.name ?? `Group`}`,
        onRemove: () => portfolio.toggleGroupFilter(value),
      };
    }),
    ...portfolio.filterSections.flatMap(section => (portfolio.facetFilters[section.id] ?? []).map(value => ({
      id: `${section.id}-${value}`,
      label: `${section.label}: ${section.options.find(option => option.value === value)?.label ?? value}`,
      onRemove: () => portfolio.toggleFacetFilter(section.id, value),
    }))),
    ...(portfolio.attentionOnly ? [{ id: `attention`, label: `Needs Attention`, onRemove: portfolio.toggleAttentionFilter }] : []),
    ...(portfolio.query.trim() ? [{ id: `search`, label: `Search: ${portfolio.query.trim()}`, onRemove: () => portfolio.setQuery(``) }] : []),
  ];
  const manualSyncBlocked = portfolio.loading || portfolio.syncing || portfolio.manualSyncWaitSeconds > 0;
  const visibleSections = portfolio.filterSections.filter(section => FILTER_TAB_FIELDS[tab].includes(section.id));
  const tabs = FILTER_TABS.map(item => ({
    ...item,
    count: item.id === `selected` ? filterCount
      : item.id === `common` ? portfolio.extensionFilters.length + portfolio.registrarFilters.length + portfolio.collectionFilters.length + portfolio.groupFilters.length
        : FILTER_TAB_FIELDS[item.id].reduce((total, field) => total + (portfolio.facetFilters[field]?.length ?? 0), 0)
          + (item.id === `domains` ? Number(portfolio.attentionOnly) : 0),
  }));
  const clearFilters = () => {
    portfolio.clearSummaryFilters();
    portfolio.setQuery(``);
  };
  const applyFilter = (updateFilter: () => void) => {
    if (portfolio.loading) return;
    updateFilter();
    onClose();
  };
  useModalFocus(modalRef, true, onClose, true);
  return { sheet, close: onClose, tab, tabs, setTab, modalRef, applyFilter, filterCount, clearFilters, registrarTotals, activeSelections, visibleSections, destinationBranches, manualSyncBlocked };
};
