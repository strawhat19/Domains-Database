import '../DomainEditor/styles.scss';
import './styles.scss';
import TagPicker from '../TagPicker/index.web';
import ModalTabs from '../ModalTabs/index.web';
import MobileSheetHandle from '../MobileSheet/index.web';
import StarButton from '../StarButton/index.web';
import ModalTitle from '../ModalTitle/index.web';
import DomainLinks from '../DomainLinks/index.web';
import CurrencyField from '../CurrencyField/index.web';
import SettingsField from '../SettingsField/index.web';
import DomainSiteIcon from '../DomainSiteIcon/index.web';
import { formatCurrency } from '../../shared/domainUtils';
import SegmentedControl from '../SegmentedControl/index.web';
import { getDomainPreviewLink } from '../../shared/domainLinks';
import DestinationChoices from '../DestinationChoices/index.web';
import { DOMAIN_PRICE_FIELDS } from '../../shared/domainPricing';
import { getLinkSiteIconUrl } from '../../shared/domainSiteIcon';
import ProjectSelect from '../DomainEditor/ProjectSelect/index.web';
import PortfolioSettingsActions from '../PortfolioSettingsActions/index.web';
import { DOMAIN_PROJECT_STATUSES, normalizeDomainProjectStatus } from '../../shared/domainProject';
import type { PortfolioGroup, CustomPortfolioGroup } from '../../shared/portfolioPreferences/types';
import { X, Eye, Link, Check, Folder, Trash2, Database, Settings2, AppWindow, FolderTree, FolderPlus } from 'lucide-react';
import {
  useDomainGroupSettings,
  CREATE_COLLECTION_OPTION,
  CONVERT_COLLECTION_OPTION,
  MAIN_DATABASE_COLLECTION_OPTION,
} from './useDomainGroupSettings';

interface DomainGroupSettingsProps {
  onClose: () => void;
  copyGroup?: PortfolioGroup;
  convertToCollection?: boolean;
  group: CustomPortfolioGroup;
}

