import { styles } from './styles.native';
import type { ReactNode } from 'react';
import { Animated, View } from 'react-native';
import { useNativeCollapse, type NativeCollapseState } from './useNativeCollapse';

interface Props {
  id: string;
  collapsed: boolean;
  children: ReactNode;
  onStateChange?: (state: NativeCollapseState) => void;
}

const PortfolioCollapse = ({ id, collapsed, children, onStateChange }: Props) => {
  const animation = useNativeCollapse(collapsed, onStateChange);
  const hidden = collapsed || !animation.interactive;
  return (
    <Animated.View
      nativeID={id}
      pointerEvents={hidden ? `none` : `auto`}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? `no-hide-descendants` : `auto`}
      style={[styles.collapse, { opacity: animation.opacity, height: animation.measuredHeight === null ? collapsed ? 0 : undefined : animation.height }]}
    >
      <View nativeID={`${id}-content`} style={styles.content} onLayout={animation.onContentLayout}>
        {children}
      </View>
    </Animated.View>
  );
};

export default PortfolioCollapse;
