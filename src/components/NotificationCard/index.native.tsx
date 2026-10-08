import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Info, Sparkles } from 'lucide-react-native';
import { Text, View, Pressable } from 'react-native';
import { createStyles } from './styles.native';
import type { NotificationCardProps } from './types';
import { elementProps } from '../../shared/elementProps';
import { getNotificationHref } from '../../shared/routes';
import { useTheme } from '../../shared/themeContext/useTheme';

const NotificationCard = ({ index = 0, notification, prefix = `header`, onNavigate }: NotificationCardProps) => {
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

  const Icon = notification.icon === `Info` ? Info : Sparkles;

  return (
    <Link href={getNotificationHref(notification.id)} asChild>
      <Pressable
        onPress={onNavigate}
        accessibilityRole={`link`}
        {...elementProps(`native-${prefix}-notification-card`, suffix)}
        accessibilityLabel={`Open Notification: ${notification.title}`}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
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
          <Text
            style={styles.title}
            {...elementProps(`native-${prefix}-notification-title`, suffix)}
          >
            {notification.title}
          </Text>
          <Text
            style={styles.text}
            {...elementProps(`native-${prefix}-notification-text`, suffix)}
          >
            {notification.before}
            {`sign up`}
            {notification.after}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
};

export default NotificationCard;
export type { NotificationCardProps } from './types';
