import type { TextProps, TextStyle, StyleProp } from 'react-native';

export interface ResponsiveDomainHeadingProps {
  id: string;
  htmlFor?: string;
  fullText: string;
  shortText: string;
  className?: string;
  forceCompact?: boolean;
  style?: StyleProp<TextStyle>;
  accessibilityRole?: TextProps['accessibilityRole'];
}
