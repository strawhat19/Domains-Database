import type { DomainRecord } from '../types';
import type { PortfolioColumn } from '../portfolioColumns';

export type PortfolioView = `table` | `grid`;
export type PortfolioGroupBy = `none` | `custom` | PortfolioColumn;

export interface CustomPortfolioGroup {
  id: string;
  name: string;
  description?: string;
  collectionId?: string;
  domainIds: string[];
}

export interface CustomPortfolioCollection {
  id: string;
  name: string;
  number: number;
  description?: string;
  sortDirection: `asc` | `desc`;
  sortField: PortfolioColumn | null;
}

export interface GroupSettingsInput {
  name: string;
  description: string;
  collectionId?: string | null;
  newCollection?: { name: string; description: string };
}

export interface PortfolioPreferences {
  view: PortfolioView;
  groupBy: PortfolioGroupBy;
  collectionNumber: number;
  customGroups: CustomPortfolioGroup[];
  orders: Record<string, string[]>;
  collections: CustomPortfolioCollection[];
}

export interface PortfolioGroup {
  key: string;
  label: string;
  description?: string;
  customGroupId?: string;
  domains: DomainRecord[];
}

export interface PortfolioCollectionSection {
  groups: PortfolioGroup[];
  domains: DomainRecord[];
  collection: CustomPortfolioCollection;
}

export interface PortfolioSections {
  mainGroups: PortfolioGroup[];
  mainDomains: DomainRecord[];
  collections: PortfolioCollectionSection[];
}

export interface PortfolioPreferencesContextValue extends PortfolioPreferences {
  clearOrders: () => void;
  setView: (view: PortfolioView) => void;
  resetOrder: (groupKey: string) => void;
  deleteGroup: (groupId: string) => void;
  setGroupBy: (groupBy: PortfolioGroupBy) => void;
  renameGroup: (groupId: string, name: string) => boolean;
  assignDomain: (domainId: string, groupId: string | null) => void;
  createGroup: (name: string, domainIds?: string[]) => string | undefined;
  assignDomains: (domainIds: string[], groupId: string | null) => boolean;
  updateGroup: (groupId: string, name: string, description: string) => boolean;
  saveGroupSettings: (groupId: string, input: GroupSettingsInput) => boolean;
  moveGroup: (groupId: string, targetId: string, placement?: `before` | `after`) => boolean;
  updateCollection: (collectionId: string, name: string, description: string) => boolean;
  assignGroupCollection: (groupId: string, collectionId: string | null) => boolean;
  setCollectionSort: (collectionId: string, field: PortfolioColumn | null, direction: `asc` | `desc`) => boolean;
  moveCollection: (collectionId: string, targetId: string, placement?: `before` | `after`) => boolean;
  moveDomain: (groupKey: string, domainId: string, targetId: string, fullGroupDomainIds: string[], placement?: `before` | `after`) => void;
}
