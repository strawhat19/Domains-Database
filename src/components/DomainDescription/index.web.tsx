import './styles.scss';
import { X, Check, Pencil, BookOpen } from 'lucide-react';
import { useDomainDescription } from './useDomainDescription';

interface DomainDescriptionProps {
  id: string;
  busy?: boolean;
  value?: string;
  domainName: string;
  onReadMore: () => void;
  onSave: (value: string) => Promise<boolean>;
}

const DomainDescription = ({ id, busy, value, onSave, domainName, onReadMore }: DomainDescriptionProps) => {
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
          className={`domain-description-editor`}
          onSubmit={event => { event.preventDefault(); void description.save(); }}
        >
          <textarea
            rows={2}
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
          {description.saveError && (
            <span role={`alert`} id={`${id}-error`} className={`domain-description-error`}>
              {`Description Wasn't Saved. Try Again`}
            </span>
          )}
        </form>
      ) : (
        <>
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
                <span ref={description.textRef} id={`${id}-text`} className={`domain-site-description`}>
                  {value}
                </span>
                <Pencil size={12} aria-hidden={`true`} id={`${id}-edit-icon`} className={`domain-description-edit-icon`} />
              </>
            ) : (
              <Pencil size={12} aria-hidden={`true`} id={`${id}-add-icon`} className={`domain-description-add-icon`} />
            )}
          </button>
          {description.truncated && (
            <button
              type={`button`}
              draggable={false}
              onClick={onReadMore}
              id={`${id}-read-more`}
              disabled={description.disabled}
              ref={description.readMoreRef}
              className={`domain-description-read-more`}
              aria-label={`Read More In Domain Settings For ${domainName}`}
            >
              <BookOpen size={12} aria-hidden={`true`} id={`${id}-read-more-icon`} className={`domain-description-read-more-icon`} />
              <span id={`${id}-read-more-label`} className={`domain-description-read-more-label`}>
                {`Read More`}
              </span>
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default DomainDescription;
