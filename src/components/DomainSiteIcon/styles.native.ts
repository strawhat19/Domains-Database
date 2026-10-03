import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  image: { position: `absolute` },
  compact: { borderWidth: 0, borderRadius: 2, backgroundColor: `transparent` },
  container: { flexShrink: 0, borderWidth: 1, borderRadius: 5, overflow: `hidden`, alignItems: `center`, justifyContent: `center`, borderColor: palette.line, backgroundColor: palette.canvas },
});
