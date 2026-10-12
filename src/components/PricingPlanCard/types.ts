import type { ReactNode } from 'react';

export interface PricingPlanCardProps {
  id: string;
  width: number;
  children: ReactNode | ((hovered: boolean) => ReactNode);
}
