import './styles.scss';
import { COLUMN_GROUPS } from './groups';
import type { LucideIcon } from 'lucide-react';
import BooleanSetting from '../SegmentedControl/BooleanSetting.web';
import { PORTFOLIO_COLUMNS, type PortfolioColumn } from '../../shared/portfolioColumns';
import type { PortfolioColumnCategory } from '../../shared/portfolioPreferences/columns';
import { Lock, Coins, Globe, Gauge, Contact, Layers3, Columns3, ChevronDown, CalendarDays, ShieldCheck } from 'lucide-react';

const COLUMN_GROUP_ICONS: Record<PortfolioColumnCategory, LucideIcon> = {
  costs: Coins,
  domain: Globe,
  insights: Gauge,
  contact: Contact,
  project: Layers3,
  security: ShieldCheck,
  registration: CalendarDays,
};

interface ColumnOptionsProps {
  expanded?: boolean;
  idPrefix?: string;
  categoriesDisabled?: boolean;
  visibleColumns: PortfolioColumn[];
  onToggle: (column: PortfolioColumn) => void;
  columnCounts: Record<PortfolioColumn, number>;
  collapsedCategories?: readonly PortfolioColumnCategory[];
  onToggleCategory?: (category: PortfolioColumnCategory) => void;
}

const ColumnOptions = ({
  onToggle,
  columnCounts,
  visibleColumns,
  onToggleCategory,
  expanded = false,
  collapsedCategories = [],
  categoriesDisabled = false,
  idPrefix = `portfolio-column`,
}: ColumnOptionsProps) => (
  <fieldset
    id={`${idPrefix}-options`}
    className={`column-controls-options${expanded ? ` column-controls-options-expanded` : ``}`}
  >
    <legend id={`${idPrefix}-options-title`} className={`column-controls-title`}>
      {`Show Columns`}
    </legend>
    <div id={`${idPrefix}-groups`} className={`column-controls-groups`}>
      {COLUMN_GROUPS.map(group => {
        const Icon = COLUMN_GROUP_ICONS[group.id] ?? Columns3;
        const collapsible = expanded && Boolean(onToggleCategory);
        const collapsed = collapsible && collapsedCategories.includes(group.id);
        const columns = PORTFOLIO_COLUMNS.filter(column => group.fields.includes(column.field));
        const visibleCount = columns.filter(column => column.field === `name` || visibleColumns.includes(column.field)).length;
        return (
          <section
            key={group.id}
            id={`${idPrefix}-group-${group.id}`}
            aria-labelledby={`${idPrefix}-group-${group.id}-title`}
            className={`column-controls-group${collapsible ? ` column-controls-group-collapsible` : ``}`}
          >
            <h3 id={`${idPrefix}-group-${group.id}-title`} className={`column-controls-group-title`}>
              {collapsible ? (
                <button
                  type={`button`}
                  aria-expanded={!collapsed}
                  disabled={categoriesDisabled}
                  id={`${idPrefix}-group-${group.id}-toggle`}
                  className={`column-controls-group-toggle`}
                  onClick={() => onToggleCategory?.(group.id)}
                  aria-controls={`${idPrefix}-group-${group.id}-content`}
                  aria-labelledby={`${idPrefix}-group-${group.id}-text`}
                  aria-describedby={`${idPrefix}-group-${group.id}-summary`}
                >
                  <Icon size={15} aria-hidden={`true`} id={`${idPrefix}-group-${group.id}-icon`} className={`column-controls-group-icon`} />
                  <span id={`${idPrefix}-group-${group.id}-text`} className={`column-controls-group-title-text`}>{group.label}</span>
                  <span
                    id={`${idPrefix}-group-${group.id}-summary`}
                    className={`column-controls-group-summary`}
                    title={`${visibleCount} Of ${columns.length} Columns Shown`}
                    aria-label={`${visibleCount} Of ${columns.length} Columns Shown`}
                  >
                    {`${visibleCount}/${columns.length}`}
                  </span>
                  <ChevronDown size={15} aria-hidden={`true`} data-expanded={!collapsed} id={`${idPrefix}-group-${group.id}-chevron`} className={`column-controls-group-chevron`} />
                </button>
              ) : (
                <>
                  {expanded && <Icon size={15} aria-hidden={`true`} id={`${idPrefix}-group-${group.id}-icon`} className={`column-controls-group-icon`} />}
                  <span id={`${idPrefix}-group-${group.id}-text`} className={`column-controls-group-title-text`}>{group.label}</span>
                </>
              )}
            </h3>
            <div
              inert={collapsed}
              aria-hidden={collapsed || undefined}
              data-collapsed={collapsed || undefined}
              id={`${idPrefix}-group-${group.id}-content`}
              className={`column-controls-group-content`}
            >
              <div id={`${idPrefix}-group-${group.id}-options`} className={`column-controls-group-options`}>
                {columns.map(column => {
                  const required = column.field === `name`;
                  const count = columnCounts[column.field] ?? 0;
                  const visible = required || visibleColumns.includes(column.field);
                  const scope = `${idPrefix}-option-${column.field}`;
                  const countDescription = `${count} saved portfolio ${count === 1 ? `row has` : `rows have`} a value for ${column.label}.`;
                  return (
                    <div
                      key={column.field}
                      id={`${scope}-card`}
                      className={`column-controls-option${required ? ` column-controls-option-required` : ``}`}
                    >
                      <div id={`${scope}-heading`} className={`column-controls-option-heading`}>
                        <span id={`${scope}-label`} className={`column-controls-option-label`}>
                          {expanded && <Icon size={15} aria-hidden={`true`} id={`${scope}-icon`} className={`column-controls-option-icon`} />}
                          <span id={`${scope}-text`} title={column.label} className={`column-controls-option-text`}>
                            {column.label}
                          </span>
                        </span>
                        {column.public && (
                          <span id={`${scope}-public`} title={`Public Column`} aria-label={`Public Column`} className={`column-controls-public-text`}>
                            {expanded ? <Globe size={12} aria-hidden={`true`} id={`${scope}-public-icon`} className={`column-controls-public-icon`} /> : `Public`}
                          </span>
                        )}
                        <span
                          id={`${scope}-count`}
                          title={countDescription}
                          aria-label={countDescription}
                          className={`column-controls-option-count`}
                        >
                          {expanded ? count : `(${count})`}
                        </span>
                        {required && (
                          <span id={`${scope}-required`} title={`Always Shown`} aria-label={`Always Shown`} className={`column-controls-required-text`}>
                            {expanded ? <Lock size={12} aria-hidden={`true`} id={`${scope}-required-icon`} className={`column-controls-required-icon`} /> : `Always shown`}
                          </span>
                        )}
                      </div>
                      <BooleanSetting
                        id={scope}
                        value={visible}
                        disabled={required}
                        labelledBy={`${scope}-label`}
                        className={`column-controls-toggle`}
                        describedBy={`${scope}-count${required ? ` ${scope}-required` : ``}`}
                        onChange={value => { if (!required && value !== visible) onToggle(column.field); }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  </fieldset>
);

export default ColumnOptions;
