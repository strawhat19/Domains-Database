import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { gap: 18 },
  heading: { gap: 12, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center` },
  toolbar: { gap: 10, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  periods: { gap: 5, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center` },
  period: { padding: 9, borderWidth: 1, borderRadius: 7, borderColor: palette.line, backgroundColor: palette.paper },
  selected: { borderColor: palette.accent, backgroundColor: palette.subtle },
  title: { color: palette.ink, fontSize: 15, fontFamily: `DMSans_700Bold` },
  label: { color: palette.ink, fontSize: 11, fontFamily: `DMSans_600SemiBold` },
  copy: { color: palette.muted, fontSize: 11, lineHeight: 18, fontFamily: `DMSans_400Regular` },
  row: { gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: palette.line, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  identity: { flex: 1, gap: 8, minWidth: 0, flexDirection: `row`, alignItems: `center` },
  rowCopy: { flex: 1, gap: 3, minWidth: 0 },
  rowLabel: { minWidth: 0, color: palette.ink, fontSize: 12, fontFamily: `DMSans_400Regular` },
  rowCaption: { color: palette.muted, fontSize: 10, fontFamily: `DMSans_400Regular` },
  expand: { gap: 5, minHeight: 34, alignSelf: `flex-start`, flexDirection: `row`, alignItems: `center` },
  expandLabel: { color: palette.accent, fontSize: 11, fontFamily: `DMSans_400Regular` },
  values: { gap: 8, alignItems: `flex-end` },
  columns: { gap: 18, flexWrap: `wrap`, flexDirection: `row` },
  column: { flex: 1, minWidth: 250 },
  error: { color: palette.danger, fontSize: 12, lineHeight: 20, fontFamily: `DMSans_400Regular` },
  link: { gap: 6, paddingVertical: 8, flexDirection: `row`, alignItems: `center` },
  linkText: { color: palette.accent, fontSize: 12, fontFamily: `DMSans_600SemiBold` },
});
