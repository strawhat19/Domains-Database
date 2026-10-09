import { useEffect, useRef, useState } from 'react';
import type { TextInput, TextInputKeyPressEvent } from 'react-native';

interface NativeModalTitleInput {
  value: string;
  invalid?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export const useNativeModalTitle = ({ value, onChange, invalid = false, readOnly = false, disabled = false }: NativeModalTitleInput) => {
  const editorRef = useRef<TextInput>(null);
  const valueRef = useRef(value);
  const draftRef = useRef(value);
  const editingRef = useRef(false);
  const [draft, updateDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  const editable = !readOnly && !disabled;
  valueRef.current = value;
  const setDraft = (text: string) => {
    draftRef.current = text;
    updateDraft(text);
  };
  const getValue = () => (editingRef.current && editable ? draftRef.current : valueRef.current).replace(/[\r\n]+/g, ` `).trim();
  const open = () => {
    if (!editable) return;
    setDraft(value);
    editingRef.current = true;
    setEditing(true);
  };
  const finish = (accept: boolean) => {
    if (!editingRef.current) return;
    const nextValue = getValue();
    editingRef.current = false;
    if (accept && editable) {
      valueRef.current = nextValue;
      onChange(nextValue);
    }
    else setDraft(value);
    setEditing(false);
    editorRef.current?.blur();
  };
  const onKeyPress = (event: TextInputKeyPressEvent) => {
    if (![`Enter`, `Escape`].includes(event.nativeEvent.key)) return;
    event.preventDefault();
    event.stopPropagation();
    finish(event.nativeEvent.key === `Enter`);
  };

  useEffect(() => {
    if (editable) return;
    editingRef.current = false;
    setEditing(false);
  }, [editable]);

  useEffect(() => {
    if (!invalid || !editable) return;
    setDraft(value);
    editingRef.current = true;
    setEditing(true);
  }, [invalid, editable, value]);

  useEffect(() => {
    if (editing) editorRef.current?.focus();
  }, [editing]);

  return { open, draft, finish, editing, editable, setDraft, getValue, editorRef, onKeyPress };
};
