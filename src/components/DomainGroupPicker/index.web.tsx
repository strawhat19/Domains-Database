import './styles.scss';
import MobileSheetHandle from '../MobileSheet/index.web';
import '../DomainEditor/styles.scss';
import type { DomainRecord } from '../../shared/types';
import DestinationChoices from '../DestinationChoices/index.web';
import BooleanSetting from '../SegmentedControl/BooleanSetting.web';
import PortfolioDestinationTree from '../PortfolioDestinationTree/index.web';
import { UNGROUPED_GROUP_LABEL } from '../../shared/portfolioPreferences/names';
import { X, List, Plus, Folder, Database, FolderPlus, ChevronRight } from 'lucide-react';
import { CREATE_GROUP_OPTION, CREATE_COLLECTION_OPTION, UNGROUPED_GROUP_OPTION, useDomainGroupPicker, MAIN_DATABASE_COLLECTION_OPTION } from './useDomainGroupPicker';

interface DomainGroupPickerProps {
  embedded?: boolean;
  disabled?: boolean;
  onClose: () => void;
  domains: DomainRecord[];
  onGrouped?: () => void;
}

const DomainGroupPicker = ({ domains, onClose, onGrouped, embedded = false, disabled = false }: DomainGroupPickerProps) => {
  const picker = useDomainGroupPicker(domains, onClose, onGrouped, { embedded, disabled });
  const selectedBranch = picker.destinationBranches.find(branch => picker.selectingCollection
    ? branch.id === picker.collectionId : branch.groups.some(group => group.id === picker.groupId));
  const selectedGroup = !picker.selectingCollection ? selectedBranch?.groups.find(group => group.id === picker.groupId) : undefined;
  const collectionChoices = [
    { icon: Database, label: `Database`, count: picker.mainCollectionCount, id: MAIN_DATABASE_COLLECTION_OPTION },
    ...picker.collections.map(collection => ({
      icon: Folder,
      id: collection.id,
      label: collection.name,
      count: collection.count,
    })),
    { icon: FolderPlus, label: `New Collection`, id: CREATE_COLLECTION_OPTION },
  ];
  const actionLabel = picker.creatingNewCollection ? `Create & Move` : `Create & Group`;

  const formContent = (
    <>
      <div id={`domain-group-picker-body`} className={`domain-dialog-body`}>
        <p id={`domain-group-picker-description`} className={`domain-dialog-description`}>
          {picker.count === 1
            ? `Click a collection or group to move this domain, or create a new destination.`
            : `Click a collection or group to move all ${picker.count} selected domains, or create a new destination.`}
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
        <div
          id={`domain-group-picker-fields`}
          className={`domain-group-picker-fields${picker.creatingGroup || picker.creatingNewCollection ? ` domain-group-picker-fields-creating` : ``}`}
        >
          <div id={`domain-group-picker-group-field`} className={`domain-editor-field domain-group-picker-group-field`}>
            <span id={`domain-group-picker-group-text`} className={`domain-editor-label`}>
              {`Destination`}
            </span>
            <div
              role={`group`}
              ref={picker.groupChoicesRef}
              id={`domain-group-picker-group`}
              className={`domain-group-picker-group-choices`}
              aria-labelledby={`domain-group-picker-group-text`}
              aria-invalid={Boolean(picker.error && !picker.creatingGroup && !picker.creatingNewCollection)}
              aria-describedby={`domain-group-picker-group-help${picker.error ? ` domain-group-picker-error` : ``}`}
            >
              <div id={`domain-group-picker-commands`} className={`domain-group-picker-commands`}>
                <button
                  type={`button`}
                  disabled={picker.disabled}
                  id={`domain-group-picker-create-command`}
                  aria-pressed={picker.creatingGroup}
                  onClick={() => picker.setGroupId(CREATE_GROUP_OPTION)}
                  aria-describedby={`domain-group-picker-create-command-description`}
                  className={`portfolio-button portfolio-button-secondary domain-group-picker-command`}
                >
                  <Plus size={19} aria-hidden={`true`} id={`domain-group-picker-create-command-icon`} className={`domain-group-picker-command-icon`} />
                  <span id={`domain-group-picker-create-command-content`} className={`domain-group-picker-command-content`}>
                    <span id={`domain-group-picker-create-command-label`} className={`domain-group-picker-command-label`}>{`Create New Group`}</span>
                    <span id={`domain-group-picker-create-command-description`} className={`domain-group-picker-command-description`}>{`Create a group and choose its collection`}</span>
                  </span>
                </button>
                <button
                  type={`button`}
                  disabled={picker.disabled}
                  id={`domain-group-picker-create-collection-command`}
                  aria-pressed={picker.creatingNewCollection}
                  onClick={() => picker.setDestinationCollectionId(CREATE_COLLECTION_OPTION)}
                  aria-describedby={`domain-group-picker-create-collection-command-description`}
                  className={`portfolio-button portfolio-button-secondary domain-group-picker-command`}
                >
                  <FolderPlus size={19} aria-hidden={`true`} id={`domain-group-picker-create-collection-command-icon`} className={`domain-group-picker-command-icon`} />
                  <span id={`domain-group-picker-create-collection-command-content`} className={`domain-group-picker-command-content`}>
                    <span id={`domain-group-picker-create-collection-command-label`} className={`domain-group-picker-command-label`}>{`Create New Collection`}</span>
                    <span id={`domain-group-picker-create-collection-command-description`} className={`domain-group-picker-command-description`}>{`Move domains into a collection without a group`}</span>
                  </span>
                </button>
                <button
                  type={`button`}
                  disabled={picker.disabled}
                  id={`domain-group-picker-ungrouped-command`}
                  aria-pressed={!picker.selectingCollection && picker.groupId === UNGROUPED_GROUP_OPTION}
                  onClick={() => picker.setGroupId(UNGROUPED_GROUP_OPTION)}
                  aria-describedby={`domain-group-picker-ungrouped-command-description`}
                  className={`portfolio-button portfolio-button-secondary domain-group-picker-command`}
                  data-autofocus={!picker.disabled && !picker.selectingCollection && picker.groupId === UNGROUPED_GROUP_OPTION || undefined}
                >
                  <List size={19} aria-hidden={`true`} id={`domain-group-picker-ungrouped-command-icon`} className={`domain-group-picker-command-icon`} />
                  <span id={`domain-group-picker-ungrouped-command-content`} className={`domain-group-picker-command-content`}>
                    <span id={`domain-group-picker-ungrouped-command-label`} className={`domain-group-picker-command-label`}>{UNGROUPED_GROUP_LABEL}</span>
                    <span id={`domain-group-picker-ungrouped-command-description`} className={`domain-group-picker-command-description`}>{`Remove selected domains from their current groups or apps`}</span>
                  </span>
                  <span
                    id={`domain-group-picker-ungrouped-command-count`}
                    className={`destination-choice-count domain-group-picker-command-count`}
                    title={`${picker.ungroupedCount} Domain(s) Without A Group Or App`}
                  >
                    {picker.ungroupedCount}
                  </span>
                </button>
              </div>
              <PortfolioDestinationTree
                value={!picker.selectingCollection ? picker.groupId : undefined}
                disabled={picker.disabled}
                onSelect={picker.setGroupId}
                branches={picker.destinationBranches}
                id={`domain-group-picker-destinations`}
                labelId={`domain-group-picker-group-text`}
                onSelectCollection={picker.setDestinationCollectionId}
                collectionValue={picker.selectingCollection ? picker.collectionId : undefined}
                invalid={Boolean(picker.error && !picker.creatingGroup && !picker.creatingNewCollection)}
                describedBy={`domain-group-picker-group-help${picker.error ? ` domain-group-picker-error` : ``}`}
              />
            </div>
          </div>
          <div id={`domain-group-picker-controls`} className={`domain-group-picker-controls`}>
            {selectedBranch && (selectedGroup || picker.selectingCollection) && (
              <p id={`domain-group-picker-destination`} className={`domain-group-picker-destination`} aria-live={`polite`}>
                <span id={`domain-group-picker-destination-label`} className={`domain-group-picker-destination-label`}>{`Destination:`}</span>
                <span id={`domain-group-picker-destination-collection`} className={`domain-group-picker-destination-name`}>{selectedBranch.name}</span>
                {selectedGroup && (
                  <>
                    <ChevronRight size={13} aria-hidden={`true`} id={`domain-group-picker-destination-arrow`} className={`domain-group-picker-destination-arrow`} />
                    <span id={`domain-group-picker-destination-group`} className={`domain-group-picker-destination-name`}>{selectedGroup.name}</span>
                  </>
                )}
              </p>
            )}
            <p id={`domain-group-picker-group-help`} className={`domain-group-picker-help`}>
              {picker.selectingCollection
                ? `Domains move directly into the collection or Database, without a group.`
                : picker.groupId === UNGROUPED_GROUP_OPTION
                ? `${UNGROUPED_GROUP_LABEL} removes these domains from their current groups or apps.`
                : `Clicking a group moves these domains out of their current custom groups.`}
            </p>
            {(picker.creatingGroup || picker.creatingNewCollection) && (
              <div id={`domain-group-picker-create-fields`} className={`domain-group-picker-create-fields`}>
                {picker.creatingGroup && (
                  <label id={`domain-group-picker-name-label`} htmlFor={`domain-group-picker-name`} className={`domain-editor-field`}>
                    <span id={`domain-group-picker-name-text`} className={`domain-editor-label`}>
                      {`New Group`}
                    </span>
                    <input
                      required
                      maxLength={80}
                      value={picker.name}
                      disabled={picker.disabled}
                      autoComplete={`off`}
                      ref={picker.nameInputRef}
                      id={`domain-group-picker-name`}
                      aria-invalid={picker.invalidField === `name`}
                      data-autofocus={!picker.disabled || undefined}
                      placeholder={`e.g. Client sites`}
                      className={`domain-editor-input domain-group-picker-name-input`}
                      onChange={event => picker.setName(event.target.value)}
                      aria-describedby={picker.invalidField === `name` ? `domain-group-picker-error` : undefined}
                    />
                  </label>
                )}
                <div id={`domain-group-picker-collection-fields`} className={`domain-group-picker-collection-fields${picker.creatingNewCollection ? ` domain-group-picker-collection-destinations` : ``}`}>
                  <label
                    id={`domain-group-picker-collection-name-label`}
                    htmlFor={`domain-group-picker-collection-name`}
                    className={`domain-editor-field`}
                  >
                    <span id={`domain-group-picker-collection-name-text`} className={`domain-editor-label`}>
                      {`New Collection`}
                    </span>
                    <input
                      maxLength={80}
                      autoComplete={`off`}
                      disabled={picker.disabled}
                      value={picker.collectionName}
                      required={picker.creatingCollection}
                      ref={picker.collectionNameInputRef}
                      data-autofocus={picker.creatingNewCollection && !picker.disabled || undefined}
                      id={`domain-group-picker-collection-name`}
                      placeholder={`e.g. Client projects`}
                      aria-invalid={picker.invalidField === `collectionName`}
                      className={`domain-editor-input domain-group-picker-collection-name-input`}
                      onChange={event => picker.setCollectionName(event.target.value)}
                      aria-describedby={`domain-group-picker-collection-help${picker.invalidField === `collectionName` ? ` domain-group-picker-error` : ``}`}
                    />
                  </label>
                  {picker.creatingNewCollection && (
                    <p id={`domain-group-picker-collection-help`} className={`domain-group-picker-help`}>
                      {`Names must be unique across collections and groups, ignoring capitalization.`}
                    </p>
                  )}
                </div>
                {picker.creatingGroup && (
                  <div id={`domain-group-picker-collection-field`} className={`domain-editor-field domain-group-picker-collection-destinations`}>
                    <span id={`domain-group-picker-collection-text`} className={`domain-editor-label`}>
                      {`Collection`}
                    </span>
                    <DestinationChoices
                      mosaic
                      options={collectionChoices}
                      value={picker.collectionId}
                      disabled={picker.disabled}
                      onChange={picker.setCollectionId}
                      id={`domain-group-picker-collection`}
                      choicesRef={picker.collectionChoicesRef}
                      labelId={`domain-group-picker-collection-text`}
                      invalid={picker.missingCollection || picker.invalidField === `collection`}
                      describedBy={`domain-group-picker-collection-help${picker.missingCollection || picker.invalidField === `collection` ? ` domain-group-picker-error` : ``}`}
                    />
                    <p id={`domain-group-picker-collection-help`} className={`domain-group-picker-help`}>
                      {`With a group name filled in, click Database or a collection to create and group immediately. For a new collection, enter its name and click Create & Group.`}
                    </p>
                  </div>
                )}
              </div>
            )}
            {!embedded && <div id={`domain-group-picker-scroll-field`} className={`domain-editor-field domain-group-picker-scroll-field`}>
              <span id={`domain-group-picker-scroll-label`} className={`domain-editor-label domain-group-picker-scroll-label`}>
                <span id={`domain-group-picker-scroll-text`} className={`domain-group-picker-scroll-text`}>
                  {`Scroll to Destination when Done`}
                </span>
              </span>
              <BooleanSetting
                value={picker.scrollToGroup}
                disabled={picker.disabled}
                onChange={picker.setScrollToGroup}
                id={`domain-group-picker-scroll-input`}
                className={`domain-group-picker-scroll-control`}
                labelledBy={`domain-group-picker-scroll-label`}
              />
            </div>}
          </div>
        </div>
        {picker.error && (
          <p role={`alert`} id={`domain-group-picker-error`} className={`domain-dialog-error`}>
            {picker.error}
          </p>
        )}
      </div>
      <footer id={`domain-group-picker-footer`} className={`domain-dialog-footer domain-group-picker-footer`}>
        <div id={`domain-group-picker-actions`} className={`domain-dialog-actions`}>
          <button
            type={`button`}
            disabled={disabled}
            onClick={picker.handleClose}
            id={`domain-group-picker-cancel`}
            className={`portfolio-button portfolio-button-secondary`}
          >
            <X size={15} aria-hidden={`true`} id={`domain-group-picker-cancel-icon`} className={`portfolio-button-icon`} />
            <span id={`domain-group-picker-cancel-text`} className={`portfolio-button-text`}>
              {`Cancel`}
            </span>
          </button>
          {(picker.creatingGroup || picker.creatingNewCollection) && <button
            type={embedded ? `button` : `submit`}
            disabled={picker.disabled}
            onClick={embedded ? picker.submit : undefined}
            id={`domain-group-picker-submit`}
            className={`portfolio-button portfolio-button-primary`}
          >
            <Plus size={15} aria-hidden={`true`} id={`domain-group-picker-submit-icon`} className={`portfolio-button-icon`} />
            <span id={`domain-group-picker-submit-text`} className={`portfolio-button-text`}>
              {`${actionLabel}${picker.count > 1 ? ` (${picker.count})` : ``}`}
            </span>
          </button>}
        </div>
      </footer>
    </>
  );

  if (embedded) return (
    <div
      role={`group`}
      id={`domain-group-picker-embedded`}
      aria-label={`Move Domain Destination`}
      className={`domain-group-picker domain-group-picker-embedded`}
      aria-describedby={`domain-group-picker-description`}
      onKeyDown={event => {
        if (event.key !== `Enter` || event.nativeEvent.isComposing || !(event.target instanceof HTMLInputElement)) return;
        event.preventDefault();
        event.stopPropagation();
        picker.submit();
      }}
    >
      <div id={`domain-group-picker-form`} className={`domain-dialog-form domain-group-picker-form`}>
        {formContent}
      </div>
    </div>
  );

  return (
    <div
      role={`presentation`}
      id={`domain-group-picker-backdrop`}
      {...picker.sheet.pressProps}
      style={picker.sheet.style}
      className={`domain-dialog-backdrop${picker.sheet.className}`}
      onClick={event => { if (picker.sheet.mobile && event.target === event.currentTarget) picker.handleClose(); }}
      onMouseDown={event => { if (!picker.sheet.mobile && event.target === event.currentTarget) picker.handleClose(); }}
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
        <MobileSheetHandle id={`domain-group-picker`} sheet={picker.sheet} />
        <header id={`domain-group-picker-header`} className={`domain-dialog-header`}>
          <div id={`domain-group-picker-heading`} className={`domain-dialog-heading`}>
            <span id={`domain-group-picker-eyebrow`} className={`domain-dialog-eyebrow`}>
              {`ACTIONS`}
            </span>
            <h2 id={`domain-group-picker-title`} className={`domain-dialog-title`}>
              {`Move Domains`}
            </h2>
          </div>
          <button
            type={`button`}
            disabled={disabled}
            onClick={picker.handleClose}
            id={`domain-group-picker-close`}
            className={`domain-dialog-close`}
            aria-label={`Close Domain Destination Picker`}
          >
            <X size={19} aria-hidden={`true`} id={`domain-group-picker-close-icon`} className={`domain-dialog-close-icon`} />
          </button>
        </header>
        <form noValidate id={`domain-group-picker-form`} className={`domain-dialog-form domain-group-picker-form`} onSubmit={picker.handleSubmit}>
          {formContent}
        </form>
      </div>
    </div>
  );
};

export default DomainGroupPicker;
