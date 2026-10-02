import type { DragEventHandler } from 'react';
import type { DomainRecord } from '../../shared/types';
import { getDomainStatus } from '../../shared/domainUtils';
import type { PortfolioColumn } from '../../shared/portfolioColumns';

export interface DomainItemProps {
  busy?: boolean;
  selected?: boolean;
  position: number;
  domain: DomainRecord;
  visibleColumns?: PortfolioColumn[];
  onSelect?: (id: string, selected: boolean) => void;
  onEdit: (domain: DomainRecord) => void;
  onDelete: (domain: DomainRecord) => void;
  onMoveUp?: (domain: DomainRecord) => void;
  onMoveDown?: (domain: DomainRecord) => void;
  onToggleAutoRenew: (domain: DomainRecord) => void;
}

export interface DomainDragProps<Element extends HTMLElement> {
  dragging?: boolean;
  dropTarget?: boolean;
  draggable?: boolean;
  onDrop?: DragEventHandler<Element>;
  onDragEnd?: DragEventHandler<Element>;
  onDragOver?: DragEventHandler<Element>;
  onDragStart?: DragEventHandler<Element>;
}

export const getDomainColumnKey = (column: PortfolioColumn) => {
  if (column === `expiresAt`) return `renewal`;
  if (column === `renewalPrice`) return `annual-cost`;
  return column.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
};

export const getDomainSkeletonKey = (column: PortfolioColumn) => (
  column === `renewalPrice` ? `cost` : getDomainColumnKey(column)
);

export const getDomainRow = (domain: DomainRecord) => {
  const status = getDomainStatus(domain);
  return {
    status,
    scope: `domain-row-${domain.id}`,
    lastDot: domain.name.lastIndexOf(`.`),
    statusKey: status.toLowerCase().replaceAll(` `, `-`),
    registrarKey: domain.registrar.toLowerCase().replaceAll(` `, `-`) || `unknown`,
  };
};
