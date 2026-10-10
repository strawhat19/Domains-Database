import { Roles } from '../../types/types';
import { useAuth } from '../authContext/useAuth';
import { useMemo, useEffect, useState } from 'react';
import { useAfterPaint } from '../common/useAfterPaint';
import { notificationsAPI } from '../../api/notifications';
import { sampleNotifications, type HeaderNotification } from '../sampleNotifications';

interface NotificationState {
  actor: string;
  error: string;
  loading: boolean;
  notifications: HeaderNotification[];
}

export const useNotifications = () => {
  const ready = useAfterPaint();
  const { user, loading: authLoading } = useAuth();
  const actor = !authLoading && user?.active ? user.id : ``;
  const owner = actor && user?.role === Roles.Owner ? actor : ``;
  const [announcementError, setAnnouncementError] = useState(``);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [population, setPopulation] = useState({ actor: ``, error: `` });
  const [announcements, setAnnouncements] = useState<HeaderNotification[]>(() => sampleNotifications.map(notification => ({ ...notification })));
  const [state, setState] = useState<NotificationState>({
    actor: ``, error: ``, loading: true, notifications: [],
  });

  useEffect(() => {
    let mounted = true;
    const unsubscribe = notificationsAPI.subscribeAnnouncements(records => {
      if (!mounted) return;
      setAnnouncements(records);
      setAnnouncementError(``);
      setAnnouncementsLoading(false);
    }, failure => {
      if (!mounted) return;
      setAnnouncementError(failure.message);
      setAnnouncementsLoading(false);
    });
    return () => { mounted = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!owner) return;
    let mounted = true;
    setPopulation({ actor: owner, error: `` });
    void notificationsAPI.populateInitialAnnouncements().catch(failure => {
      if (mounted) setPopulation({
        actor: owner,
        error: failure instanceof Error ? failure.message : `Could Not Save Initial Notification(s)`,
      });
    });
    return () => { mounted = false; };
  }, [owner]);

  useEffect(() => {
    if (!ready || authLoading) return;
    let mounted = true;
    setState({ actor, error: ``, loading: !!actor, notifications: [] });
    if (!actor) return () => { mounted = false; };
    const unsubscribe = notificationsAPI.subscribeNotifications(records => {
      if (mounted) setState({
        actor,
        error: ``,
        loading: false,
        notifications: records.filter(record => record.active).map(record => ({
          id: record.id,
          after: ``,
          before: ``,
          title: record.title || record.name,
          message: record.description || record.details,
          icon: record.icon === `Sparkles` ? `Sparkles` : `Info`,
        })),
      });
    }, failure => {
      if (mounted) setState({ actor, notifications: [], loading: false, error: failure.message });
    });
    return () => { mounted = false; unsubscribe(); };
  }, [actor, ready, authLoading]);

  const current = state.actor === actor ? state : { error: ``, loading: !!actor, notifications: [] };
  const notifications = useMemo(() => {
    const sharedIDs = new Set(announcements.map(notification => notification.id));
    const accountNotifications = state.actor === actor ? state.notifications : [];
    return [...announcements, ...accountNotifications.filter(notification => !sharedIDs.has(notification.id))];
  }, [actor, state, announcements]);

  return {
    ...current,
    notifications,
    error: announcementError || current.error || (population.actor === owner ? population.error : ``),
    loading: !notifications.length && (announcementsLoading || !ready || authLoading || current.loading),
  };
};
