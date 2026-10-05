import './styles.scss';
import '../DomainEditor/styles.scss';
import { X, Check } from 'lucide-react';
import { useDomainGroupSettings } from './useDomainGroupSettings';
import type { CustomPortfolioGroup } from '../../shared/portfolioPreferences/types';

interface DomainGroupSettingsProps {
  onClose: () => void;
  group: CustomPortfolioGroup;
}

const DomainGroupSettings = ({ group, onClose }: DomainGroupSettingsProps) => {
  const settings = useDomainGroupSettings(group, onClose);

  return (
    <div
      role={`presentation`}
      id={`domain-group-settings-backdrop`}
      className={`domain-dialog-backdrop`}
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        tabIndex={-1}
        role={`dialog`}
        aria-modal={`true`}
        ref={settings.modalRef}
        id={`domain-group-settings-dialog`}
        aria-labelledby={`domain-group-settings-title`}
        className={`domain-dialog domain-group-settings`}
        aria-describedby={`domain-group-settings-description`}
      >
        <header id={`domain-group-settings-header`} className={`domain-dialog-header`}>
          <div id={`domain-group-settings-heading`} className={`domain-dialog-heading`}>
            <span id={`domain-group-settings-eyebrow`} className={`domain-dialog-eyebrow`}>
              {`YOUR PORTFOLIO`}
            </span>
            <h2 id={`domain-group-settings-title`} className={`domain-dialog-title`}>
              {`Edit group`}
            </h2>
          </div>
          <button
            type={`button`}
            onClick={onClose}
            id={`domain-group-settings-close`}
            aria-label={`Close Group Settings`}
            className={`domain-dialog-close domain-group-settings-close`}
          >
            <X size={19} aria-hidden={`true`} id={`domain-group-settings-close-icon`} className={`domain-dialog-close-icon`} />
          </button>
        </header>
        <p id={`domain-group-settings-description`} className={`domain-dialog-description`}>
          {`Give your group a unique name and an optional description.`}
        </p>
        <form noValidate id={`domain-group-settings-form`} className={`domain-group-settings-form`} onSubmit={settings.handleSubmit}>
          <div id={`domain-group-settings-fields`} className={`domain-group-settings-fields`}>
            <div id={`domain-group-settings-name-field`} className={`domain-editor-field`}>
              <label id={`domain-group-settings-name-label`} htmlFor={`domain-group-settings-name`} className={`domain-editor-label`}>
                {`Group name`}
              </label>
              <input
                required
                data-autofocus
                maxLength={80}
                value={settings.name}
                autoComplete={`off`}
                ref={settings.nameInputRef}
                id={`domain-group-settings-name`}
                placeholder={`e.g. Client sites`}
                aria-invalid={settings.invalidField === `name`}
                className={`domain-editor-input domain-group-settings-name-input`}
                onChange={event => settings.setName(event.target.value)}
                aria-describedby={`domain-group-settings-name-help${settings.error ? ` domain-group-settings-error` : ``}`}
              />
              <p id={`domain-group-settings-name-help`} className={`domain-group-settings-help`}>
                {`Names must be unique, regardless of capitalization.`}
              </p>
            </div>
            <div id={`domain-group-settings-description-field`} className={`domain-editor-field`}>
              <label id={`domain-group-settings-description-label`} htmlFor={`domain-group-settings-description-input`} className={`domain-editor-label`}>
                {`Description (optional)`}
              </label>
              <textarea
                rows={3}
                maxLength={280}
                value={settings.description}
                ref={settings.descriptionInputRef}
                id={`domain-group-settings-description-input`}
                placeholder={`A short note about this group…`}
                aria-invalid={settings.invalidField === `description`}
                className={`domain-editor-input domain-group-settings-description-input`}
                onChange={event => settings.setDescription(event.target.value)}
                aria-describedby={`domain-group-settings-description-help${settings.error ? ` domain-group-settings-error` : ``}`}
              />
              <p id={`domain-group-settings-description-help`} className={`domain-group-settings-help`}>
                {`Up to 280 characters, shown next to the group title.`}
              </p>
            </div>
          </div>
          {settings.error && (
            <p role={`alert`} id={`domain-group-settings-error`} className={`domain-dialog-error`}>
              {settings.error}
            </p>
          )}
          <footer id={`domain-group-settings-footer`} className={`domain-dialog-footer domain-group-settings-footer`}>
            <div id={`domain-group-settings-actions`} className={`domain-dialog-actions`}>
              <button
                type={`button`}
                onClick={onClose}
                id={`domain-group-settings-cancel`}
                className={`portfolio-button portfolio-button-secondary`}
              >
                <X size={15} aria-hidden={`true`} id={`domain-group-settings-cancel-icon`} className={`portfolio-button-icon`} />
                <span id={`domain-group-settings-cancel-text`} className={`portfolio-button-text`}>
                  {`Cancel`}
                </span>
              </button>
              <button
                type={`submit`}
                id={`domain-group-settings-submit`}
                className={`portfolio-button portfolio-button-primary`}
              >
                <Check size={15} aria-hidden={`true`} id={`domain-group-settings-submit-icon`} className={`portfolio-button-icon`} />
                <span id={`domain-group-settings-submit-text`} className={`portfolio-button-text`}>
                  {`Save Changes`}
                </span>
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default DomainGroupSettings;
