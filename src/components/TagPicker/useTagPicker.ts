import { useEffect, useState } from 'react';
import type { TagPickerProps } from './types';
import { normalizeDomainTags } from '../../shared/domainTags';
import type { DomainTag } from '../../shared/domainTags';

export const useTagPicker = ({ value, onChange, disabled = false }: TagPickerProps) => {
  const [open, setOpen] = useState(false);
  const tags = normalizeDomainTags(value);
  const close = () => setOpen(false);
  const toggle = () => { if (!disabled) setOpen(current => !current); };
  const choose = (tag: DomainTag) => {
    if (disabled) return;
    onChange(tags.includes(tag) ? tags.filter(value => value !== tag) : [...tags, tag]);
  };

  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

  return { open, tags, close, toggle, choose, setOpen };
};
