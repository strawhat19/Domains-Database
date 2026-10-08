import type { ViewStyle } from 'react-native';
import { Platform, StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { right: 20, zIndex: 35, position: `absolute` },
  button: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 22,
    alignItems: `center`,
    justifyContent: `center`,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    ...Platform.select<ViewStyle>({
      web: { boxShadow: `0px 4px 8px color-mix(in srgb, ${palette.ink} 12%, transparent)` },
      default: { elevation: 4, shadowRadius: 8, shadowOpacity: .12, shadowColor: palette.ink, shadowOffset: { width: 0, height: 4 } },
    }),
  },
  pressed: { backgroundColor: palette.subtle },
});
