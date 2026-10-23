import './styles.scss';
import { Link } from 'expo-router';
import PageMeta from '../PageMeta';
import StatePanel from '../StatePanel';
import RouterAnchor from '../RouterAnchor';
import { routes } from '../../shared/routes';
import NotificationCard from '../NotificationCard';
import { useFeatureFlags } from '../../shared/featureFlags/useFeatureFlags';
import { getNotificationSpacing } from '../NotificationCard/content';
import { useNotificationsPage, type NotificationsProps } from './useNotificationsPage';
import { Bell, Info, Heart, House, Globe2, BookOpen, Sparkles, ArrowLeft, CheckCheck, RotateCcw, Construction } from 'lucide-react';

const NotificationsContent = ({ detail = false }: NotificationsProps) => {
  const state = useNotificationsPage(detail);
  const { suffix, notification } = state;
  const Icon = detail ? notification?.kind === `development` ? Construction : notification?.kind === `announcement` ? Heart : notification?.icon === `Sparkles` ? Sparkles : Info : Bell;

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
            {detail ? `APP ANNOUNCEMENT` : `${state.appName.toUpperCase()} UPDATES`}
          </p>
          <h1 id={`${suffix}-title`} className={`notifications-title`}>{state.title}</h1>
          {!detail && (
            <p id={`${suffix}-description`} className={`notifications-description`}>
              {`Announcements and updates from ${state.appName}.`}
            </p>
          )}
          {!detail && !state.loading && !state.error && (
            <p id={`${suffix}-count`} className={`notifications-count`}>
              {`${state.notifications.length} Notification(s) · ${state.readReady ? `${state.unreadCount} Unread` : state.notice ? `Read Status Unavailable` : `Loading Read Status`}`}
            </p>
          )}
        </header>
        <div id={`${suffix}-actions`} className={`notifications-actions`}>
          {!detail && <button type={`button`} disabled={state.loading || state.busy || !state.readReady || !state.unreadCount} onClick={() => { void state.markAllRead(); }} id={`${suffix}-read-all`} className={`notifications-action`}><CheckCheck size={14} aria-hidden id={`${suffix}-read-all-icon`} className={`notifications-action-icon`} />{`Mark All Read`}</button>}
          <button type={`button`} disabled={state.loading} onClick={state.reload} id={`${suffix}-reload`} className={`notifications-action`}><RotateCcw size={14} aria-hidden id={`${suffix}-reload-icon`} className={`notifications-action-icon`} />{`Reload`}</button>
        </div>
        {!!state.error && (
          <p role={`alert`} id={`${suffix}-error`} className={`notifications-error`}>{state.error}</p>
        )}
        {!!state.notice && <p role={`status`} id={`${suffix}-notice`} className={`notifications-notice`}>{state.notice}</p>}
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
                {notification.body !== undefined ? <>
                  {notification.body}
                  {getNotificationSpacing(notification.body, notification.link?.label)}
                  {notification.link && (state.linkHref ? state.linkHref.startsWith(`/`) ? <Link href={state.linkHref} asChild><RouterAnchor id={`${suffix}-inline-link`} className={`notifications-inline-link`}>{notification.link.label}</RouterAnchor></Link> : <a href={state.linkHref} id={`${suffix}-inline-link`} className={`notifications-inline-link`}>{notification.link.label}</a> : notification.link.label)}
                  {getNotificationSpacing(notification.link?.label ?? notification.body, notification.suffix)}{notification.suffix}
                </> : notification.message ?? (
                  <>
                    {notification.before}
                    <Link href={routes.signup.href} asChild>
                      <RouterAnchor id={`${suffix}-sign-up`} className={`notifications-inline-link`}>{`sign up`}</RouterAnchor>
                    </Link>
                    {notification.after}
                  </>
                )}
              </p>
              <dl id={`${suffix}-metadata`} className={`notifications-detail-meta`}>
                <div id={`${suffix}-kind-row`} className={`notifications-detail-meta-item`}><dt id={`${suffix}-kind-label`} className={`notifications-detail-meta-label`}>{`Type`}</dt><dd id={`${suffix}-kind-value`} className={`notifications-detail-meta-value`}>{notification.kind === `development` ? `Development` : `Announcement`}</dd></div>
                <div id={`${suffix}-read-row`} className={`notifications-detail-meta-item`}><dt id={`${suffix}-read-label`} className={`notifications-detail-meta-label`}>{`Read Status`}</dt><dd role={`status`} id={`${suffix}-read-value`} className={`notifications-detail-meta-value`}>{!state.readReady ? state.notice ? `Unavailable` : `Loading` : notification.isRead ? `Read` : `Unread`}</dd></div>
              </dl>
              {!notification.isRead && <button type={`button`} disabled={state.busy || !state.readReady} onClick={() => { void state.markRead(notification.id); }} id={`${suffix}-mark-read`} className={`notifications-action`}><CheckCheck size={14} aria-hidden id={`${suffix}-mark-read-icon`} className={`notifications-action-icon`} />{`Mark Read`}</button>}
            </article>
          ) : state.missing ? (
            <StatePanel
              variant={`inline`}
              icon={`notifications`}
              id={`${suffix}-missing`}
              eyebrow={`NOTIFICATIONS`}
              title={`Announcement unavailable`}
              description={`This notification could not be found. Browse the list for available announcements.`}
            >
              <Link href={routes.notifications.href} asChild>
                <RouterAnchor id={`${suffix}-browse-notifications`} className={`notifications-state-link is-primary`}>
                  <Bell size={16} aria-hidden id={`${suffix}-browse-notifications-icon`} className={`notifications-state-link-icon`} />
                  {`View Notifications`}
                </RouterAnchor>
              </Link>
            </StatePanel>
          ) : null
        ) : (
          <>
            <ul aria-busy={state.loading} id={`${suffix}-list`} className={`notifications-list`}>
              {state.loading
                ? [0, 1].map(index => <NotificationCard key={index} index={index} prefix={`notifications`} />)
                : state.notifications.map(record => <NotificationCard key={record.id} prefix={`notifications`} readReady={state.readReady} onRead={state.readReady && !state.busy ? state.markRead : undefined} notification={record} />)}
            </ul>
            {!state.loading && !state.error && !state.notifications.length && (
              <StatePanel
                variant={`inline`}
                icon={`notifications`}
                id={`${suffix}-empty`}
                eyebrow={`YOU’RE UP TO DATE`}
                title={`No notifications yet`}
                description={`Announcements and updates will appear here when they’re available.`}
              >
                <Link href={routes.domains.href} asChild>
                  <RouterAnchor id={`${suffix}-browse-domains`} className={`notifications-state-link is-primary`}>
                    <Globe2 size={16} aria-hidden id={`${suffix}-browse-domains-icon`} className={`notifications-state-link-icon`} />
                    {`Explore Domains`}
                  </RouterAnchor>
                </Link>
              </StatePanel>
            )}
          </>
        )}
      </div>
    </>
  );
};

