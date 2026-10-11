import './styles.scss';
import { useRef } from 'react';
import type { EditorModalProps } from './types';
import { useEditorModal } from './useEditorModal.web';

const EditorModal = ({ id, busy, error, onClose, children, labelledBy }: EditorModalProps) => {
  const backdropPress = useRef(false);
  const { closing, dismiss, expanded, dialogRef } = useEditorModal(onClose);
  return <dialog
    id={id}
    ref={dialogRef}
    aria-busy={busy}
    aria-modal={`true`}
    aria-labelledby={labelledBy}
    className={`admin-plan-editor-modal${expanded ? ` is-open` : ``}`}
    onCancel={event => { event.preventDefault(); if (!busy) dismiss(); }}
    onPointerDown={event => { backdropPress.current = event.target === event.currentTarget; }}
    onClick={event => { if (!busy && backdropPress.current && event.target === event.currentTarget) dismiss(); }}
  >
    <div id={`${id}-panel`} className={`admin-plan-editor-modal-panel`}>
      <div id={`${id}-content`} className={`admin-plan-editor-modal-content`} inert={closing}>
        {!!error && <p id={`${id}-error`} className={`admin-plan-editor-modal-error`} role={`alert`}>{error}</p>}
        {children(dismiss)}
      </div>
    </div>
  </dialog>;
};

export default EditorModal;
