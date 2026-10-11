import { notificationHref } from '../../shared/notifications/values';
import type { HeaderNotification } from '../../shared/sampleNotifications';

export const getNotificationSpacing = (previous?: string, next?: string) => previous && next && !/\s$/.test(previous) && !/^[\s,.;:!?)]/.test(next) ? ` ` : ``;
export const getNotificationCopy = (notification: HeaderNotification) => {
  if (notification.body === undefined) return notification.message ?? `${notification.before}sign up${notification.after}`;
  const label = notification.link?.label;
  return `${notification.body}${getNotificationSpacing(notification.body, label)}${label ?? ``}${getNotificationSpacing(label ?? notification.body, notification.suffix)}${notification.suffix ?? ``}`;
};
export const getNotificationLink = (href?: string) => {
  try { return notificationHref(href); } catch { return ``; }
};
