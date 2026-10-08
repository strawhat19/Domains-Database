import { useEffect, useState } from 'react';
import { notificationsAPI } from '../../api/notifications';
import type { HeaderNotification } from '../sampleNotifications';

export const useNotifications = () => {
  const [error, setError] = useState(``);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);

  useEffect(() => {
    let mounted = true;
    void notificationsAPI.getSampleNotifications().then(items => {
      if (mounted) setNotifications(items);
    }).catch(failure => {
      if (mounted) setError(failure instanceof Error ? failure.message : `Could Not Load Notification(s)`);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  return { error, loading, notifications };
};