const DomainGroupSettings = ({ group, onClose, copyGroup, convertToCollection = false }: DomainGroupSettingsProps) => {
  const settings = useDomainGroupSettings(group, onClose, convertToCollection);
  const tabsId = `domain-group-settings-sections-${group.id}`;
  const deleteId = `domain-group-settings-delete-${group.id}`;
  const previewLink = getDomainPreviewLink(settings.details);
  const hasCustomLogo = Boolean(settings.details.siteIconUrl?.trim());
  const SubmitIcon = settings.convertingToCollection ? FolderPlus : Check;
  const originalSiteIconUrl = getLinkSiteIconUrl(settings.details.productionLink ?? ``)
    || settings.details.previewLinks?.map(getLinkSiteIconUrl)?.find(Boolean) || ``;

  return (
    <div
      role={`presentation`}
      id={`domain-group-settings-backdrop`}
      {...settings.sheet.pressProps}
      style={settings.sheet.style}
      className={`domain-dialog-backdrop${settings.sheet.className}`}
      onClick={event => { if (settings.sheet.mobile && event.target === event.currentTarget) settings.close(); }}
      onMouseDown={event => { if (!settings.sheet.mobile && event.target === event.currentTarget) settings.close(); }}
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
        <MobileSheetHandle id={`domain-group-settings-${group.id}`} sheet={settings.sheet} />
        <header id={`domain-group-settings-header`} className={`domain-dialog-header domain-group-settings-header`}>
          <div id={`domain-group-settings-heading`} className={`domain-dialog-heading`}>
            <span id={`domain-group-settings-eyebrow`} className={`domain-dialog-eyebrow`}>
              {settings.details.isApp ? `APP SETTINGS` : `GROUP SETTINGS`}
            </span>
            <div id={`domain-group-settings-title-row-${group.id}`} className={`domain-group-settings-title-row`}>
              <ModalTitle
                maxLength={80}
                value={settings.name}
                onChange={settings.setName}
                id={`domain-group-settings-title`}
                disabled={settings.missingGroup}
                inputRef={settings.nameInputRef}
                form={`domain-group-settings-form`}
                placeholder={`e.g. Client sites`}
                invalid={settings.invalidField === `name`}
                focusRequest={settings.nameFocusRequest}
                label={settings.convertingToCollection ? `Collection Name` : settings.details.isApp ? `App Name` : `Group Name`}
                describedBy={`domain-group-settings-name-help${settings.error ? ` domain-group-settings-error` : ``}`}
              />
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
            <span hidden id={`domain-group-settings-name-help`}>
              {`Names must be unique across collections and groups, regardless of capitalization.`}
            </span>
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
              onClick={settings.close}
              id={`domain-group-settings-close`}
              aria-label={`Close Group Settings`}
              className={`domain-dialog-close domain-group-settings-close`}
            >
              <X size={19} aria-hidden={`true`} id={`domain-group-settings-close-icon`} className={`domain-dialog-close-icon`} />
            </button>
          </div>
        </header>
        <form noValidate id={`domain-group-settings-form`} className={`domain-dialog-form domain-group-settings-form`} onSubmit={settings.handleSubmit}>
          <ModalTabs
            id={tabsId}
            value={settings.activeTab}
            onChange={settings.setActiveTab}
            label={`Group Settings Sections`}
            disabled={settings.confirmingDelete || settings.missingGroup}
            options={[
              { id: `general`, label: `General`, Icon: Settings2 },
              { id: `project`, label: `Links & Project`, Icon: Link },
              { id: `organization`, label: `Organization`, Icon: FolderTree },
            ]}
          />
          <div id={`domain-group-settings-body`} className={`domain-dialog-body`}>
            <section
              tabIndex={0}
              hidden={settings.activeTab !== `general`}
              role={`tabpanel`}
              id={`${tabsId}-panel-general`}
              aria-labelledby={`${tabsId}-tab-general`}
              className={`domain-group-settings-fields domain-group-settings-pane`}
            >
              {settings.activeTab === `general` && (
                <>
                  <div id={`domain-group-settings-type-field-${group.id}`} className={`domain-editor-field`}>
                    <span id={`domain-group-settings-type-label-${group.id}`} className={`domain-editor-label`}>
                      {`Type`}
                    </span>
                    <SegmentedControl
                      disabled={settings.missingGroup}
                      value={settings.details.isApp ? `app` : `group`}
                      id={`domain-group-settings-type-${group.id}`}
                      className={`domain-group-settings-type-controls`}
                      onChange={value => settings.setDetail(`isApp`, value === `app`)}
                      labelledBy={`domain-group-settings-type-label-${group.id}`}
                      describedBy={`domain-group-settings-type-help-${group.id}`}
                      options={[
                        { value: `group`, label: `Group`, Icon: Folder },
                        { value: `app`, label: `App`, Icon: AppWindow },
                      ]}
                    />
                    <p id={`domain-group-settings-type-help-${group.id}`} className={`domain-group-settings-help`}>
                      {settings.details.isApp
                        ? `Apps have a distinct row color. Their domains hide statuses, previews, and descriptions.`
                        : `Groups show each domain’s status, preview, and description. You can switch between Group and App anytime.`}
                    </p>
                  </div>
                  <div id={`domain-group-settings-icon-field-${group.id}`} className={`domain-editor-field domain-editor-field-full`}>
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
                              fallback={settings.details.isApp ? `app` : `group`}
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
                                fallback={settings.details.isApp ? `app` : `group`}
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
                        invalid={settings.invalidField === field}
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
                  <div id={`domain-group-settings-description-field`} className={`domain-editor-field domain-editor-field-full`}>
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
                </>
              )}
            </section>
            <section
              tabIndex={0}
              hidden={settings.activeTab !== `project`}
              role={`tabpanel`}
              id={`${tabsId}-panel-project`}
              aria-labelledby={`${tabsId}-tab-project`}
              className={`domain-group-settings-pane domain-settings-links-pane`}
            >
              {settings.activeTab === `project` && (
                <>
                  <DomainLinks
                    input={settings.details}
                    onChange={settings.setDetail}
                    disabled={settings.missingGroup}
                    errorId={`domain-group-settings-error`}
                    invalidField={settings.invalidLinkField}
                    id={`domain-group-settings-links-${group.id}`}
                    topContent={
                      <div id={`domain-group-settings-status-field-${group.id}`} className={`domain-editor-field`}>
                        <label id={`domain-group-settings-status-${group.id}-label`} htmlFor={`domain-group-settings-status-${group.id}`} className={`domain-editor-label`}>
                          {`Status`}
                        </label>
                        <ProjectSelect
                          label={`Status`}
                          placeholder={`Future`}
                          field={`projectStatus`}
                          options={DOMAIN_PROJECT_STATUSES}
                          value={settings.details.projectStatus}
                          id={`domain-group-settings-status-${group.id}`}
                          onChange={value => settings.setDetail(`projectStatus`, normalizeDomainProjectStatus(value))}
                        />
                      </div>
                    }
                  >
                    <div id={`domain-group-settings-tags-field-${group.id}`} className={`domain-editor-field domain-group-settings-tags-field`}>
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
                    </div>
                  </DomainLinks>
                </>
              )}
            </section>
            <section
              tabIndex={0}
              hidden={settings.activeTab !== `organization`}
              role={`tabpanel`}
              id={`${tabsId}-panel-organization`}
              aria-labelledby={`${tabsId}-tab-organization`}
              className={`domain-group-settings-fields domain-group-settings-pane`}
            >
              {settings.activeTab === `organization` && (
                <>
                  <PortfolioSettingsActions
                    label={group.name}
                    hidden={settings.hidden}
                    disabled={settings.actionsDisabled}
                    onToggleVisibility={settings.toggleVisibility}
                    id={`domain-group-settings-row-actions-${group.id}`}
                    sections={{ collections: [], mainDomains: copyGroup?.domains ?? [], mainGroups: copyGroup ? [copyGroup] : [] }}
                  />
                  <div id={`domain-group-settings-collection-field`} className={`domain-editor-field domain-editor-field-full`}>
                    <span id={`domain-group-settings-collection-label`} className={`domain-editor-label`}>
                      {`Collection`}
                    </span>
                    <DestinationChoices
                      mosaic
                      initialRows={2}
                      value={settings.collectionId}
                      disabled={settings.missingGroup}
                      onChange={settings.setCollectionId}
                      id={`domain-group-settings-collection`}
                      choicesRef={settings.collectionChoicesRef}
                      labelId={`domain-group-settings-collection-label`}
                      invalid={settings.invalidField === `collection` || settings.missingCollection}
                      describedBy={`domain-group-settings-collection-help${settings.error ? ` domain-group-settings-error` : ``}`}
                      options={[
                        { icon: Database, label: `Database`, id: MAIN_DATABASE_COLLECTION_OPTION },
                        ...settings.collections.map(collection => ({ icon: Folder, id: collection.id, label: collection.name })),
                        ...(settings.missingCollection ? [{ icon: Folder, disabled: true, id: settings.collectionId, label: `Unavailable Collection` }] : []),
                        { icon: FolderPlus, id: CONVERT_COLLECTION_OPTION, label: `Convert To Collection` },
                        { icon: FolderPlus, id: CREATE_COLLECTION_OPTION, label: `New Collection` },
                      ]}
                    />
                    <p id={`domain-group-settings-collection-help`} className={`domain-group-settings-help`}>
                      {settings.convertingToCollection
                        ? `Creates a collection and keeps all domains in the uniquely named inner group “${settings.convertedGroupName}”.`
                        : `The group and its domains appear together in the selected collection.`}
                    </p>
                  </div>
                  {settings.creatingCollection && (
                    <fieldset id={`domain-group-settings-new-collection`} className={`domain-group-settings-new-collection domain-editor-field-full`}>
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
                          {`Names must be unique across collections and groups, regardless of capitalization.`}
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
                </>
              )}
            </section>
          </div>
          {settings.error && (
            <p role={`alert`} id={`domain-group-settings-error`} className={`domain-dialog-error`}>
              {settings.error}
            </p>
          )}
          {settings.canDelete && settings.confirmingDelete && (
            <div
              role={`group`}
              id={`${deleteId}-confirmation`}
              className={`domain-editor-delete-confirmation`}
              aria-labelledby={`${deleteId}-confirmation-title`}
              aria-describedby={`${deleteId}-confirmation-description`}
            >
              <div id={`${deleteId}-confirmation-copy`} className={`domain-editor-delete-confirmation-copy`}>
                <h3 id={`${deleteId}-confirmation-title`} className={`domain-editor-delete-confirmation-title`}>
                  {`Delete ${group.name}?`}
                </h3>
                <p id={`${deleteId}-confirmation-description`} className={`domain-editor-delete-confirmation-description`}>
                  {`This removes the group and keeps its domains in their current collection or the database.`}
                </p>
              </div>
              <div id={`${deleteId}-confirmation-actions`} className={`domain-editor-delete-confirmation-actions`}>
                <button
                  type={`button`}
                  onClick={settings.cancelDelete}
                  ref={settings.deleteCancelRef}
                  id={`${deleteId}-keep`}
                  disabled={settings.actionsDisabled}
                  className={`portfolio-button portfolio-button-secondary`}
                >
                  <X size={15} aria-hidden={`true`} id={`${deleteId}-keep-icon`} className={`portfolio-button-icon`} />
                  <span id={`${deleteId}-keep-text`} className={`portfolio-button-text`}>{`Keep Group`}</span>
                </button>
                <button
                  type={`button`}
                  onClick={settings.handleDelete}
                  id={`${deleteId}-confirm`}
                  disabled={settings.actionsDisabled}
                  className={`portfolio-button domain-group-settings-delete-button`}
                >
                  <Trash2 size={15} aria-hidden={`true`} id={`${deleteId}-confirm-icon`} className={`portfolio-button-icon`} />
                  <span id={`${deleteId}-confirm-text`} className={`portfolio-button-text`}>{`Delete Group`}</span>
                </button>
              </div>
            </div>
          )}
          <footer id={`domain-group-settings-footer`} className={`domain-dialog-footer domain-group-settings-footer`}>
            {settings.canDelete && (
              <div id={`${deleteId}-action`} className={`domain-editor-delete-action`}>
                <button
                  type={`button`}
                  onClick={settings.requestDelete}
                  ref={settings.deleteButtonRef}
                  id={`${deleteId}-button`}
                  disabled={settings.actionsDisabled}
                  aria-expanded={settings.confirmingDelete}
                  className={`portfolio-button domain-group-settings-delete-button`}
                  aria-controls={settings.confirmingDelete ? `${deleteId}-confirmation` : undefined}
                >
                  <Trash2 size={15} aria-hidden={`true`} id={`${deleteId}-icon`} className={`portfolio-button-icon`} />
                  <span id={`${deleteId}-text`} className={`portfolio-button-text`}>{`Delete Group`}</span>
                </button>
              </div>
            )}
            <div id={`domain-group-settings-actions`} className={`domain-dialog-actions`}>
              <button
                type={`button`}
                onClick={settings.close}
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
                disabled={settings.confirmingDelete || settings.actionsDisabled}
                className={`portfolio-button portfolio-button-primary`}
              >
                <SubmitIcon size={15} aria-hidden={`true`} id={`domain-group-settings-submit-icon`} className={`portfolio-button-icon`} />
                <span id={`domain-group-settings-submit-text`} className={`portfolio-button-text`}>
                  {settings.convertingToCollection ? `Convert To Collection` : `Save`}
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
