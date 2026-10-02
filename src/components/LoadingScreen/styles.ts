import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  label: { color: palette.muted, fontSize: 12 },
  screen: { flex: 1, gap: 18, alignItems: `center`, justifyContent: `center`, backgroundColor: palette.canvas },
});
