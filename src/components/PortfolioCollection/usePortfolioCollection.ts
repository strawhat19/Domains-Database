import { useState } from 'react';
import type { DomainProjectStatus } from '../../shared/domainProject';
import type { CustomPortfolioCollection } from '../../shared/portfolioPreferences/types';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

export const usePortfolioCollection = (collection: CustomPortfolioCollection) => {
  const preferences = usePortfolioPreferences();
  const [editing, setEditing] = useState(false);
  const voteUp = () => preferences.voteCollection(collection.id, `up`);
  const voteDown = () => preferences.voteCollection(collection.id, `down`);
  const setDescription = async (description: string) => {
    const current = preferences.collections.find(item => item.id === collection.id);
    return current ? preferences.updateCollection(current.id, current.name, description, current.visibility) : false;
  };
  const setProjectStatus = (projectStatus: DomainProjectStatus) => {
    const current = preferences.collections.find(item => item.id === collection.id);
    return current ? preferences.updateCollection(current.id, current.name, current.description ?? ``, current.visibility, projectStatus) : false;
  };

  return {
    voteUp,
    editing,
    voteDown,
    setEditing,
    setDescription,
    setProjectStatus,
  };
};
