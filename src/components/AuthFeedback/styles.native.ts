import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  connectionText: { fontSize: 12, color: palette.accent, fontFamily: `DMSans_600SemiBold` },
  connectionLink: { gap: 7, minHeight: 44, borderRadius: 6, alignSelf: `flex-start`, alignItems: `center`, flexDirection: `row` },
});
