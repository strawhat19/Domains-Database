import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette, isDark: boolean) => StyleSheet.create({
  pressed: { opacity: .8 },
  page: { width: `100%` },
  secondaryText: { color: palette.ink },
  secondaryButton: { borderColor: palette.line, backgroundColor: palette.paper },
  buttonText: { fontSize: 12, color: palette.contrast, fontFamily: `DMSans_600SemiBold` },
  button: { gap: 9, minHeight: 46, borderWidth: 1, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 18, alignItems: `center`, flexDirection: `row`, justifyContent: `center`, borderColor: isDark ? palette.accent : palette.strong, backgroundColor: isDark ? palette.accent : palette.strong },
});
