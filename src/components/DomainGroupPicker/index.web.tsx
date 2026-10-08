import './styles.scss';
import '../DomainEditor/styles.scss';
import { X, Plus, Layers3 } from 'lucide-react';
import type { DomainRecord } from '../../shared/types';
import { CREATE_GROUP_OPTION, UNGROUPED_GROUP_OPTION, useDomainGroupPicker } from './useDomainGroupPicker';

interface DomainGroupPickerProps {
  onClose: () => void;
  domains: DomainRecord[];
  onGrouped?: () => void;
}

const DomainGroupPicker = ({ domains, onClose, onGrouped }: DomainGroupPickerProps) => {
  const picker = useDomainGroupPicker(domains, onClose, onGrouped);
  const actionLabel = picker.creatingGroup
    ? `Create & Group`
    : picker.groupId === UNGROUPED_GROUP_OPTION ? `Remove From Group` : `Apply Group`;

  return (
    <div
      role={`presentation`}
      id={`domain-group-picker-backdrop`}
      className={`domain-dialog-backdrop`}
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        tabIndex={-1}
        role={`dialog`}
        ref={picker.modalRef}
        aria-modal={`true`}
        id={`domain-group-picker-dialog`}
        aria-labelledby={`domain-group-picker-title`}
        className={`domain-dialog domain-group-picker`}
        aria-describedby={`domain-group-picker-description`}
      >
        <header id={`domain-group-picker-header`} className={`domain-dialog-header`}>
          <div id={`domain-group-picker-heading`} className={`domain-dialog-heading`}>
            <span id={`domain-group-picker-eyebrow`} className={`domain-dialog-eyebrow`}>
              {`YOUR PORTFOLIO`}
            </span>
            <h2 id={`domain-group-picker-title`} className={`domain-dialog-title`}>
              {`Group domains`}
            </h2>
          </div>
          <button
            type={`button`}
            onClick={onClose}
            id={`domain-group-picker-close`}
            className={`domain-dialog-close`}
            aria-label={`Close Domain Group Picker`}
          >
            <X size={19} aria-hidden={`true`} id={`domain-group-picker-close-icon`} className={`domain-dialog-close-icon`} />
          </button>
        </header>
        <p id={`domain-group-picker-description`} className={`domain-dialog-description`}>
          {picker.count === 1
            ? `Choose a group for this domain, or create a new one.`
            : `Choose a group for all ${picker.count} selected domains, or create a new one.`}
        </p>
        <div id={`domain-group-picker-selection`} className={`domain-group-picker-selection`}>
          <span id={`domain-group-picker-count`} className={`domain-group-picker-count`}>
            {`${picker.count} ${picker.count === 1 ? `domain` : `domains`} selected`}
          </span>
          <ul id={`domain-group-picker-domain-list`} className={`domain-group-picker-domain-list`}>
            {domains.map(domain => (
              <li key={domain.id} id={`domain-group-picker-domain-${domain.id}`} className={`domain-group-picker-domain`}>
                {domain.name}
              </li>
            ))}
          </ul>
        </div>
        <form noValidate id={`domain-group-picker-form`} className={`domain-group-picker-form`} onSubmit={picker.handleSubmit}>
          <div id={`domain-group-picker-fields`} className={`domain-group-picker-fields`}>
            <label id={`domain-group-picker-group-label`} htmlFor={`domain-group-picker-group`} className={`domain-editor-field`}>
              <span id={`domain-group-picker-group-text`} className={`domain-editor-label`}>
                {`Group`}
              </span>
              <select
                required
                data-autofocus={!picker.creatingGroup || undefined}
                value={picker.groupId}
                ref={picker.groupSelectRef}
                id={`domain-group-picker-group`}
                aria-invalid={Boolean(picker.error && !picker.creatingGroup)}
                className={`domain-editor-input domain-editor-select domain-group-picker-select`}
                onChange={event => picker.setGroupId(event.target.value)}
                aria-describedby={`domain-group-picker-group-help${picker.error ? ` domain-group-picker-error` : ``}`}
              >
                <option value={CREATE_GROUP_OPTION} id={`domain-group-picker-option-create`} className={`domain-group-picker-option`}>
                  {`Create new group…`}
                </option>
                {picker.customGroups.map(group => (
                  <option key={group.id} value={group.id} id={`domain-group-picker-option-${group.id}`} className={`domain-group-picker-option`}>
                    {group.name}
                  </option>
                ))}
                <option value={UNGROUPED_GROUP_OPTION} id={`domain-group-picker-option-ungrouped`} className={`domain-group-picker-option`}>
                  {`Ungrouped`}
                </option>
              </select>
            </label>
            <p id={`domain-group-picker-group-help`} className={`domain-group-picker-help`}>
              {picker.groupId === UNGROUPED_GROUP_OPTION
                ? `Ungrouped removes these domains from their current custom groups.`
                : `Applying a group moves these domains out of their current custom groups.`}
            </p>
            {picker.creatingGroup && (
              <label id={`domain-group-picker-name-label`} htmlFor={`domain-group-picker-name`} className={`domain-editor-field`}>
                <span id={`domain-group-picker-name-text`} className={`domain-editor-label`}>
                  {`New group name`}
                </span>
                <input
                  required
                  data-autofocus
                  maxLength={80}
                  value={picker.name}
                  autoComplete={`off`}
                  ref={picker.nameInputRef}
                  id={`domain-group-picker-name`}
                  placeholder={`e.g. Client sites`}
                  aria-invalid={Boolean(picker.error)}
                  className={`domain-editor-input domain-group-picker-name-input`}
                  onChange={event => picker.setName(event.target.value)}
                  aria-describedby={picker.error ? `domain-group-picker-error` : undefined}
                />
              </label>
            )}
            <label
              id={`domain-group-picker-scroll-label`}
              htmlFor={`domain-group-picker-scroll-input`}
              className={`domain-group-picker-scroll-label`}
            >
              <input
                type={`checkbox`}
                checked={picker.scrollToGroup}
                id={`domain-group-picker-scroll-input`}
                className={`domain-group-picker-scroll-checkbox`}
                onChange={event => picker.setScrollToGroup(event.currentTarget.checked)}
              />
              <span id={`domain-group-picker-scroll-text`} className={`domain-group-picker-scroll-text`}>
                {`Scroll to Group when Done`}
              </span>
            </label>
          </div>
          {picker.error && (
            <p role={`alert`} id={`domain-group-picker-error`} className={`domain-dialog-error`}>
              {picker.error}
            </p>
          )}
          <footer id={`domain-group-picker-footer`} className={`domain-dialog-footer domain-group-picker-footer`}>
            <div id={`domain-group-picker-actions`} className={`domain-dialog-actions`}>
              <button
                type={`button`}
                onClick={onClose}
                id={`domain-group-picker-cancel`}
                className={`portfolio-button portfolio-button-secondary`}
              >
                <X size={15} aria-hidden={`true`} id={`domain-group-picker-cancel-icon`} className={`portfolio-button-icon`} />
                <span id={`domain-group-picker-cancel-text`} className={`portfolio-button-text`}>
                  {`Cancel`}
                </span>
              </button>
              <button
                type={`submit`}
                id={`domain-group-picker-submit`}
                className={`portfolio-button portfolio-button-primary`}
              >
                {picker.creatingGroup
                  ? <Plus size={15} aria-hidden={`true`} id={`domain-group-picker-submit-icon`} className={`portfolio-button-icon`} />
                  : <Layers3 size={15} aria-hidden={`true`} id={`domain-group-picker-submit-icon`} className={`portfolio-button-icon`} />}
                <span id={`domain-group-picker-submit-text`} className={`portfolio-button-text`}>
                  {`${actionLabel}${picker.count > 1 ? ` (${picker.count})` : ``}`}
                </span>
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default DomainGroupPicker;
