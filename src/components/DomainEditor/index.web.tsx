import './styles.scss';
import type { ReactNode } from 'react';
import TagPicker from '../TagPicker/index.web';
import ModalTabs from '../ModalTabs/index.web';
import MobileSheetHandle from '../MobileSheet/index.web';
import ModalTitle from '../ModalTitle/index.web';
import { REGISTRARS } from '../../shared/config';
import ConnectRegistrar from './ConnectRegistrar';
import DomainLinks from '../DomainLinks/index.web';
import { useDomainEditor } from './useDomainEditor';
import ProjectSelect from './ProjectSelect/index.web';
import CurrencyField from '../CurrencyField/index.web';
import SettingsField from '../SettingsField/index.web';
import type { DomainRecord } from '../../shared/types';
import DomainSiteIcon from '../DomainSiteIcon/index.web';
import DomainMetadata from '../DomainMetadata/index.web';
import DomainStarButton from '../DomainStarButton/index.web';
import DomainGroupPicker from '../DomainGroupPicker/index.web';
import DomainSourceBadge from '../DomainSourceBadge/index.web';
import { DOMAIN_PRICE_FIELDS } from '../../shared/domainPricing';
import { getCustomSiteIconUrl } from '../../shared/domainSiteIcon';
import BooleanSetting from '../SegmentedControl/BooleanSetting.web';
import DomainAnalyticsButton from '../DomainAnalyticsButton/index.web';
import PortfolioSettingsActions from '../PortfolioSettingsActions/index.web';
import type { DomainLinkField, DomainLinkValues } from '../DomainLinks/index.web';
import { formatCurrency, getDomainSource, getDomainDeletionRestriction } from '../../shared/domainUtils';
import { X, Plus, Link, Info, Check, Trash2, Settings2, FolderTree, ChevronDown, BriefcaseBusiness } from 'lucide-react';
import { DOMAIN_DIFFICULTIES, DOMAIN_PROJECT_STATUSES, normalizeDomainDifficulty, normalizeDomainProjectStatus } from '../../shared/domainProject';

interface DomainEditorProps {
  active?: boolean;
  onClose: () => void;
  domain?: DomainRecord | null;
  entryTabs?: (busy: boolean) => ReactNode;
}

