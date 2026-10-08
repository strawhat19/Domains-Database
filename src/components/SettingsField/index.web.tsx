import './styles.scss';
import type { ReactNode } from 'react';
import { Check, Pencil } from 'lucide-react';
import { useSettingsField } from './useSettingsField';

interface SettingsFieldProps {
  id: string;
  label: string;
  value?: ReactNode;
  invalid?: boolean;
  enabled?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  emptyText?: string;
  children: ReactNode;
}

const SettingsField = ({
  id,
  label,
  value,
  children,
  invalid = false,
  enabled = true,
  readOnly = false,
  disabled = false,
  emptyText = `Not Set`,
}: SettingsFieldProps) => {
  const field = useSettingsField({ invalid, enabled, readOnly, disabled });
  const empty = value == null || value === false || (typeof value === `string` && !value.trim());
  const displayValue = empty ? emptyText : value;
  const valueClass = `settings-field-value${empty ? ` settings-field-empty` : ``}`;

  if (!enabled) return <>{children}</>;

  return (
    <div
      id={id}
      role={`group`}
      aria-label={label}
      ref={field.rootRef}
      onBlur={field.onBlur}
      onKeyDown={field.onKeyDown}
      onKeyDownCapture={field.onKeyDownCapture}
      className={`settings-field${field.editing ? ` settings-field-editing` : ``}${invalid ? ` settings-field-invalid` : ``}${readOnly ? ` settings-field-read-only` : ``}`}
    >
      {field.editing && !readOnly ? (
        <div id={`${id}-editor`} className={`settings-field-editor`}>
          <div ref={field.editorRef} id={`${id}-controls`} className={`settings-field-editor-controls`}>
            {children}
          </div>
          <button
            type={`button`}
            id={`${id}-done`}
            disabled={disabled}
            onClick={() => field.close()}
            className={`settings-field-done`}
            aria-label={`Done Editing ${label}`}
          >
            <Check size={12} aria-hidden={`true`} id={`${id}-done-icon`} className={`settings-field-done-icon`} />
            <span id={`${id}-done-label`} className={`settings-field-done-label`}>
              {`Done`}
            </span>
          </button>
        </div>
      ) : readOnly ? (
        <div id={`${id}-preview`} className={`settings-field-preview`}>
          <span id={`${id}-value`} className={valueClass}>
            {displayValue}
          </span>
        </div>
      ) : (
        <button
          type={`button`}
          disabled={disabled}
          onClick={field.open}
          id={`${id}-trigger`}
          ref={field.triggerRef}
          aria-invalid={invalid}
          aria-expanded={field.editing}
          aria-label={`Edit ${label}`}
          aria-controls={`${id}-editor`}
          aria-describedby={`${id}-value`}
          className={`settings-field-preview settings-field-trigger`}
        >
          <span id={`${id}-value`} className={valueClass}>
            {displayValue}
          </span>
          <Pencil size={13} aria-hidden={`true`} id={`${id}-edit-icon`} className={`settings-field-edit-icon`} />
        </button>
      )}
    </div>
  );
};

export default SettingsField;
