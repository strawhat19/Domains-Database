import type { BackgroundProgressTask } from '../../shared/backgroundProgress/BackgroundProgressContext';

export type ProgressToastTask = BackgroundProgressTask;

export interface ProgressToastsProps {
  headerHeight?: number;
  scrollToTopVisible?: boolean;
  tasks: readonly ProgressToastTask[];
}
