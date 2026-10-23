import type { ReactNode } from 'react';

export type StatePanelIcon = `domains` | `search` | `lock` | `watching` | `community` | `auction` | `planned` | `error` | `notifications`;

export interface StatePanelProps {
  id: string;
  title: string;
  description: string;
  alert?: boolean;
  badge?: string;
  detail?: string;
  eyebrow?: string;
  children?: ReactNode;
  icon?: StatePanelIcon;
  variant?: `page` | `inline`;
}
