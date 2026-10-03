import './styles.scss';
import { Bell, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
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
        aria-expanded={state.open}
        id={`header-notifications-toggle`}
        className={`header-notifications-toggle`}
        aria-controls={`header-notifications-panel`}
        aria-label={`Notifications, ${state.count} updates`}
      >
        <Bell
          size={18}
          aria-hidden={true}
          id={`header-notifications-icon`}
          className={`header-notifications-icon`}
        />
        <span
          aria-hidden={true}
          id={`header-notifications-badge`}
          className={`header-notifications-badge`}
        >
          {state.count}
        </span>
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
              {`${state.count} updates`}
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
              ? Array.from({ length: state.count }, (_, index) => (
                <NotificationCard key={index} index={index} onSignUp={state.close} />
              ))
              : state.notifications.map(notification => (
                <NotificationCard key={notification.id} notification={notification} onSignUp={state.close} />
              ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default NotificationBell;
