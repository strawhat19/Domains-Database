import './styles.scss';
import { Link } from 'expo-router';
import { Info, Sparkles } from 'lucide-react';
import RouterAnchor from '../RouterAnchor';
import type { NotificationCardProps } from './types';
import { getNotificationHref } from '../../shared/routes';

const NotificationCard = ({ notification, index = 0, prefix = `header`, onNavigate }: NotificationCardProps) => {
  const suffix = notification?.id ?? `skeleton-${index}`;
  const Icon = notification?.icon === `Sparkles` ? Sparkles : Info;
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
            </strong>
            <p
              id={`${prefix}-notification-text-${suffix}`}
              className={`header-notification-text`}
            >
              {notification.before}
              {`sign up`}
              {notification.after}
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
    </>
  );

  return (
    <li
      id={`${prefix}-notification-${suffix}`}
      className={`header-notification-item`}
      aria-hidden={notification ? undefined : true}
    >
      {notification ? (
        <Link href={getNotificationHref(notification.id)} asChild>
          <RouterAnchor
            onClick={onNavigate}
            className={`header-notification-card`}
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
