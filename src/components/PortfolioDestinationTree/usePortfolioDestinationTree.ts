import { useMemo, useState } from 'react';
import type { DestinationBranch } from '../../shared/portfolioPreferences/destinationTree';

export const usePortfolioDestinationTree = (
  branches: DestinationBranch[],
  searchBranches?: DestinationBranch[],
) => {
  const [search, setSearchValue] = useState(``);
  const [collapsedBranches, setCollapsedBranches] = useState<Map<string, boolean>>(new Map());
  const [searchCollapsedBranches, setSearchCollapsedBranches] = useState<Map<string, boolean>>(new Map());
  const query = search.trim().toLocaleLowerCase();
  const searching = Boolean(query);
  const setSearch = (value: string) => {
    setSearchValue(value);
    setSearchCollapsedBranches(new Map());
  };
  const filteredBranches = useMemo(() => {
    if (!query) return branches;

    return (searchBranches ?? branches).flatMap(branch => {
      if (branch.name.toLocaleLowerCase().includes(query)) return [branch];

      const groups = branch.groups.filter(group => group.name.toLocaleLowerCase().includes(query));
      return groups.length ? [{ ...branch, groups }] : [];
    });
  }, [query, branches, searchBranches]);

  return {
    search,
    setSearch,
    searching,
    filteredBranches,
    collapsedBranches: searching ? searchCollapsedBranches : collapsedBranches,
    setCollapsedBranches: searching ? setSearchCollapsedBranches : setCollapsedBranches,
  };
};
