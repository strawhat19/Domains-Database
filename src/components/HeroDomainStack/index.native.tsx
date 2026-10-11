import { useMemo } from 'react';
import { heroExtensions } from './content';
import StackPillShape from '../StackPillShape';
import { createStyles } from './styles.native';
import { Text, View, Animated } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';

const HeroDomainStack = ({ loading = false, compact = false, skeletonOpacity }: { loading?: boolean; compact?: boolean; skeletonOpacity?: Animated.Value }) => {
  const { isDark, palette } = useTheme();
  const styles = useMemo(() => createStyles(palette, isDark), [palette, isDark]);
  return (
    <Animated.View
      accessible={false}
      pointerEvents={`none`}
      accessibilityElementsHidden
      importantForAccessibility={`no-hide-descendants`}
      {...elementProps(`hero-domain-stack`)}
      style={[styles.stack, compact && styles.compactStack, loading && { opacity: skeletonOpacity ?? 1 }]}
    >
      {heroExtensions.map(extension => (
        <View key={extension} {...elementProps(loading ? `hero-domain-stack-skeleton` : `hero-domain-stack-tile`, extension)} style={[styles.tile, compact && styles.compactTile]}>
          <StackPillShape sharp fill={loading ? palette.skeleton : palette.ink} stroke={`transparent`} id={`hero-domain-stack-${loading ? `skeleton-` : ``}shape-${extension}`} />
          {!loading && (
            <>
              <Text {...elementProps(`hero-domain-stack-label`, extension)} style={[styles.label, compact && styles.compactLabel]}>{`.${extension}`}</Text>
              <View {...elementProps(`hero-domain-stack-dot`, extension)} style={styles.dot} />
            </>
          )}
        </View>
      ))}
    </Animated.View>
  );
};

export default HeroDomainStack;
