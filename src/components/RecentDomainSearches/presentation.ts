import type { RecentDomainSearchRecord } from './types';

export const newestSearches = (records: RecentDomainSearchRecord[]) => [...records]
  .sort((first, second) => second.submittedAt.localeCompare(first.submittedAt));

export const searchSuffix = (query: string, index: number) => `${index}-${query.replace(/[^a-z0-9-]+/gi, `-`)}`;
