import type { DomainTag } from '../../shared/domainTags';

export interface TagPillsProps {
  id: string;
  value?: readonly DomainTag[];
}

export interface TagPickerProps extends TagPillsProps {
  label: string;
  disabled?: boolean;
  onChange: (tags: DomainTag[]) => void;
}