const DomainEditor = ({ domain, onClose, entryTabs, active = true }: DomainEditorProps) => {
  const {
    error,
    input,
    close,
    sheet,
    activeTab,
    setActiveTab,
    invalidField,
    invalidLinkField,
    hidden,
    moving,
    openMove,
    closeMove,
    saving,
    deleting,
    setField,
    modalRef,
    nameInvalid,
    copySections,
    moveButtonRef,
    handleDelete,
    cancelDelete,
    requestDelete,
    handleSubmit,
    nameFocusRequest,
    deleteButtonRef,
    deleteCancelRef,
    confirmingDelete,
    actionsDisabled,
    destinationLabel,
    hideProjectDetails,
    toggleVisibility,
  } = useDomainEditor(domain, onClose, active);
  const tabsId = `domain-editor-sections-${domain?.id ?? `new`}`;
  const deleteId = `domain-editor-delete-${domain?.id ?? `new`}`;
  const isEditing = Boolean(domain?.id);
  const hasCustomIcon = Boolean(getCustomSiteIconUrl(input).trim());
  const deleteRestriction = domain ? getDomainDeletionRestriction(domain) : ``;
  const isSynced = Boolean(domain && getDomainSource(domain) === `registrar`);
  const setLinkField = <Key extends DomainLinkField>(field: Key, value: DomainLinkValues[Key]) => setField<DomainLinkField>(field, value);
  const statusField = (
    <div id={`domain-status-field`} className={`domain-editor-field`}>
      <label id={`domain-status-input-label`} className={`domain-editor-label`} htmlFor={`domain-status-input`}>
        {`Status`}
      </label>
      <ProjectSelect
        label={`Status`}
        disabled={saving}
        field={`projectStatus`}
        id={`domain-status-input`}
        value={input.projectStatus}
        placeholder={`Future`}
        options={DOMAIN_PROJECT_STATUSES}
        onChange={value => setField(`projectStatus`, normalizeDomainProjectStatus(value))}
      />
    </div>
  );
  return (
    <div
      role={`presentation`}
      hidden={!active}
      id={`domain-editor-backdrop`}
      {...(active ? sheet.pressProps : {})}
      style={{ ...sheet.style, display: active ? undefined : `none` }}
      className={`domain-dialog-backdrop${sheet.className}`}
      onClick={event => { if (active && sheet.mobile && event.target === event.currentTarget) close(); }}
      onMouseDown={event => { if (active && !sheet.mobile && event.target === event.currentTarget) close(); }}
    >
      <div
        tabIndex={-1}
        role={`dialog`}
        ref={modalRef}
        aria-modal={`true`}
        id={`domain-editor-dialog`}
        className={`domain-dialog domain-editor${isEditing ? ` domain-editor-settings` : ``}`}
        aria-labelledby={`domain-editor-title`}
        aria-describedby={!isEditing && activeTab === `general` ? `domain-editor-description` : undefined}
      >
        <MobileSheetHandle id={`domain-editor-${domain?.id ?? `new`}`} sheet={sheet} />
        <header id={`domain-editor-header`} className={`domain-dialog-header`}>
          <div id={`domain-editor-heading`} className={`domain-dialog-heading`}>
            <span id={`domain-editor-eyebrow`} className={`domain-dialog-eyebrow`}>
              {isEditing ? `DOMAIN SETTINGS` : `ACTIONS`}
            </span>
            <div id={`domain-editor-title-row`} className={`domain-editor-title-row`}>
              {isEditing ? (
                <ModalTitle
                  maxLength={253}
                  value={input.name}
                  disabled={saving}
                  readOnly={isSynced}
                  label={`Domain Name`}
                  invalid={nameInvalid}
                  id={`domain-editor-title`}
                  form={`domain-editor-form`}
                  focusRequest={nameFocusRequest}
                  placeholder={`your-next-idea.com`}
                  describedBy={error ? `domain-editor-error` : undefined}
                  onChange={value => setField(`name`, value)}
                />
              ) : <h2 id={`domain-editor-title`} className={`domain-dialog-title`}>{`Add a domain`}</h2>}
              {isEditing && domain && (
                <div id={`domain-editor-registrar-summary`} className={`domain-editor-registrar-summary`}>
                  <span id={`domain-editor-registrar-name`} className={`domain-editor-registrar-name`}>
                    {domain.registrar || `Unknown Registrar`}
                  </span>
                  <DomainSourceBadge domain={domain} id={`domain-editor-source-${domain.id}`} />
                </div>
              )}
            </div>
          </div>
          <div
            role={`group`}
            id={`domain-editor-header-actions`}
            aria-label={`Domain Editor Actions`}
            className={`domain-editor-header-actions`}
          >
            {isEditing && domain && (
              <>
                <DomainAnalyticsButton
                  domain={domain.name}
                  suffix={`domain-editor-${domain.id}`}
                />
                <DomainStarButton
                  size={34}
                  disabled={saving}
                  domainId={domain.id}
                  domainName={domain.name}
                  id={`domain-editor-star-${domain.id}`}
                />
              </>
            )}
            <button
              type={`button`}
              onClick={close}
              disabled={saving}
              id={`domain-editor-close`}
              aria-label={`Close Domain Editor`}
              className={`domain-dialog-close`}
            >
              <X size={19} aria-hidden={`true`} id={`domain-editor-close-icon`} className={`domain-dialog-close-icon`} />
            </button>
          </div>
        </header>
        {active && entryTabs?.(saving)}
        <form
          noValidate
          id={`domain-editor-form`}
          onSubmit={handleSubmit}
          role={entryTabs ? `tabpanel` : undefined}
          className={`domain-dialog-form domain-editor-form`}
          aria-labelledby={entryTabs ? `registrar-setup-tab-manual` : undefined}
        >
          <ModalTabs
            id={tabsId}
            value={activeTab}
            onChange={setActiveTab}
            label={`Domain Settings Sections`}
            disabled={saving || confirmingDelete}
            options={[
              { id: `general`, label: `General`, Icon: Settings2 },
              { id: `project`, label: `Project`, Icon: BriefcaseBusiness },
              ...(isEditing ? [
                { id: `links` as const, label: `Links`, Icon: Link },
                { id: `details` as const, label: `Details`, Icon: Info },
                { id: `actions` as const, label: `Actions`, Icon: FolderTree },
              ] : []),
            ]}
          />
          <div id={`domain-editor-body`} className={`domain-dialog-body`}>
            <section
              tabIndex={0}
              hidden={activeTab !== `general`}
              role={`tabpanel`}
              id={`${tabsId}-panel-general`}
              aria-labelledby={`${tabsId}-tab-general`}
              className={`domain-editor-pane`}
            >
              {activeTab === `general` && (
                <>
                  {!isEditing && <p id={`domain-editor-description`} className={`domain-dialog-description`}>{`A little detail now. A lot less searching later.`}</p>}
                  {!entryTabs && !isEditing && !isSynced && <ConnectRegistrar onClose={close} disabled={saving} scope={`domain-editor`} />}
                  <div id={`domain-editor-fields`} className={`domain-editor-fields`}>
                    <div id={`domain-site-icon-field`} className={`domain-editor-field domain-editor-field-full`}>
                      <label id={`domain-site-icon-label`} className={`domain-editor-label`} htmlFor={`domain-site-icon-input`}>
                        {`Site icon URL`}
                      </label>
                      <div id={`domain-site-icon-row`} className={`domain-editor-icon-row`}>
                        <div id={`domain-site-icon-previews`} className={`domain-editor-icon-previews`}>
                          <div id={`domain-site-icon-custom-preview-item`} className={`domain-editor-icon-preview-item`}>
                            <div
                              role={`img`}
                              id={`domain-site-icon-preview`}
                              className={`domain-editor-icon-preview`}
                              aria-label={hasCustomIcon ? `Custom Logo Preview` : `Site Icon Preview`}
                            >
                              <DomainSiteIcon
                                compact
                                size={40}
                                domain={input.name}
                                id={`domain-editor-site-icon`}
                                iconUrl={getCustomSiteIconUrl(input)}
                              />
                            </div>
                            {hasCustomIcon && (
                              <span id={`domain-site-icon-custom-preview-label`} className={`domain-editor-icon-preview-label`}>
                                {`Custom logo`}
                              </span>
                            )}
                          </div>
                          {hasCustomIcon && (
                            <div id={`domain-site-icon-original-preview-item`} className={`domain-editor-icon-preview-item`}>
                              <div
                                role={`img`}
                                id={`domain-site-icon-original-preview`}
                                aria-label={`Original Site Icon Preview`}
                                className={`domain-editor-icon-preview`}
                              >
                                <DomainSiteIcon
                                  compact
                                  size={40}
                                  domain={input.name}
                                  id={`domain-editor-original-site-icon`}
                                />
                              </div>
                              <span id={`domain-site-icon-original-preview-label`} className={`domain-editor-icon-preview-label`}>
                                {`Original site icon`}
                              </span>
                            </div>
                          )}
                        </div>
                        <div id={`domain-site-icon-copy`} className={`domain-editor-icon-copy`}>
                          <SettingsField
                            disabled={saving}
                            enabled={isEditing}
                            label={`Site Icon URL`}
                            id={`domain-site-icon-setting`}
                            invalid={invalidField === `siteIconUrl`}
                            value={getCustomSiteIconUrl(input)}
                            emptyText={`Website Default Icon`}
                          >
                            <input
                              type={`url`}
                              maxLength={2048}
                              inputMode={`url`}
                              autoComplete={`off`}
                              spellCheck={false}
                              id={`domain-site-icon-input`}
                              value={getCustomSiteIconUrl(input)}
                              className={`domain-editor-input`}
                              aria-describedby={`domain-site-icon-help`}
                              placeholder={`https://example.com/icon.png`}
                              onChange={event => setField(`meta`, { ...input.meta, siteIconUrl: event.target.value })}
                            />
                          </SettingsField>
                          <p id={`domain-site-icon-help`} className={`domain-editor-icon-help`}>
                            {`Use a public image URL. Leave blank to use the website's default icon.`}
                          </p>
                        </div>
                      </div>
                    </div>
                    {!isEditing && <div id={`domain-name-field`} className={`domain-editor-field`}>
                      <label id={`domain-name-label`} className={`domain-editor-label`} htmlFor={`domain-name-input`}>
                        {`Domain name`}
                      </label>
                      <SettingsField
                        disabled={saving}
                        value={input.name}
                        readOnly={isSynced}
                        enabled={isEditing}
                        label={`Domain Name`}
                        id={`domain-name-setting`}
                        invalid={invalidField === `name`}
                      >
                        <input
                          required
                          maxLength={253}
                          spellCheck={false}
                          value={input.name}
                          readOnly={isSynced}
                          autoComplete={`off`}
                          id={`domain-name-input`}
                          data-autofocus={!isEditing || undefined}
                          placeholder={`your-next-idea.com`}
                          className={`domain-editor-input`}
                          onChange={event => setField(`name`, event.target.value)}
                        />
                      </SettingsField>
                    </div>}
                    {!isSynced && (
                        <div id={`domain-owner-field`} className={`domain-editor-field`}>
                          <label id={`domain-owner-label`} className={`domain-editor-label`} htmlFor={`domain-owner-input`}>
                            {`Registered to`}
                          </label>
                          <SettingsField
                            disabled={saving}
                            value={input.owner}
                            enabled={isEditing}
                            label={`Registered To`}
                            id={`domain-owner-setting`}
                            invalid={invalidField === `owner`}
                          >
                            <input
                              required
                              maxLength={120}
                              value={input.owner}
                              autoComplete={`name`}
                              id={`domain-owner-input`}
                              placeholder={`Your name or company`}
                              className={`domain-editor-input`}
                              onChange={event => setField(`owner`, event.target.value)}
                            />
                          </SettingsField>
                        </div>
                    )}
                    {!isEditing && (
                      <>
                        <div id={`domain-registrar-field`} className={`domain-editor-field`}>
                          <label id={`domain-registrar-label`} className={`domain-editor-label`} htmlFor={`domain-registrar-input`}>
                            {`Registrar`}
                          </label>
                          <div id={`domain-registrar-select-wrap`} className={`domain-editor-select-wrap`}>
                            <select
                              disabled={saving}
                              value={input.registrar}
                              id={`domain-registrar-input`}
                              className={`domain-editor-input domain-editor-select`}
                              onChange={event => setField(`registrar`, event.target.value as typeof input.registrar)}
                            >
                              <option value={``} id={`domain-registrar-option-unknown`} className={`domain-registrar-option`}>
                                {`Unknown`}
                              </option>
                              {REGISTRARS.map(registrar => (
                                <option
                                  key={registrar}
                                  value={registrar}
                                  className={`domain-editor-option`}
                                  id={`domain-registrar-option-${registrar.toLowerCase().replaceAll(` `, `-`)}`}
                                >
                                  {registrar}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={15} aria-hidden={`true`} id={`domain-registrar-select-chevron`} className={`domain-editor-select-chevron`} />
                          </div>
                        </div>
                        <div id={`domain-expiry-field`} className={`domain-editor-field`}>
                          <label id={`domain-expiry-label`} className={`domain-editor-label`} htmlFor={`domain-expiry-input`}>
                            {`Renewal date`}
                          </label>
                          <input
                            type={`date`}
                            value={input.expiresAt}
                            id={`domain-expiry-input`}
                            className={`domain-editor-input`}
                            onChange={event => setField(`expiresAt`, event.target.value)}
                          />
                        </div>
                        <div id={`domain-created-field`} className={`domain-editor-field`}>
                          <label id={`domain-created-label`} className={`domain-editor-label`} htmlFor={`domain-created-input`}>
                            {`Created`}
                          </label>
                          <input
                            type={`date`}
                            id={`domain-created-input`}
                            value={input.createdAt ?? ``}
                            className={`domain-editor-input`}
                            onChange={event => setField(`createdAt`, event.target.value)}
                          />
                        </div>
                      </>
                    )}
                    {!isSynced && (
                      <>
                        <div id={`domain-price-field`} className={`domain-editor-field`}>
                          <label id={`domain-price-label`} className={`domain-editor-label`} htmlFor={`domain-price-input`}>
                            {`Annual renewal · USD`}
                          </label>
                          <SettingsField
                            disabled={saving}
                            enabled={isEditing}
                            id={`domain-price-setting`}
                            invalid={invalidField === `renewalPrice`}
                            label={`Annual Renewal · USD`}
                            value={`$${input.renewalPrice.toFixed(2)}`}
                          >
                            <div id={`domain-price-input-wrap`} className={`domain-editor-price-wrap`}>
                              <span id={`domain-price-prefix`} className={`domain-editor-price-prefix`} aria-hidden={`true`}>
                                {`$`}
                              </span>
                              <input
                                min={0}
                                required
                                step={0.01}
                                type={`number`}
                                inputMode={`decimal`}
                                value={input.renewalPrice}
                                id={`domain-price-input`}
                                className={`domain-editor-input domain-editor-price-input`}
                                onChange={event => setField(`renewalPrice`, Number(event.target.value))}
                              />
                            </div>
                          </SettingsField>
                        </div>
                        <div id={`domain-auto-renew-field`} className={`domain-editor-field domain-editor-field-full domain-editor-renew-field`}>
                          <span id={`domain-auto-renew-setting-label`} className={`domain-editor-label`}>{`Auto-Renew`}</span>
                          <BooleanSetting
                            disabled={saving}
                            value={input.autoRenew}
                            id={`domain-auto-renew-input`}
                            describedBy={`domain-auto-renew-help`}
                            labelledBy={`domain-auto-renew-setting-label`}
                            onChange={value => setField(`autoRenew`, value)}
                          />
                          <span id={`domain-auto-renew-help`} className={`domain-editor-renew-help`}>
                            {`Match the setting at your registrar`}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </section>
            <section
              tabIndex={0}
              hidden={activeTab !== `project`}
              role={`tabpanel`}
              id={`${tabsId}-panel-project`}
              aria-labelledby={`${tabsId}-tab-project`}
              className={`domain-editor-fields domain-editor-pane`}
            >
              {activeTab === `project` && (
                <>
                  {DOMAIN_PRICE_FIELDS.map(({ field, label }) => (
                    <div key={field} id={`domain-${field}-field-${domain?.id ?? `new`}`} className={`domain-editor-field`}>
                      <label
                        className={`domain-editor-label`}
                        id={`domain-${field}-label-${domain?.id ?? `new`}`}
                        htmlFor={`domain-${field}-input-${domain?.id ?? `new`}`}
                      >
                        {label}
                      </label>
                      <SettingsField
                        label={label}
                        disabled={saving}
                        enabled={isEditing}
                        id={`domain-${field}-setting-${domain?.id ?? `new`}`}
                        invalid={invalidField === field}
                        value={input[field] === undefined ? undefined : formatCurrency(input[field])}
                      >
                        <CurrencyField
                          label={label}
                          disabled={saving}
                          value={input[field]}
                          id={`domain-${field}-input-${domain?.id ?? `new`}`}
                          onChange={value => setField(field, value)}
                        />
                      </SettingsField>
                    </div>
                  ))}
                  <div id={`domain-tags-field-${domain?.id ?? `new`}`} className={`domain-editor-field domain-editor-field-full`}>
                    <label
                      className={`domain-editor-label`}
                      id={`domain-tags-input-${domain?.id ?? `new`}-label`}
                      htmlFor={`domain-tags-input-${domain?.id ?? `new`}`}
                    >
                      {`Tags`}
                    </label>
                    <TagPicker
                      label={`Tags`}
                      value={input.tags}
                      disabled={saving}
                      id={`domain-tags-input-${domain?.id ?? `new`}`}
                      onChange={tags => setField(`tags`, tags)}
                    />
                  </div>
                  {statusField}
                  <div id={`domain-difficulty-field`} className={`domain-editor-field`}>
                    <label id={`domain-difficulty-input-label`} className={`domain-editor-label`} htmlFor={`domain-difficulty-input`}>
                      {`Difficulty Level`}
                    </label>
                    <ProjectSelect
                      disabled={saving}
                      field={`difficulty`}
                      value={input.difficulty}
                      label={`Difficulty Level`}
                      id={`domain-difficulty-input`}
                      options={DOMAIN_DIFFICULTIES}
                      placeholder={`Select Difficulty Level`}
                      onChange={value => setField(`difficulty`, normalizeDomainDifficulty(value))}
                    />
                  </div>
                  <div id={`domain-mvp-field`} className={`domain-editor-field`}>
                    <label id={`domain-mvp-label`} className={`domain-editor-label`} htmlFor={`domain-mvp-input`}>
                      {`MVP`}
                    </label>
                    <SettingsField
                      label={`MVP`}
                      disabled={saving}
                      value={input.mvp}
                      enabled={isEditing}
                      id={`domain-mvp-setting`}
                    >
                      <input
                        maxLength={500}
                        id={`domain-mvp-input`}
                        value={input.mvp ?? ``}
                        className={`domain-editor-input`}
                        placeholder={`The first useful version`}
                        onChange={event => setField(`mvp`, event.target.value)}
                      />
                    </SettingsField>
                  </div>
                  <div id={`domain-future-field`} className={`domain-editor-field`}>
                    <label id={`domain-future-label`} className={`domain-editor-label`} htmlFor={`domain-future-input`}>
                      {`Future`}
                    </label>
                    <SettingsField
                      label={`Future`}
                      disabled={saving}
                      value={input.future}
                      enabled={isEditing}
                      id={`domain-future-setting`}
                    >
                      <input
                        maxLength={500}
                        id={`domain-future-input`}
                        value={input.future ?? ``}
                        className={`domain-editor-input`}
                        placeholder={`What comes after the MVP`}
                        onChange={event => setField(`future`, event.target.value)}
                      />
                    </SettingsField>
                  </div>
                  <div id={`domain-description-field`} className={`domain-editor-field domain-editor-field-full`}>
                    <label id={`domain-description-label`} className={`domain-editor-label`} htmlFor={`domain-description-input`}>
                      {`Description`}
                    </label>
                    <SettingsField
                      disabled={saving}
                      enabled={isEditing}
                      label={`Description`}
                      value={input.description}
                      id={`domain-description-setting`}
                    >
                      <textarea
                        rows={2}
                        maxLength={2000}
                        id={`domain-description-input`}
                        value={input.description ?? ``}
                        placeholder={`What is this domain for?`}
                        className={`domain-editor-input domain-editor-textarea`}
                        onChange={event => setField(`description`, event.target.value)}
                      />
                    </SettingsField>
                  </div>
                </>
              )}
            </section>
            {isEditing && (
              <section
                tabIndex={0}
                hidden={activeTab !== `links`}
                role={`tabpanel`}
                id={`${tabsId}-panel-links`}
                aria-labelledby={`${tabsId}-tab-links`}
                className={`domain-editor-pane domain-settings-links-pane`}
              >
                {activeTab === `links` && (
                  <>
                    <DomainLinks
                      input={input}
                      disabled={saving}
                      onChange={setLinkField}
                      invalidField={invalidLinkField}
                      errorId={`domain-editor-error`}
                      id={`domain-editor-links-${domain?.id}`}
                    />
                  </>
                )}
              </section>
            )}
            {domain && (
              <section
                tabIndex={0}
                role={`tabpanel`}
                hidden={activeTab !== `details`}
                id={`${tabsId}-panel-details`}
                aria-labelledby={`${tabsId}-tab-details`}
                className={`domain-editor-pane domain-editor-details-pane`}
              >
                {activeTab === `details` && (
                  <DomainMetadata
                    domain={domain}
                    idPrefix={`domain-editor-metadata`}
                    hideProjectDetails={hideProjectDetails}
                  />
                )}
              </section>
            )}
            {isEditing && (
              <section
                tabIndex={0}
                hidden={activeTab !== `actions`}
                role={`tabpanel`}
                id={`${tabsId}-panel-actions`}
                aria-labelledby={`${tabsId}-tab-actions`}
                className={`domain-editor-fields domain-editor-pane`}
              >
                {activeTab === `actions` && (
                  <>
                    {isEditing && domain && (
                      <div id={`domain-editor-row-actions-field-${domain.id}`} className={`domain-editor-field domain-editor-field-full`}>
                        <PortfolioSettingsActions
                          hidden={hidden}
                          label={domain.name}
                          treeAvailable={false}
                          sections={copySections}
                          onToggleVisibility={toggleVisibility}
                          id={`domain-editor-row-actions-${domain.id}`}
                          disabled={saving || confirmingDelete || actionsDisabled}
                        />
                      </div>
                    )}
                    {isEditing && (
                      <div id={`domain-group-field`} className={`domain-editor-field domain-editor-field-full`}>
                        <span id={`domain-group-label`} className={`domain-editor-label`}>{`Move To`}</span>
                        <button
                          type={`button`}
                          ref={moveButtonRef}
                          aria-expanded={moving}
                          id={`domain-group-input`}
                          onClick={moving ? closeMove : openMove}
                          aria-labelledby={`domain-group-label domain-group-destination`}
                          aria-controls={moving ? `domain-editor-move-${domain?.id}` : undefined}
                          disabled={saving || confirmingDelete || actionsDisabled}
                          className={`domain-editor-input domain-editor-move-trigger`}
                        >
                          <FolderTree size={15} aria-hidden id={`domain-group-move-icon`} className={`domain-editor-move-icon`} />
                          <span id={`domain-group-destination`} className={`domain-editor-move-destination`}>{destinationLabel}</span>
                          <ChevronDown size={15} aria-hidden id={`domain-group-select-chevron`} className={`domain-editor-move-icon`} />
                        </button>
                        {moving && domain && (
                          <div
                            id={`domain-editor-move-${domain.id}`}
                            className={`domain-editor-move-options`}
                            onKeyDown={event => {
                              if (event.key !== `Escape`) return;
                              event.preventDefault();
                              event.stopPropagation();
                              closeMove();
                            }}
                          >
                            <DomainGroupPicker
                              embedded
                              domains={[domain]}
                              onClose={closeMove}
                              disabled={saving || confirmingDelete || actionsDisabled}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
          </div>
          {error && (
            <p role={`alert`} id={`domain-editor-error`} className={`domain-dialog-error domain-editor-field-full`}>
              {error}
            </p>
          )}
          {isEditing && confirmingDelete && (
            <div
              role={`group`}
              id={`${deleteId}-confirmation`}
              className={`domain-editor-delete-confirmation domain-editor-field-full`}
              aria-labelledby={`${deleteId}-confirmation-title`}
              aria-describedby={`${deleteId}-confirmation-description`}
            >
              <div id={`${deleteId}-confirmation-copy`} className={`domain-editor-delete-confirmation-copy`}>
                <h3 id={`${deleteId}-confirmation-title`} className={`domain-editor-delete-confirmation-title`}>
                  {`Delete ${domain?.name}?`}
                </h3>
                <p id={`${deleteId}-confirmation-description`} className={`domain-editor-delete-confirmation-description`}>
                  {`This removes the domain entry from your portfolio. It does not cancel the domain registration.`}
                </p>
              </div>
              <div id={`${deleteId}-confirmation-actions`} className={`domain-editor-delete-confirmation-actions`}>
                <button
                  type={`button`}
                  disabled={saving}
                  onClick={cancelDelete}
                  ref={deleteCancelRef}
                  id={`${deleteId}-keep`}
                  className={`portfolio-button portfolio-button-secondary`}
                >
                  <X size={15} aria-hidden={`true`} id={`${deleteId}-keep-icon`} className={`portfolio-button-icon`} />
                  <span id={`${deleteId}-keep-text`} className={`portfolio-button-text`}>
                    {`Keep Domain`}
                  </span>
                </button>
                <button
                  type={`button`}
                  disabled={saving}
                  onClick={handleDelete}
                  id={`${deleteId}-confirm`}
                  className={`portfolio-button domain-editor-delete-button`}
                >
                  <Trash2 size={15} aria-hidden={`true`} id={`${deleteId}-confirm-icon`} className={`portfolio-button-icon`} />
                  <span id={`${deleteId}-confirm-text`} className={`portfolio-button-text`}>
                    {deleting ? `Deleting…` : `Delete Domain`}
                  </span>
                </button>
              </div>
            </div>
          )}
          <footer id={`domain-editor-footer`} className={`domain-dialog-footer`}>
            {isEditing && !isSynced && (
              <div id={`${deleteId}-action`} className={`domain-editor-delete-action`}>
                <button
                  type={`button`}
                  onClick={requestDelete}
                  ref={deleteButtonRef}
                  id={`${deleteId}-button`}
                  aria-expanded={confirmingDelete}
                  className={`portfolio-button domain-editor-delete-button`}
                  aria-controls={confirmingDelete ? `${deleteId}-confirmation` : undefined}
                  disabled={saving || moving || Boolean(deleteRestriction)}
                  aria-describedby={deleteRestriction ? `${deleteId}-restriction` : undefined}
                >
                  <Trash2 size={15} aria-hidden={`true`} id={`${deleteId}-icon`} className={`portfolio-button-icon`} />
                  <span id={`${deleteId}-text`} className={`portfolio-button-text`}>
                    {`Delete Domain`}
                  </span>
                </button>
                {deleteRestriction && (
                  <p id={`${deleteId}-restriction`} className={`domain-editor-delete-restriction`}>
                    {deleteRestriction}
                  </p>
                )}
              </div>
            )}
            <div id={`domain-editor-actions`} className={`domain-dialog-actions`}>
              <button
                type={`button`}
                onClick={close}
                disabled={saving}
                id={`domain-editor-cancel`}
                className={`portfolio-button portfolio-button-secondary`}
              >
                <X size={15} aria-hidden={`true`} id={`domain-editor-cancel-icon`} className={`portfolio-button-icon`} />
                <span id={`domain-editor-cancel-text`} className={`portfolio-button-text`}>
                  {`Cancel`}
                </span>
              </button>
              <button
                type={`submit`}
                disabled={saving || moving || confirmingDelete}
                id={`domain-editor-submit`}
                className={`portfolio-button portfolio-button-primary`}
              >
                {isEditing
                  ? <Check size={16} aria-hidden={`true`} id={`domain-editor-submit-icon`} className={`portfolio-button-icon`} />
                  : <Plus size={16} aria-hidden={`true`} id={`domain-editor-submit-icon`} className={`portfolio-button-icon`} />}
                <span id={`domain-editor-submit-text`} className={`portfolio-button-text`}>
                  {saving && !deleting ? `Saving…` : isEditing ? `Save` : `Add Domain`}
                </span>
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default DomainEditor;
