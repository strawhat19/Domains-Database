import type { PortfolioFilterField } from '../DomainPortfolio/filters';
import { ListFilter, FolderTree, ListTodo, Shield, CheckCheck } from 'lucide-react';

export const FILTER_TABS = [
  { id: `common`, label: `Common`, Icon: FolderTree },
  { id: `domains`, label: `Domains`, Icon: ListFilter },
  { id: `project`, label: `Project`, Icon: ListTodo },
  { id: `security`, label: `Security`, Icon: Shield },
  { id: `selected`, label: `Selected`, Icon: CheckCheck },
] as const;

export type PortfolioFiltersTab = typeof FILTER_TABS[number][`id`];

export const FILTER_TAB_FIELDS: Record<PortfolioFiltersTab, readonly PortfolioFilterField[]> = {
  selected: [],
  common: [`starred`],
  project: [`owner`, `tags`, `difficulty`, `projectStatus`],
  security: [`locked`, `dnssec`, `privacy`, `autoRenew`],
  domains: [`status`, `expiry`, `source`, `country`, `currency`, `providerStatus`],
};
