import type { DiscoveryCardDensity } from '../DomainDiscovery/useDiscoveryShelf';
import type { DomainDiscoveryResult } from '../../shared/domainSearch/discovery';

export interface DomainDiscoveryCarouselProps {
  suffix: string;
  loading?: boolean;
  disabled?: boolean;
  tldFilter: string;
  density?: DiscoveryCardDensity;
  results: DomainDiscoveryResult[];
  tldResults: DomainDiscoveryResult[];
  onSearch: (domain: string) => void;
  setTldFilter: (value: string) => void;
}
