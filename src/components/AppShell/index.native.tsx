import { useMemo } from 'react';
import { Image } from 'expo-image';
import UserMenu from '../UserMenu';
import type { ReactNode } from 'react';
import ThemeToggle from '../ThemeToggle';
import AuthFeedback from '../AuthFeedback';
import NotificationBell from '../NotificationBell';
import { createStyles } from './styles.native';
import { Link } from 'expo-router';
import { useAppShell, footerLinks } from './useAppShell';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Info, Mail, House, Search, Globe2, FileText, UsersRound, ShieldCheck } from 'lucide-react-native';
import { Alert, Linking, Pressable, ScrollView, Text, View, StyleSheet, useWindowDimensions } from 'react-native';

const AppShell = ({ children }: { children: ReactNode }) => {
  const { pathname, year, navigation } = useAppShell();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isDark, palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const openPiratechs = async () => {
    try {
      await Linking.openURL(`https://piratechs.com/`);
    } catch {
      Alert.alert(`Unable To Open Link`, `Visit piratechs.com in your browser`);
    }
  };

  return (
    <View {...elementProps(`native-app-shell`)} style={styles.shell}>
      <View {...elementProps(`native-app-header`)} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View {...elementProps(`native-header-row`)} style={styles.headerRow}>
          <Link href={`/`} asChild>
            <Pressable {...elementProps(`native-brand-link`)} accessibilityLabel={`Domains Database Home`}>
              <Image
                {...elementProps(`native-brand-logo`)}
                contentFit={`contain`}
                style={[styles.logo, { width: Math.max(70, Math.min(194, width - 288)) }]}
                accessibilityLabel={`Domains Database`}
                source={isDark
                  ? require('../../../assets/icons/brand-logo-dark.svg')
                  : require('../../../assets/concepts/logos/v8/02-domain-record-stack-fill.svg')}
              />
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
            <NotificationBell />
            <UserMenu />
          </View>
        </View>
        <View {...elementProps(`native-navigation`)} style={styles.navigation}>
          {navigation.map(({ label, href, icon }) => {
            const Icon = { Info, Mail, House, Search, Globe2, UsersRound }[icon];
            const active = pathname === href;
            return (
              <Link key={href} href={href} asChild>
                <Pressable
                  {...elementProps(`native-navigation-link`, label.toLowerCase())}
                  accessibilityRole={`link`}
                  accessibilityLabel={label}
                  accessibilityState={{ selected: active }}
                  style={StyleSheet.flatten([styles.navigationLink, active && styles.navigationLinkActive])}
                >
                  <Icon {...elementProps(`native-navigation-icon`, label.toLowerCase())} size={14} color={active ? `#ffffff` : palette.muted} />
                  <Text {...elementProps(`native-navigation-text`, label.toLowerCase())} style={[styles.navigationText, active && styles.navigationTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
      </View>
      <ScrollView {...elementProps(`native-app-scroll`)} style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps={`handled`}>
        <View {...elementProps(`native-app-main`)} style={styles.main}>
          {children}
        </View>
        <View {...elementProps(`native-app-footer`)} style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
          <View {...elementProps(`native-footer-top`)} style={styles.footerTop}>
            <Text {...elementProps(`native-footer-label`)} style={styles.footerLabel}>
              {`Every address in order.`}
            </Text>
            <View {...elementProps(`native-footer-device`)} style={styles.footerDevice}>
              <ShieldCheck {...elementProps(`native-footer-device-icon`)} size={12} color={palette.muted} />
              <Text {...elementProps(`native-footer-device-text`)} style={styles.footerDeviceText}>
                {`Stored on this device`}
              </Text>
            </View>
          </View>
          <View {...elementProps(`native-footer-links`)} style={styles.footerLinks}>
            {footerLinks.map(({ label, href, icon }) => {
              const Icon = { FileText, ShieldCheck }[icon];
              return (
              <Link key={href} href={href} asChild>
                <Pressable {...elementProps(`native-footer-link`, label.toLowerCase())} style={styles.footerLink} accessibilityLabel={label}>
                  <Icon {...elementProps(`native-footer-link-icon`, label.toLowerCase())} size={12} color={palette.muted} />
                  <Text {...elementProps(`native-footer-link-text`, label.toLowerCase())} style={styles.footerLinkText}>
                    {label}
                  </Text>
                </Pressable>
              </Link>
              );
            })}
          </View>
          <Text {...elementProps(`native-copyright`)} style={styles.copyright}>
            {`© ${year} Domains Database. Made by `}
            <Text {...elementProps(`native-piratechs-link`)} style={styles.piratechsLink} accessibilityRole={`link`} onPress={() => void openPiratechs()}>
              {`Piratechs ↗`}
            </Text>
          </Text>
        </View>
      </ScrollView>
      <AuthFeedback />
    </View>
  );
};

export default AppShell;
