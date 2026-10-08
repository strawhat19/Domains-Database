import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  disabled: { opacity: .5 },
  focused: { borderColor: palette.accent },
  prefix: { paddingLeft: 12, fontSize: 13, color: palette.muted, fontFamily: `DMSans_400Regular` },
  field: { gap: 8, minWidth: 0, minHeight: 44, borderWidth: 1, borderRadius: 8, borderColor: palette.line, backgroundColor: palette.input, flexDirection: `row`, alignItems: `center` },
  input: { flex: 1, minWidth: 0, minHeight: 44, paddingVertical: 10, paddingRight: 12, color: palette.ink, fontSize: 13, fontFamily: `DMSans_400Regular`, fontVariant: [`tabular-nums`] },
});
