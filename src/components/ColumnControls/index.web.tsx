import './styles.scss';
import type { RefObject } from 'react';
import { COLUMN_GROUPS } from './groups';
import { useEffect, useRef } from 'react';
import { X, Columns3, RotateCcw, MoveHorizontal } from 'lucide-react';
import { PORTFOLIO_COLUMNS, type PortfolioColumn } from '../../shared/portfolioColumns';

interface ColumnControlsProps {
  open: boolean;
  onFit: () => void;
  onReset: () => void;
  fitDisabled?: boolean;
  onOpenChange: (open: boolean) => void;
  visibleColumns: PortfolioColumn[];
  onToggle: (column: PortfolioColumn) => void;
  columnCounts: Record<PortfolioColumn, number>;
  settingsButtonRef: RefObject<HTMLButtonElement | null>;
}

const ColumnControls = ({
  open,
  onFit,
  onReset,
  onToggle,
  columnCounts,
  onOpenChange,
  visibleColumns,
  settingsButtonRef,
  fitDisabled = false,
}: ColumnControlsProps) => {
  const invokingRef = useRef<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    onOpenChange(false);
    (invokingRef.current ?? buttonRef.current)?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return;
    invokingRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : buttonRef.current;
    const handleOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)
        && !settingsButtonRef.current?.contains(event.target)) onOpenChange(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== `Escape`) return;
      event.preventDefault();
      onOpenChange(false);
      (invokingRef.current ?? buttonRef.current)?.focus({ preventScroll: true });
    };
    rootRef.current?.querySelector<HTMLInputElement>(`input:not(:disabled)`)?.focus({ preventScroll: true });
    document.addEventListener(`keydown`, handleEscape);
    document.addEventListener(`pointerdown`, handleOutsideClick);
    return () => {
      document.removeEventListener(`keydown`, handleEscape);
      document.removeEventListener(`pointerdown`, handleOutsideClick);
    };
  }, [open, onOpenChange, settingsButtonRef]);

  return (
    <div ref={rootRef} id={`portfolio-column-controls`} className={`column-controls`}>
      <div id={`portfolio-column-tools`} className={`column-controls-tools`}>
        <button
          type={`button`}
          ref={buttonRef}
          title={`Columns`}
          aria-label={`Columns`}
          aria-expanded={open}
          id={`portfolio-columns-button`}
          aria-controls={`portfolio-column-panel`}
          onClick={() => onOpenChange(!open)}
          className={`portfolio-button portfolio-button-secondary column-controls-button${open ? ` column-controls-button-open` : ``}`}
        >
          <Columns3 size={15} aria-hidden={`true`} id={`portfolio-columns-button-icon`} className={`portfolio-button-icon`} />
          <span id={`portfolio-columns-button-text`} className={`portfolio-button-text`}>
            <span id={`portfolio-columns-button-text-full`} className={`portfolio-button-text-full`}>{`Columns`}</span>
            <span id={`portfolio-columns-button-text-short`} className={`portfolio-button-text-short`}>{`Cols`}</span>
          </span>
        </button>
        <button
          type={`button`}
          onClick={onFit}
          disabled={fitDisabled}
          id={`portfolio-fit-columns`}
          aria-label={`Fit Columns To Contents`}
          title={`Fit Each Column To Its Longest Value`}
          className={`portfolio-button portfolio-button-secondary column-controls-fit`}
        >
          <MoveHorizontal size={15} aria-hidden={`true`} id={`portfolio-fit-columns-icon`} className={`portfolio-button-icon`} />
          <span id={`portfolio-fit-columns-text`} className={`portfolio-button-text`}>{`Fit`}</span>
        </button>
      </div>
      {open && (
        <div id={`portfolio-column-panel`} className={`column-controls-panel`}>
          <fieldset id={`portfolio-column-options`} className={`column-controls-options`}>
            <legend id={`portfolio-column-options-title`} className={`column-controls-title`}>
              {`Show columns`}
            </legend>
            <div id={`portfolio-column-groups`} className={`column-controls-groups`}>
              {COLUMN_GROUPS.map(group => (
                <section
                  key={group.id}
                  className={`column-controls-group`}
                  id={`portfolio-column-group-${group.id}`}
                  aria-labelledby={`portfolio-column-group-${group.id}-title`}
                >
                  <h3
                    className={`column-controls-group-title`}
                    id={`portfolio-column-group-${group.id}-title`}
                  >
                    {group.label}
                  </h3>
                  <div
                    className={`column-controls-group-options`}
                    id={`portfolio-column-group-${group.id}-options`}
                  >
                    {PORTFOLIO_COLUMNS.filter(column => group.fields.includes(column.field)).map(column => {
                      const required = column.field === `name`;
                      const count = columnCounts[column.field] ?? 0;
                      const scope = `portfolio-column-option-${column.field}`;
                      const countDescription = `${count} saved portfolio ${count === 1 ? `row has` : `rows have`} a value for ${column.label}.`;
                      return (
                        <label
                          key={column.field}
                          htmlFor={scope}
                          id={`${scope}-label`}
                          className={`column-controls-option${required ? ` column-controls-option-required` : ``}`}
                        >
                          <input
                            id={scope}
                            type={`checkbox`}
                            disabled={required}
                            className={`column-controls-checkbox`}
                            aria-describedby={`${scope}-count`}
                            onChange={() => onToggle(column.field)}
                            checked={required || visibleColumns.includes(column.field)}
                          />
                          <span id={`${scope}-text`} className={`column-controls-option-text`}>
                            {column.label}
                          </span>
                          {column.public && (
                            <span id={`${scope}-public`} className={`column-controls-public-text`}>
                              {`Public`}
                            </span>
                          )}
                          <span
                            id={`${scope}-count`}
                            title={countDescription}
                            aria-label={countDescription}
                            className={`column-controls-option-count`}
                          >
                            {`(${count})`}
                          </span>
                          {required && (
                            <span id={`${scope}-required`} className={`column-controls-required-text`}>
                              {`Always shown`}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </fieldset>
          <div id={`portfolio-column-actions`} className={`column-controls-actions`}>
            <button
              type={`button`}
              onClick={onReset}
              id={`portfolio-column-reset`}
              className={`portfolio-button portfolio-button-quiet`}
            >
              <RotateCcw size={13} aria-hidden={`true`} id={`portfolio-column-reset-icon`} className={`portfolio-button-icon`} />
              <span id={`portfolio-column-reset-text`} className={`portfolio-button-text`}>
                {`Reset columns`}
              </span>
            </button>
            <button
              type={`button`}
              onClick={close}
              id={`portfolio-column-close`}
              className={`portfolio-button portfolio-button-quiet`}
            >
              <X size={14} aria-hidden={`true`} id={`portfolio-column-close-icon`} className={`portfolio-button-icon`} />
              <span id={`portfolio-column-close-text`} className={`portfolio-button-text`}>
                {`Close`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnControls;
