import './styles.scss';
import '../DomainEditor/styles.scss';
import { X, Eye, Check, Folder, AppWindow, FolderPlus } from 'lucide-react';
import StarButton from '../StarButton/index.web';
import TagPicker from '../TagPicker/index.web';
import DomainLinks from '../DomainLinks/index.web';
import CurrencyField from '../CurrencyField/index.web';
import SettingsField from '../SettingsField/index.web';
import ProjectSelect from '../DomainEditor/ProjectSelect/index.web';
import DomainSiteIcon from '../DomainSiteIcon/index.web';
import DomainProjectBadge from '../DomainProjectBadge/index.web';
import { getDomainPreviewLink } from '../../shared/domainLinks';
import { formatCurrency } from '../../shared/domainUtils';
import { DOMAIN_PRICE_FIELDS } from '../../shared/domainPricing';
import { getLinkSiteIconUrl } from '../../shared/domainSiteIcon';
import { DOMAIN_PROJECT_STATUSES, normalizeDomainProjectStatus } from '../../shared/domainProject';
import type { CustomPortfolioGroup } from '../../shared/portfolioPreferences/types';
import {
  useDomainGroupSettings,
  CREATE_COLLECTION_OPTION,
  CONVERT_COLLECTION_OPTION,
  MAIN_DATABASE_COLLECTION_OPTION,
} from './useDomainGroupSettings';

interface DomainGroupSettingsProps {
  onClose: () => void;
  group: CustomPortfolioGroup;
}

