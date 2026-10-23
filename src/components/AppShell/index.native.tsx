import { Link } from 'expo-router';
import Toast from '../Toast';
import BrandLogo from '../BrandLogo';
import UserMenu from '../UserMenu';
import { useRef, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import ThemeToggle from '../ThemeToggle';
import ScrollToTop from '../ScrollToTop';
import DomainMarquee from '../DomainMarquee';
import AuthFeedback from '../AuthFeedback';
import NotificationBell from '../NotificationBell';
import AccountBackdrop from '../AccountBackdrop';
import { routes, isAdminPath } from '../../shared/routes';
import { createStyles } from './styles.native';
import { BlurView, BlurTargetView } from 'expo-blur';
import { useShellScroll } from './useShellScroll.native';
import { useAppShell, footerLinks } from './useAppShell';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useFeatureFlags } from '../../shared/featureFlags/useFeatureFlags';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { Eye, Info, Mail, Gavel, House, Wallet, Search, Globe2, BookOpen, FileText, UsersRound, ArrowUpRight, ShieldCheck } from 'lucide-react-native';
import { Alert, Linking, Animated, Pressable, ScrollView, Text, View, StyleSheet, useWindowDimensions } from 'react-native';

const AppShell = ({ children, sticky = true }: { children: ReactNode; sticky?: boolean }) => {
  const { pathname, year, appName, signedIn, navigation, badgeColors, fitViewport, searchViewport, authLoading } = useAppShell();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [viewportHeight, setViewportHeight] = useState(height);
  const [footerHeight, setFooterHeight] = useState(insets.bottom + 64);
  const { isDark, palette, error: themeError, clearError: clearThemeError } = useTheme();
  const { flags, ready: featuresReady } = useFeatureFlags();
  const blurTargetRef = useRef<View>(null);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const scroll = useShellScroll(pathname, sticky, blurTargetRef, insets.bottom);
  const accountShell = isAdminPath(pathname) || pathname === routes.profile.href || pathname.startsWith(`${routes.profile.href}/`);
  const blurOpacity = useMemo(() => scroll.headerOpacity.interpolate({
    inputRange: [.86, 1],
    outputRange: [1, 0],
  }), [scroll.headerOpacity]);
  const pageContentHeight = fitViewport || searchViewport
    ? Math.max(0, viewportHeight - scroll.headerHeight - footerHeight)
    : undefined;
  const heroContext = useMemo(() => ({ pageContentHeight, pageScroll: scroll.pageScroll, setHeroBottom: scroll.setHeroBottom }), [pageContentHeight, scroll.pageScroll, scroll.setHeroBottom]);
  const openPiratechs = async () => {
    try {
      await Linking.openURL(`https://piratechs.com/`);
    } catch {
      Alert.alert(`Unable To Open Link`, `Visit piratechs.com in your browser`);
    }
  };

  const header = (
      <View
        onLayout={scroll.onHeaderLayout}
        {...elementProps(`native-app-header`)}
        style={[styles.header, sticky && styles.stickyHeader, { paddingTop: insets.top + 12 }]}
      >
        {sticky && (
          <Animated.View
            {...elementProps(`native-header-blur-layer`)}
            style={[StyleSheet.absoluteFill, { opacity: blurOpacity, pointerEvents: `none` }]}
          >
            <BlurView
              intensity={40}
              blurTarget={blurTargetRef}
              tint={isDark ? `dark` : `light`}
              style={[StyleSheet.absoluteFill, { pointerEvents: `none` }]}
              blurMethod={`dimezisBlurView`}
              {...elementProps(`native-header-blur`)}
            />
          </Animated.View>
        )}
        <Animated.View {...elementProps(`native-header-background`)} style={[StyleSheet.absoluteFill, { pointerEvents: `none`, opacity: scroll.headerOpacity, backgroundColor: accountShell ? palette.subtle : palette.paper }]} />
        {featuresReady && flags.domainMarquee && <DomainMarquee translucent={scroll.scrolled} backgroundColor={accountShell ? palette.subtle : undefined} />}
        <View {...elementProps(`native-header-row`)} style={styles.headerRow}>
          <Link href={`/`} asChild>
            <Pressable {...elementProps(`native-brand-link`)} accessibilityLabel={`${appName} Home`}>
              <BrandLogo id={`native-brand-logo`} height={58} width={Math.max(70, Math.min(194, width - 288))} style={[styles.logo, { width: Math.max(70, Math.min(194, width - 288)) }]} />
            </Pressable>
          </Link>
          <View {...elementProps(`native-header-actions`)} style={styles.headerActions}>
            <View {...elementProps(`native-device-badge`)} style={styles.deviceBadge}>
              <ShieldCheck {...elementProps(`native-device-badge-icon`)} size={12} color={palette.accent} />
              {width >= 400 && (
                <Text {...elementProps(`native-device-badge-text`)} style={styles.deviceBadgeText}>
                  {`ON DEVICE`}
                </Text>
              )}
            </View>
            <ThemeToggle />
            {featuresReady && flags.notifications && <NotificationBell />}
            {(signedIn || authLoading) && <UserMenu />}
          </View>
        </View>
        <View {...elementProps(`native-navigation`)} style={styles.navigation}>
          {navigation.filter(item => width > 1360 || item.href !== routes.watching.href).map(item => {
            const { label, href, icon } = item;
            const beta = `beta` in item && item.beta;
            const Icon = { Eye, Info, Mail, Gavel, House, Wallet, Search, Globe2, BookOpen, UsersRound }[icon];
            const active = pathname === href || (href === routes.blog.href && pathname.startsWith(`${href}/`));
            return (
              <Link key={href} href={href} asChild>
                <Pressable
                  {...elementProps(`native-navigation-link`, label.toLowerCase())}
                  accessibilityRole={`link`}
                  accessibilityLabel={item.accessibilityLabel}
                  accessibilityState={{ busy: item.countLoading, selected: active }}
                  style={StyleSheet.flatten([styles.navigationLink, active && styles.navigationLinkActive])}
                >
                  <Icon {...elementProps(`native-navigation-icon`, label.toLowerCase())} size={14} color={active ? `#ffffff` : palette.muted} />
                  <Text {...elementProps(`native-navigation-text`, label.toLowerCase())} style={[styles.navigationText, active && styles.navigationTextActive]}>
                    {label}
                  </Text>
                  {(item.countLoading || (item.count ?? 0) > 0) && (
                    <View
                      accessible={false}
                      accessibilityElementsHidden
                      style={[styles.navigationCount, { backgroundColor: item.countLoading ? palette.skeleton : badgeColors.backgroundColor }]}
                      importantForAccessibility={`no-hide-descendants`}
                      {...elementProps(`native-navigation-count`, label.toLowerCase())}
                    >
                      <Text {...elementProps(`native-navigation-count-text`, label.toLowerCase())} style={[styles.navigationCountText, { color: badgeColors.color }]}>
                        {item.countLoading ? `` : item.count}
                      </Text>
                    </View>
                  )}
                  {beta && (
                    <View
                      accessible={false}
                      accessibilityElementsHidden
                      style={[styles.navigationBeta, { borderColor: badgeColors.backgroundColor, backgroundColor: badgeColors.backgroundColor }]}
                      importantForAccessibility={`no-hide-descendants`}
                      {...elementProps(`native-navigation-beta`, label.toLowerCase())}
                    >
                      <Text {...elementProps(`native-navigation-beta-text`, label.toLowerCase())} style={[styles.navigationBetaText, { color: badgeColors.color }]}>
                        {`Beta`}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </Link>
            );
          })}
          {!signedIn && !authLoading && (
            <View {...elementProps(`native-navigation-signin`)}>
              <UserMenu />
            </View>
          )}
        </View>
      </View>
  );

  return (
    <ScrollContext.Provider value={heroContext}>
      <View {...elementProps(`native-app-shell`)} style={styles.shell}>
        {accountShell && <AccountBackdrop top={sticky ? scroll.headerHeight : 0} />}
        <BlurTargetView ref={blurTargetRef} style={styles.blurTarget} {...elementProps(`native-app-blur-target`)}>
          <ScrollView
            ref={scroll.scrollRef}
            onScroll={scroll.onScroll}
            onLayout={event => { scroll.onViewportLayout(event); setViewportHeight(event.nativeEvent.layout.height); }}
            onContentSizeChange={scroll.onContentSizeChange}
            style={styles.scroll}
            scrollEventThrottle={16}
            {...elementProps(`native-app-scroll`)}
            keyboardShouldPersistTaps={`handled`}
            scrollIndicatorInsets={{ top: sticky ? scroll.headerHeight : 0 }}
            contentContainerStyle={[styles.content, { paddingTop: sticky ? scroll.headerHeight : 0 }]}
          >
            {!sticky && header}
            <View {...elementProps(`native-app-main`)} style={[styles.main, (fitViewport || searchViewport) && { minHeight: pageContentHeight }]} onLayout={scroll.onMainLayout}>
              {children}
            </View>
            <View
              {...elementProps(`native-app-footer`)}
              onLayout={({ nativeEvent }) => setFooterHeight(nativeEvent.layout.height)}
              style={[styles.footer, width < 760 && styles.compactFooter, { paddingBottom: insets.bottom + 8 }]}
            >
              <View {...elementProps(`native-footer-copyright-column`)} style={[styles.footerColumn, width < 760 && styles.compactFooterColumn]}>
                <Text {...elementProps(`native-copyright`)} style={styles.copyright}>
                  {width >= 760 ? `© ${year} ${appName}.` : `© ${year}`}
                </Text>
              </View>
              <View {...elementProps(`native-footer-links`)} style={[styles.footerLinks, width < 760 && styles.compactFooterLinks]}>
                {footerLinks.map(({ label, href, icon }) => {
                  const Icon = { Info, Mail, BookOpen, FileText, ShieldCheck }[icon];
                  return (
                    <Link key={href} href={href} asChild>
                      <Pressable {...elementProps(`native-footer-link`, label.toLowerCase())} style={styles.footerLink} accessibilityLabel={label}>
                        <Icon {...elementProps(`native-footer-link-icon`, label.toLowerCase())} size={10} color={palette.muted} />
                        <Text {...elementProps(`native-footer-link-text`, label.toLowerCase())} style={styles.footerLinkText}>
                          {label}
                        </Text>
                      </Pressable>
                    </Link>
                  );
                })}
              </View>
              <View {...elementProps(`native-footer-attribution`)} style={[styles.footerAttribution, width < 760 && styles.compactFooterAttribution]}>
                <Pressable
                  style={styles.footerLink}
                  accessibilityRole={`link`}
                  accessibilityLabel={`Visit Piratechs`}
                  {...elementProps(`native-piratechs-link`)}
                  onPress={() => void openPiratechs()}
                >
                  <Text {...elementProps(`native-piratechs-link-text`)} style={[styles.copyright, styles.piratechsLink]}>
                    {width >= 760 ? `Made by Piratechs` : `Piratechs`}
                  </Text>
                  <ArrowUpRight {...elementProps(`native-piratechs-link-icon`)} size={12} color={palette.accent} />
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </BlurTargetView>
        {sticky && header}
        <AuthFeedback />
        <Toast id={`theme-preference-error`} message={themeError} onDismiss={clearThemeError} />
        <ScrollToTop visible={scroll.showScrollTop} onPress={scroll.scrollToTop} bottomInset={insets.bottom} />
      </View>
    </ScrollContext.Provider>
  );
};

export default AppShell;
