import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';
import { createStyles as createLandingStyles } from '../LandingSections/styles.native';

export const createStyles = (palette: ThemePalette) => ({
  ...createLandingStyles(palette),
  ...StyleSheet.create({
    disabled: { opacity: .5 },
    pricingDescription: { maxWidth: `100%` },
    pricingHeading: { width: `100%`, maxWidth: `100%` },
    interest: { gap: 12, zIndex: 1 },
    enrollment: { gap: 10, zIndex: 1 },
    enrollmentButtonText: { flexShrink: 1 },
    enrollmentGuest: { gap: 8, width: `100%`, alignItems: `stretch`, flexDirection: `row` },
    enrollmentButton: { gap: 6, flex: 1, minWidth: 0, minHeight: 44, alignSelf: `stretch`, paddingHorizontal: 10, justifyContent: `center` },
    planTitle: { gap: 12, flex: 1, minWidth: 0, zIndex: 1, flexDirection: `row`, alignItems: `center` },
    planName: { flexShrink: 1, fontSize: 22, lineHeight: 28, color: palette.ink, fontFamily: `DMSans_700Bold` },
    interestNote: { fontSize: 11, lineHeight: 18, color: palette.muted, fontFamily: `DMSans_400Regular` },
    period: { fontSize: 11, letterSpacing: 0, color: palette.muted, fontFamily: `DMSans_400Regular` },
    feedback: { gap: 14, padding: 24, borderWidth: 1, borderRadius: 12, borderColor: palette.line, backgroundColor: palette.input },
  }),
});
