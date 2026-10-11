export const COLUMN_CATEGORY_IDS = [`domain`, `project`, `registration`, `security`, `insights`, `contact`, `costs`] as const;

export type PortfolioColumnCategory = typeof COLUMN_CATEGORY_IDS[number];

export const DEFAULT_COLLAPSED_COLUMN_CATEGORIES: readonly PortfolioColumnCategory[] = [
  `registration`, `security`, `insights`, `contact`, `costs`,
];
