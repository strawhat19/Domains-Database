import './styles.scss';
import { COLUMN_GROUPS } from './groups';
import { useEffect, useRef, useState } from 'react';
import { X, Columns3, RotateCcw } from 'lucide-react';
import { PORTFOLIO_COLUMNS, type PortfolioColumn } from '../../shared/portfolioColumns';

interface ColumnControlsProps {
  onReset: () => void;
  visibleColumns: PortfolioColumn[];
  onToggle: (column: PortfolioColumn) => void;
  columnCounts: Record<PortfolioColumn, number>;
}

const ColumnControls = ({
  onReset,
  onToggle,
  columnCounts,
  visibleColumns,
}: ColumnControlsProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== `Escape`) return;
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener(`keydown`, handleEscape);
    document.addEventListener(`pointerdown`, handleOutsideClick);
    return () => {
      document.removeEventListener(`keydown`, handleEscape);
      document.removeEventListener(`pointerdown`, handleOutsideClick);
    };
  }, [open]);

  return (
    <div ref={rootRef} id={`portfolio-column-controls`} className={`column-controls`}>
      <button
        type={`button`}
        ref={buttonRef}
        aria-expanded={open}
        id={`portfolio-columns-button`}
        aria-controls={`portfolio-column-panel`}
        onClick={() => setOpen(current => !current)}
        className={`portfolio-button portfolio-button-secondary column-controls-button${open ? ` column-controls-button-open` : ``}`}
      >
        <Columns3 size={15} aria-hidden={`true`} id={`portfolio-columns-button-icon`} className={`portfolio-button-icon`} />
        <span id={`portfolio-columns-button-text`} className={`portfolio-button-text`}>
          {`Columns`}
        </span>
      </button>
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
