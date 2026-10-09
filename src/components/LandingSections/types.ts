import type { useHeroSearch } from '../Hero/useHeroSearch';

export interface LandingSectionsProps {
  search: ReturnType<typeof useHeroSearch>;
}
