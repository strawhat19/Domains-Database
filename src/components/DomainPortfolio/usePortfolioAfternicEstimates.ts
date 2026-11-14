import { useMemo } from 'react';
import type { DomainRecord } from '../../shared/types';
import { Domain } from '../../shared/models/domains/Domain';
import { useAuth } from '../../shared/authContext/useAuth';
import { afternicPortfolioEstimate, getPortfolioColumnValue } from '../../shared/portfolioColumns';
import { useAfternicPortfolioSync } from '../../shared/marketplaceAfternic/PortfolioSyncContext';

export const usePortfolioAfternicEstimates = (domains: DomainRecord[], compact: boolean) => {
  const { user, loading } = useAuth();
  const ownerId = !compact && !loading && user?.active && !user.anonymous && user.role !== `Guest` ? user.id : null;
  const { connected, listings } = useAfternicPortfolioSync(Boolean(ownerId));
  return useMemo(() => {
    if (!ownerId || !connected || !listings.size) return domains;
    return domains.map(domain => {
      if (domain.uid !== ownerId || domain.isSample) return domain;
      const estimate = listings.get(domain.name.trim().toLowerCase().replace(/\.$/, ``))?.estimatedValueCents;
      if (estimate == null || !Number.isSafeInteger(estimate) || estimate < 0 || getPortfolioColumnValue(domain, `estimatedValue`) !== undefined) return domain;
      return Object.defineProperty(new Domain(domain), afternicPortfolioEstimate, { value: estimate / 100 });
    });
  }, [domains, ownerId, connected, listings]);
};
