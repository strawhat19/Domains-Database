import type { ReactNode } from 'react';

export interface ToastStackNotice {
  id: string;
  message: string;
  appearAt: number;
  dismissAt: number;
  reminder?: boolean;
}

export interface ToastStackProps {
  scope: string;
  children?: ReactNode;
  onDismiss: (id: string) => void;
  notices: readonly ToastStackNotice[];
}
