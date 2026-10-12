import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  row: { borderBottomWidth: 1, borderBottomColor: palette.line, flexDirection: `row`, alignItems: `flex-start` },
  cell: { paddingVertical: 16, paddingHorizontal: 12 },
  numberBadge: { alignSelf: `flex-start`, paddingVertical: 3, paddingHorizontal: 5, borderRadius: 4, backgroundColor: palette.subtle, color: palette.accent, fontSize: 10, fontFamily: `DMSans_500Medium` },
  identity: { gap: 13, flexDirection: `row`, alignItems: `flex-start` },
  thumbnail: { width: 36, height: 36, borderWidth: 1, borderRadius: 18, borderColor: palette.line, backgroundColor: palette.subtle, alignItems: `center`, justifyContent: `center` },
  copy: { flex: 1, minWidth: 0 },
  featureList: { gap: 5 },
  score: { gap: 6, flexDirection: `row`, alignItems: `center` },
  highlighted: { gap: 5, marginTop: 8, flexDirection: `row`, alignItems: `center` },
  highlightedLabel: { fontSize: 9, color: palette.accent, fontFamily: `DMSans_400Regular` },
  title: { marginBottom: 6, fontSize: 11, color: palette.ink, fontFamily: `DMSans_600SemiBold` },
  slug: { marginBottom: 6, fontSize: 10, color: palette.muted, fontFamily: `DMSans_400Regular` },
  body: { fontSize: 10, lineHeight: 16, color: palette.muted, fontFamily: `DMSans_400Regular` },
  label: { fontSize: 10, lineHeight: 16, color: palette.muted, fontFamily: `DMSans_400Regular` },
  actionsCell: { gap: 6, flexDirection: `row`, justifyContent: `flex-end`, alignItems: `center` },
  rowStatus: { gap: 4, minHeight: 26, flexDirection: `row`, alignItems: `center` },
  statusDotWrap: { width: 16, height: 16, alignItems: `center`, justifyContent: `center` },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: `DMSans_400Regular` },
  action: { width: 30, height: 26, borderRadius: 5, backgroundColor: palette.subtle, alignItems: `center`, justifyContent: `center` },
  disabled: { opacity: .5 },
  confirmation: { gap: 9, marginTop: 14, padding: 12, borderWidth: 1, borderRadius: 9, borderColor: palette.warning, backgroundColor: palette.paper },
  archiveTitle: { fontSize: 10, lineHeight: 16, color: palette.ink, fontFamily: `DMSans_600SemiBold` },
  archiveNote: { fontSize: 9, lineHeight: 15, color: palette.muted, fontFamily: `DMSans_400Regular` },
});
