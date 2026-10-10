import { useRef, useState, useEffect } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';

export interface PortfolioNameEditorInput {
  value: string;
  busy?: boolean;
  kind: `Group` | `Collection`;
  onSave: (value: string) => boolean | string;
  onEditingChange?: (editing: boolean) => void;
}

export const usePortfolioNameEditor = ({ value, kind, onSave, onEditingChange, busy = false }: PortfolioNameEditorInput) => {
  const rootRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const editingRef = useRef(false);
  const savingRef = useRef(false);
  const composingRef = useRef(false);
  const restoreFocusRef = useRef(false);
  const editingChangeRef = useRef(onEditingChange);
  const [draft, setDraftValue] = useState(value);
  const [error, setError] = useState(``);
  const [editing, setEditing] = useState(false);

  const finishEditing = (restoreFocus: boolean) => {
    editingRef.current = false;
    composingRef.current = false;
    restoreFocusRef.current = restoreFocus;
    setError(``);
    setEditing(false);
    editingChangeRef.current?.(false);
  };
  const edit = () => {
    if (busy || savingRef.current || editingRef.current) return;
    editingRef.current = true;
    restoreFocusRef.current = false;
    setDraftValue(value);
    setError(``);
    setEditing(true);
    editingChangeRef.current?.(true);
  };
  const cancel = () => {
    if (busy || savingRef.current || !editingRef.current) return;
    finishEditing(true);
  };
  const save = (restoreFocus = true) => {
    if (busy || savingRef.current || composingRef.current || !editingRef.current) return;
    const name = draft.trim();
    const showError = (message: string) => {
      setError(message);
      if (restoreFocus) inputRef.current?.focus({ preventScroll: true });
    };
    if (!name || name.length > 80) {
      showError(`Enter A ${kind} Name Between 1 And 80 Characters`);
      return;
    }
    if (name === value.trim()) {
      finishEditing(restoreFocus);
      return;
    }
    savingRef.current = true;
    setError(``);
    try {
      const result = onSave(name);
      if (result === true) finishEditing(restoreFocus);
      else showError(typeof result === `string` && result ? result : `Could Not Save ${kind} Name`);
    } catch {
      showError(`Could Not Save ${kind} Name`);
    } finally {
      savingRef.current = false;
    }
  };
  const setDraft = (value: string) => {
    if (busy) return;
    setError(``);
    setDraftValue(value);
  };
  const onBlur = (event: FocusEvent<HTMLSpanElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    save(false);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (!editingRef.current && (event.key === `ContextMenu` || event.key === `F10` && event.shiftKey)) return;
    event.stopPropagation();
    if (composingRef.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
    if (event.key === `Escape` && editingRef.current) {
      event.preventDefault();
      cancel();
    } else if (event.key === `Enter` && event.target === inputRef.current) {
      event.preventDefault();
      save();
    }
  };

  useEffect(() => {
    editingChangeRef.current = onEditingChange;
  }, [onEditingChange]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.select();
    } else if (restoreFocusRef.current) {
      restoreFocusRef.current = false;
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [editing]);

  useEffect(() => {
    const root = rootRef.current;
    return () => {
      if (editingRef.current) editingChangeRef.current?.(false);
      if (!restoreFocusRef.current) return;
      restoreFocusRef.current = false;
      const focused = document.activeElement;
      if (focused instanceof HTMLElement && focused !== document.body && focused.isConnected && !root?.contains(focused)) return;
      const trigger = root?.id ? document.getElementById(`${root.id}-edit`) : null;
      const destination = trigger?.isConnected && !trigger.matches(`:disabled`) ? trigger : document.getElementById(`portfolio-groups-button`);
      destination?.focus({ preventScroll: true });
    };
  }, []);

  return {
    edit,
    save,
    draft,
    error,
    cancel,
    onBlur,
    rootRef,
    editing,
    setDraft,
    inputRef,
    onKeyDown,
    triggerRef,
    disabled: busy,
    onCompositionEnd: () => { composingRef.current = false; },
    onCompositionStart: () => { composingRef.current = true; },
  };
};
