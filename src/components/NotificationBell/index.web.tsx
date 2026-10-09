import './styles.scss';
import { Link } from 'expo-router';
import { X, Bell, List } from 'lucide-react';
import { useEffect, useRef } from 'react';
import RouterAnchor from '../RouterAnchor';
import { routes } from '../../shared/routes';
import NotificationCard from '../NotificationCard';
import { useNotificationBell } from './useNotificationBell';

const NotificationBell = () => {
  const state = useNotificationBell();
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!state.open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) state.close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== `Escape`) return;
      state.close();
      toggleRef.current?.focus();
    };
    document.addEventListener(`keydown`, escape);
    document.addEventListener(`pointerdown`, dismiss);
    return () => {
      document.removeEventListener(`keydown`, escape);
      document.removeEventListener(`pointerdown`, dismiss);
    };
  }, [state.open, state.close]);

  return (
    <div
      ref={rootRef}
      id={`header-notifications`}
      className={`header-notifications`}
    >
      <button
        type={`button`}
        ref={toggleRef}
        title={`Notifications`}
        onClick={state.toggle}
        aria-busy={state.loading}
        aria-expanded={state.open}
        id={`header-notifications-toggle`}
        className={`header-notifications-toggle`}
        aria-controls={`header-notifications-panel`}
        aria-label={state.loading ? `Notifications, Loading Updates` : `Notifications, ${state.count} updates`}
      >
        <Bell
          size={18}
          aria-hidden={true}
          id={`header-notifications-icon`}
          className={`header-notifications-icon`}
        />
        {(state.loading || state.count > 0) && (
          <span
            aria-hidden={true}
            id={`header-notifications-badge`}
            className={`header-notifications-badge${state.loading ? ` header-notifications-badge-skeleton` : ``}`}
          >
            {state.loading ? null : state.count}
          </span>
        )}
      </button>
      {state.open && (
        <section
          role={`region`}
          aria-busy={state.loading}
          id={`header-notifications-panel`}
          className={`header-notifications-panel`}
          aria-labelledby={`header-notifications-heading`}
        >
          <div
            id={`header-notifications-heading-row`}
            className={`header-notifications-heading-row`}
          >
            <strong
              id={`header-notifications-heading`}
              className={`header-notifications-heading`}
            >
              {`Notifications`}
            </strong>
            <span
              id={`header-notifications-count`}
              className={`header-notifications-count`}
            >
              {state.loading ? <span aria-hidden id={`header-notifications-count-skeleton`} className={`header-notifications-count-skeleton`} /> : `${state.count} updates`}
            </span>
            <button
              type={`button`}
              id={`header-notifications-close`}
              aria-label={`Close notifications`}
              className={`header-notifications-close`}
              onClick={() => {
                state.close();
                toggleRef.current?.focus();
              }}
            >
              <X
                size={16}
                aria-hidden={true}
                id={`header-notifications-close-icon`}
                className={`header-notifications-close-icon`}
              />
            </button>
          </div>
          <ul
            id={`header-notifications-list`}
            className={`header-notifications-list`}
          >
            {state.loading
              ? [0, 1].map(index => (
                <NotificationCard key={index} index={index} />
              ))
              : state.error ? (
                <li id={`header-notifications-error`} className={`header-notifications-message header-notifications-message-error`} role={`alert`}>
                  {state.error}
                </li>
              ) : state.notifications.length ? state.notifications.map(notification => (
                <NotificationCard key={notification.id} notification={notification} onNavigate={state.close} />
              )) : (
                <li id={`header-notifications-empty`} className={`header-notifications-message`} role={`status`}>
                  {`No Notifications Yet`}
                </li>
              )}
          </ul>
          <div id={`header-notifications-footer`} className={`header-notifications-footer`}>
            <Link href={routes.notifications.href} asChild>
              <RouterAnchor
                onClick={state.close}
                id={`header-notifications-all-link`}
                className={`header-notifications-all-link`}
              >
                <List size={14} aria-hidden id={`header-notifications-all-icon`} className={`header-notifications-all-icon`} />
                <span id={`header-notifications-all-text`} className={`header-notifications-all-text`}>
                  {`View All Notifications`}
                </span>
              </RouterAnchor>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default NotificationBell;
