import type { ToastStackNotice } from '../ToastStack/types';

export interface ToastStackItemProps {
  scope: string;
  notice: ToastStackNotice;
  onDismiss: (id: string) => void;
  entryTimeline: { nextAt: number };
}
