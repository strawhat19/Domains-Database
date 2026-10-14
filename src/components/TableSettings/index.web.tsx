import './styles.scss';
import '../DomainEditor/styles.scss';
import ModalTabs from '../ModalTabs/index.web';
import MobileSheetHandle from '../MobileSheet/index.web';
import type { TableSettingsProps } from './types';
import { useTableSettings } from './useTableSettings';
import GroupControls from '../GroupControls/index.web';
import SegmentedControl from '../SegmentedControl/index.web';
import ColumnOptions from '../ColumnControls/ColumnOptions.web';
import BooleanSetting from '../SegmentedControl/BooleanSetting.web';
import { GROUPABLE_COLUMNS } from '../../shared/portfolioPreferences/groups';
import type { PortfolioGroupBy } from '../../shared/portfolioPreferences/types';
import { X, Eye, List, Lock, Plus, Minus, Globe, Coins, Check, ArrowUp, Columns3, Layers3, Database, Settings, ArrowDown, RotateCcw, LayoutGrid, ChevronDown, ArrowDownAZ, GripVertical, MoveHorizontal } from 'lucide-react';

const SETTINGS_TABS = [
  { id: `general`, label: `General`, Icon: Settings },
  { id: `organization`, label: `Organization`, Icon: Layers3 },
  { id: `columns`, label: `Columns`, Icon: Columns3 },
] as const;

const VIEW_OPTIONS = [
  { value: `table`, label: `Table`, Icon: List },
  { value: `grid`, label: `Cards`, Icon: LayoutGrid },
] as const;

const VISIBILITY_OPTIONS = [
  { value: `public`, label: `Public`, Icon: Globe },
  { value: `private`, label: `Private`, Icon: Lock },
] as const;

const HIDDEN_OPTIONS = [
  { value: `off`, label: `Off`, Icon: Minus },
  { value: `on`, label: `On`, Icon: Check },
] as const;

const SORT_OPTIONS = [
  { value: `manual`, label: `Manual`, Icon: GripVertical },
  { value: `alphabetical`, label: `Alphabetical`, Icon: ArrowDownAZ },
] as const;

const DATABASE_POSITION_OPTIONS = [
  { value: `above`, label: `Above`, Icon: ArrowUp },
  { value: `below`, label: `Below`, Icon: ArrowDown },
] as const;

