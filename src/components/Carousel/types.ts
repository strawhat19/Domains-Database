import type { ReactNode } from 'react';

export interface CarouselSlide {
  id: string;
  label: string;
  content: ReactNode;
}

export interface CarouselProps {
  scope: string;
  label?: string;
  interval?: number;
  autoplay?: boolean;
  slides: readonly CarouselSlide[];
}
