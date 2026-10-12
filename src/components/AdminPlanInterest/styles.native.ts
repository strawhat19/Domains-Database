import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  section: { gap: 12, marginTop: 28 },
  count: { gap: 6, alignItems: `center`, flexDirection: `row` },
  counts: { gap: 16, flexWrap: `wrap`, flexDirection: `row` },
  heading: { gap: 12, flexWrap: `wrap`, alignItems: `center`, flexDirection: `row`, justifyContent: `space-between` },
  title: { fontSize: 22, color: palette.ink, fontFamily: `InstrumentSerif_400Regular` },
  countText: { fontSize: 12, color: palette.ink, fontFamily: `DMSans_400Regular` },
  planName: { fontSize: 14, color: palette.ink, fontFamily: `DMSans_600SemiBold` },
  description: { fontSize: 11, lineHeight: 18, color: palette.muted, fontFamily: `DMSans_400Regular` },
  error: { fontSize: 12, lineHeight: 18, color: palette.danger, fontFamily: `DMSans_400Regular` },
  refreshLabel: { fontSize: 12, color: palette.accent, fontFamily: `DMSans_600SemiBold` },
  row: { gap: 10, padding: 14, borderWidth: 1, borderRadius: 8, borderColor: palette.line, backgroundColor: palette.paper },
  refresh: { gap: 6, padding: 10, minHeight: 44, borderWidth: 1, borderRadius: 6, borderColor: palette.line, alignItems: `center`, flexDirection: `row` },
});