const Notifications = ({ detail = false }: NotificationsProps) => {
  const { error, flags, ready } = useFeatureFlags();
  if (ready && flags.notifications) return <NotificationsContent detail={detail} />;
  const loading = !ready && !error;
  const message = loading ? `Loading Notifications…` : `Notifications are currently unavailable. Explore domains or read the latest articles while you’re here.`;
  return <>
    <PageMeta noIndex title={`Notifications`} canonicalPath={routes.notifications.href} description={message} />
    {loading ? (
      <div role={`status`} aria-busy aria-label={`Loading Notifications`} id={`notifications-page`} className={`notifications-page`}>
        <div aria-hidden id={`notifications-loading-content`} className={`notifications-loading-content`}>
          <div id={`notifications-loading-intro`} className={`notifications-loading-intro`}>
            <span id={`notifications-loading-title`} className={`notifications-skeleton-line notifications-skeleton-title`} />
            <span id={`notifications-loading-description`} className={`notifications-skeleton-line notifications-skeleton-description`} />
          </div>
          <ul id={`notifications-loading-list`} className={`notifications-list`}>
            {[0, 1].map(index => <NotificationCard key={index} index={index} prefix={`notifications-loading`} />)}
          </ul>
        </div>
      </div>
    ) : (
      <StatePanel
        icon={`notifications`}
        id={`notifications-unavailable`}
        title={`Notifications unavailable`}
        eyebrow={`ANNOUNCEMENTS & UPDATES`}
        description={message}
      >
        <Link href={routes.home.href} asChild>
          <RouterAnchor id={`notifications-unavailable-home`} className={`notifications-state-link is-primary`}>
            <House size={16} aria-hidden id={`notifications-unavailable-home-icon`} className={`notifications-state-link-icon`} />
            {`Back to Home`}
          </RouterAnchor>
        </Link>
        <Link href={routes.blog.href} asChild>
          <RouterAnchor id={`notifications-unavailable-blog`} className={`notifications-state-link`}>
            <BookOpen size={16} aria-hidden id={`notifications-unavailable-blog-icon`} className={`notifications-state-link-icon`} />
            {`Read the Blog`}
          </RouterAnchor>
        </Link>
      </StatePanel>
    )}
  </>;
};

export default Notifications;
