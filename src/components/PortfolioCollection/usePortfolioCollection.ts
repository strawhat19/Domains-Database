import { useState } from 'react';
import type { PortfolioColumn } from '../../shared/portfolioColumns';
import { useStickyPortfolio } from '../DomainPortfolio/useStickyPortfolio';
import type { CollectionVisibility, CustomPortfolioCollection } from '../../shared/portfolioPreferences/types';
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
  const voteUp = () => preferences.voteCollection(collection.id, `up`);
  const voteDown = () => preferences.voteCollection(collection.id, `down`);
  const setVisibility = (visibility: CollectionVisibility) => preferences.setCollectionVisibility(collection.id, visibility);
  const setDescription = async (description: string) => {
    const current = preferences.collections.find(item => item.id === collection.id);
    return current ? preferences.updateCollection(current.id, current.name, description, current.visibility) : false;
  };

  return { sticky, voteUp, editing, onSort, voteDown, setEditing, setVisibility, recordsSticky, setDescription, toggleManualOrder };
};
