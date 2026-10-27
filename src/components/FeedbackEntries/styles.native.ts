import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { gap: 16, width: `100%`, minWidth: 0 },
  heading: { gap: 12, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  headingCopy: { gap: 6, minWidth: 0, flexShrink: 1 },
  titleRow: { gap: 8, flexDirection: `row`, alignItems: `center` },
  title: { color: palette.ink, fontSize: 20, lineHeight: 28, fontFamily: `DMSans_700Bold` },
  copy: { color: palette.muted, fontSize: 12, lineHeight: 20, fontFamily: `DMSans_400Regular` },
  small: { color: palette.muted, fontSize: 10, lineHeight: 17, fontFamily: `DMSans_400Regular` },
  search: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 12, color: palette.ink, backgroundColor: palette.paper, borderWidth: 1, borderRadius: 8, borderColor: palette.line, fontSize: 12, fontFamily: `DMSans_400Regular` },
  actions: { gap: 8, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center` },
  statusButton: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderRadius: 7, borderColor: palette.line, backgroundColor: palette.paper, alignItems: `center`, justifyContent: `center` },
  selected: { borderColor: palette.accent, backgroundColor: palette.subtle },
  statusText: { color: palette.muted, fontSize: 11, fontFamily: `DMSans_600SemiBold` },
  selectedText: { color: palette.accent },
  list: { gap: 14 },
  entry: { gap: 12, padding: 16, minWidth: 0, borderWidth: 1, borderRadius: 10, borderColor: palette.line, backgroundColor: palette.paper },
  entryHeading: { gap: 12, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  entryTitle: { color: palette.ink, fontSize: 15, lineHeight: 23, fontFamily: `DMSans_600SemiBold` },
  description: { color: palette.ink, fontSize: 12, lineHeight: 21, fontFamily: `DMSans_400Regular` },
  rating: { gap: 5, flexDirection: `row`, alignItems: `center` },
  error: { color: palette.danger, fontSize: 11, lineHeight: 18, fontFamily: `DMSans_400Regular` },
  notice: { color: palette.success, fontSize: 11, lineHeight: 18, fontFamily: `DMSans_400Regular` },
});
