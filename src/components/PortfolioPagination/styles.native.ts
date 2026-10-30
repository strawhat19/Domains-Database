import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  disabled: { opacity: .45 },
  row: { gap: 8, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center` },
  pagination: { gap: 10, padding: 14, borderWidth: 1, borderRadius: 8, borderColor: palette.line, backgroundColor: palette.paper },
  button: { gap: 5, minHeight: 44, paddingHorizontal: 12, borderWidth: 1, borderRadius: 6, borderColor: palette.line, flexDirection: `row`, alignItems: `center`, justifyContent: `center` },
  sizeButton: { minWidth: 44, minHeight: 44, paddingHorizontal: 10, borderWidth: 1, borderRadius: 6, borderColor: palette.line, alignItems: `center`, justifyContent: `center` },
  activeButton: { borderColor: palette.accent, backgroundColor: palette.subtle },
  label: { color: palette.muted, fontSize: 11, fontFamily: `DMSans_500Medium` },
  page: { minWidth: 42, textAlign: `center`, color: palette.muted, fontSize: 11, fontFamily: `DMSans_500Medium` },
  summary: { color: palette.muted, fontSize: 11, lineHeight: 18, fontFamily: `DMSans_400Regular` },
  buttonText: { color: palette.ink, fontSize: 11, fontFamily: `DMSans_600SemiBold` },
  activeText: { color: palette.accent },
});
