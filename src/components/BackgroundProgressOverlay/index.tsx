import ProgressToasts from '../ProgressToasts';
import { useBackgroundProgressTasks } from '../../shared/backgroundProgress/BackgroundProgressContext';

const BackgroundProgressOverlay = ({ headerHeight, scrollToTopVisible }: { headerHeight?: number; scrollToTopVisible: boolean }) => {
  const tasks = useBackgroundProgressTasks();
  return <ProgressToasts tasks={tasks} headerHeight={headerHeight} scrollToTopVisible={scrollToTopVisible} />;
};

export default BackgroundProgressOverlay;
