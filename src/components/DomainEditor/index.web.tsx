import './styles.scss';
import ConnectRegistrar from './ConnectRegistrar';
import ProjectSelect from './ProjectSelect/index.web';
import { X, Plus, Check, ChevronDown } from 'lucide-react';
import DomainSiteIcon from '../DomainSiteIcon/index.web';
import DomainSourceBadge from '../DomainSourceBadge/index.web';
import { REGISTRARS } from '../../shared/config';
import { useDomainEditor } from './useDomainEditor';
import type { DomainRecord } from '../../shared/types';
import { getDomainSource } from '../../shared/domainUtils';
import { getCustomSiteIconUrl } from '../../shared/domainSiteIcon';
import { DOMAIN_DIFFICULTIES, DOMAIN_PROJECT_STATUSES, normalizeDomainDifficulty, normalizeDomainProjectStatus } from '../../shared/domainProject';

interface DomainEditorProps {
  onClose: () => void;
  domain?: DomainRecord | null;
}

const DomainEditor = ({ domain, onClose }: DomainEditorProps) => {
  const { error, input, close, saving, setField, modalRef, groupEditor, handleSubmit } = useDomainEditor(domain, onClose);
  const isEditing = Boolean(domain?.id);
  const isSynced = Boolean(domain && getDomainSource(domain) === `registrar`);
  return (
    <div
      role={`presentation`}
      id={`domain-editor-backdrop`}
      className={`domain-dialog-backdrop`}
      onMouseDown={event => { if (event.target === event.currentTarget) close(); }}
    >
      <div
        tabIndex={-1}
        role={`dialog`}
        ref={modalRef}
        aria-modal={`true`}
        id={`domain-editor-dialog`}
        className={`domain-dialog domain-editor${isEditing ? ` domain-editor-settings` : ``}`}
        aria-labelledby={`domain-editor-title`}
        aria-describedby={!isEditing ? `domain-editor-description` : undefined}
      >
        <header id={`domain-editor-header`} className={`domain-dialog-header`}>
          <div id={`domain-editor-heading`} className={`domain-dialog-heading`}>
            <span id={`domain-editor-eyebrow`} className={`domain-dialog-eyebrow`}>
              {isEditing ? `SETTINGS` : `YOUR PORTFOLIO`}
            </span>
            <div id={`domain-editor-title-row`} className={`domain-editor-title-row`}>
              <h2 id={`domain-editor-title`} className={`domain-dialog-title`}>
                {isEditing ? domain?.name ?? input.name : `Add a domain`}
              </h2>
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
        </header>
        {!isEditing && (
          <p id={`domain-editor-description`} className={`domain-dialog-description`}>
            {`A little detail now. A lot less searching later.`}
          </p>
        )}
        {!isSynced && <ConnectRegistrar onClose={close} disabled={saving} scope={`domain-editor`} />}
        <form id={`domain-editor-form`} className={`domain-editor-form`} onSubmit={handleSubmit}>
          <div id={`domain-editor-fields`} className={`domain-editor-fields`}>
            <div id={`domain-site-icon-field`} className={`domain-editor-field domain-editor-field-full`}>
              <label id={`domain-site-icon-label`} className={`domain-editor-label`} htmlFor={`domain-site-icon-input`}>
                {`Site icon URL`}
              </label>
              <div id={`domain-site-icon-row`} className={`domain-editor-icon-row`}>
                <div
                  role={`img`}
                  id={`domain-site-icon-preview`}
                  aria-label={`Site Icon Preview`}
                  className={`domain-editor-icon-preview`}
                >
                  <DomainSiteIcon
                    compact
                    size={40}
                    domain={input.name}
                    id={`domain-editor-site-icon`}
                    iconUrl={getCustomSiteIconUrl(input)}
                  />
                </div>
                <div id={`domain-site-icon-copy`} className={`domain-editor-icon-copy`}>
                  <input
                    type={`url`}
                    maxLength={2048}
                    inputMode={`url`}
                    autoComplete={`off`}
                    spellCheck={false}
                    id={`domain-site-icon-input`}
                    data-autofocus={isEditing || undefined}
                    value={getCustomSiteIconUrl(input)}
                    className={`domain-editor-input`}
                    aria-describedby={`domain-site-icon-help`}
                    placeholder={`https://example.com/icon.png`}
                    onChange={event => setField(`meta`, { ...input.meta, siteIconUrl: event.target.value })}
                  />
                  <p id={`domain-site-icon-help`} className={`domain-editor-icon-help`}>
                    {`Use a public image URL. Leave blank to use the website's default icon.`}
                  </p>
                </div>
              </div>
            </div>
            <div id={`domain-name-field`} className={`domain-editor-field`}>
              <label id={`domain-name-label`} className={`domain-editor-label`} htmlFor={`domain-name-input`}>
                {`Domain name`}
              </label>
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
            </div>
            {!isSynced && (
                <div id={`domain-owner-field`} className={`domain-editor-field`}>
                  <label id={`domain-owner-label`} className={`domain-editor-label`} htmlFor={`domain-owner-input`}>
                    {`Registered to`}
                  </label>
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
                </div>
                <div id={`domain-auto-renew-field`} className={`domain-editor-field domain-editor-field-full domain-editor-renew-field`}>
                  <label id={`domain-auto-renew-label`} className={`domain-editor-renew-label`} htmlFor={`domain-auto-renew-input`}>
                    <input
                      type={`checkbox`}
                      checked={input.autoRenew}
                      id={`domain-auto-renew-input`}
                      className={`domain-editor-renew-checkbox`}
                      onChange={event => setField(`autoRenew`, event.target.checked)}
                    />
                    <span id={`domain-auto-renew-copy`} className={`domain-editor-renew-copy`}>
                      <span id={`domain-auto-renew-title`} className={`domain-editor-renew-title`}>
                        {`Auto-renew is enabled`}
                      </span>
                      <span id={`domain-auto-renew-help`} className={`domain-editor-renew-help`}>
                        {`Match the setting at your registrar`}
                      </span>
                    </span>
                  </label>
                </div>
              </>
            )}
            {isEditing && (
              <div id={`domain-group-field`} className={`domain-editor-field domain-editor-field-full`}>
                <label id={`domain-group-label`} className={`domain-editor-label`} htmlFor={`domain-group-input`}>
                  {`Group`}
                </label>
                <div id={`domain-group-select-wrap`} className={`domain-editor-select-wrap`}>
                  <select
                    disabled={saving}
                    value={groupEditor.groupId}
                    id={`domain-group-input`}
                    className={`domain-editor-input domain-editor-select`}
                    onChange={event => groupEditor.setGroupId(event.target.value)}
                  >
                    {groupEditor.options.map(option => (
                      <option
                        key={option.id}
                        value={option.id}
                        className={`domain-editor-option`}
                        id={`domain-group-option-${option.id || `ungrouped`}`}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} aria-hidden={`true`} id={`domain-group-select-chevron`} className={`domain-editor-select-chevron`} />
                </div>
              </div>
            )}
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
              <input
                maxLength={500}
                id={`domain-mvp-input`}
                value={input.mvp ?? ``}
                className={`domain-editor-input`}
                placeholder={`The first useful version`}
                onChange={event => setField(`mvp`, event.target.value)}
              />
            </div>
            <div id={`domain-future-field`} className={`domain-editor-field`}>
              <label id={`domain-future-label`} className={`domain-editor-label`} htmlFor={`domain-future-input`}>
                {`Future`}
              </label>
              <input
                maxLength={500}
                id={`domain-future-input`}
                value={input.future ?? ``}
                className={`domain-editor-input`}
                placeholder={`What comes after the MVP`}
                onChange={event => setField(`future`, event.target.value)}
              />
            </div>
            <div id={`domain-description-field`} className={`domain-editor-field domain-editor-field-full`}>
              <label id={`domain-description-label`} className={`domain-editor-label`} htmlFor={`domain-description-input`}>
                {`Description`}
              </label>
              <textarea
                rows={2}
                maxLength={2000}
                id={`domain-description-input`}
                value={input.description ?? ``}
                placeholder={`What is this domain for?`}
                className={`domain-editor-input domain-editor-textarea`}
                onChange={event => setField(`description`, event.target.value)}
              />
            </div>
          </div>
          {error && (
            <p role={`alert`} id={`domain-editor-error`} className={`domain-dialog-error`}>
              {error}
            </p>
          )}
          <footer id={`domain-editor-footer`} className={`domain-dialog-footer`}>
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
                disabled={saving}
                id={`domain-editor-submit`}
                className={`portfolio-button portfolio-button-primary`}
              >
                {isEditing
                  ? <Check size={16} aria-hidden={`true`} id={`domain-editor-submit-icon`} className={`portfolio-button-icon`} />
                  : <Plus size={16} aria-hidden={`true`} id={`domain-editor-submit-icon`} className={`portfolio-button-icon`} />}
                <span id={`domain-editor-submit-text`} className={`portfolio-button-text`}>
                  {saving ? `Saving…` : isEditing ? `Save Changes` : `Add Domain`}
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
