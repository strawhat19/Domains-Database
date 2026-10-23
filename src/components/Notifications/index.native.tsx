import { Link } from 'expo-router';
import PageMeta from '../PageMeta';
import StatePanel from '../StatePanel';
import { routes } from '../../shared/routes';
import { createStyles } from './styles.native';
import NotificationCard from '../NotificationCard';
import { useMemo, useEffect, useContext } from 'react';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useFeatureFlags } from '../../shared/featureFlags/useFeatureFlags';
import { getNotificationSpacing } from '../NotificationCard/content';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { Text, View, Platform, Pressable, useWindowDimensions } from 'react-native';
import { useNotificationsPage, type NotificationsProps } from './useNotificationsPage';
import { Bell, Info, Heart, House, Globe2, BookOpen, Sparkles, ArrowLeft, CheckCheck, RotateCcw, Construction } from 'lucide-react-native';

const decorativeIconProps = Platform.OS === `web` ? { 'aria-hidden': true as const } : { accessible: false };

const NotificationsContent = ({ detail = false }: NotificationsProps) => {
  const state = useNotificationsPage(detail);
  const { width } = useWindowDimensions();
  const { palette, isDark } = useTheme();
  const setHeroBottom = useContext(ScrollContext)?.setHeroBottom;
  const styles = useMemo(() => createStyles(palette, isDark), [palette, isDark]);
  const { suffix, notification } = state;
  const wide = width >= 700;
  const padding = wide ? 32 : 20;
  const cardWidth = (Math.min(width, 960) - padding * 2 - (wide ? 16 : 0)) / (wide ? 2 : 1);
  const Icon = detail ? notification?.kind === `development` ? Construction : notification?.kind === `announcement` ? Heart : notification?.icon === `Sparkles` ? Sparkles : Info : Bell;

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
              {detail ? `APP ANNOUNCEMENT` : `${state.appName.toUpperCase()} UPDATES`}
            </Text>
          </View>
          <Text {...elementProps(`native-notifications-title`, suffix)} style={[styles.title, wide && styles.wideTitle]} accessibilityRole={`header`}>
            {state.title}
          </Text>
          {!detail && (
            <Text {...elementProps(`native-notifications-description`, suffix)} style={styles.description}>
              {`Announcements and updates from ${state.appName}.`}
            </Text>
          )}
          {!detail && !state.loading && !state.error && (
            <Text {...elementProps(`native-notifications-count`, suffix)} style={styles.count}>
              {`${state.notifications.length} Notification(s) · ${state.readReady ? `${state.unreadCount} Unread` : state.notice ? `Read Status Unavailable` : `Loading Read Status`}`}
            </Text>
          )}
        </View>
        <View {...elementProps(`native-notifications-actions`, suffix)} style={styles.actions}>
          {!detail && <Pressable disabled={state.loading || state.busy || !state.readReady || !state.unreadCount} onPress={() => { void state.markAllRead(); }} accessibilityRole={`button`} accessibilityState={{ disabled: state.loading || state.busy || !state.readReady || !state.unreadCount }} style={[styles.action, (state.loading || state.busy || !state.readReady || !state.unreadCount) && styles.disabled]} {...elementProps(`native-notifications-read-all`, suffix)}><CheckCheck size={14} color={palette.accent} {...elementProps(`native-notifications-read-all-icon`, suffix)} /><Text style={styles.actionLabel} {...elementProps(`native-notifications-read-all-label`, suffix)}>{`Mark All Read`}</Text></Pressable>}
          <Pressable disabled={state.loading} onPress={state.reload} accessibilityRole={`button`} accessibilityState={{ disabled: state.loading }} style={[styles.action, state.loading && styles.disabled]} {...elementProps(`native-notifications-reload`, suffix)}><RotateCcw size={14} color={palette.accent} {...elementProps(`native-notifications-reload-icon`, suffix)} /><Text style={styles.actionLabel} {...elementProps(`native-notifications-reload-label`, suffix)}>{`Reload`}</Text></Pressable>
        </View>
        {!!state.error && (
          <Text {...elementProps(`native-notifications-error`, suffix)} style={styles.error} accessibilityRole={`alert`}>{state.error}</Text>
        )}
        {!!state.notice && <Text {...elementProps(`native-notifications-notice`, suffix)} style={styles.notice} accessibilityLiveRegion={`polite`}>{state.notice}</Text>}
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
                {notification.body !== undefined ? <>
                  {notification.body}
                  {getNotificationSpacing(notification.body, notification.link?.label)}
                  {notification.link && (state.linkHref ? <Link href={state.linkHref} style={styles.inlineLink} {...elementProps(`native-notifications-inline-link`, suffix)} accessibilityLabel={notification.link.label}>{notification.link.label}</Link> : notification.link.label)}
                  {getNotificationSpacing(notification.link?.label ?? notification.body, notification.suffix)}{notification.suffix}
                </> : notification.message ?? (
                  <>
                    {notification.before}
                    <Link href={routes.signup.href} style={styles.inlineLink} {...elementProps(`native-notifications-sign-up`, suffix)} accessibilityLabel={`Sign Up`}>
                      {`sign up`}
                    </Link>
                    {notification.after}
                  </>
                )}
              </Text>
              <View {...elementProps(`native-notifications-metadata`, suffix)} style={styles.metadata}>
                <View {...elementProps(`native-notifications-kind-row`, suffix)} style={styles.metaItem}><Text {...elementProps(`native-notifications-kind-label`, suffix)} style={styles.metaLabel}>{`Type`}</Text><Text {...elementProps(`native-notifications-kind-value`, suffix)} style={styles.metaValue}>{notification.kind === `development` ? `Development` : `Announcement`}</Text></View>
                <View {...elementProps(`native-notifications-read-row`, suffix)} style={styles.metaItem}><Text {...elementProps(`native-notifications-read-label`, suffix)} style={styles.metaLabel}>{`Read Status`}</Text><Text {...elementProps(`native-notifications-read-value`, suffix)} style={styles.metaValue} accessibilityLiveRegion={`polite`}>{!state.readReady ? state.notice ? `Unavailable` : `Loading` : notification.isRead ? `Read` : `Unread`}</Text></View>
              </View>
              {!notification.isRead && <Pressable disabled={state.busy || !state.readReady} onPress={() => { void state.markRead(notification.id); }} accessibilityRole={`button`} accessibilityState={{ disabled: state.busy || !state.readReady }} style={[styles.action, (state.busy || !state.readReady) && styles.disabled]} {...elementProps(`native-notifications-mark-read`, suffix)}><CheckCheck size={14} color={palette.accent} {...elementProps(`native-notifications-mark-read-icon`, suffix)} /><Text style={styles.actionLabel} {...elementProps(`native-notifications-mark-read-label`, suffix)}>{`Mark Read`}</Text></Pressable>}
            </View>
          ) : state.missing ? (
            <StatePanel
              variant={`inline`}
              icon={`notifications`}
              id={`${suffix}-missing`}
              eyebrow={`NOTIFICATIONS`}
              title={`Announcement unavailable`}
              description={`This notification could not be found. Browse the list for available announcements.`}
            >
              <Link href={routes.notifications.href} asChild>
                <Pressable
                  accessibilityRole={`link`}
                  {...elementProps(`native-notifications-browse-notifications`, suffix)}
                  style={({ pressed }) => [styles.stateLink, styles.primaryStateLink, pressed && styles.pressed]}
                >
                  <Bell {...decorativeIconProps} size={16} color={palette.contrast} {...elementProps(`native-notifications-browse-notifications-icon`, suffix)} />
                  <Text {...elementProps(`native-notifications-browse-notifications-label`, suffix)} style={[styles.stateLinkText, styles.primaryStateLinkText]}>{`View Notifications`}</Text>
                </Pressable>
              </Link>
            </StatePanel>
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
                  <NotificationCard prefix={`notifications`} readReady={state.readReady} onRead={state.readReady && !state.busy ? state.markRead : undefined} notification={record} />
                </View>
              ))}
            </View>
            {!state.loading && !state.error && !state.notifications.length && (
              <StatePanel
                variant={`inline`}
                icon={`notifications`}
                id={`${suffix}-empty`}
                eyebrow={`YOU’RE UP TO DATE`}
                title={`No notifications yet`}
                description={`Announcements and updates will appear here when they’re available.`}
              >
                <Link href={routes.domains.href} asChild>
                  <Pressable
                    accessibilityRole={`link`}
                    {...elementProps(`native-notifications-browse-domains`, suffix)}
                    style={({ pressed }) => [styles.stateLink, styles.primaryStateLink, pressed && styles.pressed]}
                  >
                    <Globe2 {...decorativeIconProps} size={16} color={palette.contrast} {...elementProps(`native-notifications-browse-domains-icon`, suffix)} />
                    <Text {...elementProps(`native-notifications-browse-domains-label`, suffix)} style={[styles.stateLinkText, styles.primaryStateLinkText]}>{`Explore Domains`}</Text>
                  </Pressable>
                </Link>
              </StatePanel>
            )}
          </>
        )}
      </View>
    </>
  );
};

