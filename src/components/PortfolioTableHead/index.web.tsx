import type { Ref } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { PortfolioColumn, PortfolioColumnDefinition } from '../../shared/portfolioColumns';

interface PortfolioTableHeadProps {
  inactive?: boolean;
  mirrored?: boolean;
  allSelected?: boolean;
  someSelected?: boolean;
  idPrefix?: string;
  columnWidths?: number[];
  sortField: PortfolioColumn | null;
  sortDirection: `asc` | `desc`;
  columns: PortfolioColumnDefinition[];
  headRef?: Ref<HTMLTableSectionElement>;
  onSort: (field: PortfolioColumn) => void;
  onSelectAll?: (selected: boolean) => void;
}

const getColumnStyle = (width?: number) => (
  width === undefined ? undefined : { width, minWidth: width, maxWidth: width }
);

const PortfolioTableHead = ({
  columns,
  headRef,
  onSort,
  onSelectAll,
  sortField,
  sortDirection,
  columnWidths,
  inactive = false,
  mirrored = false,
  allSelected = false,
  someSelected = false,
  idPrefix = `portfolio`,
}: PortfolioTableHeadProps) => (
  <thead
    ref={headRef}
    id={`${idPrefix}-table-head`}
    role={mirrored ? `presentation` : undefined}
    className={`portfolio-table-head${inactive ? ` portfolio-table-head-inactive` : ``}`}
  >
    <tr
      id={`${idPrefix}-table-heading-row`}
      role={mirrored ? `presentation` : undefined}
      className={`portfolio-table-heading-row`}
    >
      <th
        scope={mirrored ? undefined : `col`}
        aria-hidden={mirrored || undefined}
        role={mirrored ? `presentation` : undefined}
        aria-label={mirrored ? undefined : `Position`}
        id={`${idPrefix}-heading-position`}
        style={getColumnStyle(columnWidths?.[0] ?? 38)}
        className={`portfolio-table-heading portfolio-table-heading-position portfolio-heading-position`}
      >
        {`#`}
      </th>
      <th
        scope={mirrored ? undefined : `col`}
        role={mirrored ? `presentation` : undefined}
        aria-label={mirrored ? undefined : `Select domains`}
        id={`${idPrefix}-heading-selection`}
        style={getColumnStyle(columnWidths?.[1] ?? 36)}
        className={`portfolio-table-heading portfolio-table-heading-selection portfolio-heading-selection`}
      >
        <input
          type={`checkbox`}
          checked={allSelected}
          disabled={!onSelectAll}
          aria-hidden={inactive || undefined}
          tabIndex={inactive ? -1 : undefined}
          id={`${idPrefix}-select-all`}
          className={`portfolio-select-all`}
          aria-label={`Select all visible domains`}
          aria-checked={someSelected && !allSelected ? `mixed` : allSelected}
          onChange={event => onSelectAll?.(event.target.checked)}
          ref={input => {
            if (input) input.indeterminate = someSelected && !allSelected;
          }}
        />
      </th>
      {columns.map((column, index) => {
        const sorted = sortField === column.field;
        const direction = sortDirection === `asc` ? `ascending` : `descending`;
        const Icon = sorted ? sortDirection === `asc` ? ArrowUp : ArrowDown : ArrowUpDown;
        const width = columnWidths?.[index + 2];
        const sortLabel = mirrored
          ? `Sort by ${column.label}, ${sorted ? `currently ${direction}` : `unsorted`}`
          : `Sort By ${column.label}`;

        return (
          <th
            key={column.field}
            scope={mirrored ? undefined : `col`}
            role={mirrored ? `presentation` : undefined}
            aria-label={mirrored ? undefined : column.label}
            id={`${idPrefix}-heading-${column.field}`}
            aria-sort={mirrored ? undefined : sorted ? direction : `none`}
            style={getColumnStyle(width)}
            className={`portfolio-table-heading portfolio-table-heading-${column.field}`}
          >
            <button
              type={`button`}
              aria-label={sortLabel}
              aria-hidden={inactive || undefined}
              tabIndex={inactive ? -1 : undefined}
              id={`${idPrefix}-sort-${column.field}`}
              className={`portfolio-sort-button`}
              onClick={() => onSort(column.field)}
            >
              <span id={`${idPrefix}-sort-label-${column.field}`} className={`portfolio-sort-label`}>
                {column.label}
              </span>
              <Icon
                size={11}
                aria-hidden={`true`}
                id={`${idPrefix}-sort-icon-${column.field}`}
                className={`portfolio-sort-icon${sorted ? ` portfolio-sort-icon-active` : ``}`}
              />
            </button>
          </th>
        );
      })}
      <th
        scope={mirrored ? undefined : `col`}
        role={mirrored ? `presentation` : undefined}
        aria-label={mirrored ? undefined : `Actions`}
        id={`${idPrefix}-heading-actions`}
        style={getColumnStyle(columnWidths?.[columns.length + 2])}
        className={`portfolio-table-heading portfolio-table-heading-actions`}
      >
        <span
          aria-hidden={mirrored || undefined}
          id={`${idPrefix}-actions-label`}
          className={`portfolio-sr-only`}
        >
          {`Actions`}
        </span>
      </th>
    </tr>
  </thead>
);

export default PortfolioTableHead;
