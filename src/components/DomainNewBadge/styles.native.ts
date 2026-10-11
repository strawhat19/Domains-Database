import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  badge: { gap: 3, height: 16, flexShrink: 0, paddingHorizontal: 5, borderRadius: 999, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.subtle, flexDirection: `row`, alignItems: `center` },
  text: { fontSize: 9, lineHeight: 12, color: palette.accent, fontFamily: `DMSans_600SemiBold` },
  compactBadge: { gap: 2, height: 14, paddingHorizontal: 4 },
  compactText: { fontSize: 8 },
});
