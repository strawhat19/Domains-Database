import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  icon: { marginTop: 2 },
  feature: { gap: 8, flexDirection: `row`, alignItems: `flex-start` },
  content: { gap: 5, flex: 1, minWidth: 0 },
  label: { fontSize: 11, lineHeight: 17, color: palette.ink, fontFamily: `DMSans_400Regular` },
});
