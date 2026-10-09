import { useEffect, useState } from 'react';
import { useAfterPaint } from '../common/useAfterPaint';
import { notificationsAPI } from '../../api/notifications';
import type { HeaderNotification } from '../sampleNotifications';

export const useNotifications = () => {
  const ready = useAfterPaint();
  const [error, setError] = useState(``);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);

  useEffect(() => {
    if (!ready) return;
    let mounted = true;
    void notificationsAPI.getSampleNotifications().then(items => {
      if (mounted) setNotifications(items);
    }).catch(failure => {
      if (mounted) setError(failure instanceof Error ? failure.message : `Could Not Load Notification(s)`);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [ready]);

  return { error, loading, notifications };
};
