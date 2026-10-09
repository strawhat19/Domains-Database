import type { useHeroSearch } from './useHeroSearch';

export interface HeroProps {
  search: ReturnType<typeof useHeroSearch>;
}
