import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette, isDark: boolean) => StyleSheet.create({
  pressed: { opacity: .8 },
  page: { width: `100%` },
  disabled: { opacity: .5 },
  secondaryText: { color: palette.ink },
  secondary: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper },
  buttonText: { color: palette.contrast, fontSize: 12, fontFamily: `DMSans_600SemiBold` },
  button: { gap: 8, minHeight: 46, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 8, alignItems: `center`, flexDirection: `row`, justifyContent: `center`, backgroundColor: isDark ? palette.accent : palette.strong },
});
