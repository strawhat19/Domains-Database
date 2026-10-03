import { createContext } from 'react';

interface ScrollContextValue {
  pageContentHeight?: number;
  setHeroBottom: (bottom: number | null) => void;
}

export const ScrollContext = createContext<ScrollContextValue | undefined>(undefined);
