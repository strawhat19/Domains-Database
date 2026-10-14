import { useRef, useState, useEffect, useCallback } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { isMobileSheet } from '../MobileSheet/useMobileSheet';
import { portfolioHaptic } from '../../shared/common/haptics.web';

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
  const pendingBlurRef = useRef(false);
  const pointerRef = useRef<number | null>(null);
  const [editing, setEditing] = useState(false);

  const open = () => {
    if (disabled || readOnly || !enabled) return;
    if (isMobileSheet() && rootRef.current?.closest(`.mobile-sheet-backdrop`)) portfolioHaptic(`tap`);
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
    if (isMobileSheet() && pointerRef.current !== null) {
      pendingBlurRef.current = true;
      return;
    }
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
    const closeOutside = (event: Event) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) close(false);
    };
    if (!isMobileSheet()) {
      document.addEventListener(`pointerdown`, closeOutside);
      return () => document.removeEventListener(`pointerdown`, closeOutside);
    }
    let releaseTimer: number | undefined;
    const settlePointer = (keepEditing = false) => {
      window.clearTimeout(releaseTimer);
      pointerRef.current = null;
      const blurred = pendingBlurRef.current;
      pendingBlurRef.current = false;
      if (blurred && !keepEditing && !rootRef.current?.contains(document.activeElement)) close(false);
    };
    const beginPointer = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      window.clearTimeout(releaseTimer);
      pointerRef.current = event.pointerId;
    };
    const releasePointer = (event: PointerEvent) => {
      if (pointerRef.current !== event.pointerId) return;
      // Compatibility clicks can follow touch release; keep the layout stable until then.
      releaseTimer = window.setTimeout(() => settlePointer(), 400);
    };
    const cancelPointer = (event: PointerEvent) => {
      if (pointerRef.current === event.pointerId) settlePointer();
    };
    const completeClick = (event: MouseEvent) => {
      const inside = event.target instanceof Node && Boolean(rootRef.current?.contains(event.target));
      settlePointer(inside);
      if (!inside) close(false);
    };
    const keyboard = (event: globalThis.KeyboardEvent) => {
      if (event.key === `Tab`) settlePointer();
    };
    document.addEventListener(`click`, completeClick, true);
    document.addEventListener(`keydown`, keyboard, true);
    document.addEventListener(`pointerup`, releasePointer, true);
    document.addEventListener(`pointerdown`, beginPointer, true);
    document.addEventListener(`pointercancel`, cancelPointer, true);
    return () => {
      window.clearTimeout(releaseTimer);
      pointerRef.current = null;
      pendingBlurRef.current = false;
      document.removeEventListener(`click`, completeClick, true);
      document.removeEventListener(`keydown`, keyboard, true);
      document.removeEventListener(`pointerup`, releasePointer, true);
      document.removeEventListener(`pointerdown`, beginPointer, true);
      document.removeEventListener(`pointercancel`, cancelPointer, true);
    };
  }, [close, editing]);

  return { open, close, onBlur, editing, rootRef, editorRef, onKeyDown, triggerRef, onKeyDownCapture };
};
