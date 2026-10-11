import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { gap: 8 },
  roomy: { width: 220 },
  disabled: { opacity: .55 },
  options: { gap: 6, flex: 1, minWidth: 0, flexWrap: `wrap`, flexDirection: `row` },
  heading: { gap: 10, minWidth: 0, flexDirection: `row`, alignItems: `flex-start` },
  selected: { borderColor: palette.accent, backgroundColor: palette.subtle },
  title: { width: 48, paddingTop: 7, fontSize: 12, color: palette.muted, fontFamily: `DMSans_600SemiBold` },
  label: { fontSize: 11, color: palette.ink, fontFamily: `DMSans_400Regular` },
  copy: { fontSize: 11, lineHeight: 18, color: palette.muted, fontFamily: `DMSans_400Regular` },
  error: { fontSize: 12, lineHeight: 18, color: palette.danger, fontFamily: `DMSans_400Regular` },
  option: { gap: 5, minHeight: 30, paddingVertical: 5, paddingHorizontal: 6, borderWidth: 1, borderRadius: 8, borderColor: palette.line, flexDirection: `row`, alignItems: `center`, justifyContent: `center` },
});
