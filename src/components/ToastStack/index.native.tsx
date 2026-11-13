import { useRef } from 'react';
import { styles } from './styles.native';
import ToastStackItem from '../ToastStackItem';
import type { ToastStackProps } from './types';
import { useToastAnchor } from '../Toast/useToastAnchor';
import { elementProps } from '../../shared/elementProps';
import { View, Platform, ScrollView, useWindowDimensions } from 'react-native';

const ToastStack = ({ scope, notices, onDismiss, children }: ToastStackProps) => {
  const entryTimeline = useRef({ nextAt: 0 }).current;
  const { height } = useWindowDimensions();
  const anchor = useToastAnchor(720);
  const maxHeight = Math.max(0, height - 48);
  if (!notices.length && !children) return null;
  return (
    <View
      {...elementProps(`toast-stack`, scope)}
      style={[styles.root, { maxHeight }, anchor.style]}
      {...(Platform.OS === `web` ? { dataSet: { class: `toast-stack`, toastPlacement: anchor.placement } } : {})}
    >
      <ScrollView
        nestedScrollEnabled
        keyboardShouldPersistTaps={`handled`}
        contentContainerStyle={styles.content}
        style={[styles.scroll, { maxHeight }]}
        {...elementProps(`toast-stack-scroll`, scope)}
      >
        {!!children && <View {...elementProps(`toast-stack-feedback`, scope)} style={notices.length ? styles.feedback : undefined}>{children}</View>}
        {notices.map(notice => (
          <ToastStackItem
            scope={scope}
            key={notice.id}
            notice={notice}
            onDismiss={onDismiss}
            entryTimeline={entryTimeline}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default ToastStack;
