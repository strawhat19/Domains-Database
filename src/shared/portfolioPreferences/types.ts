import type { DomainRecord } from '../types';
import type { PortfolioColumn } from '../portfolioColumns';

export type PortfolioView = `table` | `grid`;
export type PortfolioGroupBy = `none` | `custom` | PortfolioColumn;

export interface CustomPortfolioGroup {
  id: string;
  name: string;
  description?: string;
  domainIds: string[];
}

export interface PortfolioPreferences {
  view: PortfolioView;
  groupBy: PortfolioGroupBy;
  customGroups: CustomPortfolioGroup[];
  orders: Record<string, string[]>;
}

export interface PortfolioGroup {
  key: string;
  label: string;
  description?: string;
  customGroupId?: string;
  domains: DomainRecord[];
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
  moveGroup: (groupId: string, targetId: string, placement?: `before` | `after`) => boolean;
  moveDomain: (groupKey: string, domainId: string, targetId: string, fullGroupDomainIds: string[], placement?: `before` | `after`) => void;
}
