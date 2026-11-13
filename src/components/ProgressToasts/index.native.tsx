import { useMemo } from 'react';
import ProgressToast from './ProgressToast';
import { Platform, View } from 'react-native';
import { createStyles } from './styles.native';
import type { ProgressToastsProps } from './types';
import { useToastAnchor } from '../Toast/useToastAnchor';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';

const ProgressToasts = ({ tasks, headerHeight, scrollToTopVisible }: ProgressToastsProps) => {
  const anchor = useToastAnchor(340, headerHeight, scrollToTopVisible);
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  if (!tasks.length) return null;

  return (
    <View
      style={[styles.stack, anchor.style]}
      {...elementProps(`progress-toast-stack`)}
      {...(Platform.OS === `web` ? { dataSet: { class: `progress-toast-stack`, toastPlacement: anchor.placement, scrollToTop: scrollToTopVisible ? `true` : undefined } } : {})}
    >
      {tasks.map(task => <ProgressToast key={task.id} task={task} palette={palette} styles={styles} />)}
    </View>
  );
};

export default ProgressToasts;
