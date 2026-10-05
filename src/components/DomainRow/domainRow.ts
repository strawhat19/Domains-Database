import type { DomainRecord } from '../../shared/types';
import { getDomainStatus } from '../../shared/domainUtils';
import type { PortfolioColumn } from '../../shared/portfolioColumns';
import type { MouseEvent, ChangeEvent, KeyboardEvent, DragEventHandler } from 'react';

export interface DomainItemProps {
  busy?: boolean;
  selected?: boolean;
  position: number;
  domain: DomainRecord;
  selectionDescriptionId?: string;
  visibleColumns?: PortfolioColumn[];
  onEdit: (domain: DomainRecord) => void;
  onDelete: (domain: DomainRecord) => void;
  onMoveUp?: (domain: DomainRecord) => void;
  onMoveDown?: (domain: DomainRecord) => void;
  onToggleAutoRenew: (domain: DomainRecord) => void;
  onSelect?: (id: string, selected: boolean, extend?: boolean) => void;
}

export interface DomainDragProps<Element extends HTMLElement> {
  dragging?: boolean;
  dropTarget?: boolean;
  draggable?: boolean;
  reorderable?: boolean;
  onDrop?: DragEventHandler<Element>;
  onDragEnd?: DragEventHandler<Element>;
  onDragOver?: DragEventHandler<Element>;
  onDragStart?: DragEventHandler<Element>;
}

export const isDomainSelectionTarget = (target: EventTarget | null, container: HTMLElement) => {
  if (!(target instanceof Element)) return false;
  const control = target.closest(
    `a, button, input, select, textarea, label, summary, [role], [tabindex], [contenteditable]:not([contenteditable="false"]), audio[controls], video[controls], .domain-drag-handle, .domain-grid-card-drag-handle`,
  );
  return !control || !container.contains(control);
};

export const getDomainSelectionHandlers = (
  id: string,
  selected: boolean,
  onSelect?: DomainItemProps[`onSelect`],
) => ({
  onClick: (event: MouseEvent<HTMLInputElement>) => event.stopPropagation(),
  onChange: (event: ChangeEvent<HTMLInputElement>) => onSelect?.(
    id,
    event.currentTarget.checked,
    `shiftKey` in event.nativeEvent && event.nativeEvent.shiftKey === true,
  ),
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== ` ` || !event.shiftKey) return;
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) onSelect?.(id, !selected, true);
  },
});

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
