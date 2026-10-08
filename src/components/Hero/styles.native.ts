import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';
import { themePalettes } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette, isDark: boolean) => {
  const heroPalette = isDark ? themePalettes.dark : palette;
  const heroBackground = isDark ? palette.strong : palette.paper;

  return StyleSheet.create({
    hero: {
      gap: 3,
      width: `100%`,
      minHeight: 680,
      overflow: `hidden`,
      position: `relative`,
      paddingVertical: 64,
      paddingHorizontal: 32,
      paddingBottom: 220,
      backgroundColor: heroBackground,
    },
    compactHero: { paddingTop: 40, paddingBottom: 190, paddingHorizontal: 24 },
    contentFade: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
    cubeArt: { zIndex: 0, right: -120, bottom: -90, width: `78%`, height: 560, minWidth: 620, opacity: .95, overflow: `hidden`, position: `absolute` },
    compactCubeArt: { right: -180, bottom: -70, height: 420, minWidth: 540 },
    title: { zIndex: 1, fontSize: 20, lineHeight: 28, letterSpacing: -.4, color: heroPalette.muted, fontFamily: `DMSans_500Medium` },
    accent: { zIndex: 1, fontSize: 52, lineHeight: 56, letterSpacing: -1.8, fontStyle: `italic`, textTransform: `uppercase`, color: heroPalette.accent, fontFamily: `DMSans_700Bold` },
    eyebrow: { zIndex: 1, fontSize: 9, marginBottom: 28, letterSpacing: 1.5, color: heroPalette.muted, fontFamily: `DMSans_500Medium` },
    promise: { gap: 8, zIndex: 1, maxWidth: 430, marginTop: 28, paddingTop: 18, borderTopWidth: 1, alignItems: `center`, flexDirection: `row`, borderTopColor: `${heroPalette.accent}40` },
    promiseText: { fontSize: 11, letterSpacing: .3, color: heroPalette.muted, fontFamily: `DMSans_600SemiBold` },
    description: { zIndex: 1, fontSize: 14, maxWidth: 430, lineHeight: 23, marginTop: 22, color: heroPalette.ink, fontFamily: `DMSans_400Regular` },
    search: { gap: 9, zIndex: 1, width: `100%`, maxWidth: 430, marginTop: 26 },
    searchSuggestions: { minWidth: 0, paddingRight: 92, position: `relative` },
    searchRow: { gap: 6, padding: 5, borderWidth: 1, borderRadius: 2, flexDirection: `row`, alignItems: `center`, borderColor: `${heroPalette.accent}66`, backgroundColor: `${heroBackground}e6` },
    searchLabel: { fontSize: 11, color: heroPalette.muted, fontFamily: `DMSans_500Medium` },
    domainsLink: { gap: 4, right: 0, top: `50%`, height: 22, minHeight: 22, borderWidth: 1, borderRadius: 2, paddingVertical: 2, alignItems: `center`, position: `absolute`, flexDirection: `row`, paddingHorizontal: 8, borderColor: heroPalette.accent, backgroundColor: heroPalette.accent, transform: [{ translateY: -11 }] },
    domainsLinkText: { fontSize: 11, color: heroPalette.contrast, fontFamily: `DMSans_700Bold` },
    searchInput: { flex: 1, minWidth: 0, fontSize: 12, paddingVertical: 10, paddingHorizontal: 8, color: heroPalette.ink, fontFamily: `DMSans_500Medium` },
    searchButton: { gap: 6, minHeight: 38, borderWidth: 1, borderRadius: 1, paddingVertical: 10, paddingHorizontal: 13, flexDirection: `row`, alignItems: `center`, borderColor: heroPalette.accent, backgroundColor: `transparent` },
    searchButtonText: { fontSize: 12, color: heroPalette.accent, fontFamily: `DMSans_700Bold` },
    magicTypingWrap: { padding: 5, borderRadius: 2, alignSelf: `flex-start`, backgroundColor: palette.paper },
    recentPressed: { opacity: .6 },
    recentsItems: { gap: 5, flex: 1, minWidth: 0, flexWrap: `wrap`, alignItems: `center`, flexDirection: `row` },
    recentsHeading: { gap: 4, flexShrink: 0, alignItems: `center`, flexDirection: `row` },
    recents: { gap: 8, minWidth: 0, marginTop: 3, alignItems: `center`, flexDirection: `row` },
    recentsLabel: { fontSize: 10, color: heroPalette.muted, fontFamily: `DMSans_500Medium` },
    recentsError: { fontSize: 10, color: heroPalette.danger, fontFamily: `DMSans_400Regular` },
    recentsMessage: { fontSize: 10, color: heroPalette.muted, fontFamily: `DMSans_400Regular` },
    recentQuery: { flexShrink: 1, fontSize: 10, color: heroPalette.muted, fontFamily: `DMSans_500Medium` },
    recent: { gap: 4, minWidth: 0, maxWidth: 130, borderWidth: 1, borderRadius: 2, paddingVertical: 4, paddingHorizontal: 6, alignItems: `center`, flexDirection: `row`, borderColor: `${heroPalette.accent}40`, backgroundColor: `${heroBackground}e6` },
  });
};
