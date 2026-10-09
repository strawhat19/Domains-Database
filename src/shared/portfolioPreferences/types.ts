import type { DomainRecord } from '../types';
import type { DomainTag } from '../domainTags';
import type { PortfolioColumn } from '../portfolioColumns';
import type { DomainProjectStatus } from '../domainProject';

export type PortfolioView = `table` | `grid`;
export type CollectionVote = `up` | `down` | null;
export type CollectionVisibility = `private` | `public`;
export type PortfolioGroupBy = `none` | `custom` | PortfolioColumn;

export interface PortfolioGroupDetails {
  isApp?: boolean;
  tags?: DomainTag[];
  parentLink?: string;
  startingBid?: number;
  siteIconUrl?: string;
  childLinks?: string[];
  estimatedRevenue?: number;
  githubRepoLink?: string;
  productionLink?: string;
  previewLinks?: string[];
  relatedLinks?: string[];
  developmentLinks?: string[];
  socialMediaLinks?: string[];
  projectStatus?: DomainProjectStatus;
}

export interface CustomPortfolioGroup extends PortfolioGroupDetails {
  id: string;
  name: string;
  starred?: boolean;
  description?: string;
  collectionId?: string;
  domainIds: string[];
}

export interface CustomPortfolioCollection {
  id: string;
  name: string;
  number: number;
  upvotes: number;
  downvotes: number;
  description?: string;
  currentVote: CollectionVote;
  sortDirection: `asc` | `desc`;
  visibility: CollectionVisibility;
  sortField: PortfolioColumn | null;
}

export interface GroupSettingsInput extends PortfolioGroupDetails {
  name: string;
  description: string;
  collectionId?: string | null;
  newCollection?: { name: string; description: string };
}

export interface PortfolioPreferences {
  view: PortfolioView;
  groupBy: PortfolioGroupBy;
  hiddenGroupKeys: string[];
  showHiddenGroups: boolean;
  collectionNumber: number;
  customGroups: CustomPortfolioGroup[];
  orders: Record<string, string[]>;
  collections: CustomPortfolioCollection[];
}

export interface PortfolioGroup extends PortfolioGroupDetails {
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
  loading: boolean;
  clearOrders: () => void;
  setView: (view: PortfolioView) => void;
  resetOrder: (groupKey: string) => void;
  deleteGroup: (groupId: string) => void;
  setGroupBy: (groupBy: PortfolioGroupBy) => void;
  renameGroup: (groupId: string, name: string) => boolean;
  toggleGroupStar: (groupId: string) => boolean;
  setShowHiddenGroups: (value: boolean) => void;
  toggleGroupVisibility: (groupKey: string) => boolean;
  assignDomain: (domainId: string, groupId: string | null) => void;
  createGroup: (name: string, domainIds?: string[]) => string | undefined;
  assignDomains: (domainIds: string[], groupId: string | null) => boolean;
  voteCollection: (collectionId: string, vote: Exclude<CollectionVote, null>) => boolean;
  updateGroup: (groupId: string, name: string, description: string) => boolean;
  saveGroupSettings: (groupId: string, input: GroupSettingsInput) => boolean;
  updateGroupProjectStatus: (groupId: string, status: DomainProjectStatus) => boolean;
  moveGroup: (groupId: string, targetId: string, placement?: `before` | `after`) => boolean;
  updateCollection: (collectionId: string, name: string, description: string, visibility?: CollectionVisibility) => boolean;
  setCollectionVisibility: (collectionId: string, visibility: CollectionVisibility) => boolean;
  assignGroupCollection: (groupId: string, collectionId: string | null) => boolean;
  setCollectionSort: (collectionId: string, field: PortfolioColumn | null, direction: `asc` | `desc`) => boolean;
  moveCollection: (collectionId: string, targetId: string, placement?: `before` | `after`) => boolean;
  moveDomain: (groupKey: string, domainId: string, targetId: string, fullGroupDomainIds: string[], placement?: `before` | `after`) => void;
}
