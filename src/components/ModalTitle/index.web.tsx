import './styles.scss';
import type { RefObject } from 'react';
import { X, Check, Pencil } from 'lucide-react';
import { useModalTitle } from './useModalTitle';

interface ModalTitleProps {
  id: string;
  value: string;
  label: string;
  form?: string;
  invalid?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  maxLength?: number;
  focusRequest?: number;
  describedBy?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
}

const ModalTitle = ({ id, value, label, form, inputRef, maxLength, focusRequest, describedBy, placeholder = `Untitled`, invalid = false, readOnly = false, disabled = false, onChange }: ModalTitleProps) => {
  const title = useModalTitle({ value, onChange, inputRef, focusRequest, invalid, readOnly, disabled });
  return (
    <h2 id={id} aria-label={value || placeholder} className={`domain-dialog-title modal-title${title.editing ? ` modal-title-editing` : ``}${invalid ? ` modal-title-invalid` : ``}`}>
      <button
        type={`button`}
        onClick={title.open}
        ref={title.triggerRef}
        hidden={title.editing}
        aria-invalid={invalid}
        id={`${id}-trigger`}
        disabled={!title.editable}
        aria-describedby={describedBy}
        aria-label={`${title.editable ? `Edit ${label}: ` : ``}${value || placeholder}`}
        aria-controls={`${id}-editor`}
        className={`modal-title-trigger`}
        aria-expanded={title.editing}
      >
        <span id={`${id}-value`} className={`modal-title-value${value ? `` : ` modal-title-placeholder`}`}>{value || placeholder}</span>
        {title.editable && <Pencil size={15} aria-hidden={`true`} id={`${id}-edit-icon`} className={`modal-title-edit-icon`} />}
      </button>
      {title.editing && (
        <span
          id={`${id}-editor`}
          className={`modal-title-editor`}
          onKeyDown={title.onKeyDown}
          onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) title.finish(true, false); }}
        >
          <textarea
            rows={1}
            form={form}
            value={title.draft}
            aria-label={label}
            spellCheck={false}
            ref={title.editorRef}
            disabled={disabled}
            maxLength={maxLength}
            autoComplete={`off`}
            aria-invalid={invalid}
            placeholder={placeholder}
            id={`${id}-input`}
            className={`modal-title-input`}
            aria-describedby={describedBy}
            onChange={event => title.setDraft(event.target.value)}
          />
          <span id={`${id}-actions`} className={`modal-title-actions`}>
            {[
              { key: `confirm`, label: `Accept Title`, accept: true, Icon: Check },
              { key: `cancel`, label: `Cancel Title Edit`, accept: false, Icon: X },
            ].map(action => (
              <button
                type={`button`}
                key={action.key}
                disabled={disabled}
                aria-label={action.label}
                id={`${id}-${action.key}`}
                className={`modal-title-action`}
                onClick={() => title.finish(action.accept)}
                onMouseDown={event => event.preventDefault()}
              >
                <action.Icon size={15} aria-hidden={`true`} id={`${id}-${action.key}-icon`} className={`modal-title-action-icon`} />
              </button>
            ))}
          </span>
        </span>
      )}
    </h2>
  );
};

export default ModalTitle;
