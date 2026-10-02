import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: `center`,
    justifyContent: `center`,
    borderColor: palette.line,
    backgroundColor: palette.paper,
  },
  pressed: { backgroundColor: palette.subtle },
});
