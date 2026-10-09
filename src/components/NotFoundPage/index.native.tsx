import { Link } from 'expo-router';
import PageMeta from '../PageMeta';
import { notFoundContent } from './content';
import { createStyles } from './styles.native';
import { useMemo, useContext } from 'react';
import { routes } from '../../shared/routes';
import { House, Link2, Globe2 } from 'lucide-react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { Text, View, Platform, Pressable, useWindowDimensions } from 'react-native';

const NotFoundPage = () => {
  const { palette } = useTheme();
  const { width, height } = useWindowDimensions();
  const pageContentHeight = useContext(ScrollContext)?.pageContentHeight;
  const styles = useMemo(() => createStyles(palette), [palette]);
  const compact = width < 600;
  const iconProps = Platform.OS === `web` ? { 'aria-hidden': true as const } : { accessible: false };

  return (
    <>
      <PageMeta noIndex title={`404 · Page Not Found`} description={notFoundContent.description} />
      <View
        {...elementProps(`not-found-page`)}
        style={[styles.page, compact && styles.compactPage, { minHeight: pageContentHeight ?? Math.max(440, height - 260) }]}
      >
        <View {...elementProps(`not-found-content`)} style={styles.content}>
          <View
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility={`no-hide-descendants`}
            {...elementProps(`not-found-art`)}
            style={[styles.art, compact && styles.compactArt]}
          >
            <View {...elementProps(`not-found-code`)} style={styles.code}>
              <Text {...elementProps(`not-found-first-digit`)} style={[styles.digit, compact && styles.compactDigit]}>{`4`}</Text>
              <View {...elementProps(`not-found-globe-ring`)} style={[styles.globeRing, compact && styles.compactGlobeRing]}>
                <Globe2
                  {...iconProps}
                  strokeWidth={1.2}
                  color={palette.accent}
                  size={compact ? 58 : 88}
                  {...elementProps(`not-found-globe`)}
                />
              </View>
              <Text {...elementProps(`not-found-last-digit`)} style={[styles.digit, compact && styles.compactDigit]}>{`4`}</Text>
            </View>
            <View {...elementProps(`not-found-address`)} style={styles.address}>
              <Link2 {...iconProps} size={13} color={palette.accent} {...elementProps(`not-found-address-icon`)} />
              <Text {...elementProps(`not-found-address-label`)} style={styles.addressText}>{notFoundContent.address}</Text>
            </View>
          </View>
          <Text {...elementProps(`not-found-eyebrow`)} style={styles.eyebrow}>{notFoundContent.eyebrow}</Text>
          <Text {...elementProps(`not-found-title`)} style={[styles.title, compact && styles.compactTitle]} accessibilityRole={`header`}>{notFoundContent.title}</Text>
          <Text {...elementProps(`not-found-description`)} style={styles.description}>{notFoundContent.description}</Text>
          <View {...elementProps(`not-found-actions`)} style={[styles.actions, compact && styles.compactActions]}>
            <Link asChild href={routes.home.href}>
              <Pressable
                accessibilityRole={`link`}
                accessibilityLabel={notFoundContent.homeLabel}
                {...elementProps(`not-found-home-link`)}
                style={({ pressed }) => [styles.button, styles.primaryButton, pressed && styles.pressed]}
              >
                <House {...iconProps} size={16} color={palette.contrast} {...elementProps(`not-found-home-icon`)} />
                <Text {...elementProps(`not-found-home-label`)} style={[styles.buttonText, styles.primaryText]}>{notFoundContent.homeLabel}</Text>
              </Pressable>
            </Link>
            <Link asChild href={routes.domains.href}>
              <Pressable
                accessibilityRole={`link`}
                accessibilityLabel={notFoundContent.domainsLabel}
                {...elementProps(`not-found-domains-link`)}
                style={({ pressed }) => [styles.button, pressed && styles.pressed]}
              >
                <Globe2 {...iconProps} size={16} color={palette.accent} {...elementProps(`not-found-domains-icon`)} />
                <Text {...elementProps(`not-found-domains-label`)} style={styles.buttonText}>{notFoundContent.domainsLabel}</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </>
  );
};

export default NotFoundPage;
