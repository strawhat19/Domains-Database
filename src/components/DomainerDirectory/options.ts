export const profileFilters = [
  { value: `all`, label: `All Profiles` },
  { value: `with-bio`, label: `With Bio` },
] as const;

export const profileOrders = [
  { value: `az`, label: `Name A–Z` },
  { value: `za`, label: `Name Z–A` },
] as const;

export const directoryDescription = `Find and explore public domainer profiles.`;
