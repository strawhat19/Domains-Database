import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  rank: { width: 16, color: palette.muted, fontSize: 12, fontFamily: `DMSans_700Bold` },
  person: { gap: 3, flex: 1, minWidth: 0 },
  name: { color: palette.ink, fontSize: 12, fontFamily: `DMSans_600SemiBold` },
  xp: { color: palette.accent, fontSize: 10, fontFamily: `DMSans_700Bold` },
  title: { color: palette.ink, fontSize: 15, fontFamily: `DMSans_700Bold` },
  caption: { color: palette.muted, fontSize: 10, lineHeight: 18, fontFamily: `DMSans_400Regular` },
  heading: { gap: 8, flexDirection: `row`, alignItems: `center` },
  row: { gap: 8, paddingVertical: 8, flexDirection: `row`, alignItems: `center` },
  root: { gap: 12, padding: 18, borderWidth: 1, borderRadius: 10, borderColor: palette.line, backgroundColor: palette.paper },
});
