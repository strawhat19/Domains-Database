import type { LucideIcon } from 'lucide-react';

export interface ModalTabOption<Tab extends string> {
  id: Tab;
  label: string;
  Icon: LucideIcon;
  count?: number;
}

export interface ModalTabsProps<Tab extends string> {
  id: string;
  value: Tab;
  label: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onChange: (value: Tab) => void;
  options: readonly ModalTabOption<Tab>[];
}
