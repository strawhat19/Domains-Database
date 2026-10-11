import { useMemo } from 'react';
import { Link } from 'expo-router';
import { createStyles } from './styles.native';
import { getNotificationCopy } from './content';
import { Text, View, Pressable } from 'react-native';
import type { NotificationCardProps } from './types';
import { elementProps } from '../../shared/elementProps';
import { getNotificationHref } from '../../shared/routes';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Info, Heart, Sparkles, Construction, ArrowUpRight } from 'lucide-react-native';

const NotificationCard = ({ index = 0, notification, prefix = `header`, readReady = true, onRead, onNavigate }: NotificationCardProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const suffix = notification?.id ?? `skeleton-${index}`;

  if (!notification) return (
    <View
      style={styles.card}
      accessibilityLabel={`Loading Notification`}
      {...elementProps(`native-${prefix}-notification-skeleton`, suffix)}
    >
      <View
        style={styles.skeletonSymbol}
        {...elementProps(`native-${prefix}-notification-skeleton-symbol`, suffix)}
      />
      <View
        style={styles.copy}
        {...elementProps(`native-${prefix}-notification-skeleton-copy`, suffix)}
      >
        <View
          style={styles.skeletonTitle}
          {...elementProps(`native-${prefix}-notification-skeleton-title`, suffix)}
        />
        <View
          style={styles.skeletonText}
          {...elementProps(`native-${prefix}-notification-skeleton-text`, suffix)}
        />
        <View
          style={styles.skeletonShortText}
          {...elementProps(`native-${prefix}-notification-skeleton-short-text`, suffix)}
        />
      </View>
    </View>
  );

  const Icon = notification.kind === `development` ? Construction : notification.kind === `announcement` ? Heart : notification.icon === `Info` ? Info : Sparkles;

  return (
    <Link href={getNotificationHref(notification.slug || notification.id)} asChild>
      <Pressable
        onPress={() => { void onRead?.(notification.id); onNavigate?.(); }}
        accessibilityRole={`link`}
        {...elementProps(`native-${prefix}-notification-card`, suffix)}
        accessibilityLabel={`Open Notification: ${notification.title}`}
        style={({ pressed }) => [styles.card, notification.isRead && styles.read, pressed && styles.pressed]}
      >
        <View
          style={styles.symbol}
          {...elementProps(`native-${prefix}-notification-symbol`, suffix)}
        >
          <Icon
            size={17}
            color={palette.accent}
            {...elementProps(`native-${prefix}-notification-icon`, suffix)}
          />
        </View>
        <View
          style={styles.copy}
          {...elementProps(`native-${prefix}-notification-copy`, suffix)}
        >
          <View style={styles.titleRow} {...elementProps(`native-${prefix}-notification-title-row`, suffix)}>
            <Text style={styles.title} {...elementProps(`native-${prefix}-notification-title`, suffix)}>{notification.title}</Text>
            {readReady && !notification.isRead && <View style={styles.unreadDot} accessibilityLabel={`Unread`} {...elementProps(`native-${prefix}-notification-unread`, suffix)} />}
          </View>
          <Text
            style={styles.text}
            {...elementProps(`native-${prefix}-notification-text`, suffix)}
          >
            {getNotificationCopy(notification)}
          </Text>
        </View>
        <ArrowUpRight size={15} color={palette.muted} {...elementProps(`native-${prefix}-notification-arrow`, suffix)} />
      </Pressable>
    </Link>
  );
};

export default NotificationCard;
export type { NotificationCardProps } from './types';
