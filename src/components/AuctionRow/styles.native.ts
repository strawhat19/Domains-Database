import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  metric: { gap: 4, width: `46%` },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.muted },
  metrics: { gap: 16, flexWrap: `wrap`, flexDirection: `row` },
  identity: { gap: 9, flexDirection: `row`, alignItems: `center` },
  rowStatus: { gap: 4, flexDirection: `row`, alignItems: `center` },
  statusDotWrap: { width: 8, height: 8, alignItems: `center`, justifyContent: `center` },
  statusText: { fontSize: 10, color: palette.muted, fontFamily: `DMSans_500Medium` },
  domain: { flex: 1, fontSize: 17, color: palette.ink, fontFamily: `DMSans_700Bold` },
  source: { fontSize: 11, color: palette.muted, fontFamily: `DMSans_500Medium` },
  label: { fontSize: 10, color: palette.muted, fontFamily: `DMSans_500Medium` },
  value: { fontSize: 13, color: palette.ink, fontFamily: `DMSans_600SemiBold` },
  linkText: { fontSize: 11, color: palette.accent, fontFamily: `DMSans_600SemiBold` },
  sourceHeading: { gap: 10, flexWrap: `wrap`, flexDirection: `row`, justifyContent: `space-between` },
  actionsCell: { gap: 12, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center` },
  link: { gap: 4, minHeight: 40, flexDirection: `row`, alignItems: `center` },
  card: { gap: 15, padding: 18, borderWidth: 1, borderRadius: 8, borderColor: palette.line, backgroundColor: palette.paper },
});
