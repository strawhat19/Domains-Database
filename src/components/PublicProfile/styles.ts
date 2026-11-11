import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => {
  const text = { color: palette.ink, fontFamily: `DMSans_400Regular` };
  const strong = { ...text, fontFamily: `DMSans_700Bold` };
  const row = { gap: 10, flexDirection: `row` as const, alignItems: `center` as const };
  const surface = { backgroundColor: palette.paper, borderColor: palette.line, borderWidth: 1, borderRadius: 12 };
  return StyleSheet.create({
    page: { gap: 16, width: `100%`, maxWidth: 760, alignSelf: `center`, paddingHorizontal: 18, paddingVertical: 28 },
    panel: { ...surface, gap: 14, minWidth: 0, padding: 18 },
    identity: { ...row, gap: 13 },
    identityText: { gap: 3, minWidth: 0, flex: 1 },
    name: { ...strong, fontSize: 27, letterSpacing: -.5 },
    heading: { ...strong, fontSize: 17 },
    copy: { ...text, fontSize: 14, lineHeight: 22 },
    muted: { ...text, fontSize: 12, lineHeight: 18, color: palette.muted },
    section: { gap: 9 },
    countPanel: { ...surface, gap: 8, minWidth: 0, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
    domainCount: { ...row, gap: 6, flexWrap: `wrap` },
    countLabel: { ...strong, fontSize: 12, lineHeight: 16, includeFontPadding: false },
    countSlot: { marginLeft: `auto` },
    count: { ...strong, fontSize: 13, lineHeight: 16, includeFontPadding: false, fontVariant: [`tabular-nums`], color: palette.accent },
    countMeasure: { opacity: 0 },
    countValue: { ...StyleSheet.absoluteFillObject, textAlign: `right` },
    countSkeleton: { width: 24, height: 10, marginLeft: `auto`, borderRadius: 4, backgroundColor: palette.skeleton },
    domain: { ...row, gap: 11, paddingTop: 9, borderTopWidth: 1, borderColor: palette.line },
    domainName: { ...strong, minWidth: 0, flexShrink: 1, fontSize: 14 },
    button: { ...row, minHeight: 44, alignSelf: `flex-start`, paddingHorizontal: 11, borderRadius: 7, backgroundColor: palette.subtle },
    buttonText: { ...strong, fontSize: 12, color: palette.accent },
  });
};
