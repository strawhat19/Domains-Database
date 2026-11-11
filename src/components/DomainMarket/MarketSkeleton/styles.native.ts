import { StyleSheet } from 'react-native';
import { createStyles as createMarketStyles } from '../styles.native';
import type { ThemePalette } from '../../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette, wide: boolean) => ({
  ...createMarketStyles(palette, wide),
  ...StyleSheet.create({
    root: { minWidth: 0, width: `100%` },
    line: { height: 10, width: `100%` },
    title: { height: 16, width: `74%`, maxWidth: 230 },
    short: { width: `40%`, maxWidth: 150 },
    medium: { width: `64%`, maxWidth: 280 },
    icon: { width: 42, height: 42, borderRadius: 8 },
    avatar: { width: 30, height: 30, borderRadius: 15 },
    chip: { width: 80, height: 20, borderRadius: 5 },
    status: { width: 135, height: 13 },
    field: { height: 44, width: `100%`, borderRadius: 6 },
    textArea: { height: 83, width: `100%`, borderRadius: 6 },
    buttonShape: { height: 44, width: 124, maxWidth: `48%`, borderRadius: 6 },
    copyStack: { gap: 8, flex: 1, minWidth: 0 },
    messageShape: { gap: 7, width: `70%`, padding: 9, alignSelf: `flex-start`, borderWidth: 1, borderRadius: 8, borderColor: palette.line, backgroundColor: palette.input },
    replyShape: { width: `58%`, alignSelf: `flex-end`, backgroundColor: palette.subtle },
    placeholder: { backgroundColor: palette.skeleton, borderRadius: 4 },
  }),
});
