import './styles.scss';
import { Link } from 'expo-router';
import RouterAnchor from '../RouterAnchor';
import { getNotificationCopy } from './content';
import type { NotificationCardProps } from './types';
import { getNotificationHref } from '../../shared/routes';
import { Info, Heart, Sparkles, Construction, ArrowUpRight } from 'lucide-react';

const NotificationCard = ({ notification, index = 0, prefix = `header`, readReady = true, onRead, onNavigate }: NotificationCardProps) => {
  const suffix = notification?.id ?? `skeleton-${index}`;
  const Icon = notification?.kind === `development` ? Construction : notification?.kind === `announcement` ? Heart : notification?.icon === `Sparkles` ? Sparkles : Info;
  const content = (
    <>
      <span
        id={`${prefix}-notification-symbol-${suffix}`}
        className={`header-notification-symbol`}
      >
        {notification && (
          <Icon
            size={16}
            aria-hidden={true}
            id={`${prefix}-notification-icon-${suffix}`}
            className={`header-notification-icon`}
          />
        )}
      </span>
      <div
        id={`${prefix}-notification-copy-${suffix}`}
        className={`header-notification-copy`}
      >
        {notification ? (
          <>
            <strong
              id={`${prefix}-notification-title-${suffix}`}
              className={`header-notification-title`}
            >
              {notification.title}
              {readReady && !notification.isRead && <span id={`${prefix}-notification-unread-${suffix}`} className={`header-notification-unread-dot`} aria-label={`Unread`} />}
            </strong>
            <p
              id={`${prefix}-notification-text-${suffix}`}
              className={`header-notification-text`}
            >
              {getNotificationCopy(notification)}
            </p>
          </>
        ) : (
          <>
            <span
              id={`${prefix}-notification-skeleton-title-${suffix}`}
              className={`header-notification-skeleton header-notification-skeleton-title`}
            />
            <span
              id={`${prefix}-notification-skeleton-text-${suffix}`}
              className={`header-notification-skeleton header-notification-skeleton-text`}
            />
          </>
        )}
      </div>
      {notification && <ArrowUpRight size={15} aria-hidden id={`${prefix}-notification-arrow-${suffix}`} className={`header-notification-arrow`} />}
    </>
  );

  return (
    <li
      id={`${prefix}-notification-${suffix}`}
      className={`header-notification-item`}
      aria-hidden={notification ? undefined : true}
    >
      {notification ? (
        <Link href={getNotificationHref(notification.slug || notification.id)} asChild>
          <RouterAnchor
            onClick={() => { void onRead?.(notification.id); onNavigate?.(); }}
            className={`header-notification-card${notification.isRead ? ` is-read` : ``}`}
            id={`${prefix}-notification-card-${suffix}`}
            aria-label={`Open Notification: ${notification.title}`}
          >
            {content}
          </RouterAnchor>
        </Link>
      ) : (
        <div
          id={`${prefix}-notification-card-${suffix}`}
          className={`header-notification-card header-notification-card-loading`}
        >
          {content}
        </div>
      )}
    </li>
  );
};

export default NotificationCard;
export type { NotificationCardProps } from './types';
