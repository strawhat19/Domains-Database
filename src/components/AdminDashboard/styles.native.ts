import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { gap: 28, width: `100%`, alignItems: `flex-start`, flexDirection: `row` },
  compact: { gap: 24, paddingHorizontal: 18, paddingTop: 24, flexDirection: `column` },
  content: { flex: 1, minWidth: 0, paddingTop: 32, paddingRight: 24, paddingBottom: 48 },
  heading: { gap: 24, marginBottom: 28, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  headingCompact: { gap: 16, flexDirection: `column`, alignItems: `flex-start` },
  tableHeading: { gap: 20, marginBottom: 12 },
  headingCopy: { minWidth: 0 },
  eyebrow: { gap: 9, flexDirection: `row`, alignItems: `center` },
  eyebrowLine: { height: 1, width: 28, backgroundColor: palette.accent },
  eyebrowText: { color: palette.accent, fontSize: 10, letterSpacing: 1.5, fontFamily: `DMSans_500Medium` },
  titleRow: { gap: 12, marginTop: 15, marginBottom: 12, flexDirection: `row`, alignItems: `center` },
  title: { color: palette.ink, fontSize: 42, letterSpacing: -1.7, lineHeight: 49, fontFamily: `DMSans_700Bold` },
  copy: { color: palette.muted, fontSize: 12, lineHeight: 20, fontFamily: `DMSans_400Regular` },
  loading: { marginBottom: 18 },
  error: { fontSize: 12, lineHeight: 19, color: palette.danger, fontFamily: `DMSans_400Regular` },
  errorBox: { gap: 8, marginVertical: 16, paddingVertical: 12, paddingHorizontal: 15, borderWidth: 1, borderRadius: 8, borderColor: palette.danger, backgroundColor: palette.dangerBackground },
  analyticsViews: { gap: 4, alignSelf: `flex-start`, marginBottom: 18, padding: 4, borderWidth: 1, borderRadius: 9, borderColor: palette.line, backgroundColor: palette.subtle, flexDirection: `row`, flexWrap: `wrap` },
  analyticsView: { gap: 7, minHeight: 34, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 6, borderColor: `transparent`, flexDirection: `row`, alignItems: `center` },
  analyticsViewActive: { borderColor: palette.line, backgroundColor: palette.paper },
  analyticsViewText: { color: palette.muted, fontSize: 11, fontFamily: `DMSans_400Regular` },
});
