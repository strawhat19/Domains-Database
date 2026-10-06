import { styles } from './styles.native';
import { Text, View } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import type { ResponsiveDomainHeadingProps } from './types';
import { useResponsiveDomainHeading } from './useResponsiveDomainHeading.native';

const ResponsiveDomainHeading = ({ id, style, fullText, shortText, forceCompact, accessibilityRole }: ResponsiveDomainHeadingProps) => {
  const { compact, onTextLayout } = useResponsiveDomainHeading(forceCompact);

  return (
    <View {...elementProps(`responsive-domain-heading`, id)} style={styles.wrapper}>
      <Text {...elementProps(id)} style={style} accessibilityRole={accessibilityRole}>
        {compact ? shortText : fullText}
      </Text>
      <Text
        accessible={false}
        accessibilityElementsHidden
        onTextLayout={onTextLayout}
        style={[style, styles.probe]}
        importantForAccessibility={`no-hide-descendants`}
        {...elementProps(`responsive-domain-heading-probe`, id)}
      >
        {fullText}
      </Text>
    </View>
  );
};

export default ResponsiveDomainHeading;
