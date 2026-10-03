import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { gap: 12, paddingBottom: 18 },
  button: { gap: 8, maxWidth: `100%`, minHeight: 44, paddingHorizontal: 14, borderWidth: 1, borderRadius: 8, alignSelf: `flex-start`, alignItems: `center`, flexDirection: `row`, borderColor: palette.line, backgroundColor: palette.subtle },
  label: { flexShrink: 1, color: palette.accent, fontSize: 12, fontFamily: `DMSans_600SemiBold` },
  prompt: { gap: 8, padding: 14, borderRadius: 8, backgroundColor: palette.input },
  copy: { color: palette.muted, fontSize: 12, lineHeight: 19, fontFamily: `DMSans_400Regular` },
  links: { gap: 14, flexDirection: `row`, flexWrap: `wrap` },
  link: { gap: 5, minHeight: 44, maxWidth: `100%`, flexDirection: `row`, alignItems: `center` },
  disabled: { opacity: 0.5 },
});
