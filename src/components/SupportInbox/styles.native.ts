import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { gap: 16, minWidth: 0, width: `100%` },
  heading: { gap: 12, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  headingCopy: { gap: 6, minWidth: 0, flexShrink: 1 },
  title: { color: palette.ink, fontSize: 20, lineHeight: 28, fontFamily: `DMSans_700Bold` },
  copy: { color: palette.muted, fontSize: 12, lineHeight: 20, fontFamily: `DMSans_400Regular` },
  small: { color: palette.muted, fontSize: 10, lineHeight: 17, fontFamily: `DMSans_400Regular` },
  search: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, color: palette.ink, backgroundColor: palette.paper, borderWidth: 1, borderRadius: 8, borderColor: palette.line, fontSize: 12, fontFamily: `DMSans_400Regular` },
  list: { gap: 12 },
  thread: { gap: 10, minWidth: 0, padding: 16, borderWidth: 1, borderRadius: 10, borderColor: palette.line, backgroundColor: palette.paper },
  threadHeading: { gap: 12, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  subject: { color: palette.ink, fontSize: 14, lineHeight: 22, fontFamily: `DMSans_600SemiBold` },
  threadFooter: { gap: 12, flexDirection: `row`, justifyContent: `space-between`, alignItems: `center` },
});
