import type { ReactNode } from 'react';

export interface EditorModalProps {
  id: string;
  busy: boolean;
  error?: string;
  labelledBy: string;
  onClose: () => void;
  children: (dismiss: () => void) => ReactNode;
}
