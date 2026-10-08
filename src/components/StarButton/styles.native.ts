import type { ViewStyle } from 'react-native';
import { Platform, StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  button: { flexShrink: 0, borderRadius: 6, alignItems: `center`, justifyContent: `center` },
  pressed: { backgroundColor: palette.input },
  disabled: { opacity: .55 },
  starred: {
    backgroundColor: `#fbbf240d`,
    ...Platform.select<ViewStyle>({
      web: { boxShadow: `0 0 8px #fbbf2499` },
      default: { elevation: 2, shadowRadius: 6, shadowOpacity: .65, shadowColor: `#fbbf24`, shadowOffset: { width: 0, height: 0 } },
    }),
  },
});
