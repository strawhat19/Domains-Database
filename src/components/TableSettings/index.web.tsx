import './styles.scss';
import '../DomainEditor/styles.scss';
import type { TableSettingsProps } from './types';
import { useTableSettings } from './useTableSettings';
import SettingsField from '../SettingsField/index.web';
import ColumnOptions from '../ColumnControls/ColumnOptions.web';
import { PORTFOLIO_COLUMNS } from '../../shared/portfolioColumns';
import { GROUPABLE_COLUMNS } from '../../shared/portfolioPreferences/groups';
import type { PortfolioGroupBy } from '../../shared/portfolioPreferences/types';
import { X, Eye, List, Coins, Check, Layers3, RotateCcw, LayoutGrid, ArrowDownAZ, GripVertical, MoveHorizontal } from 'lucide-react';

const TableSettings = ({
  onFit,
  onClose,
  onReset,
  onToggle,
  sortField,
  columnCounts,
  visibleColumns,
  onToggleManualOrder,
  fitDisabled = false,
}: TableSettingsProps) => {
  const settings = useTableSettings(onClose);
  const groupLabel = settings.groupBy === `none` ? `No Groups` : settings.groupBy === `custom` ? `Custom Groups`
    : GROUPABLE_COLUMNS.find(column => column.field === settings.groupBy)?.label ?? `No Groups`;
  const sortLabel = PORTFOLIO_COLUMNS.find(column => column.field === sortField)?.label ?? `Domain Name`;

  return (
    <div
      role={`presentation`}
      id={`table-settings-backdrop`}
      className={`domain-dialog-backdrop table-settings-backdrop`}
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        tabIndex={-1}
        role={`dialog`}
        aria-modal={`true`}
        ref={settings.modalRef}
        id={`table-settings-dialog`}
        aria-labelledby={`table-settings-title`}
        className={`domain-dialog table-settings`}
      >
        <header id={`table-settings-header`} className={`domain-dialog-header table-settings-header`}>
          <div id={`table-settings-heading`} className={`domain-dialog-heading`}>
            <span id={`table-settings-eyebrow`} className={`domain-dialog-eyebrow`}>
              {`TABLE SETTINGS`}
            </span>
            <h2 id={`table-settings-title`} className={`domain-dialog-title`}>
              {`Table Settings`}
            </h2>
          </div>
          <button
            type={`button`}
            onClick={onClose}
            id={`table-settings-close`}
            className={`domain-dialog-close`}
            aria-label={`Close Table Settings`}
          >
            <X size={19} aria-hidden={`true`} id={`table-settings-close-icon`} className={`domain-dialog-close-icon`} />
          </button>
        </header>
        <div id={`table-settings-content`} className={`table-settings-content`}>
          <div id={`table-settings-fields`} className={`table-settings-fields`}>
            <fieldset id={`table-settings-view`} className={`table-settings-field table-settings-view`}>
              <legend id={`table-settings-view-label`} className={`table-settings-label`}>
                {`View`}
              </legend>
              <div id={`table-settings-view-choices`} className={`table-settings-choices`}>
                <button
                  type={`button`}
                  id={`table-settings-view-table`}
                  aria-pressed={settings.view === `table`}
                  onClick={() => settings.setView(`table`)}
                  className={`portfolio-button portfolio-button-secondary table-settings-choice`}
                >
                  <List size={15} aria-hidden={`true`} id={`table-settings-view-table-icon`} className={`portfolio-button-icon`} />
                  <span id={`table-settings-view-table-text`} className={`portfolio-button-text`}>
                    {`Table`}
                  </span>
                </button>
                <button
                  type={`button`}
                  id={`table-settings-view-cards`}
                  aria-pressed={settings.view === `grid`}
                  onClick={() => settings.setView(`grid`)}
                  className={`portfolio-button portfolio-button-secondary table-settings-choice`}
                >
                  <LayoutGrid size={15} aria-hidden={`true`} id={`table-settings-view-cards-icon`} className={`portfolio-button-icon`} />
                  <span id={`table-settings-view-cards-text`} className={`portfolio-button-text`}>
                    {`Cards`}
                  </span>
                </button>
              </div>
            </fieldset>
            <div id={`table-settings-sort`} className={`table-settings-field`}>
              <span id={`table-settings-sort-label`} className={`table-settings-label`}>
                {`Sorting`}
              </span>
              <div id={`table-settings-sort-options`} className={`table-settings-sort-options`}>
                <span id={`table-settings-current-sort`} className={`table-settings-current-sort`}>
                  {sortField ? `Sorted By ${sortLabel}` : `Manual Order`}
                </span>
                <button
                  type={`button`}
                  id={`table-settings-sort-toggle`}
                  onClick={onToggleManualOrder}
                  title={sortField ? `Switch To Manual Order` : `Sort Domains Alphabetically`}
                  aria-label={sortField ? `Switch To Manual Domain Order` : `Sort Domains Alphabetically`}
                  className={`portfolio-button portfolio-button-secondary table-settings-sort-toggle`}
                >
                  {sortField
                    ? <GripVertical size={15} aria-hidden={`true`} id={`table-settings-sort-icon`} className={`portfolio-button-icon`} />
                    : <ArrowDownAZ size={15} aria-hidden={`true`} id={`table-settings-sort-icon`} className={`portfolio-button-icon`} />}
                  <span id={`table-settings-sort-text`} className={`portfolio-button-text`}>
                    {sortField ? `Use Manual Order` : `Use Alphabetical Order`}
                  </span>
                </button>
              </div>
            </div>
            <div id={`table-settings-grouping`} className={`table-settings-field`}>
              <label id={`table-settings-group-by-label`} htmlFor={`table-settings-group-by`} className={`table-settings-label`}>
                <Layers3 size={13} aria-hidden={`true`} id={`table-settings-group-by-icon`} className={`table-settings-field-icon`} />
                <span id={`table-settings-group-by-text`} className={`table-settings-label-text`}>
                  {`Group By`}
                </span>
              </label>
              <SettingsField id={`table-settings-group-by-view`} label={`Group By`} value={groupLabel}>
                <select
                  value={settings.groupBy}
                  id={`table-settings-group-by`}
                  className={`domain-editor-input table-settings-select`}
                  onChange={event => settings.setGroupBy(event.target.value as PortfolioGroupBy)}
                >
                  <option id={`table-settings-group-none`} className={`table-settings-group-option`} value={`none`}>
                    {`No Groups`}
                  </option>
                  <option id={`table-settings-group-custom`} className={`table-settings-group-option`} value={`custom`}>
                    {`Custom Groups`}
                  </option>
                  {GROUPABLE_COLUMNS.map(column => (
                    <option key={column.field} id={`table-settings-group-${column.field}`} className={`table-settings-group-option`} value={column.field}>
                      {column.label}
                    </option>
                  ))}
                </select>
              </SettingsField>
            </div>
            <div id={`table-settings-group-visibility`} className={`table-settings-field table-settings-group-visibility`}>
              <label htmlFor={`table-settings-show-hidden-groups`} id={`table-settings-show-hidden-label`} className={`table-settings-hidden-label`}>
                <input
                  type={`checkbox`}
                  id={`table-settings-show-hidden-groups`}
                  checked={settings.showHiddenGroups}
                  className={`column-controls-checkbox table-settings-hidden-checkbox`}
                  onChange={event => settings.setShowHiddenGroups(event.target.checked)}
                />
                <Eye size={14} aria-hidden={`true`} id={`table-settings-show-hidden-icon`} className={`table-settings-field-icon`} />
                <span id={`table-settings-show-hidden-text`} className={`table-settings-hidden-text`}>
                  {`Show Hidden Groups`}
                </span>
              </label>
            </div>
            <div id={`table-settings-costs`} className={`table-settings-field table-settings-costs`}>
              <label htmlFor={`table-settings-show-costs`} id={`table-settings-show-costs-label`} className={`table-settings-costs-label`}>
                <input
                  type={`checkbox`}
                  id={`table-settings-show-costs`}
                  checked={settings.showCosts}
                  disabled={settings.loading}
                  aria-describedby={`table-settings-costs-help`}
                  className={`column-controls-checkbox table-settings-costs-checkbox`}
                  onChange={event => settings.setShowCosts(event.target.checked)}
                />
                <Coins size={14} aria-hidden={`true`} id={`table-settings-show-costs-icon`} className={`table-settings-field-icon`} />
                <span id={`table-settings-show-costs-text`} className={`table-settings-costs-text`}>
                  {`Show Costs`}
                </span>
              </label>
              <p id={`table-settings-costs-help`} className={`table-settings-help`}>
                {`Show registrar renewal estimates below active domain renewal dates. Renewal warnings stay visible.`}
              </p>
            </div>
          </div>
          <ColumnOptions
            expanded
            onToggle={onToggle}
            columnCounts={columnCounts}
            visibleColumns={visibleColumns}
            idPrefix={`table-settings-column`}
          />
        </div>
        <footer id={`table-settings-footer`} className={`domain-dialog-footer table-settings-footer`}>
          <div id={`table-settings-column-actions`} className={`table-settings-column-actions`}>
            <button
              type={`button`}
              onClick={onFit}
              disabled={fitDisabled}
              id={`table-settings-fit-columns`}
              aria-label={`Fit Columns To Contents`}
              title={`Fit Each Column To Its Longest Value`}
              className={`portfolio-button portfolio-button-secondary`}
            >
              <MoveHorizontal size={15} aria-hidden={`true`} id={`table-settings-fit-icon`} className={`portfolio-button-icon`} />
              <span id={`table-settings-fit-text`} className={`portfolio-button-text`}>
                {`Fit Columns`}
              </span>
            </button>
            <button
              type={`button`}
              onClick={onReset}
              id={`table-settings-reset-columns`}
              className={`portfolio-button portfolio-button-secondary`}
            >
              <RotateCcw size={14} aria-hidden={`true`} id={`table-settings-reset-icon`} className={`portfolio-button-icon`} />
              <span id={`table-settings-reset-text`} className={`portfolio-button-text`}>
                {`Reset Columns`}
              </span>
            </button>
          </div>
          <button
            type={`button`}
            onClick={onClose}
            id={`table-settings-done`}
            className={`portfolio-button portfolio-button-primary table-settings-done`}
          >
            <Check size={15} aria-hidden={`true`} id={`table-settings-done-icon`} className={`portfolio-button-icon`} />
            <span id={`table-settings-done-text`} className={`portfolio-button-text`}>
              {`Done`}
            </span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default TableSettings;
