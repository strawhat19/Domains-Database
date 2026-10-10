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
  createdAt?: string;
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
  createdAt?: string;
  domainIds?: string[];
  description?: string;
  currentVote: CollectionVote;
  sortDirection: `asc` | `desc`;
  visibility: CollectionVisibility;
  sortField: PortfolioColumn | null;
  projectStatus: DomainProjectStatus;
}

export interface GroupSettingsInput extends PortfolioGroupDetails {
  name: string;
  description: string;
  collectionId?: string | null;
  convertToCollection?: boolean;
  newCollection?: { name: string; description: string };
}

export interface PortfolioPreferences {
  view: PortfolioView;
  showCosts: boolean;
  showAddRows: boolean;
  groupBy: PortfolioGroupBy;
  hiddenDomainIds: string[];
  hiddenGroupKeys: string[];
  expandedDomainIds: string[];
  collapsedGroupKeys: string[];
  showHiddenGroups: boolean;
  showHiddenDomains: boolean;
  collectionNumber: number;
  hiddenCollectionIds: string[];
  showHiddenCollections: boolean;
  collapsedCollectionIds: string[];
  customGroups: CustomPortfolioGroup[];
  orders: Record<string, string[]>;
  collections: CustomPortfolioCollection[];
}

export interface PortfolioGroup extends PortfolioGroupDetails {
  key: string;
  label: string;
  description?: string;
  customGroupId?: string;
  directCollectionId?: string;
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
  deleteGroup: (groupId: string) => boolean;
  setGroupBy: (groupBy: PortfolioGroupBy) => void;
  setShowCosts: (value: boolean) => void;
  setShowAddRows: (value: boolean) => void;
  renameGroup: (groupId: string, name: string) => boolean;
  renameCollection: (collectionId: string, name: string) => boolean;
  toggleGroupStar: (groupId: string) => boolean;
  starGroups: (groupIds: readonly string[]) => boolean;
  setShowHiddenGroups: (value: boolean) => void;
  setShowHiddenDomains: (value: boolean) => void;
  setShowHiddenCollections: (value: boolean) => void;
  toggleGroupVisibility: (groupKey: string) => boolean;
  toggleGroupCollapsed: (groupKey: string) => boolean;
  toggleDomainExpansion: (domainId: string) => boolean;
  toggleDomainVisibility: (domainId: string) => boolean;
  toggleCollectionCollapsed: (collectionId: string) => boolean;
  toggleCollectionVisibility: (collectionId: string) => boolean;
  assignDomain: (domainId: string, groupId: string | null) => void;
  createCollection: (name: string, description?: string) => string | undefined;
  createGroup: (name: string, domainIds?: string[], collection?: Pick<GroupSettingsInput, `collectionId` | `newCollection`>) => string | undefined;
  assignDomains: (domainIds: string[], groupId: string | null) => boolean;
  assignDomainsToCollection: (domainIds: string[], collectionId: string | null) => boolean;
  voteCollection: (collectionId: string, vote: Exclude<CollectionVote, null>) => boolean;
  updateGroup: (groupId: string, name: string, description: string) => boolean;
  saveGroupSettings: (groupId: string, input: GroupSettingsInput) => boolean;
  updateGroupProjectStatus: (groupId: string, status: DomainProjectStatus) => boolean;
  moveGroup: (groupId: string, targetId: string, placement?: `before` | `after`) => boolean;
  updateCollection: (collectionId: string, name: string, description: string, visibility?: CollectionVisibility, projectStatus?: DomainProjectStatus) => boolean;
  setCollectionVisibility: (collectionId: string, visibility: CollectionVisibility) => boolean;
  assignGroupCollection: (groupId: string, collectionId: string | null) => boolean;
  setCollectionSort: (collectionId: string, field: PortfolioColumn | null, direction: `asc` | `desc`) => boolean;
  moveCollection: (collectionId: string, targetId: string, placement?: `before` | `after`) => boolean;
  moveDomain: (groupKey: string, domainId: string, targetId: string, fullGroupDomainIds: string[], placement?: `before` | `after`) => void;
}
