import './styles.scss';
import { useEffect, useRef, useState } from 'react';
import { useColumns } from '../../shared/columnContext/useColumns';
import type { Ref, DragEvent, PointerEvent, KeyboardEvent } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, MoveHorizontal } from 'lucide-react';
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

const COLUMN_DRAG_TYPE = `application/x-domains-database-column`;
const clampColumnWidth = (width: number) => Math.max(72, Math.min(10000, Math.round(width)));

interface ColumnResize {
  startX: number;
  width: number;
  startWidth: number;
  pointerId: number;
  field: PortfolioColumn;
}

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
}: PortfolioTableHeadProps) => {
  const { moveColumn, resizeColumn, flexibleColumns, toggleColumnFlex } = useColumns();
  const resize = useRef<ColumnResize | null>(null);
  const resizeFrame = useRef<number | null>(null);
  const dragStartedOnControl = useRef(false);
  const [draggedColumn, setDraggedColumn] = useState<PortfolioColumn | null>(null);
  const [dropColumn, setDropColumn] = useState<PortfolioColumn | null>(null);
  const [resizingColumn, setResizingColumn] = useState<PortfolioColumn | null>(null);

  useEffect(() => () => {
    if (resizeFrame.current !== null) cancelAnimationFrame(resizeFrame.current);
    resize.current = null;
  }, []);

  const startDrag = (event: DragEvent<HTMLTableCellElement>, field: PortfolioColumn) => {
    event.stopPropagation();
    const target = event.target instanceof Element ? event.target : null;
    if (inactive || resize.current || dragStartedOnControl.current || target?.closest(`button, .portfolio-column-resize-handle`)) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = `move`;
    event.dataTransfer.setData(COLUMN_DRAG_TYPE, field);
    setDraggedColumn(field);
  };

  const dragOver = (event: DragEvent<HTMLTableCellElement>, field: PortfolioColumn) => {
    if (inactive || !event.dataTransfer.types.includes(COLUMN_DRAG_TYPE)) return;
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = `move`;
    setDropColumn(field);
  };

  const drop = (event: DragEvent<HTMLTableCellElement>, field: PortfolioColumn) => {
    if (inactive || !event.dataTransfer.types.includes(COLUMN_DRAG_TYPE)) return;
    event.stopPropagation();
    event.preventDefault();
    const source = event.dataTransfer.getData(COLUMN_DRAG_TYPE) as PortfolioColumn;
    if (source !== field && columns.some(column => column.field === source)) moveColumn(source, field);
    setDropColumn(null);
    setDraggedColumn(null);
  };

  const reorderWithKeyboard = (event: KeyboardEvent<HTMLTableCellElement>, index: number) => {
    if (event.target !== event.currentTarget || !event.altKey || ![`ArrowLeft`, `ArrowRight`].includes(event.key)) return;
    event.stopPropagation();
    event.preventDefault();
    const source = columns[index]?.field;
    const target = columns[index + (event.key === `ArrowLeft` ? -1 : 1)]?.field;
    if (!inactive && source && target) moveColumn(source, target);
  };

  const startResize = (event: PointerEvent<HTMLSpanElement>, field: PortfolioColumn, width?: number) => {
    event.stopPropagation();
    if (inactive || event.button !== 0) return;
    event.preventDefault();
    const startWidth = width ?? event.currentTarget.closest(`th`)?.getBoundingClientRect().width ?? 120;
    resize.current = { field, startX: event.clientX, pointerId: event.pointerId, width: startWidth, startWidth };
    event.currentTarget.setPointerCapture(event.pointerId);
    setResizingColumn(field);
  };

  const updateResize = (event: PointerEvent<HTMLSpanElement>) => {
    const current = resize.current;
    if (!current || current.pointerId !== event.pointerId) return;
    event.stopPropagation();
    current.width = clampColumnWidth(current.startWidth + event.clientX - current.startX);
    if (resizeFrame.current !== null) return;
    resizeFrame.current = requestAnimationFrame(() => {
      resizeFrame.current = null;
      if (resize.current) resizeColumn(resize.current.field, resize.current.width);
    });
  };

  const finishResize = (event: PointerEvent<HTMLSpanElement>, cancelled = false) => {
    const current = resize.current;
    if (!current || current.pointerId !== event.pointerId) return;
    event.stopPropagation();
    if (resizeFrame.current !== null) cancelAnimationFrame(resizeFrame.current);
    resizeFrame.current = null;
    if (!cancelled) resizeColumn(current.field, current.width);
    resize.current = null;
    setResizingColumn(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const resizeWithKeyboard = (event: KeyboardEvent<HTMLSpanElement>, field: PortfolioColumn, width?: number) => {
    if (inactive || ![`ArrowLeft`, `ArrowRight`].includes(event.key)) return;
    event.stopPropagation();
    event.preventDefault();
    const currentWidth = width ?? event.currentTarget.closest(`th`)?.getBoundingClientRect().width ?? 120;
    resizeColumn(field, clampColumnWidth(currentWidth + (event.key === `ArrowLeft` ? -10 : 10)));
  };

  return (
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
          const flexible = flexibleColumns.includes(column.field);
          const direction = sortDirection === `asc` ? `ascending` : `descending`;
          const Icon = sorted ? sortDirection === `asc` ? ArrowUp : ArrowDown : ArrowUpDown;
          const width = columnWidths?.[index + 2];
          const sortLabel = mirrored
            ? `Sort by ${column.label}, ${sorted ? `currently ${direction}` : `unsorted`}`
            : `Sort By ${column.label}`;
          const flexLabel = flexible ? `Use Fixed Width For ${column.label}` : `Stretch ${column.label} To Fill Table`;

          return (
            <th
              key={column.field}
              draggable={!inactive}
              tabIndex={inactive ? -1 : 0}
              scope={mirrored ? undefined : `col`}
              role={mirrored ? `presentation` : undefined}
              aria-label={mirrored ? undefined : column.label}
              id={`${idPrefix}-heading-${column.field}`}
              aria-sort={mirrored ? undefined : sorted ? direction : `none`}
              style={getColumnStyle(width)}
              onDrop={event => drop(event, column.field)}
              title={`Drag To Reorder ${column.label}; Alt + Left Or Right To Move`}
              onDragStart={event => startDrag(event, column.field)}
              onKeyDown={event => reorderWithKeyboard(event, index)}
              onDragOver={event => dragOver(event, column.field)}
              onDragEnd={event => {
                event.stopPropagation();
                setDropColumn(null);
                setDraggedColumn(null);
              }}
              onPointerDownCapture={event => {
                dragStartedOnControl.current = event.target instanceof Element && Boolean(event.target.closest(`button, .portfolio-column-resize-handle`));
              }}
              onDragLeave={event => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropColumn(null);
              }}
              className={`portfolio-table-heading portfolio-table-heading-${column.field}${draggedColumn === column.field ? ` portfolio-table-heading-dragging` : ``}${dropColumn === column.field && draggedColumn !== column.field ? ` portfolio-table-heading-drop` : ``}${resizingColumn === column.field ? ` portfolio-table-heading-resizing` : ``}`}
            >
              <div id={`${idPrefix}-heading-controls-${column.field}`} className={`portfolio-heading-controls`}>
                <span id={`${idPrefix}-heading-label-${column.field}`} className={`portfolio-column-label`}>
                  {column.label}
                </span>
                <button
                  type={`button`}
                  draggable={false}
                  disabled={inactive}
                  title={sortLabel}
                  aria-label={sortLabel}
                  aria-hidden={inactive || undefined}
                  tabIndex={inactive ? -1 : undefined}
                  id={`${idPrefix}-sort-${column.field}`}
                  className={`portfolio-sort-button`}
                  onPointerDown={event => event.stopPropagation()}
                  onDragStart={event => { event.stopPropagation(); event.preventDefault(); }}
                  onClick={event => { event.stopPropagation(); onSort(column.field); }}
                >
                  <Icon
                    size={11}
                    aria-hidden={`true`}
                    id={`${idPrefix}-sort-icon-${column.field}`}
                    className={`portfolio-sort-icon${sorted ? ` portfolio-sort-icon-active` : ``}`}
                  />
                </button>
                <button
                  type={`button`}
                  draggable={false}
                  disabled={inactive}
                  title={flexLabel}
                  aria-label={flexLabel}
                  aria-pressed={flexible}
                  aria-hidden={inactive || undefined}
                  tabIndex={inactive ? -1 : undefined}
                  id={`${idPrefix}-stretch-${column.field}`}
                  onPointerDown={event => event.stopPropagation()}
                  className={`portfolio-column-flex-button${flexible ? ` portfolio-column-flex-button-active` : ``}`}
                  onDragStart={event => { event.stopPropagation(); event.preventDefault(); }}
                  onClick={event => { event.stopPropagation(); toggleColumnFlex(column.field); }}
                >
                  <MoveHorizontal
                    size={12}
                    aria-hidden={`true`}
                    className={`portfolio-column-flex-icon`}
                    id={`${idPrefix}-stretch-icon-${column.field}`}
                  />
                </button>
              </div>
              <span
                role={`separator`}
                draggable={false}
                aria-valuemin={72}
                aria-valuemax={10000}
                aria-orientation={`vertical`}
                aria-valuenow={width === undefined ? undefined : Math.round(width)}
                aria-hidden={inactive || undefined}
                tabIndex={inactive ? -1 : 0}
                id={`${idPrefix}-resize-${column.field}`}
                className={`portfolio-column-resize-handle`}
                aria-label={`Resize ${column.label} Column`}
                title={`Drag To Resize ${column.label}; Left Or Right To Adjust`}
                onClick={event => event.stopPropagation()}
                onPointerMove={updateResize}
                onPointerUp={event => finishResize(event)}
                onPointerCancel={event => finishResize(event, true)}
                onLostPointerCapture={event => finishResize(event, true)}
                onDragStart={event => { event.stopPropagation(); event.preventDefault(); }}
                onPointerDown={event => startResize(event, column.field, width)}
                onKeyDown={event => resizeWithKeyboard(event, column.field, width)}
              />
            </th>
          );
        })}
        <th
          aria-hidden={`true`}
          role={`presentation`}
          id={`${idPrefix}-heading-spacer`}
          style={getColumnStyle(columnWidths?.[columns.length + 2] ?? 0)}
          className={`portfolio-table-heading portfolio-table-heading-spacer`}
        />
        <th
          scope={mirrored ? undefined : `col`}
          role={mirrored ? `presentation` : undefined}
          aria-label={mirrored ? undefined : `Actions`}
          id={`${idPrefix}-heading-actions`}
          style={getColumnStyle(columnWidths?.[columns.length + 3] ?? 116)}
          className={`portfolio-table-heading portfolio-table-heading-actions${mirrored ? ` portfolio-table-heading-actions-mirrored` : ``}`}
        >
          <span
            aria-hidden={mirrored || undefined}
            id={`${idPrefix}-actions-label`}
            className={`portfolio-actions-label`}
          >
            {`Actions`}
          </span>
        </th>
      </tr>
    </thead>
  );
};

export default PortfolioTableHead;
