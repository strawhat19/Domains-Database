import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { styles } from './styles.native';
import { Link, usePathname } from 'expo-router';
import { elementProps } from '../../shared/elementProps';
import { Grid2X2, Layers3, ShieldCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';

const navigation = [
  { label: `Overview`, href: `/`, Icon: Grid2X2 },
  { label: `Portfolio`, href: `/domains`, Icon: Layers3 },
] as const;

const footerLinks = [
  { label: `About`, href: `/about` },
  { label: `Terms`, href: `/terms` },
  { label: `Contact`, href: `/contact` },
  { label: `Privacy`, href: `/privacy` },
] as const;

const AppShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
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
                style={styles.logo}
                accessibilityLabel={`Domains Database: Every Address In Order`}
                source={require('../../../assets/concepts/logos/v8/02-domain-record-stack-fill.svg')}
              />
            </Pressable>
          </Link>
          <View {...elementProps(`native-device-badge`)} style={styles.deviceBadge}>
            <ShieldCheck {...elementProps(`native-device-badge-icon`)} size={12} color={`#48615d`} />
            <Text {...elementProps(`native-device-badge-text`)} style={styles.deviceBadgeText}>
              {`ON DEVICE`}
            </Text>
          </View>
        </View>
        <View {...elementProps(`native-navigation`)} style={styles.navigation}>
          {navigation.map(({ label, href, Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} asChild>
                <Pressable
                  {...elementProps(`native-navigation-link`, label.toLowerCase())}
                  accessibilityRole={`link`}
                  accessibilityLabel={label}
                  accessibilityState={{ selected: active }}
                  style={[styles.navigationLink, active && styles.navigationLinkActive]}
                >
                  <Icon {...elementProps(`native-navigation-icon`, label.toLowerCase())} size={14} color={active ? `#ffffff` : `#6b7978`} />
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
              <ShieldCheck {...elementProps(`native-footer-device-icon`)} size={12} color={`#6b7978`} />
              <Text {...elementProps(`native-footer-device-text`)} style={styles.footerDeviceText}>
                {`Stored on this device`}
              </Text>
            </View>
          </View>
          <View {...elementProps(`native-footer-links`)} style={styles.footerLinks}>
            {footerLinks.map(({ label, href }) => (
              <Link key={href} href={href} asChild>
                <Pressable {...elementProps(`native-footer-link`, label.toLowerCase())} style={styles.footerLink} accessibilityLabel={label}>
                  <Text {...elementProps(`native-footer-link-text`, label.toLowerCase())} style={styles.footerLinkText}>
                    {label}
                  </Text>
                </Pressable>
              </Link>
            ))}
          </View>
          <Text {...elementProps(`native-copyright`)} style={styles.copyright}>
            {`© ${new Date().getFullYear()} Domains Database. Made by `}
            <Text {...elementProps(`native-piratechs-link`)} style={styles.piratechsLink} accessibilityRole={`link`} onPress={() => void openPiratechs()}>
              {`Piratechs ↗`}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default AppShell;
