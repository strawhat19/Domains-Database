import type { WatchedDomain } from '../../shared/models/watching/WatchedDomain';
import type { DomainSearchResult } from '../../shared/domainSearch/types';
import { getSearchStatus, getDomainSearchStatus, formatSearchPrice, getPurchaseHref } from '../DomainSearch/resultPresentation';

export interface WatchingRowProps {
  busy: boolean;
  record: WatchedDomain;
  onRemove: (id: string) => Promise<unknown>;
}

const formatDate = (value: string, includeTime = false) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return `—`;
  return new Intl.DateTimeFormat(`en-US`, {
    day: `numeric`,
    month: `short`,
    year: `numeric`,
    ...(includeTime ? { hour: `numeric`, minute: `2-digit` } as const : {}),
  }).format(date);
};

export const getWatchingRow = (record: WatchedDomain) => ({
  status: getDomainSearchStatus(record),
  addedDate: formatDate(record.created),
  checkedDate: formatDate(record.checkedAt, true),
  dataLabel: record.mock ? `Mock Data` : `Search Snapshot`,
});

export const getWatchingConnection = (connection: DomainSearchResult) => {
  const status = getSearchStatus(connection);
  const available = status.state === `available`;
  return {
    status,
    available,
    purchaseHref: available ? getPurchaseHref(connection.purchaseUrl) : null,
    renewal: formatSearchPrice(available ? connection.renewal : undefined),
    registration: formatSearchPrice(available ? connection.registration : undefined),
  };
};
