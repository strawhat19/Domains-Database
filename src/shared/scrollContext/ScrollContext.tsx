import { createContext } from 'react';

interface ScrollContextValue {
  setHeroBottom: (bottom: number | null) => void;
}

export const ScrollContext = createContext<ScrollContextValue | undefined>(undefined);