const TableSettings = ({
  onFit,
  domains,
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
  const sortOptions = SORT_OPTIONS.map(option => option.value === `alphabetical` && sortField && sortField !== `name`
    ? { ...option, label: `Sorted`, Icon: List } : option);

  return (
    <div
      role={`presentation`}
      id={`table-settings-backdrop`}
      {...settings.sheet.pressProps}
      style={settings.sheet.style}
      className={`domain-dialog-backdrop table-settings-backdrop${settings.sheet.className}`}
      onClick={event => { if (settings.sheet.mobile && event.target === event.currentTarget) settings.close(); }}
      onMouseDown={event => { if (!settings.sheet.mobile && event.target === event.currentTarget) settings.close(); }}
    >
      <div
        tabIndex={-1}
        role={`dialog`}
        aria-modal={`true`}
        ref={settings.modalRef}
        id={`table-settings-dialog`}
        aria-labelledby={`table-settings-title table-settings-eyebrow`}
        className={`domain-dialog table-settings`}
      >
        <MobileSheetHandle id={`table-settings`} sheet={settings.sheet} />
        <header id={`table-settings-header`} className={`domain-dialog-header table-settings-header`}>
          <div id={`table-settings-heading`} className={`domain-dialog-heading`}>
            <span id={`table-settings-eyebrow`} className={`domain-dialog-eyebrow`}>
              {`SETTINGS`}
            </span>
            <h2 id={`table-settings-title`} className={`domain-dialog-title`}>
              {`Table`}
            </h2>
          </div>
          <button
            type={`button`}
            onClick={settings.close}
            id={`table-settings-close`}
            className={`domain-dialog-close`}
            aria-label={`Close Table Settings`}
          >
            <X size={19} aria-hidden={`true`} id={`table-settings-close-icon`} className={`domain-dialog-close-icon`} />
          </button>
        </header>
        <ModalTabs
          id={`table-settings`}
          value={settings.tab}
          options={SETTINGS_TABS}
          onChange={settings.setTab}
          label={`Table Settings Sections`}
        />
        <div id={`table-settings-content`} className={`table-settings-content`}>
          <section
            role={`tabpanel`}
            tabIndex={0}
            hidden={settings.tab !== `general`}
            id={`table-settings-panel-general`}
            aria-labelledby={`table-settings-tab-general`}
            className={`table-settings-panel table-settings-general-panel`}
          >
            <div id={`table-settings-fields`} className={`table-settings-fields`}>
              <div id={`table-settings-view`} className={`table-settings-field table-settings-view`}>
                <span id={`table-settings-view-label`} className={`table-settings-label`}>
                  <LayoutGrid size={14} aria-hidden={`true`} id={`table-settings-view-icon`} className={`table-settings-field-icon`} />
                  <span id={`table-settings-view-label-text`} className={`table-settings-label-text`}>{settings.mobile ? `Desktop View` : `View`}</span>
                </span>
                <SegmentedControl
                  value={settings.view}
                  options={VIEW_OPTIONS}
                  onChange={settings.setView}
                  disabled={settings.loading}
                  id={`table-settings-view-choices`}
                  labelledBy={`table-settings-view-label`}
                  describedBy={settings.mobile ? `table-settings-view-help` : undefined}
                />
                {settings.mobile && (
                  <p id={`table-settings-view-help`} className={`table-settings-view-help`}>
                    {`Small screens use the board. This preference applies on larger screens.`}
                  </p>
                )}
              </div>
              <div id={`table-settings-visibility`} className={`table-settings-field table-settings-visibility`}>
                <span id={`table-settings-visibility-label`} className={`table-settings-label`}>
                  <Eye size={14} aria-hidden={`true`} id={`table-settings-visibility-icon`} className={`table-settings-field-icon`} />
                  <span id={`table-settings-visibility-label-text`} className={`table-settings-label-text`}>{`Visibility`}</span>
                </span>
                <SegmentedControl
                  disabled
                  value={`private`}
                  options={VISIBILITY_OPTIONS}
                  onChange={() => undefined}
                  id={`table-settings-visibility-choices`}
                  labelledBy={`table-settings-visibility-label`}
                />
              </div>
              <div id={`table-settings-sort`} className={`table-settings-field`}>
                <span id={`table-settings-sort-label`} className={`table-settings-label`}>
                  <ArrowDownAZ size={14} aria-hidden={`true`} id={`table-settings-sort-icon`} className={`table-settings-field-icon`} />
                  <span id={`table-settings-sort-label-text`} className={`table-settings-label-text`}>{`Sorting`}</span>
                </span>
                <SegmentedControl
                  options={sortOptions}
                  disabled={settings.loading}
                  id={`table-settings-sort-options`}
                  labelledBy={`table-settings-sort-label`}
                  value={sortField ? `alphabetical` : `manual`}
                  onChange={value => { if ((value === `manual`) !== (sortField === null)) onToggleManualOrder(); }}
                />
              </div>
              <div id={`table-settings-database-position-field`} className={`table-settings-field`}>
                <span id={`table-settings-database-position-label`} className={`table-settings-label`}>
                  <Database size={13} aria-hidden={`true`} id={`table-settings-database-position-icon`} className={`table-settings-field-icon`} />
                  <span id={`table-settings-database-position-text`} className={`table-settings-label-text`}>{`Ungrouped`}</span>
                </span>
                <SegmentedControl
                  disabled={settings.loading}
                  value={settings.databasePosition}
                  onChange={settings.setDatabasePosition}
                  options={DATABASE_POSITION_OPTIONS}
                  id={`table-settings-database-position`}
                  labelledBy={`table-settings-database-position-label`}
                />
              </div>
              <div id={`table-settings-show-hidden-field`} className={`table-settings-field`}>
                <span id={`table-settings-show-hidden-label`} className={`table-settings-label`}>
                  <Eye size={14} aria-hidden={`true`} id={`table-settings-show-hidden-icon`} className={`table-settings-field-icon`} />
                  <span id={`table-settings-show-hidden-text`} className={`table-settings-label-text`}>{`Show Hidden`}</span>
                </span>
                <SegmentedControl
                  options={HIDDEN_OPTIONS}
                  disabled={settings.loading}
                  value={settings.showHiddenState}
                  id={`table-settings-show-hidden`}
                  labelledBy={`table-settings-show-hidden-label`}
                  onChange={value => settings.setShowHidden(value === `on`)}
                  describedBy={settings.showHiddenState === `mixed` ? `table-settings-show-hidden-help` : undefined}
                />
                {settings.showHiddenState === `mixed` && (
                  <span id={`table-settings-show-hidden-help`} className={`table-settings-hidden-help`}>
                    {`Some Hidden Types Shown`}
                  </span>
                )}
              </div>
              <div id={`table-settings-costs`} className={`table-settings-field table-settings-costs`}>
                <span id={`table-settings-show-costs-label`} className={`table-settings-label`}>
                  <Coins size={14} aria-hidden={`true`} id={`table-settings-show-costs-icon`} className={`table-settings-field-icon`} />
                  <span id={`table-settings-show-costs-text`} className={`table-settings-label-text`}>{`Show Costs`}</span>
                </span>
                <BooleanSetting
                  id={`table-settings-show-costs`}
                  value={settings.showCosts}
                  disabled={settings.loading}
                  onChange={settings.setShowCosts}
                  labelledBy={`table-settings-show-costs-label`}
                />
              </div>
            </div>
          </section>
          <section
            role={`tabpanel`}
            tabIndex={0}
            hidden={settings.tab !== `organization`}
            id={`table-settings-panel-organization`}
            aria-labelledby={`table-settings-tab-organization`}
            className={`table-settings-panel table-settings-organization-panel`}
          >
            <div id={`table-settings-grouping`} className={`table-settings-field table-settings-grouping`}>
              <label id={`table-settings-group-by-label`} htmlFor={`table-settings-group-by`} className={`table-settings-label`}>
                <Layers3 size={13} aria-hidden={`true`} id={`table-settings-group-by-icon`} className={`table-settings-field-icon`} />
                <span id={`table-settings-group-by-text`} className={`table-settings-label-text`}>
                  {`Group By`}
                </span>
              </label>
              <div id={`table-settings-group-by-select-wrap`} className={`table-settings-select-wrap`}>
                <select
                  disabled={settings.loading}
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
                <ChevronDown size={15} aria-hidden={`true`} id={`table-settings-group-by-select-chevron`} className={`table-settings-select-chevron`} />
              </div>
            </div>
            <form
              noValidate
              id={`table-settings-collection-create`}
              className={`table-settings-collection-create`}
              onSubmit={settings.collectionForm.handleSubmit}
              onKeyDown={settings.collectionForm.handleKeyDown}
            >
              <div id={`table-settings-collection-field`} className={`table-settings-collection-field`}>
                <label id={`table-settings-collection-label`} htmlFor={`table-settings-collection-name`} className={`table-settings-label`}>
                  <svg
                    width={15}
                    height={15}
                    stroke={`none`}
                    focusable={false}
                    aria-hidden={`true`}
                    fill={`currentColor`}
                    viewBox={`0 0 24 24`}
                    id={`table-settings-collection-icon`}
                    className={`table-settings-field-icon table-settings-collection-icon`}
                  >
                    <path
                      fillRule={`evenodd`}
                      id={`table-settings-collection-icon-path`}
                      d={`M4 4h5l2 3h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM5 9h14a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z`}
                    />
                  </svg>
                  <span id={`table-settings-collection-label-text`} className={`table-settings-label-text`}>{`New Collection`}</span>
                </label>
                <input
                  maxLength={80}
                  autoComplete={`off`}
                  placeholder={`Collection Name`}
                  id={`table-settings-collection-name`}
                  value={settings.collectionForm.name}
                  ref={settings.collectionForm.inputRef}
                  disabled={settings.collectionForm.unavailable}
                  aria-invalid={Boolean(settings.collectionForm.error)}
                  className={`table-settings-collection-name-input`}
                  onChange={event => settings.collectionForm.setName(event.target.value)}
                  aria-describedby={settings.collectionForm.error ? `table-settings-collection-error` : undefined}
                />
              </div>
              <button
                type={`submit`}
                id={`table-settings-collection-add`}
                disabled={settings.collectionForm.unavailable}
                className={`portfolio-button portfolio-button-secondary table-settings-collection-add`}
              >
                <Plus size={15} aria-hidden={`true`} id={`table-settings-collection-add-icon`} className={`portfolio-button-icon table-settings-action-icon`} />
                <span id={`table-settings-collection-add-text`} className={`portfolio-button-text`}>{`Add`}</span>
              </button>
              {settings.collectionForm.error && (
                <p role={`alert`} id={`table-settings-collection-error`} className={`table-settings-collection-error`}>
                  {settings.collectionForm.error}
                </p>
              )}
            </form>
            <GroupControls
              embedded
              domains={domains}
            />
          </section>
          <section
            role={`tabpanel`}
            tabIndex={0}
            hidden={settings.tab !== `columns`}
            id={`table-settings-panel-columns`}
            aria-labelledby={`table-settings-tab-columns`}
            className={`table-settings-panel table-settings-columns-panel`}
          >
            <ColumnOptions
              expanded
              onToggle={onToggle}
              columnCounts={columnCounts}
              visibleColumns={visibleColumns}
              categoriesDisabled={settings.loading}
              idPrefix={`table-settings-column`}
              onToggleCategory={settings.toggleColumnCategoryCollapsed}
              collapsedCategories={settings.collapsedColumnCategories}
            />
          </section>
        </div>
        <footer id={`table-settings-footer`} className={`domain-dialog-footer table-settings-footer`}>
          {settings.tab === `columns` && (
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
          )}
          <button
            type={`button`}
            onClick={settings.close}
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
