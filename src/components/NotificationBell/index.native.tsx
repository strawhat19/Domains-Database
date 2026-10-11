import { useMemo } from 'react';
import { Link } from 'expo-router';
import { routes } from '../../shared/routes';
import { createStyles } from './styles.native';
import NotificationCard from '../NotificationCard';
import { elementProps } from '../../shared/elementProps';
import { useNotificationBell } from './useNotificationBell';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { X, Bell, List, CheckCheck, RotateCcw } from 'lucide-react-native';

const NotificationBell = () => {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { open, busy, readReady, readLabel, error, notice, loading, notifications, count, close, toggle, badgeColors, markRead, markAllRead, reload } = useNotificationBell();

  return (
    <View {...elementProps(`native-header-notifications`)}>
      <Pressable
        onPress={toggle}
        accessibilityRole={`button`}
        accessibilityState={{ busy: loading, expanded: open }}
        {...elementProps(`native-header-notifications-toggle`)}
        accessibilityLabel={loading ? `Notifications, Loading Updates` : `Notifications, ${readLabel}`}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Bell
          size={18}
          color={palette.accent}
          {...elementProps(`native-header-notifications-icon`)}
        />
        {(loading || count > 0) && (
          <View
            accessibilityElementsHidden
            importantForAccessibility={`no-hide-descendants`}
            {...elementProps(`native-header-notifications-badge`)}
            style={[styles.badge, { backgroundColor: loading ? palette.skeleton : badgeColors.backgroundColor }]}
          >
            <Text
              style={[styles.badgeText, { color: badgeColors.color }]}
              {...elementProps(`native-header-notifications-badge-text`)}
            >
              {loading ? `` : count}
            </Text>
          </View>
        )}
      </Pressable>
      <Modal
        transparent
        visible={open}
        animationType={reducedMotion ? `none` : `fade`}
        onRequestClose={close}
        {...elementProps(`native-header-notifications-modal`)}
      >
        <View
          style={[styles.overlay, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
          {...elementProps(`native-header-notifications-overlay`)}
        >
          <Pressable
            onPress={close}
            style={styles.backdrop}
            accessibilityRole={`button`}
            accessibilityLabel={`Close notifications`}
            {...elementProps(`native-header-notifications-backdrop`)}
          />
          <View
            style={styles.panel}
            accessibilityViewIsModal
            {...elementProps(`native-header-notifications-panel`)}
          >
            <View
              style={styles.heading}
              {...elementProps(`native-header-notifications-heading`)}
            >
              <Text
                style={styles.title}
                accessibilityRole={`header`}
                {...elementProps(`native-header-notifications-title`)}
              >
                {`Notifications`}
              </Text>
              {loading ? (
                <View
                  accessible={false}
                  style={styles.countSkeleton}
                  {...elementProps(`native-header-notifications-count-skeleton`)}
                />
              ) : <Text
                style={styles.count}
                {...elementProps(`native-header-notifications-count`)}
              >
                {readLabel}
              </Text>}
              <Pressable
                onPress={close}
                accessibilityRole={`button`}
                accessibilityLabel={`Close notifications`}
                {...elementProps(`native-header-notifications-close`)}
                style={({ pressed }) => [styles.close, pressed && styles.pressed]}
              >
                <X
                  size={18}
                  color={palette.muted}
                  {...elementProps(`native-header-notifications-close-icon`)}
                />
              </Pressable>
            </View>
            <View {...elementProps(`native-header-notifications-actions`)} style={styles.actions}>
              <Pressable onPress={() => { void markAllRead(); }} disabled={busy || loading || !readReady || !count} accessibilityRole={`button`} accessibilityState={{ disabled: busy || loading || !readReady || !count }} style={[styles.action, (busy || loading || !readReady || !count) && styles.disabled]} {...elementProps(`native-header-notifications-read-all`)}><CheckCheck size={14} color={palette.accent} {...elementProps(`native-header-notifications-read-all-icon`)} /><Text style={styles.actionText} {...elementProps(`native-header-notifications-read-all-label`)}>{`Mark All Read`}</Text></Pressable>
              <Pressable onPress={reload} disabled={loading} accessibilityRole={`button`} accessibilityState={{ disabled: loading }} style={[styles.action, loading && styles.disabled]} {...elementProps(`native-header-notifications-reload`)}><RotateCcw size={14} color={palette.accent} {...elementProps(`native-header-notifications-reload-icon`)} /><Text style={styles.actionText} {...elementProps(`native-header-notifications-reload-label`)}>{`Reload`}</Text></Pressable>
            </View>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps={`handled`}
              {...elementProps(`native-header-notifications-list`)}
            >
              {!loading && !!error && (
                <Text
                  accessibilityRole={`alert`}
                  style={[styles.message, styles.messageError]}
                  {...elementProps(`native-header-notifications-error`)}
                >
                  {error}
                </Text>
              )}
              {loading ? [0, 1].map(index => (
                <NotificationCard
                  key={index}
                  index={index}
                />
              )) : notifications.length ? notifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  readReady={readReady}
                  onRead={readReady && !busy ? markRead : undefined}
                  onNavigate={close}
                  notification={notification}
                />
              )) : !error ? (
                <Text style={styles.message} {...elementProps(`native-header-notifications-empty`)}>
                  {`No Notifications Yet`}
                </Text>
              ) : null}
            </ScrollView>
            {!!notice && <Text style={styles.notice} accessibilityLiveRegion={`polite`} {...elementProps(`native-header-notifications-notice`)}>{notice}</Text>}
            <View style={styles.footer} {...elementProps(`native-header-notifications-footer`)}>
              <Link href={routes.notifications.href} asChild>
                <Pressable
                  onPress={close}
                  accessibilityRole={`link`}
                  accessibilityLabel={`View All Notifications`}
                  {...elementProps(`native-header-notifications-all-link`)}
                  style={({ pressed }) => [styles.footerLink, pressed && styles.pressed]}
                >
                  <List size={15} color={palette.accent} {...elementProps(`native-header-notifications-all-icon`)} />
                  <Text style={styles.footerLinkText} {...elementProps(`native-header-notifications-all-text`)}>
                    {`View All Notifications`}
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default NotificationBell;
