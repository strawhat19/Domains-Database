import { usePathname } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useNotifications } from '../../shared/notifications/useNotifications';

export const useNotificationBell = () => {
  const pathname = usePathname();
  const state = useNotifications();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen(current => !current), []);

  useEffect(() => setOpen(false), [pathname]);

  return {
    ...state,
    open,
    close,
    toggle,
    count: state.notifications.length,
  };
};
