import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  toast: { gap: 10, bottom: 24, right: 24, left: 24, zIndex: 100, padding: 16, maxWidth: 460, borderRadius: 10, borderWidth: 1, borderColor: palette.line, position: `absolute`, flexDirection: `row`, alignItems: `center`, backgroundColor: palette.paper, elevation: 8, shadowColor: `#000`, shadowOpacity: .15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  message: { flex: 1, fontSize: 12, lineHeight: 19, fontFamily: `DMSans_500Medium` },
  dismiss: { padding: 5 },
});
