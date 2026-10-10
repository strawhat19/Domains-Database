import { useRef, useState, useEffect } from 'react';
import type { KeyboardEvent } from 'react';

interface DomainDescriptionInput {
  value?: string;
  busy?: boolean;
  onSave: (value: string) => Promise<boolean>;
}

export const useDomainDescription = ({ onSave, value = ``, busy = false }: DomainDescriptionInput) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savingRef = useRef(false);
  const restoreFocusRef = useRef(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [compact, setCompact] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const disabled = busy || saving;

  const edit = () => {
    if (disabled) return;
    setCompact(Boolean(rootRef.current?.closest(`.domain-row, .portfolio-group-heading-row, .portfolio-group-heading-collapsed, .portfolio-collection-heading-row`)));
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
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
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

  return {
    edit,
    save,
    draft,
    cancel,
    saving,
    compact,
    rootRef,
    editing,
    disabled,
    setDraft,
    saveError,
    onKeyDown,
    triggerRef,
    textareaRef,
    dismissError: () => setSaveError(false),
  };
};
