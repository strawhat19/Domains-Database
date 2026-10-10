import { useState } from 'react';
import { isPortfolioNameTaken } from '../../shared/portfolioPreferences/names';
import type { CustomPortfolioCollection } from '../../shared/portfolioPreferences/types';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

export const usePortfolioCollection = (collection: CustomPortfolioCollection) => {
  const preferences = usePortfolioPreferences();
  const [editing, setEditing] = useState(false);
  const [nameEditing, setNameEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(false);
  const hidden = preferences.hiddenCollectionIds.includes(collection.id);
  const voteUp = () => preferences.voteCollection(collection.id, `up`);
  const voteDown = () => preferences.voteCollection(collection.id, `down`);
  const toggleVisibility = () => {
    const changed = preferences.toggleCollectionVisibility(collection.id);
    if (changed && !hidden && !preferences.showHiddenCollections) {
      document.getElementById(`portfolio-table-settings`)?.focus({ preventScroll: true });
    }
  };
  const setName = (value: string): boolean | string => {
    if (preferences.loading) return `Portfolio Is Loading — Try Again Shortly`;
    const name = value.trim();
    const current = preferences.collections.find(item => item.id === collection.id);
    if (!current) return `This Collection Is No Longer Available`;
    if (!name || name.length > 80) return `Enter A Collection Name Between 1 And 80 Characters`;
    if (isPortfolioNameTaken(preferences, name, { collectionId: current.id })) {
      return `A Collection Or Group With This Name Already Exists`;
    }
    return preferences.renameCollection(current.id, name) ? true : `Could Not Rename Collection — Try Again Shortly`;
  };
  const openSettings = (description = false) => {
    setEditDescription(description);
    setEditing(true);
  };

  return {
    hidden,
    voteUp,
    setName,
    editing,
    voteDown,
    setEditing,
    nameEditing,
    openSettings,
    editDescription,
    setNameEditing,
    toggleVisibility,
    loading: preferences.loading,
  };
};
