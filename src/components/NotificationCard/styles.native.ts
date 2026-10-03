import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  copy: { gap: 6, flex: 1, minWidth: 0 },
  card: {
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: `row`,
    borderColor: palette.line,
    backgroundColor: palette.input,
  },
  symbol: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: `center`,
    justifyContent: `center`,
    backgroundColor: palette.subtle,
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.ink,
    fontFamily: `DMSans_700Bold`,
  },
  text: {
    fontSize: 12,
    lineHeight: 20,
    color: palette.muted,
    fontFamily: `DMSans_400Regular`,
  },
  link: {
    color: palette.accent,
    textDecorationLine: `underline`,
    fontFamily: `DMSans_600SemiBold`,
  },
  skeletonSymbol: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: palette.skeleton,
  },
  skeletonTitle: {
    height: 13,
    width: `60%`,
    borderRadius: 4,
    backgroundColor: palette.skeleton,
  },
  skeletonText: {
    height: 10,
    width: `100%`,
    marginTop: 5,
    borderRadius: 4,
    backgroundColor: palette.skeleton,
  },
  skeletonShortText: {
    height: 10,
    width: `78%`,
    borderRadius: 4,
    backgroundColor: palette.skeleton,
  },
});
