import type { useDiscoveryShelf } from './useDiscoveryShelf';
import type { useDomainDiscovery } from '../../shared/domainSearch/useDomainDiscovery';

export interface DomainDiscoveryProps {
  suffix: string;
  sidebar?: boolean;
  disabled?: boolean;
  shelf: ReturnType<typeof useDiscoveryShelf>;
  state: ReturnType<typeof useDomainDiscovery>;
  onSearch: (domain: string) => void;
}
