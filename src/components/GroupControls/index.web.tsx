import './styles.scss';
import GroupEditor from './GroupEditor.web';
import { X, Plus, Search, Layers3, ChevronDown } from 'lucide-react';
import { useGroupControls } from './useGroupControls';
import type { DomainRecord } from '../../shared/types';
import type { PortfolioGroupBy } from '../../shared/portfolioPreferences/types';
import { GROUPABLE_COLUMNS } from '../../shared/portfolioPreferences/groups';

interface GroupControlsProps {
  domains: DomainRecord[];
}

const GroupControls = ({ domains }: GroupControlsProps) => {
  const groups = useGroupControls(domains);
  const activeLabel = groups.groupBy === `custom` ? `Custom groups` : GROUPABLE_COLUMNS.find(column => column.field === groups.groupBy)?.label;

  return (
    <div ref={groups.rootRef} id={`portfolio-group-controls`} className={`group-controls`}>
      <button
        type={`button`}
        ref={groups.buttonRef}
        aria-haspopup={`dialog`}
        aria-expanded={groups.open}
        id={`portfolio-groups-button`}
        title={activeLabel ? `Grouped by ${activeLabel}` : `Group domains`}
        aria-controls={`portfolio-group-panel`}
        aria-label={`Groups, ${groups.groupCount} ${groups.groupCount === 1 ? `group` : `groups`}${activeLabel ? `, grouped by ${activeLabel}` : ``}`}
        onClick={() => groups.setOpen(current => !current)}
        className={`portfolio-button portfolio-button-secondary group-controls-button${groups.open || activeLabel ? ` group-controls-button-active` : ``}`}
      >
        <Layers3 size={15} aria-hidden={`true`} id={`portfolio-groups-button-icon`} className={`portfolio-button-icon`} />
        <span id={`portfolio-groups-button-text`} className={`portfolio-button-text`}>
          {`Groups`}
        </span>
        <span aria-hidden={`true`} id={`portfolio-groups-button-count`} className={`group-controls-badge`}>
          {groups.groupCount}
        </span>
        <ChevronDown size={12} aria-hidden={`true`} id={`portfolio-groups-button-chevron`} className={`group-controls-chevron`} />
      </button>
      {groups.open && (
        <section
          role={`dialog`}
          ref={groups.panelRef}
          id={`portfolio-group-panel`}
          className={`group-controls-panel`}
          aria-labelledby={`portfolio-group-panel-title`}
        >
          <div id={`portfolio-group-panel-heading`} className={`group-controls-heading`}>
            <h3 id={`portfolio-group-panel-title`} className={`group-controls-title`}>
              {`Group domains`}
            </h3>
            <button
              type={`button`}
              onClick={groups.close}
              id={`portfolio-group-panel-close`}
              className={`portfolio-button portfolio-button-quiet`}
            >
              <X size={14} aria-hidden={`true`} id={`portfolio-group-panel-close-icon`} className={`portfolio-button-icon`} />
              <span id={`portfolio-group-panel-close-text`} className={`portfolio-button-text`}>
                {`Close`}
              </span>
            </button>
          </div>
          <label id={`portfolio-group-by-label`} htmlFor={`portfolio-group-by`} className={`group-controls-field`}>
            <span id={`portfolio-group-by-text`} className={`group-controls-label`}>
              {`Group by`}
            </span>
            <select
              value={groups.groupBy}
              id={`portfolio-group-by`}
              className={`group-controls-select`}
              onChange={event => groups.setGroupBy(event.target.value as PortfolioGroupBy)}
            >
              <option id={`portfolio-group-option-none`} className={`group-controls-option`} value={`none`}>
                {`No groups`}
              </option>
              <option id={`portfolio-group-option-custom`} className={`group-controls-option`} value={`custom`}>
                {`Custom groups`}
              </option>
              {GROUPABLE_COLUMNS.map(column => (
                <option key={column.field} id={`portfolio-group-option-${column.field}`} className={`group-controls-option`} value={column.field}>
                  {column.label}
                </option>
              ))}
            </select>
          </label>
          {groups.groupBy === `custom` && (
            <div id={`portfolio-custom-group-manager`} className={`group-controls-custom-manager`}>
              <form
                id={`portfolio-custom-group-create`}
                className={`group-controls-create`}
                onSubmit={event => { event.preventDefault(); groups.createGroup(); }}
              >
                <label id={`portfolio-custom-group-name-label`} htmlFor={`portfolio-custom-group-name`} className={`group-controls-field`}>
                  <span id={`portfolio-custom-group-name-text`} className={`group-controls-label`}>
                    {`New group`}
                  </span>
                  <input
                    maxLength={80}
                    value={groups.name}
                    placeholder={`e.g. Client sites`}
                    id={`portfolio-custom-group-name`}
                    aria-invalid={Boolean(groups.error)}
                    className={`group-controls-name-input`}
                    onChange={event => groups.setName(event.target.value)}
                    aria-describedby={groups.error ? `portfolio-custom-group-error` : undefined}
                  />
                </label>
                <button type={`submit`} id={`portfolio-custom-group-add`} className={`portfolio-button portfolio-button-secondary`}>
                  <Plus size={15} aria-hidden={`true`} id={`portfolio-custom-group-add-icon`} className={`portfolio-button-icon`} />
                  <span id={`portfolio-custom-group-add-text`} className={`portfolio-button-text`}>
                    {`Add group`}
                  </span>
                </button>
                {groups.error && (
                  <p role={`alert`} id={`portfolio-custom-group-error`} className={`group-controls-error`}>
                    {groups.error}
                  </p>
                )}
              </form>
              <div id={`portfolio-custom-group-editors`} className={`group-controls-editors`}>
                {groups.customGroups.map(group => (
                  <GroupEditor
                    key={group.id}
                    group={group}
                    onRename={groups.renameGroup}
                    onDelete={groups.deleteGroup}
                    count={domains.filter(domain => group.domainIds.includes(domain.id)).length}
                  />
                ))}
              </div>
              <p id={`portfolio-custom-group-help`} className={`group-controls-help`}>
                {`Choose a group for each domain. Drag the grip beside a domain to reorder it within its group, or use the move buttons. Deleting a group keeps its domains in Ungrouped.`}
              </p>
              <label id={`portfolio-group-domain-search-label`} htmlFor={`portfolio-group-domain-search`} className={`group-controls-domain-search`}>
                <Search size={15} aria-hidden={`true`} id={`portfolio-group-domain-search-icon`} className={`group-controls-search-icon`} />
                <input
                  value={groups.query}
                  aria-label={`Find domains to group`}
                  placeholder={`Find a domain to group…`}
                  id={`portfolio-group-domain-search`}
                  className={`group-controls-domain-search-input`}
                  onChange={event => groups.setQuery(event.target.value)}
                />
              </label>
              <div id={`portfolio-group-domain-list`} className={`group-controls-domain-list`}>
                {groups.filteredDomains.map(domain => {
                  const scope = `portfolio-group-membership-${domain.id}`;
                  return (
                    <label key={domain.id} id={`${scope}-label`} htmlFor={scope} className={`group-controls-domain-membership`}>
                      <span id={`${scope}-name`} className={`group-controls-domain-name`}>
                        {domain.name}
                      </span>
                      <select
                        id={scope}
                        className={`group-controls-select group-controls-membership-select`}
                        value={groups.membership.get(domain.id) ?? ``}
                        onChange={event => groups.assignDomain(domain.id, event.target.value || null)}
                      >
                        <option id={`${scope}-ungrouped`} className={`group-controls-option`} value={``}>
                          {`Ungrouped`}
                        </option>
                        {groups.customGroups.map(group => (
                          <option key={group.id} id={`${scope}-${group.id}`} className={`group-controls-option`} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                })}
                {!groups.filteredDomains.length && (
                  <p id={`portfolio-group-domain-empty`} className={`group-controls-help`}>
                    {`No matching domains.`}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default GroupControls;
