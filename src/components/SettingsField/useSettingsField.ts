import { useRef, useState, useEffect, useCallback } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';

interface SettingsFieldInput {
  invalid?: boolean;
  enabled?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
}

const focusFirstControl = (editor: HTMLDivElement | null) => {
  const controls = editor?.querySelectorAll<HTMLElement>(
    `input:not(:disabled):not([type='hidden']), textarea:not(:disabled), select:not(:disabled), button:not(:disabled), [contenteditable='true'], [role='combobox'][tabindex]:not([aria-disabled='true'])`,
  );
  const control = Array.from(controls ?? []).find(element => !element.closest(`[hidden], [aria-hidden='true'], [aria-disabled='true']`));
  control?.focus({ preventScroll: true });
};

export const useSettingsField = ({ invalid = false, enabled = true, readOnly = false, disabled = false }: SettingsFieldInput) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(false);
  const [editing, setEditing] = useState(false);

  const open = () => {
    if (disabled || readOnly || !enabled) return;
    restoreFocusRef.current = false;
    setEditing(true);
  };

  const close = useCallback((restoreFocus = true) => {
    const invalidControl = editorRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      `input:invalid, textarea:invalid, select:invalid`,
    );
    if (invalidControl) {
      if (restoreFocus) invalidControl.reportValidity();
      return;
    }
    restoreFocusRef.current = restoreFocus;
    setEditing(false);
  }, []);

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!editing || event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    close(false);
  };

  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!editing || event.key !== `Escape`) return;
    event.stopPropagation();
    if (event.nativeEvent.isComposing) return;
    event.preventDefault();
    close();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!editing || event.defaultPrevented || event.key !== `Enter` || event.nativeEvent.isComposing) return;
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || [`button`, `submit`, `reset`].includes(target.type)) return;
    if (target.closest(`[role='button'], [role='combobox'], [role='listbox'], [role='menu'], [aria-haspopup]`)) return;
    event.preventDefault();
    event.stopPropagation();
    close();
  };

  useEffect(() => {
    if (!enabled || readOnly) {
      restoreFocusRef.current = false;
      setEditing(false);
    } else if (invalid && !disabled) {
      setEditing(true);
      focusFirstControl(editorRef.current);
    }
  }, [invalid, enabled, readOnly, disabled]);

  useEffect(() => {
    if (editing && !disabled) focusFirstControl(editorRef.current);
    else if (!editing && restoreFocusRef.current) {
      restoreFocusRef.current = false;
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [editing, disabled]);

  useEffect(() => {
    if (!editing) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) close(false);
    };
    document.addEventListener(`pointerdown`, closeOutside);
    return () => document.removeEventListener(`pointerdown`, closeOutside);
  }, [close, editing]);

  return { open, close, onBlur, editing, rootRef, editorRef, onKeyDown, triggerRef, onKeyDownCapture };
};
