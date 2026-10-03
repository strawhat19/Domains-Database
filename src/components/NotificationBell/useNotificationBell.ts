import { usePathname } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { notificationsAPI } from '../../api/notifications';
import { sampleNotificationCount, type HeaderNotification } from '../../shared/sampleNotifications';

export const useNotificationBell = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen(current => !current), []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    let mounted = true;
    void notificationsAPI.getSampleNotifications().then(items => {
      if (!mounted) return;
      setNotifications(items);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  return {
    open,
    close,
    toggle,
    loading,
    notifications,
    count: loading ? sampleNotificationCount : notifications.length,
  };
};
