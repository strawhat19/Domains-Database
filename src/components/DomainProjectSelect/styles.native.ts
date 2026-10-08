import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  select: { gap: 6 },
  disabled: { opacity: .45 },
  value: { flex: 1, minWidth: 0 },
  unsetValue: { gap: 6, flexDirection: `row`, alignItems: `center` },
  placeholder: { color: palette.muted, fontSize: 12, fontFamily: `DMSans_400Regular` },
  trigger: { gap: 8, minHeight: 45, padding: 13, borderWidth: 1, borderRadius: 6, borderColor: palette.line, backgroundColor: palette.input, flexDirection: `row`, alignItems: `center` },
  options: { padding: 4, borderWidth: 1, borderRadius: 6, borderColor: palette.line, backgroundColor: palette.paper },
  option: { gap: 8, minHeight: 44, padding: 10, borderRadius: 4, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  optionSelected: { backgroundColor: palette.subtle },
});
