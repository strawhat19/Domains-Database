import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  picker: { gap: 6 },
  disabled: { opacity: .5 },
  optionScroll: { maxHeight: 260 },
  optionSelected: { backgroundColor: palette.subtle },
  pills: { gap: 6, minWidth: 0, flexWrap: `wrap`, flexDirection: `row` },
  cue: { fontSize: 12, color: palette.muted, fontFamily: `DMSans_400Regular` },
  selection: { fontSize: 10, color: palette.accent, fontFamily: `DMSans_400Regular` },
  doneLabel: { fontSize: 12, color: palette.accent, fontFamily: `DMSans_500Medium` },
  done: { padding: 10, alignItems: `center`, borderTopWidth: 1, borderColor: palette.line },
  options: { padding: 4, borderWidth: 1, borderRadius: 6, borderColor: palette.line, backgroundColor: palette.paper },
  option: { gap: 8, padding: 10, minHeight: 44, borderRadius: 4, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  pill: { fontSize: 10, lineHeight: 16, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999, letterSpacing: .4, color: palette.accent, backgroundColor: palette.subtle, overflow: `hidden`, fontFamily: `DMSans_500Medium` },
  trigger: { gap: 6, minHeight: 44, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderRadius: 6, borderColor: palette.line, backgroundColor: palette.input, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center` },
});
