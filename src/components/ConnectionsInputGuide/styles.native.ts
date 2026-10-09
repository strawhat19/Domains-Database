import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  icon: { flexShrink: 0 },
  content: { gap: 8, minWidth: 0, paddingRight: 1 },
  heading: { gap: 8, flexDirection: `row`, alignItems: `center` },
  guide: { gap: 6, minWidth: 0, padding: 12, borderWidth: 1, borderRadius: 8, borderColor: palette.line, backgroundColor: palette.input },
  title: { flex: 1, minWidth: 0, fontSize: 12, color: palette.ink, fontFamily: `DMSans_600SemiBold` },
  copy: { color: palette.muted, fontSize: 11, lineHeight: 17, fontFamily: `DMSans_400Regular` },
});
