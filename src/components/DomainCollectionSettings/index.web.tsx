import '../DomainEditor/styles.scss';
import './styles.scss';
import ModalTabs from '../ModalTabs/index.web';
import ModalTitle from '../ModalTitle/index.web';
import SettingsField from '../SettingsField/index.web';
import SegmentedControl from '../SegmentedControl/index.web';
import ProjectSelect from '../DomainEditor/ProjectSelect/index.web';
import { useDomainCollectionSettings } from './useDomainCollectionSettings';
import PortfolioSettingsActions from '../PortfolioSettingsActions/index.web';
import { X, Lock, Check, Globe, Share2, Settings2, ArrowDownAZ, GripVertical } from 'lucide-react';
import { DOMAIN_PROJECT_STATUSES, normalizeDomainProjectStatus } from '../../shared/domainProject';
import type { CustomPortfolioCollection, PortfolioCollectionSection } from '../../shared/portfolioPreferences/types';

interface DomainCollectionSettingsProps {
  onClose: () => void;
  editDescription?: boolean;
  copySection?: PortfolioCollectionSection;
  collection: CustomPortfolioCollection;
}

const DomainCollectionSettings = ({ collection, onClose, copySection, editDescription = false }: DomainCollectionSettingsProps) => {
  const tabsId = `domain-collection-settings-sections-${collection.id}`;
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
              {`COLLECTION SETTINGS`}
            </span>
            <ModalTitle
              maxLength={80}
              value={settings.name}
              label={`Collection Title`}
              onChange={settings.setName}
              inputRef={settings.nameInputRef}
              id={`domain-collection-settings-title`}
              form={`domain-collection-settings-form`}
              placeholder={`e.g. Client portfolio`}
              invalid={settings.invalidField === `name`}
              focusRequest={settings.nameFocusRequest}
              describedBy={`domain-collection-settings-name-help${settings.error ? ` domain-collection-settings-error` : ``}`}
            />
            <span hidden id={`domain-collection-settings-name-help`}>
              {`Names must be unique across collections and groups, regardless of capitalization.`}
            </span>
          </div>
          <div id={`domain-collection-settings-header-actions-${collection.id}`} className={`domain-collection-settings-header-actions`}>
            <button
              disabled
              type={`button`}
              draggable={false}
              id={`domain-collection-settings-share-${collection.id}`}
              className={`domain-collection-settings-share`}
              title={`Share ${collection.name} (Coming Soon)`}
              aria-label={`Share ${collection.name} (Coming Soon)`}
            >
              <Share2 size={17} aria-hidden={`true`} id={`domain-collection-settings-share-icon-${collection.id}`} className={`domain-collection-settings-share-icon`} />
            </button>
            <button
              type={`button`}
              onClick={onClose}
              id={`domain-collection-settings-close`}
              aria-label={`Close Collection Settings`}
              className={`domain-dialog-close domain-collection-settings-close`}
            >
              <X size={19} aria-hidden={`true`} id={`domain-collection-settings-close-icon`} className={`domain-dialog-close-icon`} />
            </button>
          </div>
        </header>
        <form noValidate id={`domain-collection-settings-form`} className={`domain-dialog-form domain-collection-settings-form`} onSubmit={settings.handleSubmit}>
          <ModalTabs
            id={tabsId}
            value={settings.activeTab}
            onChange={settings.setActiveTab}
            label={`Collection Settings Sections`}
            options={[
              { id: `general`, label: `General`, Icon: Settings2 },
              { id: `sharing`, label: `Sharing & Actions`, Icon: Share2 },
            ]}
          />
          <div id={`domain-collection-settings-body`} className={`domain-dialog-body`}>
            <section
              tabIndex={0}
              hidden={settings.activeTab !== `general`}
              role={`tabpanel`}
              id={`${tabsId}-panel-general`}
              aria-labelledby={`${tabsId}-tab-general`}
              className={`domain-collection-settings-fields domain-collection-settings-pane`}
            >
              {settings.activeTab === `general` && (
                <>
                  <div id={`domain-collection-settings-status-field-${collection.id}`} className={`domain-editor-field`}>
                    <label
                      className={`domain-editor-label`}
                      id={`domain-collection-settings-status-${collection.id}-label`}
                      htmlFor={`domain-collection-settings-status-${collection.id}`}
                    >
                      {`Status`}
                    </label>
                    <ProjectSelect
                      label={`Status`}
                      placeholder={`Future`}
                      field={`projectStatus`}
                      value={settings.projectStatus}
                      options={DOMAIN_PROJECT_STATUSES}
                      id={`domain-collection-settings-status-${collection.id}`}
                      onChange={value => settings.setProjectStatus(normalizeDomainProjectStatus(value))}
                    />
                  </div>
                  <div id={`domain-collection-settings-description-field`} className={`domain-editor-field domain-editor-field-full`}>
                    <label id={`domain-collection-settings-description-label`} htmlFor={`domain-collection-settings-description-input`} className={`domain-editor-label`}>
                      {`Description (optional)`}
                    </label>
                    <SettingsField
                      label={`Description`}
                      enabled={!editDescription}
                      value={settings.description}
                      emptyText={`Add a description`}
                      id={`domain-collection-settings-description-view`}
                      invalid={settings.invalidField === `description`}
                    >
                      <textarea
                        rows={3}
                        maxLength={280}
                        value={settings.description}
                        data-autofocus={editDescription || undefined}
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
                </>
              )}
            </section>
            <section
              tabIndex={0}
              hidden={settings.activeTab !== `sharing`}
              role={`tabpanel`}
              id={`${tabsId}-panel-sharing`}
              aria-labelledby={`${tabsId}-tab-sharing`}
              className={`domain-collection-settings-fields domain-collection-settings-pane`}
            >
              {settings.activeTab === `sharing` && (
                <>
                  <PortfolioSettingsActions
                    label={collection.name}
                    hidden={settings.hidden}
                    disabled={settings.actionsDisabled}
                    onToggleVisibility={settings.toggleRowVisibility}
                    id={`domain-collection-settings-row-actions-${collection.id}`}
                    sections={{ mainGroups: [], mainDomains: [], collections: copySection ? [copySection] : [] }}
                  />
                  <div id={`domain-collection-settings-visibility-field`} className={`domain-editor-field`}>
                    <span id={`domain-collection-settings-visibility-label`} className={`domain-editor-label`}>
                      {`Visibility`}
                    </span>
                    <SegmentedControl
                      value={settings.visibility}
                      id={`domain-collection-settings-visibility`}
                      labelledBy={`domain-collection-settings-visibility-label`}
                      describedBy={`domain-collection-settings-visibility-help`}
                      onChange={value => settings.setVisibility(value === `public` ? `public` : `private`)}
                      options={[
                        { value: `private`, label: `Private`, Icon: Lock },
                        { value: `public`, label: `Public / Published`, Icon: Globe },
                      ]}
                    />
                    <p id={`domain-collection-settings-visibility-help`} className={`domain-collection-settings-help`}>
                      {`Private keeps this collection unpublished. Public / Published marks it for public sharing.`}
                    </p>
                  </div>
                  <div id={`domain-collection-settings-order-field-${collection.id}`} className={`domain-editor-field`}>
                    <span
                      className={`domain-editor-label`}
                      id={`domain-collection-settings-order-label-${collection.id}`}
                    >
                      {`Sorting`}
                    </span>
                    <SegmentedControl
                      value={settings.manualOrder ? `manual` : `alphabetical`}
                      id={`domain-collection-settings-order-toggle-${collection.id}`}
                      labelledBy={`domain-collection-settings-order-label-${collection.id}`}
                      describedBy={`domain-collection-settings-order-help-${collection.id}`}
                      onChange={value => { if ((value === `manual`) !== settings.manualOrder) settings.toggleManualOrder(); }}
                      options={[
                        { value: `manual`, label: `Manual`, Icon: GripVertical },
                        { value: `alphabetical`, label: collection.sortField && collection.sortField !== `name` ? `Sorted` : `Alphabetical`, Icon: ArrowDownAZ },
                      ]}
                    />
                    <p id={`domain-collection-settings-order-help-${collection.id}`} className={`domain-collection-settings-help`}>
                      {settings.manualOrder
                        ? `Manual ordering is selected. Drag rows to arrange domains after saving.`
                        : `Sorting is selected. Switch to Manual to arrange domains by dragging rows.`}
                    </p>
                  </div>
                </>
              )}
            </section>
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
                  {`Save`}
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
