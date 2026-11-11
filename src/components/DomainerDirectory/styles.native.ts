import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette, wide: boolean, padding: number, gridGap: number, maxWidth: number) => {
  const text = { color: palette.ink, fontFamily: `DMSans_400Regular` };
  const panel = { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper };
  const inline = { gap: 8, flexDirection: `row` as const, alignItems: `center` as const };
  const container = { width: `100%` as const, maxWidth, alignSelf: `center` as const };
  return StyleSheet.create({
    page: { width: `100%`, paddingBottom: 30 },
    cover: { padding: wide ? 26 : 14, borderBottomWidth: 1, borderBottomColor: palette.line, backgroundColor: palette.subtle },
    coverInner: { ...panel, ...container, gap: wide ? 22 : 2, padding: wide ? 24 : 14, borderRadius: 14, backgroundColor: `${palette.paper}e6`, flexDirection: wide ? `row` : `column`, alignItems: wide ? `center` : `flex-start`, justifyContent: `space-between` },
    intro: { gap: 4, flexShrink: 1, minWidth: 0 },
    inline,
    title: { ...text, flexShrink: 1, fontSize: wide ? 37 : 28, letterSpacing: -.7, fontFamily: `DMSans_700Bold` },
    muted: { ...text, color: palette.muted, fontSize: 13, lineHeight: 20 },
    breadcrumbs: { ...inline, flexWrap: `wrap`, minWidth: 0 },
    breadcrumb: { ...inline, gap: 5, minHeight: 44 },
    label: { ...text, fontSize: 12, fontFamily: `DMSans_600SemiBold` },
    labelSelected: { color: palette.contrast },
    canvas: { ...container, gap: 16, paddingHorizontal: padding, paddingTop: 20 },
    toolbar: { gap: 10 },
    search: { ...panel, ...inline, gap: 10, minHeight: 48, paddingLeft: 13, paddingRight: 3, borderRadius: 8, backgroundColor: palette.input },
    searchInput: { ...text, flex: 1, minWidth: 0, minHeight: 46, fontSize: 16 },
    clear: { width: 44, height: 44, alignItems: `center`, justifyContent: `center` },
    controls: { ...inline, flexWrap: `wrap`, justifyContent: `space-between` },
    segments: { ...panel, ...inline, gap: 3, flexWrap: `wrap`, padding: 3, borderRadius: 8 },
    segment: { ...inline, gap: 5, paddingHorizontal: 9, minHeight: 44, borderRadius: 5 },
    segmentSelected: { backgroundColor: palette.accent },
    grid: { gap: gridGap, flexDirection: `row`, flexWrap: `wrap`, alignItems: `stretch`, alignSelf: `stretch` },
    card: { ...panel, gap: 10, padding: 12, minHeight: 98, borderRadius: 10 },
    pressed: { backgroundColor: palette.subtle, borderColor: palette.accent },
    identity: { ...inline, minWidth: 0 },
    name: { ...text, flex: 1, minWidth: 0, fontSize: 16, fontFamily: `DMSans_700Bold` },
    bio: { ...text, color: palette.muted, fontSize: 13, lineHeight: 20 },
    cardMetadata: { ...inline, gap: 6, flexWrap: `wrap`, marginTop: `auto`, justifyContent: `space-between` },
    rolePill: { ...panel, ...inline, gap: 4, minHeight: 22, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 7, backgroundColor: palette.subtle },
    domainCount: { ...inline, gap: 5, minHeight: 22 },
    metadataLabel: { ...text, fontSize: 11, includeFontPadding: false, fontFamily: `DMSans_600SemiBold` },
    countValue: { ...text, fontSize: 12, includeFontPadding: false, color: palette.accent, fontVariant: [`tabular-nums`], fontFamily: `DMSans_700Bold` },
    metadataUnavailable: { color: palette.muted },
    state: { ...panel, gap: 10, minHeight: 125, padding: 16, borderRadius: 10, alignItems: `center`, justifyContent: `center` },
    stateText: { ...text, fontSize: 14, textAlign: `center` },
    error: { color: palette.danger },
    action: { ...panel, ...inline, minHeight: 44, paddingHorizontal: 12, borderRadius: 7, alignSelf: `center`, justifyContent: `center` },
    loadMore: { marginTop: 2 },
    disabled: { opacity: .55 },
    statusLabel: { ...text, width: `100%`, color: palette.muted, fontSize: 12 },
    skeleton: { backgroundColor: palette.skeleton },
    skeletonAvatar: { width: 40, height: 40, borderRadius: 20 },
    skeletonTitle: { width: `50%`, height: 15, borderRadius: 4 },
    skeletonBio: { width: `82%`, height: 13, borderRadius: 4 },
    skeletonRole: { width: 76, height: 22, borderRadius: 999 },
    skeletonDomainCount: { width: 102, height: 12, borderRadius: 4 },
  });
};
