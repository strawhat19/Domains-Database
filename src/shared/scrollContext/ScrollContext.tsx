import { createContext } from 'react';

export interface PageScrollViewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NativePageScroll {
  getPosition: () => number;
  subscribe?: (listener: (layoutChanged: boolean) => void) => () => void;
  scrollBy: (amount: number) => boolean;
  measure: () => Promise<PageScrollViewport>;
}

interface ScrollContextValue {
  pageScroll?: NativePageScroll;
  pageContentHeight?: number;
  setHeroBottom: (bottom: number | null) => void;
}

export const ScrollContext = createContext<ScrollContextValue | undefined>(undefined);
