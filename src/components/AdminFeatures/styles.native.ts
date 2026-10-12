import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  disabled: { opacity: .5 },
  rows: { gap: 16 },
  label: { color: palette.ink, fontSize: 13, fontFamily: `DMSans_600SemiBold` },
  description: { color: palette.muted, fontSize: 11, lineHeight: 18, fontFamily: `DMSans_400Regular` },
  error: { color: palette.danger, fontSize: 11, lineHeight: 18, fontFamily: `DMSans_400Regular` },
  progress: { color: palette.muted, fontSize: 11, fontFamily: `DMSans_400Regular` },
  selectedSegment: { backgroundColor: palette.accent },
  selectedSegmentLabel: { color: palette.contrast },
  segmentLabel: { color: palette.muted, fontSize: 11, fontFamily: `DMSans_600SemiBold` },
  audienceLabel: { color: palette.muted, fontSize: 10, fontFamily: `DMSans_600SemiBold` },
  audienceOptionLabel: { color: palette.muted, fontSize: 10, fontFamily: `DMSans_600SemiBold` },
  heading: { gap: 8, flexDirection: `row`, alignItems: `center` },
  identity: { gap: 6, flex: 1, minWidth: 180 },
  actions: { gap: 12, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center` },
  audience: { gap: 6, flex: 1, minWidth: 180 },
  audiences: { gap: 12, width: `100%`, flexWrap: `wrap`, flexDirection: `row` },
  planError: { gap: 6, alignItems: `flex-start` },
  detailsButton: { minWidth: 24, minHeight: 24, alignItems: `center`, justifyContent: `center` },
  audienceOptions: { gap: 3, flexWrap: `wrap`, flexDirection: `row` },
  row: { gap: 14, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: palette.line, flexDirection: `row`, flexWrap: `wrap`, alignItems: `center` },
  segment: { gap: 5, minWidth: 0, minHeight: 24, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 3, flexDirection: `row`, alignItems: `center`, justifyContent: `center` },
  segments: { gap: 2, padding: 2, minWidth: 0, borderWidth: 1, borderRadius: 5, borderColor: palette.line, backgroundColor: palette.input, flexDirection: `row`, alignItems: `stretch` },
  audienceOption: { minHeight: 24, paddingVertical: 3, paddingHorizontal: 7, borderWidth: 1, borderRadius: 3, borderColor: palette.line, backgroundColor: palette.input, alignItems: `center`, justifyContent: `center` },
});
