import type { LucideIcon } from 'lucide-react';

export interface SegmentedOption<Value extends string> {
  value: Value;
  label: string;
  Icon?: LucideIcon;
  disabled?: boolean;
}

export interface SegmentedControlProps<Value extends string> {
  id: string;
  value: Value;
  label?: string;
  disabled?: boolean;
  className?: string;
  labelledBy?: string;
  describedBy?: string;
  onChange: (value: Value) => void;
  options: readonly SegmentedOption<Value>[];
}
