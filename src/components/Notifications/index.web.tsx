import './styles.scss';
import { Link } from 'expo-router';
import PageMeta from '../PageMeta';
import RouterAnchor from '../RouterAnchor';
import NotificationCard from '../NotificationCard';
import { Bell, Info, Sparkles, ArrowLeft } from 'lucide-react';
import { routes } from '../../shared/routes';
import { useNotificationsPage, type NotificationsProps } from './useNotificationsPage';

const Notifications = ({ detail = false }: NotificationsProps) => {
  const state = useNotificationsPage(detail);
  const { suffix, notification } = state;
  const Icon = detail ? notification?.icon === `Sparkles` ? Sparkles : Info : Bell;

  return (
    <>
      <PageMeta
        title={state.title}
        noIndex={state.noIndex}
        description={state.description}
        canonicalPath={state.canonicalPath}
      />
      <div id={`${suffix}-page`} className={`notifications-page`}>
        <header data-scroll-hero id={`${suffix}-intro`} className={`notifications-intro`}>
          {detail && (
            <Link href={routes.notifications.href} asChild>
              <RouterAnchor id={`${suffix}-back`} className={`notifications-back`}>
                <ArrowLeft size={15} aria-hidden id={`${suffix}-back-icon`} className={`notifications-back-icon`} />
                {`Back to Notifications`}
              </RouterAnchor>
            </Link>
          )}
          <p id={`${suffix}-eyebrow`} className={`notifications-eyebrow`}>
            <Icon size={15} aria-hidden id={`${suffix}-eyebrow-icon`} className={`notifications-eyebrow-icon`} />
            {detail ? `APP ANNOUNCEMENT` : `DOMAINS DATABASE UPDATES`}
          </p>
          <h1 id={`${suffix}-title`} className={`notifications-title`}>{state.title}</h1>
          {!detail && (
            <p id={`${suffix}-description`} className={`notifications-description`}>
              {`Announcements and updates from Domains Database.`}
            </p>
          )}
          {!detail && !state.loading && !state.error && (
            <p id={`${suffix}-count`} className={`notifications-count`}>
              {`${state.notifications.length} notification(s)`}
            </p>
          )}
        </header>
        {!!state.error && (
          <p role={`alert`} id={`${suffix}-error`} className={`notifications-error`}>{state.error}</p>
        )}
        {state.loading && (
          <p role={`status`} id={`${suffix}-loading`} className={`notifications-status`}>
            {detail ? `Loading notification…` : `Loading notifications…`}
          </p>
        )}
        {detail ? (
          state.loading ? (
            <div aria-hidden id={`${suffix}-skeleton`} className={`notifications-detail notifications-detail-loading`}>
              {[0, 1, 2].map(index => (
                <span key={index} id={`${suffix}-skeleton-line-${index}`} className={`notifications-skeleton-line`} />
              ))}
            </div>
          ) : notification ? (
            <article id={`${suffix}-body`} className={`notifications-detail`} aria-labelledby={`${suffix}-title`}>
              <p id={`${suffix}-text`} className={`notifications-detail-text`}>
                {notification.before}
                <Link href={routes.signup.href} asChild>
                  <RouterAnchor id={`${suffix}-sign-up`} className={`notifications-inline-link`}>{`sign up`}</RouterAnchor>
                </Link>
                {notification.after}
              </p>
            </article>
          ) : state.missing ? (
            <p role={`status`} id={`${suffix}-missing`} className={`notifications-status notifications-empty`}>
              {`This notification could not be found. Browse the notifications list for available announcements.`}
            </p>
          ) : null
        ) : (
          <>
            <ul aria-busy={state.loading} id={`${suffix}-list`} className={`notifications-list`}>
              {state.loading
                ? [0, 1].map(index => <NotificationCard key={index} index={index} prefix={`notifications`} />)
                : state.notifications.map(record => <NotificationCard key={record.id} prefix={`notifications`} notification={record} />)}
            </ul>
            {!state.loading && !state.error && !state.notifications.length && (
              <p role={`status`} id={`${suffix}-empty`} className={`notifications-status notifications-empty`}>
                {`No notifications to show.`}
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Notifications;
