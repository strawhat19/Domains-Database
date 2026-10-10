import { useMemo } from 'react';
import type { DomainProjectStatus } from '../../shared/domainProject';
import { DOMAIN_PROJECT_STATUSES, normalizeDomainProjectStatus } from '../../shared/domainProject';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

export const useCollectionProgress = (collectionId: string) => {
  const { loading, customGroups } = usePortfolioPreferences();
  const progress = useMemo(() => {
    const groups = customGroups.filter(group => group.collectionId === collectionId);
    const counts = new Map<DomainProjectStatus, number>();
    groups.forEach(group => {
      const status = normalizeDomainProjectStatus(group.projectStatus);
      counts.set(status, (counts.get(status) ?? 0) + 1);
    });
    const total = groups.length;
    const completed = counts.get(`Done`) ?? 0;
    const segments = DOMAIN_PROJECT_STATUSES.flatMap(status => {
      const count = counts.get(status.value) ?? 0;
      if (!count) return [];
      const length = count / total * 100;
      return [{ count, length, ...status }];
    });
    return { total, completed, segments, percentage: total ? Math.round(completed / total * 100) : 0 };
  }, [customGroups, collectionId]);

  return { ...progress, loading };
};
