import './styles.scss';
import '../DomainEditor/styles.scss';
import { X, Check } from 'lucide-react';
import type { CustomPortfolioGroup } from '../../shared/portfolioPreferences/types';
import { CREATE_COLLECTION_OPTION, MAIN_DATABASE_COLLECTION_OPTION, useDomainGroupSettings } from './useDomainGroupSettings';

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
          {`Give your group a unique name, an optional description, and choose where to keep it.`}
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
            <div id={`domain-group-settings-collection-field`} className={`domain-editor-field`}>
              <label id={`domain-group-settings-collection-label`} htmlFor={`domain-group-settings-collection`} className={`domain-editor-label`}>
                {`Save to collection`}
              </label>
              <select
                value={settings.collectionId}
                ref={settings.collectionSelectRef}
                id={`domain-group-settings-collection`}
                aria-invalid={settings.invalidField === `collection` || settings.missingCollection}
                className={`domain-editor-input domain-editor-select domain-group-settings-collection-select`}
                onChange={event => settings.setCollectionId(event.target.value)}
                aria-describedby={`domain-group-settings-collection-help${settings.error ? ` domain-group-settings-error` : ``}`}
              >
                <option value={MAIN_DATABASE_COLLECTION_OPTION} id={`domain-group-settings-collection-main`} className={`domain-group-settings-collection-option`}>
                  {`Main Domains Database`}
                </option>
                {settings.collections.map(collection => (
                  <option
                    key={collection.id}
                    value={collection.id}
                    id={`domain-group-settings-collection-${collection.id}`}
                    className={`domain-group-settings-collection-option`}
                  >
                    {collection.name}
                  </option>
                ))}
                {settings.missingCollection && (
                  <option disabled value={settings.collectionId} id={`domain-group-settings-collection-unavailable`} className={`domain-group-settings-collection-option`}>
                    {`Unavailable Collection`}
                  </option>
                )}
                <option value={CREATE_COLLECTION_OPTION} id={`domain-group-settings-collection-create`} className={`domain-group-settings-collection-option`}>
                  {`Add New Collection…`}
                </option>
              </select>
              <p id={`domain-group-settings-collection-help`} className={`domain-group-settings-help`}>
                {`The group and its domains appear together in the selected collection.`}
              </p>
            </div>
            {settings.creatingCollection && (
              <fieldset id={`domain-group-settings-new-collection`} className={`domain-group-settings-new-collection`}>
                <legend id={`domain-group-settings-new-collection-title`} className={`domain-group-settings-collection-legend`}>
                  {`New collection`}
                </legend>
                <div id={`domain-group-settings-collection-name-field`} className={`domain-editor-field`}>
                  <label id={`domain-group-settings-collection-name-label`} htmlFor={`domain-group-settings-collection-name`} className={`domain-editor-label`}>
                    {`Collection title`}
                  </label>
                  <input
                    required
                    maxLength={80}
                    autoComplete={`off`}
                    value={settings.collectionName}
                    ref={settings.collectionNameInputRef}
                    id={`domain-group-settings-collection-name`}
                    placeholder={`e.g. Client portfolio`}
                    aria-invalid={settings.invalidField === `collectionName`}
                    className={`domain-editor-input domain-group-settings-collection-name-input`}
                    onChange={event => settings.setCollectionName(event.target.value)}
                    aria-describedby={`domain-group-settings-collection-name-help${settings.error ? ` domain-group-settings-error` : ``}`}
                  />
                  <p id={`domain-group-settings-collection-name-help`} className={`domain-group-settings-help`}>
                    {`Collection titles must be unique, regardless of capitalization.`}
                  </p>
                </div>
                <div id={`domain-group-settings-collection-description-field`} className={`domain-editor-field`}>
                  <label id={`domain-group-settings-collection-description-label`} htmlFor={`domain-group-settings-collection-description`} className={`domain-editor-label`}>
                    {`Collection description (optional)`}
                  </label>
                  <textarea
                    rows={3}
                    maxLength={280}
                    value={settings.collectionDescription}
                    ref={settings.collectionDescriptionInputRef}
                    id={`domain-group-settings-collection-description`}
                    placeholder={`A short note about this collection…`}
                    aria-invalid={settings.invalidField === `collectionDescription`}
                    className={`domain-editor-input domain-group-settings-description-input`}
                    onChange={event => settings.setCollectionDescription(event.target.value)}
                    aria-describedby={`domain-group-settings-collection-description-help${settings.error ? ` domain-group-settings-error` : ``}`}
                  />
                  <p id={`domain-group-settings-collection-description-help`} className={`domain-group-settings-help`}>
                    {`Up to 280 characters, shown next to the collection title.`}
                  </p>
                </div>
              </fieldset>
            )}
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
