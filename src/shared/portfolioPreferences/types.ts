import type { DomainRecord } from '../types';
import type { PortfolioColumn } from '../portfolioColumns';

export type PortfolioView = `table` | `grid`;
export type PortfolioGroupBy = `none` | `custom` | PortfolioColumn;

export interface CustomPortfolioGroup {
  id: string;
  name: string;
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
  customGroupId?: string;
  domains: DomainRecord[];
}

export interface PortfolioPreferencesContextValue extends PortfolioPreferences {
  clearOrders: () => void;
  setView: (view: PortfolioView) => void;
  resetOrder: (groupKey: string) => void;
  createGroup: (name: string) => string | undefined;
  deleteGroup: (groupId: string) => void;
  setGroupBy: (groupBy: PortfolioGroupBy) => void;
  renameGroup: (groupId: string, name: string) => boolean;
  assignDomain: (domainId: string, groupId: string | null) => void;
  moveDomain: (groupKey: string, domainId: string, targetId: string, fullGroupDomainIds: string[], placement?: `before` | `after`) => void;
}
