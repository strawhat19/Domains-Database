import { useMemo } from 'react';
import { Link } from 'expo-router';
import { X, Bell, List } from 'lucide-react-native';
import { createStyles } from './styles.native';
import NotificationCard from '../NotificationCard';
import { routes } from '../../shared/routes';
import { useNotificationBell } from './useNotificationBell';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

const NotificationBell = () => {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { open, error, loading, notifications, count, close, toggle } = useNotificationBell();

  return (
    <View {...elementProps(`native-header-notifications`)}>
      <Pressable
        onPress={toggle}
        accessibilityRole={`button`}
        accessibilityState={{ expanded: open }}
        {...elementProps(`native-header-notifications-toggle`)}
        accessibilityLabel={`Notifications, ${count} updates`}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Bell
          size={18}
          color={palette.accent}
          {...elementProps(`native-header-notifications-icon`)}
        />
        <View
          style={styles.badge}
          accessibilityElementsHidden
          importantForAccessibility={`no-hide-descendants`}
          {...elementProps(`native-header-notifications-badge`)}
        >
          <Text
            style={styles.badgeText}
            {...elementProps(`native-header-notifications-badge-text`)}
          >
            {count}
          </Text>
        </View>
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
              <Text
                style={styles.count}
                {...elementProps(`native-header-notifications-count`)}
              >
                {`${count} updates`}
              </Text>
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
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps={`handled`}
              {...elementProps(`native-header-notifications-list`)}
            >
              {loading ? [0, 1].map(index => (
                <NotificationCard
                  key={index}
                  index={index}
                />
              )) : error ? (
                <Text
                  accessibilityRole={`alert`}
                  style={[styles.message, styles.messageError]}
                  {...elementProps(`native-header-notifications-error`)}
                >
                  {error}
                </Text>
              ) : notifications.length ? notifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  onNavigate={close}
                  notification={notification}
                />
              )) : (
                <Text style={styles.message} {...elementProps(`native-header-notifications-empty`)}>
                  {`No Notifications Yet`}
                </Text>
              )}
            </ScrollView>
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
