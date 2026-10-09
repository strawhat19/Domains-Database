import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  group: { gap: 8, width: `100%`, minWidth: 0, maxWidth: `100%`, alignSelf: `stretch` },
  button: { gap: 10, minWidth: 0, minHeight: 44, borderWidth: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, alignItems: `center`, flexDirection: `row`, borderColor: `#747775`, backgroundColor: `#ffffff` },
  pressed: { borderColor: `#1f1f1f` },
  disabled: { opacity: .55 },
  logo: { width: 20, height: 20 },
  label: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 20, color: `#1f1f1f`, textAlign: `center`, fontFamily: `DMSans_500Medium` },
  notice: { gap: 8, padding: 10, borderWidth: 1, borderRadius: 8, alignItems: `center`, flexDirection: `row`, borderColor: palette.line, backgroundColor: palette.subtle },
  noticeText: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: 18, color: palette.muted, fontFamily: `DMSans_500Medium` },
  dismiss: { width: 44, height: 44, alignItems: `center`, justifyContent: `center` },
});
