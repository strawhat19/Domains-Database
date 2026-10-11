import { useRef, useEffect } from 'react';
import { routes } from '../../shared/routes';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../shared/authContext/useAuth';
import { useNotifications } from '../../shared/notifications/useNotifications';
import { getNotificationCopy, getNotificationLink } from '../NotificationCard/content';

export interface NotificationsProps {
  detail?: boolean;
}

export const useNotificationsPage = (detail = false) => {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const state = useNotifications();
  const { user } = useAuth();
  const { busy, error, loading, notifications } = state;
  const attemptedRead = useRef(``);
  const notificationId = detail ? (Array.isArray(params.id) ? params.id[0] : params.id) ?? `` : ``;
  const notification = detail ? notifications.find(record => record.id === notificationId || record.slug === notificationId) : undefined;
  const missing = detail && !loading && !error && !notification;
  const title = detail ? notification?.title ?? (missing ? `Notification Not Found` : `Notification`) : `Notifications`;
  const description = notification
    ? getNotificationCopy(notification)
    : `Read announcements and updates from Domains Database.`;
  const readKey = `${user?.active ? user.id : `guest`}:${notification?.id ?? ``}`;

  useEffect(() => {
    if (!notification || notification.isRead || !state.readReady || busy || loading || error || attemptedRead.current === readKey) return;
    attemptedRead.current = readKey;
    void state.markRead(notification.id);
  }, [busy, error, loading, state.readReady, readKey, notification, state.markRead]);

  return {
    ...state,
    title,
    missing,
    description,
    notification,
    linkHref: getNotificationLink(notification?.link?.href),
    reload: () => { attemptedRead.current = ``; state.reload(); },
    noIndex: detail && !loading && !notification,
    suffix: detail ? `notification-${notificationId || `missing`}` : `notifications`,
    canonicalPath: detail && notificationId ? `${routes.notifications.href}/${encodeURIComponent(notificationId)}` : routes.notifications.href,
  };
};
