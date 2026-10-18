export interface PricingSkeletonProps {
  expanded?: boolean;
  cardWidth?: number;
}

export const pricingSkeletonCards = [0, 1, 2] as const;
export const getPricingSkeletonRows = (expanded = false) => Array.from({ length: expanded ? 10 : 5 }, (_, index) => index);
