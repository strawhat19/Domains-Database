import { Data } from '../Data';
import { Types } from '../../../types/types';
import type { DomainSearchResult } from '../../domainSearch/types';

export class WatchedDomain extends Data {
  mock: boolean;
  domain: string;
  listName: string;
  checkedAt: string;
  connections: DomainSearchResult[];

  constructor(data: Partial<WatchedDomain> = {}) {
    const domain = data.domain?.trim().toLowerCase() ?? ``;
    super({ ...data, name: domain, type: Types.WatchedDomain });
    this.mock = data.mock ?? false;
    this.domain = domain;
    this.listName = data.listName?.trim() || `Watching`;
    this.checkedAt = data.checkedAt ?? this.created;
    this.connections = data.connections?.map(connection => ({
      ...connection,
      ...(connection.renewal ? { renewal: { ...connection.renewal } } : {}),
      ...(connection.registration ? { registration: { ...connection.registration } } : {}),
    })) ?? [];
    this.refreshProperties();
  }
}
