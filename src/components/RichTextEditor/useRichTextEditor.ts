import { useState } from 'react';
import { insertFormatting, MAX_POST_LENGTH, publicHttpsUrl, type EditorFormat } from '../../shared/social/content';

export interface RichTextEditorProps { value: string; onChange: (value: string) => void; disabled?: boolean; scope?: string }

export const useRichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
  const [imageUrl, setImageUrl] = useState(``);
  const [imageOpen, setImageOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const format = (kind: EditorFormat) => {
    const result = insertFormatting(value, selection, kind);
    if (result.body.length > MAX_POST_LENGTH) { setError(`Post Is Too Long`); return; }
    onChange(result.body); setSelection(result.selection); setError(null);
  };
  const insertImage = () => {
    const url = publicHttpsUrl(imageUrl);
    if (!url) { setError(`Use A Public HTTPS Image URL`); return; }
    const next = `${value.trimEnd()}\n\n![Image](${url})\n`;
    if (next.length > MAX_POST_LENGTH) { setError(`Post Is Too Long`); return; }
    onChange(next); setImageUrl(``); setImageOpen(false); setError(null); setSelection({ start: next.length, end: next.length });
  };
  return { error, preview, selection, imageUrl, imageOpen, setPreview, setImageUrl, setImageOpen, setSelection, format, insertImage };
};
