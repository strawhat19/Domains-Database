import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { right: 20, zIndex: 35, position: `absolute` },
  button: {
    width: 44,
    height: 44,
    elevation: 4,
    borderWidth: 1,
    borderRadius: 6,
    shadowRadius: 8,
    shadowOpacity: .12,
    alignItems: `center`,
    shadowColor: palette.ink,
    justifyContent: `center`,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    shadowOffset: { width: 0, height: 4 },
  },
  pressed: { backgroundColor: palette.subtle },
});
