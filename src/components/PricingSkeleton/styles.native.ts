import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';
import { createStyles as createLandingStyles } from '../LandingSections/styles.native';

export const createStyles = (palette: ThemePalette) => ({
  ...createLandingStyles(palette),
  ...StyleSheet.create({
    root: { width: `100%` },
    card: { flexGrow: 1 },
    fullCard: { width: `100%` },
    icon: { width: 12, height: 12, borderRadius: 3 },
    title: { width: `42%`, height: 22 },
    price: { width: `56%`, height: 40, marginTop: 7 },
    label: { width: `90%`, height: 10 },
    shortLabel: { width: `68%` },
    description: { gap: 8, minHeight: 42 },
    shortLine: { width: `68%` },
    longLine: { width: `94%`, height: 9 },
    content: { gap: 15, flex: 1, zIndex: 1 },
    featureCopy: { gap: 6, flex: 1, minWidth: 0 },
    action: { width: `78%`, height: 42, borderRadius: 3, alignSelf: `flex-start` },
    placeholder: { borderRadius: 5, backgroundColor: palette.skeleton },
  }),
});
