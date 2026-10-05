import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  faded: { opacity: .55 },
  section: { gap: 10, minWidth: 0 },
  strip: { gap: 10 },
  inlineHeading: { flexShrink: 0 },
  inlineScroll: { flex: 1, minWidth: 0 },
  inlineTrack: { padding: 4 },
  inlineClear: { flexShrink: 0 },
  inlineLabel: { maxWidth: 280 },
  inlineRow: { flexWrap: `nowrap` },
  inlinePill: { maxWidth: 320, flexShrink: 0 },
  inlineTitleText: { fontSize: 11, color: palette.accent },
  inlineStrip: { gap: 12, minWidth: 0, flexDirection: `row`, alignItems: `center` },
  inlineSection: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderRadius: 10, borderColor: palette.line, backgroundColor: palette.paper },
  title: { gap: 7, flexDirection: `row`, alignItems: `center` },
  row: { gap: 8, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center` },
  clear: { gap: 5, paddingVertical: 6, flexDirection: `row`, alignItems: `center` },
  warning: { gap: 7, flexDirection: `row`, alignItems: `flex-start` },
  titleText: { fontSize: 10, color: palette.muted, fontFamily: `DMSans_600SemiBold` },
  clearText: { fontSize: 10, color: palette.muted, fontFamily: `DMSans_500Medium` },
  warningText: { flex: 1, fontSize: 11, lineHeight: 18, color: palette.warning, fontFamily: `DMSans_400Regular` },
  label: { fontSize: 11, flexShrink: 1, fontFamily: `DMSans_600SemiBold` },
  skeleton: { width: 134, height: 28, borderRadius: 4, position: `relative` },
  heading: { gap: 12, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  pill: { gap: 7, minHeight: 28, maxWidth: `100%`, borderWidth: 1, borderRadius: 4, paddingVertical: 4, paddingLeft: 12, paddingRight: 16, alignItems: `center`, flexDirection: `row`, borderColor: `transparent`, backgroundColor: `transparent` },
});
