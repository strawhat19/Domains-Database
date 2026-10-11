import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { width: 20, height: 20, flexShrink: 0, alignItems: `center`, justifyContent: `center` },
  flag: { width: 24, height: 18, borderWidth: 1, borderRadius: 2, overflow: `hidden`, borderColor: palette.line },
  flagImage: { width: `100%`, height: `100%` },
  brandImage: { width: 18, height: 18 },
});
