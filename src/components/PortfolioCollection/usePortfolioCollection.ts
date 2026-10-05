import { useState } from 'react';
import type { PortfolioColumn } from '../../shared/portfolioColumns';
import { useStickyPortfolio } from '../DomainPortfolio/useStickyPortfolio';
import type { CustomPortfolioCollection } from '../../shared/portfolioPreferences/types';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

export const usePortfolioCollection = (
  collection: CustomPortfolioCollection,
  visibleColumns: PortfolioColumn[],
  globalToolbarHeight: number,
) => {
  const preferences = usePortfolioPreferences();
  const [editing, setEditing] = useState(false);
  const sticky = useStickyPortfolio(`${collection.id}|${collection.sortField}|${collection.sortDirection}|${visibleColumns.join(`|`)}`);
  const recordsSticky = {
    ...sticky,
    header: {
      ...sticky.header,
      toolbarHeight: sticky.header.toolbarHeight + globalToolbarHeight,
    },
  };
  const onSort = (field: PortfolioColumn) => {
    const current = collection.sortField === field;
    return preferences.setCollectionSort(
      collection.id,
      current && collection.sortDirection === `desc` ? null : field,
      current && collection.sortDirection === `asc` ? `desc` : `asc`,
    );
  };
  const toggleManualOrder = () => preferences.setCollectionSort(
    collection.id,
    collection.sortField ? null : `name`,
    `asc`,
  );

  return { sticky, editing, onSort, setEditing, recordsSticky, toggleManualOrder };
};
