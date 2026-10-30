import type { DomainRecord } from '../../shared/types';
import type { RefObject } from 'react';
import type { PortfolioColumn } from '../../shared/portfolioColumns';
import type { PortfolioSections } from '../../shared/portfolioPreferences/types';

export interface BoardEntity {
  id: string;
  label: string;
  main?: boolean;
  groupKey?: string;
  collectionId?: string;
  displayGroupKey?: string;
  kind: `domain` | `group` | `collection`;
}

export interface MobilePortfolioBoardProps {
  busy: boolean;
  loading: boolean;
  compact: boolean;
  hasFilters: boolean;
  surfaceRef?: RefObject<HTMLDivElement | null>;
  sections: PortfolioSections;
  mainSortField: PortfolioColumn | null;
  mainSortDirection: `asc` | `desc`;
  allDomains: DomainRecord[];
  selectedIds: Set<string>;
  visibleDomainIds?: Set<string>;
  onGrouped: () => void;
  onManualOrder: () => void;
  onEmptyAction: () => void;
  onEdit: (domain?: DomainRecord) => void;
  onSelect: (id: string, checked: boolean, extend?: boolean) => void;
  onToggleAutoRenew: (domain: DomainRecord) => void;
  onChangeDescription: (domain: DomainRecord, description: string) => Promise<boolean>;
  onChangeProjectStatus: (domain: DomainRecord, status: DomainRecord[`projectStatus`]) => void;
}

export const boardEntityProps = (entity: BoardEntity, source = true) => ({
  'data-board-target': JSON.stringify(entity),
  'data-board-source': source ? JSON.stringify(entity) : undefined,
});
