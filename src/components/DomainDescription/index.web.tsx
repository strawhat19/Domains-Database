import './styles.scss';
import Toast from '../Toast/index.web';
import { createPortal } from 'react-dom';
import { X, Check, Pencil } from 'lucide-react';
import { useDomainDescription } from './useDomainDescription';

interface DomainDescriptionProps {
  id: string;
  busy?: boolean;
  value?: string;
  maxLength?: number;
  domainName: string;
  onSave: (value: string) => Promise<boolean>;
}

const DomainDescription = ({ id, busy, value, onSave, maxLength, domainName }: DomainDescriptionProps) => {
  const description = useDomainDescription({ busy, value, onSave });
  const label = `${value ? `Edit` : `Add`} Description For ${domainName}`;

  return (
    <div
      id={id}
      draggable={false}
      ref={description.rootRef}
      onClick={event => event.stopPropagation()}
      onKeyDown={event => event.stopPropagation()}
      onMouseDown={event => event.stopPropagation()}
      onPointerDown={event => event.stopPropagation()}
      onContextMenu={event => event.stopPropagation()}
      className={`domain-description${description.editing ? ` domain-description-editing` : ``}`}
      onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}
    >
      {description.editing ? (
        <form
          id={`${id}-editor`}
          aria-busy={description.saving || undefined}
          className={`domain-description-editor`}
          onSubmit={event => { event.preventDefault(); void description.save(); }}
        >
          <textarea
            rows={description.compact ? 1 : 2}
            maxLength={maxLength}
            aria-label={label}
            id={`${id}-input`}
            value={description.draft}
            ref={description.textareaRef}
            disabled={description.disabled}
            placeholder={`Add Description`}
            className={`domain-description-input`}
            onKeyDown={description.onKeyDown}
            aria-invalid={description.saveError}
            aria-describedby={`${id}-help${description.saveError ? ` ${id}-error` : ``}`}
            onChange={event => description.setDraft(event.target.value)}
          />
          <div id={`${id}-editor-footer`} className={`domain-description-editor-footer`}>
            <span id={`${id}-help`} className={`domain-description-help`}>
              {`Enter To Save · Shift+Enter For A New Line`}
            </span>
            <div id={`${id}-actions`} className={`domain-description-actions`}>
              <button
                type={`submit`}
                id={`${id}-save`}
                disabled={description.disabled}
                title={`Save Description For ${domainName}`}
                aria-label={`Save Description For ${domainName}`}
                className={`domain-description-action domain-description-save`}
              >
                <Check size={12} aria-hidden={`true`} id={`${id}-save-icon`} className={`domain-description-action-icon`} />
                <span id={`${id}-save-label`} className={`domain-description-action-label`}>
                  {description.saving ? `Saving…` : `Save`}
                </span>
              </button>
              <button
                type={`button`}
                id={`${id}-cancel`}
                onClick={description.cancel}
                disabled={description.disabled}
                title={`Cancel Description Edit For ${domainName}`}
                aria-label={`Cancel Description Edit For ${domainName}`}
                className={`domain-description-action domain-description-cancel`}
              >
                <X size={12} aria-hidden={`true`} id={`${id}-cancel-icon`} className={`domain-description-action-icon`} />
                <span id={`${id}-cancel-label`} className={`domain-description-action-label`}>
                  {`Cancel`}
                </span>
              </button>
            </div>
          </div>
          {description.saveError && !description.compact && (
            <span role={`alert`} id={`${id}-error`} className={`domain-description-error`}>
              {`Description Wasn't Saved. Try Again`}
            </span>
          )}
        </form>
      ) : (
        <button
          title={label}
          type={`button`}
          draggable={false}
          aria-label={label}
          id={`${id}-edit`}
          onClick={description.edit}
          ref={description.triggerRef}
          disabled={description.disabled}
          className={`domain-description-trigger${value ? `` : ` domain-description-empty`}`}
        >
          {value ? (
            <>
              <span id={`${id}-text`} className={`domain-site-description`}>
                {value}
              </span>
              <Pencil size={12} aria-hidden={`true`} id={`${id}-edit-icon`} className={`domain-description-edit-icon`} />
            </>
          ) : (
            <Pencil size={12} aria-hidden={`true`} id={`${id}-add-icon`} className={`domain-description-add-icon`} />
          )}
        </button>
      )}
      {description.compact && description.saveError && typeof document !== `undefined` && createPortal(
        <div
          id={`${id}-error`}
          className={`domain-description-error-toast`}
          onClick={event => event.stopPropagation()}
          onKeyDown={event => event.stopPropagation()}
          onMouseDown={event => event.stopPropagation()}
          onPointerDown={event => event.stopPropagation()}
        >
          <Toast id={`${id}-save-error`} message={`Description Wasn't Saved — Try Again`} onDismiss={description.dismissError} />
        </div>,
        document.body,
        `${id}-error-portal`,
      )}
    </div>
  );
};

export default DomainDescription;
