import { useRef, useState, useEffect } from 'react';
import type { KeyboardEvent } from 'react';

interface DomainDescriptionInput {
  value?: string;
  busy?: boolean;
  onSave: (value: string) => Promise<boolean>;
}

export const useDomainDescription = ({ onSave, value = ``, busy = false }: DomainDescriptionInput) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const readMoreRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savingRef = useRef(false);
  const restoreFocusRef = useRef(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const disabled = busy || saving;

  const edit = () => {
    if (disabled) return;
    setDraft(value);
    setSaveError(false);
    setEditing(true);
  };

  const cancel = () => {
    if (disabled) return;
    restoreFocusRef.current = true;
    setSaveError(false);
    setEditing(false);
  };

  const save = async () => {
    if (busy || savingRef.current) return;
    const description = draft.trim();
    if (description === value.trim()) {
      cancel();
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setSaveError(false);
    try {
      if (await onSave(description)) {
        restoreFocusRef.current = true;
        setEditing(false);
      } else setSaveError(true);
    } catch {
      setSaveError(true);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    event.stopPropagation();
    if (event.nativeEvent.isComposing) return;
    if (event.key === `Escape`) {
      event.preventDefault();
      cancel();
    } else if (event.key === `Enter` && !event.shiftKey) {
      event.preventDefault();
      void save();
    }
  };

  useEffect(() => {
    if (disabled) return;
    if (editing) {
      textareaRef.current?.focus({ preventScroll: true });
    } else if (restoreFocusRef.current) {
      restoreFocusRef.current = false;
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [disabled, editing]);

  useEffect(() => {
    if (editing || !value) {
      setTruncated(false);
      return;
    }
    let cancelled = false;
    const measure = () => {
      const root = rootRef.current;
      const text = textRef.current;
      if (cancelled || !root || !text || !root.clientWidth) return;
      const readMore = readMoreRef.current;
      const gap = parseFloat(window.getComputedStyle(root).columnGap) || 0;
      // Add back the button's reserved space so showing it cannot toggle truncation repeatedly.
      const fullWidth = text.clientWidth + (readMore ? readMore.offsetWidth + gap : 0);
      setTruncated(text.scrollWidth > fullWidth + 1);
    };
    const observer = typeof ResizeObserver === `undefined` ? null : new ResizeObserver(measure);
    if (rootRef.current) observer?.observe(rootRef.current);
    if (textRef.current) observer?.observe(textRef.current);
    measure();
    window.addEventListener(`resize`, measure);
    document.fonts?.addEventListener(`loadingdone`, measure);
    void document.fonts?.ready.then(measure);
    return () => {
      cancelled = true;
      observer?.disconnect();
      window.removeEventListener(`resize`, measure);
      document.fonts?.removeEventListener(`loadingdone`, measure);
    };
  }, [editing, value]);

  return {
    edit,
    save,
    draft,
    cancel,
    saving,
    rootRef,
    textRef,
    editing,
    disabled,
    setDraft,
    saveError,
    truncated,
    onKeyDown,
    triggerRef,
    textareaRef,
    readMoreRef,
  };
};
