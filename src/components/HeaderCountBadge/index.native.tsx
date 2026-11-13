import { Text, View } from 'react-native';
import { styles } from './styles.native';
import type { HeaderCountBadgeProps } from './types';
import { useAuth } from '../../shared/authContext/useAuth';
import { useTheme } from '../../shared/themeContext/useTheme';
import { getAccountBadgeColors } from '../../shared/common/badges';

const HeaderCountBadge = ({ id, count, textId = `${id}-text`, loading }: HeaderCountBadgeProps) => {
  const { user } = useAuth();
  const { palette } = useTheme();
  const { color, backgroundColor } = getAccountBadgeColors(user);

  return (
    <View
      testID={id}
      nativeID={id}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility={`no-hide-descendants`}
      style={[styles.badge, { borderColor: palette.paper, backgroundColor: loading ? palette.skeleton : backgroundColor }]}
    >
      <Text testID={textId} nativeID={textId} style={[styles.label, { color }]}>{loading ? null : count}</Text>
    </View>
  );
};

export default HeaderCountBadge;
