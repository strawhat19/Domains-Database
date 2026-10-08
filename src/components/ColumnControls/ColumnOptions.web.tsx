import './styles.scss';
import { COLUMN_GROUPS } from './groups';
import { PORTFOLIO_COLUMNS, type PortfolioColumn } from '../../shared/portfolioColumns';

interface ColumnOptionsProps {
  expanded?: boolean;
  idPrefix?: string;
  visibleColumns: PortfolioColumn[];
  onToggle: (column: PortfolioColumn) => void;
  columnCounts: Record<PortfolioColumn, number>;
}

const ColumnOptions = ({ onToggle, columnCounts, visibleColumns, expanded = false, idPrefix = `portfolio-column` }: ColumnOptionsProps) => (
  <fieldset
    id={`${idPrefix}-options`}
    className={`column-controls-options${expanded ? ` column-controls-options-expanded` : ``}`}
  >
    <legend id={`${idPrefix}-options-title`} className={`column-controls-title`}>
      {`Show columns`}
    </legend>
    <div id={`${idPrefix}-groups`} className={`column-controls-groups`}>
      {COLUMN_GROUPS.map(group => (
        <section
          key={group.id}
          className={`column-controls-group`}
          id={`${idPrefix}-group-${group.id}`}
          aria-labelledby={`${idPrefix}-group-${group.id}-title`}
        >
          <h3 id={`${idPrefix}-group-${group.id}-title`} className={`column-controls-group-title`}>
            {group.label}
          </h3>
          <div id={`${idPrefix}-group-${group.id}-options`} className={`column-controls-group-options`}>
            {PORTFOLIO_COLUMNS.filter(column => group.fields.includes(column.field)).map(column => {
              const required = column.field === `name`;
              const count = columnCounts[column.field] ?? 0;
              const scope = `${idPrefix}-option-${column.field}`;
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
);

export default ColumnOptions;
