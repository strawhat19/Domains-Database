import './styles.scss';
import Toast from '../Toast/index.web';
import { createPortal } from 'react-dom';
import { X, Check, Pencil } from 'lucide-react';
import { usePortfolioNameEditor } from './usePortfolioNameEditor';
import type { PortfolioNameEditorInput } from './usePortfolioNameEditor';

interface PortfolioNameEditorProps extends PortfolioNameEditorInput {
  id: string;
  className?: string;
}

const PortfolioNameEditor = ({ id, value, kind, busy, onSave, className, onEditingChange }: PortfolioNameEditorProps) => {
  const editor = usePortfolioNameEditor({ value, kind, busy, onSave, onEditingChange });
  const label = `Edit ${kind} Name: ${value}`;

  return (
    <span
      id={id}
      draggable={false}
      ref={editor.rootRef}
      onBlur={editor.onBlur}
      onKeyDown={editor.onKeyDown}
      onClick={event => event.stopPropagation()}
      onMouseDown={event => event.stopPropagation()}
      onPointerDown={event => event.stopPropagation()}
      onContextMenu={event => { if (editor.editing) event.stopPropagation(); }}
      className={`portfolio-name-editor${className ? ` ${className}` : ``}${editor.editing ? ` portfolio-name-editing` : ``}`}
      onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}
    >
      {editor.editing ? (
        <>
          <span id={`${id}-controls`} className={`portfolio-name-editor-controls`}>
            <input
              type={`text`}
              maxLength={80}
              autoComplete={`off`}
              id={`${id}-input`}
              value={editor.draft}
              ref={editor.inputRef}
              disabled={editor.disabled}
              aria-label={`${kind} Name`}
              title={editor.error || undefined}
              className={`portfolio-name-editor-input`}
              aria-invalid={Boolean(editor.error)}
              onCompositionEnd={editor.onCompositionEnd}
              onCompositionStart={editor.onCompositionStart}
              onChange={event => editor.setDraft(event.target.value)}
              aria-describedby={editor.error ? `${id}-error` : undefined}
            />
            <button
              type={`button`}
              id={`${id}-save`}
              onClick={() => editor.save()}
              disabled={editor.disabled}
              aria-label={`Save ${kind} Name`}
              title={`Save ${kind} Name`}
              className={`portfolio-name-editor-action portfolio-name-editor-save`}
              onMouseDown={event => { event.preventDefault(); event.stopPropagation(); }}
              onPointerDown={event => { event.preventDefault(); event.stopPropagation(); }}
            >
              <Check size={14} aria-hidden={`true`} id={`${id}-save-icon`} className={`portfolio-name-editor-action-icon`} />
            </button>
            <button
              type={`button`}
              id={`${id}-cancel`}
              onClick={editor.cancel}
              disabled={editor.disabled}
              aria-label={`Cancel ${kind} Name Edit`}
              title={`Cancel ${kind} Name Edit`}
              className={`portfolio-name-editor-action portfolio-name-editor-cancel`}
              onMouseDown={event => { event.preventDefault(); event.stopPropagation(); }}
              onPointerDown={event => { event.preventDefault(); event.stopPropagation(); }}
            >
              <X size={14} aria-hidden={`true`} id={`${id}-cancel-icon`} className={`portfolio-name-editor-action-icon`} />
            </button>
          </span>
          {editor.error && typeof document !== `undefined` && createPortal(
            <div id={`${id}-error`} className={`portfolio-name-editor-feedback`}>
              <Toast id={`${id}-error-toast`} message={editor.error} />
            </div>,
            document.body,
            `${id}-error-portal`,
          )}
        </>
      ) : (
        <button
          title={label}
          type={`button`}
          draggable={false}
          aria-label={label}
          id={`${id}-edit`}
          onClick={editor.edit}
          ref={editor.triggerRef}
          disabled={editor.disabled}
          className={`portfolio-name-editor-trigger`}
        >
          <span id={`${id}-text`} className={`portfolio-name-editor-value`}>{value}</span>
          <Pencil size={13} aria-hidden={`true`} id={`${id}-edit-icon`} className={`portfolio-name-editor-edit-icon`} />
        </button>
      )}
    </span>
  );
};

export default PortfolioNameEditor;
