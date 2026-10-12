import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';
import { createStyles as createLandingStyles } from '../LandingSections/styles.native';

export const createStyles = (palette: ThemePalette) => ({
  ...createLandingStyles(palette),
  ...StyleSheet.create({
    disabled: { opacity: .5 },
    interest: { gap: 12, zIndex: 1 },
    interestNote: { fontSize: 11, lineHeight: 18, color: palette.muted, fontFamily: `DMSans_400Regular` },
    period: { fontSize: 11, letterSpacing: 0, color: palette.muted, fontFamily: `DMSans_400Regular` },
    feedback: { gap: 14, padding: 24, borderWidth: 1, borderRadius: 12, borderColor: palette.line, backgroundColor: palette.input },
  }),
});
