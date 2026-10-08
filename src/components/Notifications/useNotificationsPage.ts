import { useLocalSearchParams } from 'expo-router';
import { routes } from '../../shared/routes';
import { useNotifications } from '../../shared/notifications/useNotifications';

export interface NotificationsProps {
  detail?: boolean;
}

export const useNotificationsPage = (detail = false) => {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const { error, loading, notifications } = useNotifications();
  const notificationId = detail ? (Array.isArray(params.id) ? params.id[0] : params.id) ?? `` : ``;
  const notification = detail ? notifications.find(record => record.id === notificationId) : undefined;
  const missing = detail && !loading && !error && !notification;
  const title = detail ? notification?.title ?? (missing ? `Notification Not Found` : `Notification`) : `Notifications`;
  const description = notification
    ? `${notification.before}sign up${notification.after}`
    : `Read announcements and updates from Domains Database.`;

  return {
    error,
    title,
    loading,
    missing,
    description,
    notification,
    notifications,
    noIndex: detail && !loading && !notification,
    suffix: detail ? `notification-${notificationId || `missing`}` : `notifications`,
    canonicalPath: detail && notificationId ? `${routes.notifications.href}/${encodeURIComponent(notificationId)}` : routes.notifications.href,
  };
};
