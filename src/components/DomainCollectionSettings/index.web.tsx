import './styles.scss';
import '../DomainEditor/styles.scss';
import { X, Check } from 'lucide-react';
import SettingsField from '../SettingsField/index.web';
import { useDomainCollectionSettings } from './useDomainCollectionSettings';
import type { CustomPortfolioCollection } from '../../shared/portfolioPreferences/types';

interface DomainCollectionSettingsProps {
  onClose: () => void;
  collection: CustomPortfolioCollection;
}

const DomainCollectionSettings = ({ collection, onClose }: DomainCollectionSettingsProps) => {
  const settings = useDomainCollectionSettings(collection, onClose);

  return (
    <div
      role={`presentation`}
      id={`domain-collection-settings-backdrop`}
      className={`domain-dialog-backdrop`}
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        tabIndex={-1}
        role={`dialog`}
        aria-modal={`true`}
        ref={settings.modalRef}
        id={`domain-collection-settings-dialog`}
        className={`domain-dialog domain-collection-settings`}
        aria-labelledby={`domain-collection-settings-title`}
      >
        <header id={`domain-collection-settings-header`} className={`domain-dialog-header`}>
          <div id={`domain-collection-settings-heading`} className={`domain-dialog-heading`}>
            <span id={`domain-collection-settings-eyebrow`} className={`domain-dialog-eyebrow`}>
              {`SETTINGS`}
            </span>
            <h2 id={`domain-collection-settings-title`} className={`domain-dialog-title`}>
              {collection.name}
            </h2>
          </div>
          <button
            type={`button`}
            onClick={onClose}
            id={`domain-collection-settings-close`}
            aria-label={`Close Collection Settings`}
            className={`domain-dialog-close domain-collection-settings-close`}
          >
            <X size={19} aria-hidden={`true`} id={`domain-collection-settings-close-icon`} className={`domain-dialog-close-icon`} />
          </button>
        </header>
        <form noValidate id={`domain-collection-settings-form`} className={`domain-collection-settings-form`} onSubmit={settings.handleSubmit}>
          <div id={`domain-collection-settings-fields`} className={`domain-collection-settings-fields`}>
            <div id={`domain-collection-settings-name-field`} className={`domain-editor-field`}>
              <label id={`domain-collection-settings-name-label`} htmlFor={`domain-collection-settings-name`} className={`domain-editor-label`}>
                {`Collection title`}
              </label>
              <SettingsField
                value={settings.name}
                label={`Collection title`}
                emptyText={`Add a collection title`}
                id={`domain-collection-settings-name-view`}
                invalid={settings.invalidField === `name`}
              >
                <input
                  required
                  maxLength={80}
                  value={settings.name}
                  autoComplete={`off`}
                  ref={settings.nameInputRef}
                  id={`domain-collection-settings-name`}
                  placeholder={`e.g. Client portfolio`}
                  aria-invalid={settings.invalidField === `name`}
                  className={`domain-editor-input domain-collection-settings-name-input`}
                  onChange={event => settings.setName(event.target.value)}
                  aria-describedby={`domain-collection-settings-name-help${settings.error ? ` domain-collection-settings-error` : ``}`}
                />
              </SettingsField>
              <p id={`domain-collection-settings-name-help`} className={`domain-collection-settings-help`}>
                {`Collection titles must be unique, regardless of capitalization.`}
              </p>
            </div>
            <div id={`domain-collection-settings-visibility-field`} className={`domain-editor-field`}>
              <label id={`domain-collection-settings-visibility-label`} htmlFor={`domain-collection-settings-visibility`} className={`domain-editor-label`}>
                {`Visibility`}
              </label>
              <SettingsField
                label={`Visibility`}
                id={`domain-collection-settings-visibility-view`}
                value={settings.visibility === `public` ? `Public / Published` : `Private`}
              >
                <select
                  value={settings.visibility}
                  id={`domain-collection-settings-visibility`}
                  className={`domain-editor-input domain-collection-settings-visibility-input`}
                  aria-describedby={`domain-collection-settings-visibility-help`}
                  onChange={event => settings.setVisibility(event.target.value === `public` ? `public` : `private`)}
                >
                  <option id={`domain-collection-settings-visibility-private`} value={`private`}>{`Private`}</option>
                  <option id={`domain-collection-settings-visibility-public`} value={`public`}>{`Public / Published`}</option>
                </select>
              </SettingsField>
              <p id={`domain-collection-settings-visibility-help`} className={`domain-collection-settings-help`}>
                {`Private keeps this collection unpublished. Public / Published marks it for public sharing.`}
              </p>
            </div>
            <div id={`domain-collection-settings-description-field`} className={`domain-editor-field`}>
              <label id={`domain-collection-settings-description-label`} htmlFor={`domain-collection-settings-description-input`} className={`domain-editor-label`}>
                {`Description (optional)`}
              </label>
              <SettingsField
                label={`Description`}
                value={settings.description}
                emptyText={`Add a description`}
                id={`domain-collection-settings-description-view`}
                invalid={settings.invalidField === `description`}
              >
                <textarea
                  rows={3}
                  maxLength={280}
                  value={settings.description}
                  ref={settings.descriptionInputRef}
                  id={`domain-collection-settings-description-input`}
                  placeholder={`A short note about this collection…`}
                  aria-invalid={settings.invalidField === `description`}
                  className={`domain-editor-input domain-collection-settings-description-input`}
                  onChange={event => settings.setDescription(event.target.value)}
                  aria-describedby={`domain-collection-settings-description-help${settings.error ? ` domain-collection-settings-error` : ``}`}
                />
              </SettingsField>
              <p id={`domain-collection-settings-description-help`} className={`domain-collection-settings-help`}>
                {`Up to 280 characters, shown next to the collection title.`}
              </p>
            </div>
          </div>
          {settings.error && (
            <p role={`alert`} id={`domain-collection-settings-error`} className={`domain-dialog-error`}>
              {settings.error}
            </p>
          )}
          <footer id={`domain-collection-settings-footer`} className={`domain-dialog-footer domain-collection-settings-footer`}>
            <div id={`domain-collection-settings-actions`} className={`domain-dialog-actions`}>
              <button
                type={`button`}
                onClick={onClose}
                id={`domain-collection-settings-cancel`}
                className={`portfolio-button portfolio-button-secondary`}
              >
                <X size={15} aria-hidden={`true`} id={`domain-collection-settings-cancel-icon`} className={`portfolio-button-icon`} />
                <span id={`domain-collection-settings-cancel-text`} className={`portfolio-button-text`}>
                  {`Cancel`}
                </span>
              </button>
              <button
                type={`submit`}
                id={`domain-collection-settings-submit`}
                className={`portfolio-button portfolio-button-primary`}
              >
                <Check size={15} aria-hidden={`true`} id={`domain-collection-settings-submit-icon`} className={`portfolio-button-icon`} />
                <span id={`domain-collection-settings-submit-text`} className={`portfolio-button-text`}>
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

export default DomainCollectionSettings;
