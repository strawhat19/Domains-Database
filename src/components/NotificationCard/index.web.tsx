import './styles.scss';
import { Link } from 'expo-router';
import { Info, Sparkles } from 'lucide-react';
import RouterAnchor from '../RouterAnchor';
import { routes } from '../../shared/routes';
import type { HeaderNotification } from '../../shared/sampleNotifications';

interface NotificationCardProps {
  index?: number;
  onSignUp: () => void;
  notification?: HeaderNotification;
}

const NotificationCard = ({ notification, index = 0, onSignUp }: NotificationCardProps) => {
  const suffix = notification?.id ?? `skeleton-${index}`;
  const Icon = notification?.icon === `Sparkles` ? Sparkles : Info;

  return (
    <li
      id={`header-notification-${suffix}`}
      aria-hidden={notification ? undefined : true}
      className={`header-notification-card${notification ? `` : ` header-notification-card-loading`}`}
    >
      <span
        id={`header-notification-symbol-${suffix}`}
        className={`header-notification-symbol`}
      >
        {notification && (
          <Icon
            size={16}
            aria-hidden={true}
            id={`header-notification-icon-${suffix}`}
            className={`header-notification-icon`}
          />
        )}
      </span>
      <div
        id={`header-notification-copy-${suffix}`}
        className={`header-notification-copy`}
      >
        {notification ? (
          <>
            <strong
              id={`header-notification-title-${suffix}`}
              className={`header-notification-title`}
            >
              {notification.title}
            </strong>
            <p
              id={`header-notification-text-${suffix}`}
              className={`header-notification-text`}
            >
              {notification.before}
              <Link href={routes.signup.href} asChild>
                <RouterAnchor
                  onClick={onSignUp}
                  id={`header-notification-sign-up-${suffix}`}
                  className={`header-notification-link`}
                >
                  {`sign up`}
                </RouterAnchor>
              </Link>
              {notification.after}
            </p>
          </>
        ) : (
          <>
            <span
              id={`header-notification-skeleton-title-${suffix}`}
              className={`header-notification-skeleton header-notification-skeleton-title`}
            />
            <span
              id={`header-notification-skeleton-text-${suffix}`}
              className={`header-notification-skeleton header-notification-skeleton-text`}
            />
          </>
        )}
      </div>
    </li>
  );
};

export default NotificationCard;