const DomainGroupSettings = ({ group, onClose }: DomainGroupSettingsProps) => {
  const settings = useDomainGroupSettings(group, onClose);
  const previewLink = getDomainPreviewLink(settings.details);
  const hasCustomLogo = Boolean(settings.details.siteIconUrl?.trim());
  const SubmitIcon = settings.convertingToCollection ? FolderPlus : Check;
  const originalSiteIconUrl = getLinkSiteIconUrl(settings.details.productionLink ?? ``)
    || settings.details.previewLinks?.map(getLinkSiteIconUrl)?.find(Boolean) || ``;
  const collectionLabel = settings.collectionId === MAIN_DATABASE_COLLECTION_OPTION
    ? `Database`
    : settings.convertingToCollection ? `Convert To Collection…`
      : settings.creatingCollection ? `Add New Collection…`
        : settings.collections.find(collection => collection.id === settings.collectionId)?.name ?? `Unavailable Collection`;

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
      >
        <header id={`domain-group-settings-header`} className={`domain-dialog-header domain-group-settings-header`}>
          <div id={`domain-group-settings-heading`} className={`domain-dialog-heading`}>
            <span id={`domain-group-settings-eyebrow`} className={`domain-dialog-eyebrow`}>
              {settings.details.isApp ? `APP SETTINGS` : `GROUP SETTINGS`}
            </span>
            <div id={`domain-group-settings-title-row-${group.id}`} className={`domain-group-settings-title-row`}>
              <h2 id={`domain-group-settings-title`} className={`domain-dialog-title`}>
                {group.name}
              </h2>
              {previewLink && (
                <a
                  target={`_blank`}
                  href={previewLink}
                  rel={`noopener noreferrer`}
                  title={`Preview ${group.name}`}
                  id={`domain-group-settings-preview-${group.id}`}
                  className={`domain-group-settings-preview-link`}
                  aria-label={`Open Preview For ${group.name} In A New Tab`}
                >
                  <Eye size={17} aria-hidden={`true`} id={`domain-group-settings-preview-icon-${group.id}`} className={`domain-group-settings-preview-icon`} />
                </a>
              )}
            </div>
          </div>
          <div id={`domain-group-settings-header-actions-${group.id}`} className={`domain-group-settings-header-actions`}>
            <StarButton
              size={34}
              starred={settings.starred}
              onPress={settings.toggleStar}
              disabled={settings.missingGroup}
              id={`domain-group-settings-star-${group.id}`}
              label={`${settings.starred ? `Unstar` : `Star`} ${group.name}`}
            />
            <button
              type={`button`}
              onClick={onClose}
              id={`domain-group-settings-close`}
              aria-label={`Close Group Settings`}
              className={`domain-dialog-close domain-group-settings-close`}
            >
              <X size={19} aria-hidden={`true`} id={`domain-group-settings-close-icon`} className={`domain-dialog-close-icon`} />
            </button>
          </div>
        </header>
        <form noValidate id={`domain-group-settings-form`} className={`domain-group-settings-form`} onSubmit={settings.handleSubmit}>
          <div id={`domain-group-settings-content`} className={`domain-group-settings-content`}>
            <div id={`domain-group-settings-fields`} className={`domain-group-settings-fields`}>
              <div id={`domain-group-settings-type-field-${group.id}`} className={`domain-editor-field`}>
                <span id={`domain-group-settings-type-label-${group.id}`} className={`domain-editor-label`}>
                  {`Type`}
                </span>
                <div
                  role={`group`}
                  id={`domain-group-settings-type-${group.id}`}
                  className={`domain-group-settings-type-controls`}
                  aria-labelledby={`domain-group-settings-type-label-${group.id}`}
                  aria-describedby={`domain-group-settings-type-help-${group.id}`}
                >
                  {[{ isApp: false, label: `Group`, Icon: Folder }, { isApp: true, label: `App`, Icon: AppWindow }].map(option => (
                    <button
                      type={`button`}
                      key={option.label}
                      disabled={settings.missingGroup}
                      aria-pressed={settings.details.isApp === option.isApp}
                      id={`domain-group-settings-type-${option.label.toLowerCase()}-${group.id}`}
                      onClick={() => settings.setDetail(`isApp`, option.isApp)}
                      className={`domain-group-settings-type-button${settings.details.isApp === option.isApp ? ` domain-group-settings-type-button-active` : ``}`}
                    >
                      <option.Icon size={15} aria-hidden={`true`} id={`domain-group-settings-type-${option.label.toLowerCase()}-icon-${group.id}`} className={`domain-group-settings-type-icon`} />
                      <span id={`domain-group-settings-type-${option.label.toLowerCase()}-text-${group.id}`} className={`domain-group-settings-type-text`}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
                <p id={`domain-group-settings-type-help-${group.id}`} className={`domain-group-settings-help`}>
                  {settings.details.isApp
                    ? `Apps have a distinct row color. Their domains hide statuses, previews, and descriptions.`
                    : `Groups show each domain’s status, preview, and description. You can switch between Group and App anytime.`}
                </p>
              </div>
              <div id={`domain-group-settings-icon-field-${group.id}`} className={`domain-editor-field`}>
                <label id={`domain-group-settings-icon-label-${group.id}`} htmlFor={`domain-group-settings-icon-input-${group.id}`} className={`domain-editor-label`}>
                  {`Logo or icon URL`}
                </label>
                <div id={`domain-group-settings-icon-row-${group.id}`} className={`domain-editor-icon-row`}>
                  <div id={`domain-group-settings-icon-previews-${group.id}`} className={`domain-editor-icon-previews`}>
                    <div id={`domain-group-settings-icon-preview-item-${group.id}`} className={`domain-editor-icon-preview-item`}>
                      <div
                        role={`img`}
                        aria-label={hasCustomLogo ? `Custom Logo Preview` : `Group Logo Or Icon Preview`}
                        id={`domain-group-settings-icon-preview-${group.id}`}
                        className={`domain-editor-icon-preview domain-group-settings-icon-preview`}
                      >
                        <DomainSiteIcon
                          compact
                          size={40}
                          domain={``}
                          iconUrl={settings.details.siteIconUrl}
                          id={`domain-group-settings-icon-${group.id}`}
                        />
                      </div>
                      {hasCustomLogo && (
                        <span id={`domain-group-settings-custom-icon-label-${group.id}`} className={`domain-editor-icon-preview-label`}>
                          {`Custom logo`}
                        </span>
                      )}
                    </div>
                    {hasCustomLogo && (
                      <div id={`domain-group-settings-original-icon-preview-item-${group.id}`} className={`domain-editor-icon-preview-item`}>
                        <div
                          role={`img`}
                          aria-label={`Original Site Icon Preview`}
                          id={`domain-group-settings-original-icon-preview-${group.id}`}
                          className={`domain-editor-icon-preview domain-group-settings-icon-preview`}
                        >
                          <DomainSiteIcon
                            compact
                            size={40}
                            domain={``}
                            iconUrl={originalSiteIconUrl}
                            id={`domain-group-settings-original-icon-${group.id}`}
                          />
                        </div>
                        <span id={`domain-group-settings-original-icon-label-${group.id}`} className={`domain-editor-icon-preview-label`}>
                          {`Original site icon`}
                        </span>
                      </div>
                    )}
                  </div>
                  <div id={`domain-group-settings-icon-copy-${group.id}`} className={`domain-editor-icon-copy`}>
                    <SettingsField
                      label={`Logo Or Icon URL`}
                      emptyText={`Add a public image URL`}
                      value={settings.details.siteIconUrl}
                      invalid={settings.invalidField === `siteIconUrl`}
                      id={`domain-group-settings-icon-setting-${group.id}`}
                    >
                      <input
                        type={`url`}
                        maxLength={2048}
                        inputMode={`url`}
                        autoComplete={`off`}
                        spellCheck={false}
                        ref={settings.siteIconInputRef}
                        value={settings.details.siteIconUrl ?? ``}
                        id={`domain-group-settings-icon-input-${group.id}`}
                        placeholder={`https://example.com/logo.png`}
                        aria-invalid={settings.invalidField === `siteIconUrl`}
                        className={`domain-editor-input domain-group-settings-icon-input`}
                        onChange={event => settings.setDetail(`siteIconUrl`, event.target.value)}
                        aria-describedby={`domain-group-settings-icon-help-${group.id}${settings.error ? ` domain-group-settings-error` : ``}`}
                      />
                    </SettingsField>
                    <p id={`domain-group-settings-icon-help-${group.id}`} className={`domain-group-settings-help`}>
                      {`Use a public image URL for the group or app logo. Leave blank to use the default icon.`}
                    </p>
                  </div>
                </div>
              </div>
              <div id={`domain-group-settings-name-field`} className={`domain-editor-field`}>
                <label id={`domain-group-settings-name-label`} htmlFor={`domain-group-settings-name`} className={`domain-editor-label`}>
                  {`Group name`}
                </label>
                <SettingsField
                  label={`Group name`}
                  value={settings.name}
                  emptyText={`Add a group name`}
                  id={`domain-group-settings-name-view`}
                  invalid={settings.invalidField === `name`}
                >
                  <input
                    required
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
                </SettingsField>
                <p id={`domain-group-settings-name-help`} className={`domain-group-settings-help`}>
                  {`Names must be unique, regardless of capitalization.`}
                </p>
              </div>
              <div id={`domain-group-settings-tags-field-${group.id}`} className={`domain-editor-field`}>
                <label
                  className={`domain-editor-label`}
                  id={`domain-group-settings-tags-${group.id}-label`}
                  htmlFor={`domain-group-settings-tags-${group.id}`}
                >
                  {`Tags`}
                </label>
                <TagPicker
                  label={`Tags`}
                  value={settings.details.tags}
                  disabled={settings.missingGroup}
                  id={`domain-group-settings-tags-${group.id}`}
                  onChange={tags => settings.setDetail(`tags`, tags)}
                />
                <p id={`domain-group-settings-tags-help-${group.id}`} className={`domain-group-settings-help`}>
                  {`Choose multiple tags. Select a tag again to remove it.`}
                </p>
              </div>
              <div id={`domain-group-settings-status-field-${group.id}`} className={`domain-editor-field`}>
                <label id={`domain-group-settings-status-${group.id}-label`} htmlFor={`domain-group-settings-status-${group.id}`} className={`domain-editor-label`}>
                  {`Status`}
                </label>
                <SettingsField
                  label={`Status`}
                  id={`domain-group-settings-status-setting-${group.id}`}
                  value={<DomainProjectBadge field={`projectStatus`} value={settings.details.projectStatus} id={`domain-group-settings-status-badge-${group.id}`} />}
                >
                  <ProjectSelect
                    label={`Status`}
                    placeholder={`Future`}
                    field={`projectStatus`}
                    options={DOMAIN_PROJECT_STATUSES}
                    value={settings.details.projectStatus}
                    id={`domain-group-settings-status-${group.id}`}
                    onChange={value => settings.setDetail(`projectStatus`, normalizeDomainProjectStatus(value))}
                  />
                </SettingsField>
              </div>
              {DOMAIN_PRICE_FIELDS.map(({ field, label }) => (
                <div key={field} id={`domain-group-settings-${field}-field-${group.id}`} className={`domain-editor-field`}>
                  <label
                    className={`domain-editor-label`}
                    id={`domain-group-settings-${field}-label-${group.id}`}
                    htmlFor={`domain-group-settings-${field}-input-${group.id}`}
                  >
                    {label}
                  </label>
                  <SettingsField
                    label={label}
                    disabled={settings.missingGroup}
                    id={`domain-group-settings-${field}-setting-${group.id}`}
                    value={settings.details[field] === undefined ? undefined : formatCurrency(settings.details[field])}
                  >
                    <CurrencyField
                      label={label}
                      value={settings.details[field]}
                      disabled={settings.missingGroup}
                      id={`domain-group-settings-${field}-input-${group.id}`}
                      onChange={value => settings.setDetail(field, value)}
                    />
                  </SettingsField>
                </div>
              ))}
              <div id={`domain-group-settings-collection-field`} className={`domain-editor-field`}>
                <label id={`domain-group-settings-collection-label`} htmlFor={`domain-group-settings-collection`} className={`domain-editor-label`}>
                  {`Save to collection`}
                </label>
                <SettingsField
                  value={collectionLabel}
                  label={`Save to collection`}
                  id={`domain-group-settings-collection-view`}
                  invalid={settings.invalidField === `collection`}
                >
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
                      {`Database`}
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
                    <option value={CONVERT_COLLECTION_OPTION} id={`domain-group-settings-collection-convert`} className={`domain-group-settings-collection-option`}>
                      {`Convert To Collection…`}
                    </option>
                    <option value={CREATE_COLLECTION_OPTION} id={`domain-group-settings-collection-create`} className={`domain-group-settings-collection-option`}>
                      {`Add New Collection…`}
                    </option>
                  </select>
                </SettingsField>
                <p id={`domain-group-settings-collection-help`} className={`domain-group-settings-help`}>
                  {settings.convertingToCollection
                    ? `Creates a collection with an inner group using this group’s name. All domains stay in the inner group.`
                    : `The group and its domains appear together in the selected collection.`}
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
              <div id={`domain-group-settings-description-field`} className={`domain-editor-field`}>
                <label id={`domain-group-settings-description-label`} htmlFor={`domain-group-settings-description-input`} className={`domain-editor-label`}>
                  {`Description (optional)`}
                </label>
                <SettingsField
                  label={`Description`}
                  value={settings.description}
                  emptyText={`Add a description`}
                  id={`domain-group-settings-description-view`}
                  invalid={settings.invalidField === `description`}
                >
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
                </SettingsField>
                <p id={`domain-group-settings-description-help`} className={`domain-group-settings-help`}>
                  {`Up to 280 characters, shown next to the group title.`}
                </p>
              </div>
            </div>
            <DomainLinks
              input={settings.details}
              onChange={settings.setDetail}
              disabled={settings.missingGroup}
              errorId={`domain-group-settings-error`}
              invalidField={settings.invalidLinkField}
              id={`domain-group-settings-links-${group.id}`}
            />
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
                <SubmitIcon size={15} aria-hidden={`true`} id={`domain-group-settings-submit-icon`} className={`portfolio-button-icon`} />
                <span id={`domain-group-settings-submit-text`} className={`portfolio-button-text`}>
                  {settings.convertingToCollection ? `Convert To Collection` : `Save Changes`}
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
