import type { ReactNode } from 'react';

export interface EnvironmentFileDropZoneProps {
  scope: string;
  disabled: boolean;
  children: ReactNode;
  kind: `button` | `panel`;
  onFiles: (files: File[]) => void;
}
