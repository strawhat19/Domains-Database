import { Link } from 'expo-router';
import PageMeta from '../PageMeta';
import StatePanel from '../StatePanel';
import { notFoundContent } from './content';
import { createStyles } from './styles.native';
import { useMemo, useContext } from 'react';
import { routes } from '../../shared/routes';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { House, Globe2, BookOpen, ArrowRight } from 'lucide-react-native';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { Text, View, Platform, Pressable, useWindowDimensions } from 'react-native';

const NotFoundPage = () => {
  const { palette, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const pageContentHeight = useContext(ScrollContext)?.pageContentHeight;
  const styles = useMemo(() => createStyles(palette, isDark), [palette, isDark]);
  const narrow = width < 600;
  const compact = narrow || (pageContentHeight ?? height - 260) < 520;
  const iconProps = Platform.OS === `web` ? { 'aria-hidden': true as const } : { accessible: false };

  return (
    <>
      <PageMeta noIndex title={`404 · Page Not Found`} description={notFoundContent.description} />
      <View
        {...elementProps(`not-found-page`)}
        style={[styles.page, compact && styles.compactPage, { minHeight: pageContentHeight ?? Math.max(440, height - 260) }]}
      >
        <StatePanel icon={`error`} id={`not-found`} eyebrow={notFoundContent.eyebrow} title={notFoundContent.title} description={notFoundContent.description}>
          <View {...elementProps(`not-found-content`)} style={styles.content}>
            <View {...elementProps(`not-found-actions`)} style={[styles.actions, narrow && styles.compactActions]}>
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
            <Link asChild href={routes.blog.href}>
              <Pressable
                accessibilityRole={`link`}
                accessibilityLabel={notFoundContent.blogLabel}
                {...elementProps(`not-found-blog-link`)}
                style={({ pressed }) => [styles.blogLink, pressed && styles.pressed]}
              >
                <BookOpen {...iconProps} size={15} color={palette.muted} {...elementProps(`not-found-blog-icon`)} />
                <Text {...elementProps(`not-found-blog-label`)} style={styles.blogText}>{notFoundContent.blogLabel}</Text>
                <ArrowRight {...iconProps} size={14} color={palette.muted} {...elementProps(`not-found-blog-arrow`)} />
              </Pressable>
            </Link>
          </View>
        </StatePanel>
      </View>
    </>
  );
};

export default NotFoundPage;
