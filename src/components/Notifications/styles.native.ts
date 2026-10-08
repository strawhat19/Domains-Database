import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  page: { gap: 20, width: `100%`, maxWidth: 960, paddingTop: 32, paddingBottom: 44, alignSelf: `center` },
  intro: { gap: 16, marginBottom: 8 },
  list: { gap: 16, flexWrap: `wrap`, flexDirection: `row`, alignItems: `stretch` },
  title: { fontSize: 34, lineHeight: 41, letterSpacing: -1, color: palette.ink, fontFamily: `InstrumentSerif_400Regular` },
  wideTitle: { fontSize: 46, lineHeight: 54 },
  detail: { padding: 24, borderWidth: 1, borderRadius: 6, borderColor: palette.line, backgroundColor: palette.paper },
  detailText: { fontSize: 15, lineHeight: 28, color: palette.ink, fontFamily: `DMSans_400Regular` },
  description: { fontSize: 15, lineHeight: 26, color: palette.muted, fontFamily: `DMSans_400Regular` },
  eyebrow: { gap: 8, alignItems: `center`, flexDirection: `row` },
  eyebrowText: { fontSize: 10, letterSpacing: 1.5, color: palette.accent, fontFamily: `DMSans_700Bold` },
  count: { fontSize: 11, color: palette.muted, fontFamily: `DMSans_500Medium` },
  status: { fontSize: 14, lineHeight: 24, color: palette.muted, fontFamily: `DMSans_400Regular` },
  empty: { padding: 24, borderWidth: 1, borderRadius: 6, borderColor: palette.line, backgroundColor: palette.paper },
  error: { padding: 16, fontSize: 14, lineHeight: 24, borderWidth: 1, borderRadius: 6, color: palette.danger, borderColor: palette.danger, backgroundColor: palette.paper, fontFamily: `DMSans_400Regular` },
  back: { gap: 8, minHeight: 44, alignSelf: `flex-start`, alignItems: `center`, flexDirection: `row` },
  backText: { fontSize: 12, color: palette.muted, fontFamily: `DMSans_500Medium` },
  inlineLink: { color: palette.accent, textDecorationLine: `underline` },
  detailLoading: { gap: 12 },
  shortSkeletonLine: { width: `60%` },
  skeletonLine: { height: 15, width: `100%`, borderRadius: 3, backgroundColor: palette.skeleton },
});
