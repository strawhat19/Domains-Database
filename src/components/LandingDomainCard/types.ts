import type { DomainDiscoveryResult } from '../../shared/domainSearch/discovery';

export interface LandingDomainCardProps {
  result: DomainDiscoveryResult;
  onSearch: (name: string) => void;
}
