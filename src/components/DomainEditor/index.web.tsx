import './styles.scss';
import { REGISTRARS } from '../../shared/config';
import { useDomainEditor } from './useDomainEditor';
import type { DomainRecord } from '../../shared/types';
import { Check, Plus, X, ShieldCheck } from 'lucide-react';

interface DomainEditorProps {
  onClose: () => void;
  domain?: DomainRecord | null;
}

const DomainEditor = ({ domain, onClose }: DomainEditorProps) => {
  const { error, input, close, saving, setField, modalRef, handleSubmit } = useDomainEditor(domain, onClose);
  const isEditing = Boolean(domain?.id);
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
        className={`domain-dialog domain-editor`}
        aria-labelledby={`domain-editor-title`}
        aria-describedby={`domain-editor-description`}
      >
        <header id={`domain-editor-header`} className={`domain-dialog-header`}>
          <div id={`domain-editor-heading`} className={`domain-dialog-heading`}>
            <span id={`domain-editor-eyebrow`} className={`domain-dialog-eyebrow`}>
              {`YOUR PORTFOLIO`}
            </span>
            <h2 id={`domain-editor-title`} className={`domain-dialog-title`}>
              {isEditing ? `Edit your domain` : `Add a domain`}
            </h2>
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
        <p id={`domain-editor-description`} className={`domain-dialog-description`}>
          {`A little detail now. A lot less searching later.`}
        </p>
        <form id={`domain-editor-form`} className={`domain-editor-form`} onSubmit={handleSubmit}>
          <div id={`domain-editor-fields`} className={`domain-editor-fields`}>
            <div id={`domain-name-field`} className={`domain-editor-field`}>
              <label id={`domain-name-label`} className={`domain-editor-label`} htmlFor={`domain-name-input`}>
                {`Domain name`}
              </label>
              <input
                required
                data-autofocus
                spellCheck={false}
                value={input.name}
                maxLength={253}
                autoComplete={`off`}
                id={`domain-name-input`}
                placeholder={`your-next-idea.com`}
                className={`domain-editor-input`}
                onChange={event => setField(`name`, event.target.value)}
              />
            </div>
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
            <div id={`domain-registrar-field`} className={`domain-editor-field`}>
              <label id={`domain-registrar-label`} className={`domain-editor-label`} htmlFor={`domain-registrar-input`}>
                {`Registrar`}
              </label>
              <select
                value={input.registrar}
                id={`domain-registrar-input`}
                className={`domain-editor-input domain-editor-select`}
                onChange={event => setField(`registrar`, event.target.value as typeof input.registrar)}
              >
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
            </div>
            <div id={`domain-expiry-field`} className={`domain-editor-field`}>
              <label id={`domain-expiry-label`} className={`domain-editor-label`} htmlFor={`domain-expiry-input`}>
                {`Renewal date`}
              </label>
              <input
                required
                type={`date`}
                value={input.expiresAt}
                id={`domain-expiry-input`}
                className={`domain-editor-input`}
                onChange={event => setField(`expiresAt`, event.target.value)}
              />
            </div>
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
            <div id={`domain-auto-renew-field`} className={`domain-editor-field domain-editor-renew-field`}>
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
            <div id={`domain-notes-field`} className={`domain-editor-field domain-editor-field-full`}>
              <label id={`domain-notes-label`} className={`domain-editor-label`} htmlFor={`domain-notes-input`}>
                {`A note, if you like`}
              </label>
              <textarea
                rows={2}
                maxLength={1000}
                value={input.notes}
                id={`domain-notes-input`}
                className={`domain-editor-input domain-editor-notes`}
                placeholder={`A project, an account email, a future idea…`}
                onChange={event => setField(`notes`, event.target.value)}
              />
            </div>
          </div>
          {error && (
            <p role={`alert`} id={`domain-editor-error`} className={`domain-dialog-error`}>
              {error}
            </p>
          )}
          <footer id={`domain-editor-footer`} className={`domain-dialog-footer`}>
            <span id={`domain-editor-storage-note`} className={`domain-dialog-storage-note`}>
              <ShieldCheck size={14} aria-hidden={`true`} id={`domain-editor-storage-icon`} className={`domain-dialog-storage-icon`} />
              <span id={`domain-editor-storage-text`} className={`domain-dialog-storage-text`}>
                {`Saved on this device`}
              </span>
            </span>
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
