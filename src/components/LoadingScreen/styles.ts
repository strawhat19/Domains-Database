import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  copy: { gap: 10, marginTop: 28 },
  logo: { width: 228, height: 60, maxWidth: `100%` },
  label: { color: palette.muted, fontSize: 12, letterSpacing: .2 },
  dot: { width: 8, height: 8, margin: 6, borderRadius: 4, backgroundColor: palette.accent },
  title: { color: palette.ink, fontSize: 25, lineHeight: 32, letterSpacing: -.7, fontWeight: `600` },
  description: { color: palette.muted, fontSize: 13, lineHeight: 22, maxWidth: 260 },
  status: { gap: 10, marginTop: 32, paddingTop: 22, borderTopWidth: 1, borderTopColor: palette.line, flexDirection: `row`, alignItems: `center` },
  screen: { flex: 1, padding: 24, alignItems: `center`, justifyContent: `center`, backgroundColor: palette.canvas },
  card: { width: `100%`, maxWidth: 390, padding: 32, borderWidth: 1, borderRadius: 18, borderColor: palette.line, backgroundColor: palette.paper },
});
