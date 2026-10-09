import Toast from '../Toast';
import { styles } from './styles.native';
import type { ToastStackItemProps } from './types';
import { Animated, Platform } from 'react-native';
import { useToastStackItem } from './useToastStackItem';
import { elementProps } from '../../shared/elementProps';

const ToastStackItem = ({ scope, notice, onDismiss, entryTimeline }: ToastStackItemProps) => {
  const state = useToastStackItem({ notice, onDismiss, entryTimeline });
  const itemScope = `${scope}-${notice.id}`;
  return (
    <Animated.View
      accessible={false}
      {...elementProps(`toast-stack-item`, itemScope)}
      accessibilityElementsHidden={!state.visible}
      importantForAccessibility={state.visible ? `auto` : `no-hide-descendants`}
      style={[styles.root, { height: state.height, pointerEvents: state.visible ? `auto` : `none` }]}
      {...(Platform.OS === `web` ? { inert: !state.visible, 'aria-hidden': !state.visible } : {})}
    >
      <Animated.View
        onLayout={state.onLayout}
        {...elementProps(`toast-stack-item-content`, itemScope)}
        style={[styles.content, { opacity: state.opacity, transform: [{ translateX: state.translateX }] }]}
      >
        <Toast inline id={itemScope} message={notice.message} onDismiss={state.dismiss} kind={notice.reminder ? `reminder` : `success`} />
      </Animated.View>
    </Animated.View>
  );
};

export default ToastStackItem;
