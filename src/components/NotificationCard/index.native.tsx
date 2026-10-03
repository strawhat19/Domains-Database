import { useMemo } from 'react';
import { Info, Sparkles } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import type { HeaderNotification } from '../../shared/sampleNotifications';

interface NotificationCardProps {
  index?: number;
  notification?: HeaderNotification;
  onSignUp: () => void;
}

const NotificationCard = ({ index = 0, notification, onSignUp }: NotificationCardProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const suffix = notification?.id ?? String(index);

  if (!notification) return (
    <View
      style={styles.card}
      accessibilityLabel={`Loading Notification`}
      {...elementProps(`native-notification-skeleton`, suffix)}
    >
      <View
        style={styles.skeletonSymbol}
        {...elementProps(`native-notification-skeleton-symbol`, suffix)}
      />
      <View
        style={styles.copy}
        {...elementProps(`native-notification-skeleton-copy`, suffix)}
      >
        <View
          style={styles.skeletonTitle}
          {...elementProps(`native-notification-skeleton-title`, suffix)}
        />
        <View
          style={styles.skeletonText}
          {...elementProps(`native-notification-skeleton-text`, suffix)}
        />
        <View
          style={styles.skeletonShortText}
          {...elementProps(`native-notification-skeleton-short-text`, suffix)}
        />
      </View>
    </View>
  );

  const Icon = notification.icon === `Info` ? Info : Sparkles;

  return (
    <View
      style={styles.card}
      {...elementProps(`native-notification-card`, suffix)}
    >
      <View
        style={styles.symbol}
        {...elementProps(`native-notification-symbol`, suffix)}
      >
        <Icon
          size={17}
          color={palette.accent}
          {...elementProps(`native-notification-icon`, suffix)}
        />
      </View>
      <View
        style={styles.copy}
        {...elementProps(`native-notification-copy`, suffix)}
      >
        <Text
          style={styles.title}
          {...elementProps(`native-notification-title`, suffix)}
        >
          {notification.title}
        </Text>
        <Text
          style={styles.text}
          {...elementProps(`native-notification-text`, suffix)}
        >
          {notification.before}
          <Text
            onPress={onSignUp}
            style={styles.link}
            accessibilityRole={`link`}
            accessibilityLabel={`Sign up`}
            {...elementProps(`native-notification-sign-up`, suffix)}
          >
            {`sign up`}
          </Text>
          {notification.after}
        </Text>
      </View>
    </View>
  );
};

export default NotificationCard;
