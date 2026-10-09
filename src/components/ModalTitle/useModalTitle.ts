import type { RefObject, KeyboardEvent } from 'react';
import { useRef, useState, useEffect, useLayoutEffect } from 'react';

interface ModalTitleInput {
  value: string;
  invalid?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  focusRequest?: number;
  onChange: (value: string) => void;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
}

export const useModalTitle = ({ value, onChange, inputRef, focusRequest = 0, invalid = false, readOnly = false, disabled = false }: ModalTitleInput) => {
  const ownInputRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = inputRef ?? ownInputRef;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const editingRef = useRef(false);
  const restoreFocusRef = useRef(false);
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  const editable = !disabled && !readOnly;

  const open = () => {
    if (!editable) return;
    setDraft(value);
    restoreFocusRef.current = false;
    editingRef.current = true;
    setEditing(true);
  };
  const finish = (accept: boolean, restoreFocus = true) => {
    if (!editingRef.current) return;
    editingRef.current = false;
    restoreFocusRef.current = restoreFocus;
    if (accept) onChange(draft.replace(/[\r\n]+/g, ` `).trim());
    setEditing(false);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (![`Enter`, `Escape`].includes(event.key)) return;
    if (event.key === `Escape`) event.stopPropagation();
    if (event.nativeEvent.isComposing) return;
    if (event.key === `Enter` && !(event.target instanceof HTMLTextAreaElement)) return;
    event.preventDefault();
    event.stopPropagation();
    finish(event.key === `Enter`);
  };

  useEffect(() => {
    if (!invalid || !editable) return;
    setDraft(value);
    editingRef.current = true;
    setEditing(true);
  }, [invalid, editable, value, focusRequest]);

  useEffect(() => {
    if (editable) return;
    editingRef.current = false;
    setEditing(false);
  }, [editable]);

  useLayoutEffect(() => {
    if (!editing) return;
    const input = editorRef.current;
    if (!input) return;
    input.style.height = `0px`;
    input.style.height = `${input.scrollHeight}px`;
  }, [draft, editing, editorRef]);

  useEffect(() => {
    if (editing) {
      editorRef.current?.focus({ preventScroll: true });
      editorRef.current?.select();
    } else if (restoreFocusRef.current) {
      restoreFocusRef.current = false;
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [editing, editorRef]);

  return { open, draft, finish, editing, editable, setDraft, editorRef, onKeyDown, triggerRef };
};