const NotificationsUnavailable = ({ message, loading }: { message: string; loading: boolean }) => {
  const { palette, isDark } = useTheme();
  const styles = useMemo(() => createStyles(palette, isDark), [palette, isDark]);
  return <>
    <PageMeta noIndex title={`Notifications`} canonicalPath={routes.notifications.href} description={message} />
    {loading ? (
      <View accessible accessibilityRole={`progressbar`} accessibilityState={{ busy: true }} accessibilityLabel={`Loading Notifications`} {...elementProps(`notifications-page`)} style={[styles.page, styles.loadingPage]}>
        <View accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`} {...elementProps(`notifications-loading-content`)} style={styles.loadingContent}>
          <View {...elementProps(`notifications-loading-intro`)} style={styles.loadingIntro}>
            <View {...elementProps(`notifications-loading-title`)} style={[styles.skeletonLine, styles.skeletonTitle]} />
            <View {...elementProps(`notifications-loading-description`)} style={[styles.skeletonLine, styles.skeletonDescription]} />
          </View>
          <View {...elementProps(`notifications-loading-list`)} style={styles.list}>
            {[0, 1].map(index => <View key={index} {...elementProps(`notifications-loading-slot`, index)} style={styles.loadingSlot}><NotificationCard index={index} prefix={`notifications-loading`} /></View>)}
          </View>
        </View>
      </View>
    ) : (
      <StatePanel
        icon={`notifications`}
        id={`notifications-unavailable`}
        title={`Notifications unavailable`}
        eyebrow={`ANNOUNCEMENTS & UPDATES`}
        description={message}
      >
        <Link href={routes.home.href} asChild>
          <Pressable
            accessibilityRole={`link`}
            {...elementProps(`notifications-unavailable-home`)}
            style={({ pressed }) => [styles.stateLink, styles.primaryStateLink, pressed && styles.pressed]}
          >
            <House {...decorativeIconProps} size={16} color={palette.contrast} {...elementProps(`notifications-unavailable-home-icon`)} />
            <Text {...elementProps(`notifications-unavailable-home-label`)} style={[styles.stateLinkText, styles.primaryStateLinkText]}>{`Back to Home`}</Text>
          </Pressable>
        </Link>
        <Link href={routes.blog.href} asChild>
          <Pressable
            accessibilityRole={`link`}
            {...elementProps(`notifications-unavailable-blog`)}
            style={({ pressed }) => [styles.stateLink, pressed && styles.pressed]}
          >
            <BookOpen {...decorativeIconProps} size={16} color={palette.accent} {...elementProps(`notifications-unavailable-blog-icon`)} />
            <Text {...elementProps(`notifications-unavailable-blog-label`)} style={styles.stateLinkText}>{`Read the Blog`}</Text>
          </Pressable>
        </Link>
      </StatePanel>
    )}
  </>;
};

const Notifications = ({ detail = false }: NotificationsProps) => {
  const { error, flags, ready } = useFeatureFlags();
  const loading = !ready && !error;
  const message = loading ? `Loading Notifications…` : `Notifications are currently unavailable. Explore domains or read the latest articles while you’re here.`;
  return ready && flags.notifications ? <NotificationsContent detail={detail} /> : <NotificationsUnavailable loading={loading} message={message} />;
};

export default Notifications;
