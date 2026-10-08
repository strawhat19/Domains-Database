import { Link } from 'expo-router';
import PageMeta from '../PageMeta';
import NotificationCard from '../NotificationCard';
import { useMemo, useEffect, useContext } from 'react';
import { Bell, Info, Sparkles, ArrowLeft } from 'lucide-react-native';
import { Text, View, Pressable, useWindowDimensions } from 'react-native';
import { createStyles } from './styles.native';
import { routes } from '../../shared/routes';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { useNotificationsPage, type NotificationsProps } from './useNotificationsPage';

const Notifications = ({ detail = false }: NotificationsProps) => {
  const state = useNotificationsPage(detail);
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const setHeroBottom = useContext(ScrollContext)?.setHeroBottom;
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { suffix, notification } = state;
  const wide = width >= 700;
  const padding = wide ? 32 : 20;
  const cardWidth = (Math.min(width, 960) - padding * 2 - (wide ? 16 : 0)) / (wide ? 2 : 1);
  const Icon = detail ? notification?.icon === `Sparkles` ? Sparkles : Info : Bell;

  useEffect(() => () => setHeroBottom?.(null), [setHeroBottom]);

  return (
    <>
      <PageMeta
        title={state.title}
        noIndex={state.noIndex}
        description={state.description}
        canonicalPath={state.canonicalPath}
      />
      <View {...elementProps(`native-notifications-page`, suffix)} style={[styles.page, { paddingHorizontal: padding }]}>
        <View
          style={styles.intro}
          {...elementProps(`native-notifications-intro`, suffix)}
          onLayout={({ nativeEvent }) => setHeroBottom?.(nativeEvent.layout.y + nativeEvent.layout.height)}
        >
          {detail && (
            <Link href={routes.notifications.href} asChild>
              <Pressable
                style={styles.back}
                accessibilityRole={`link`}
                accessibilityLabel={`Back To Notifications`}
                {...elementProps(`native-notifications-back`, suffix)}
              >
                <ArrowLeft size={15} accessible={false} color={palette.muted} {...elementProps(`native-notifications-back-icon`, suffix)} />
                <Text {...elementProps(`native-notifications-back-text`, suffix)} style={styles.backText}>{`Back to Notifications`}</Text>
              </Pressable>
            </Link>
          )}
          <View {...elementProps(`native-notifications-eyebrow`, suffix)} style={styles.eyebrow}>
            <Icon size={15} accessible={false} color={palette.accent} {...elementProps(`native-notifications-eyebrow-icon`, suffix)} />
            <Text {...elementProps(`native-notifications-eyebrow-text`, suffix)} style={styles.eyebrowText}>
              {detail ? `APP ANNOUNCEMENT` : `DOMAINS DATABASE UPDATES`}
            </Text>
          </View>
          <Text {...elementProps(`native-notifications-title`, suffix)} style={[styles.title, wide && styles.wideTitle]} accessibilityRole={`header`}>
            {state.title}
          </Text>
          {!detail && (
            <Text {...elementProps(`native-notifications-description`, suffix)} style={styles.description}>
              {`Announcements and updates from Domains Database.`}
            </Text>
          )}
          {!detail && !state.loading && !state.error && (
            <Text {...elementProps(`native-notifications-count`, suffix)} style={styles.count}>
              {`${state.notifications.length} notification(s)`}
            </Text>
          )}
        </View>
        {!!state.error && (
          <Text {...elementProps(`native-notifications-error`, suffix)} style={styles.error} accessibilityRole={`alert`}>{state.error}</Text>
        )}
        {state.loading && (
          <Text {...elementProps(`native-notifications-loading`, suffix)} style={styles.status} accessibilityLiveRegion={`polite`}>
            {detail ? `Loading notification…` : `Loading notifications…`}
          </Text>
        )}
        {detail ? (
          state.loading ? (
            <View accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`} {...elementProps(`native-notifications-skeleton`, suffix)} style={[styles.detail, styles.detailLoading]}>
              {[0, 1, 2].map(index => (
                <View key={index} {...elementProps(`native-notifications-skeleton-line`, `${suffix}-${index}`)} style={[styles.skeletonLine, index === 2 && styles.shortSkeletonLine]} />
              ))}
            </View>
          ) : notification ? (
            <View {...elementProps(`native-notifications-body`, suffix)} style={styles.detail}>
              <Text {...elementProps(`native-notifications-text`, suffix)} style={styles.detailText}>
                {notification.before}
                <Link href={routes.signup.href} style={styles.inlineLink} {...elementProps(`native-notifications-sign-up`, suffix)} accessibilityLabel={`Sign Up`}>
                  {`sign up`}
                </Link>
                {notification.after}
              </Text>
            </View>
          ) : state.missing ? (
            <Text {...elementProps(`native-notifications-missing`, suffix)} style={[styles.status, styles.empty]} accessibilityLiveRegion={`polite`}>
              {`This notification could not be found. Browse the notifications list for available announcements.`}
            </Text>
          ) : null
        ) : (
          <>
            <View {...elementProps(`native-notifications-list`, suffix)} style={styles.list}>
              {state.loading ? [0, 1].map(index => (
                <View key={index} {...elementProps(`native-notifications-slot`, `loading-${index}`)} style={{ width: cardWidth }}>
                  <NotificationCard index={index} prefix={`notifications`} />
                </View>
              )) : state.notifications.map(record => (
                <View key={record.id} {...elementProps(`native-notifications-slot`, record.id)} style={{ width: cardWidth }}>
                  <NotificationCard prefix={`notifications`} notification={record} />
                </View>
              ))}
            </View>
            {!state.loading && !state.error && !state.notifications.length && (
              <Text {...elementProps(`native-notifications-empty`, suffix)} style={[styles.status, styles.empty]} accessibilityLiveRegion={`polite`}>
                {`No notifications to show.`}
              </Text>
            )}
          </>
        )}
      </View>
    </>
  );
};

export default Notifications;
