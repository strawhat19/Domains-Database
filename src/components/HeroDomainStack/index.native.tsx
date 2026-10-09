import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { heroExtensions } from './content';
import StackPillShape from '../StackPillShape';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';

const HeroDomainStack = ({ compact = false }: { compact?: boolean }) => {
  const { isDark, palette } = useTheme();
  const styles = useMemo(() => createStyles(palette, isDark), [palette, isDark]);
  return (
    <View
      accessible={false}
      pointerEvents={`none`}
      accessibilityElementsHidden
      importantForAccessibility={`no-hide-descendants`}
      {...elementProps(`hero-domain-stack`)}
      style={[styles.stack, compact && styles.compactStack]}
    >
      {heroExtensions.map(extension => (
        <View key={extension} {...elementProps(`hero-domain-stack-tile`, extension)} style={[styles.tile, compact && styles.compactTile]}>
          <StackPillShape sharp fill={palette.ink} stroke={`transparent`} id={`hero-domain-stack-shape-${extension}`} />
          <Text {...elementProps(`hero-domain-stack-label`, extension)} style={[styles.label, compact && styles.compactLabel]}>{`.${extension}`}</Text>
          <View {...elementProps(`hero-domain-stack-dot`, extension)} style={styles.dot} />
        </View>
      ))}
    </View>
  );
};

export default HeroDomainStack;
