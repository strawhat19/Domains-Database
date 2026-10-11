import { useAuth } from '../authContext/useAuth';
import { useAfterPaint } from '../common/useAfterPaint';
import { notificationsAPI } from '../../api/notifications';
import { useMemo, useRef, useEffect, useState } from 'react';
import type { HeaderNotification } from '../sampleNotifications';
import { markNotificationsRead, subscribeNotificationReads } from './readPreferences';

interface NotificationState {
  actor: string;
  error: string;
  loading: boolean;
  notifications: HeaderNotification[];
}
interface ReadState { actor: string; notice: string; ready: boolean; readIds: string[] }

export const useNotifications = () => {
  const ready = useAfterPaint();
  const { user, loading: authLoading } = useAuth();
  const actor = !authLoading && user?.active ? user.id : ``;
  const reader = actor ? user : null;
  const latestActor = useRef(actor);
  latestActor.current = actor;
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [announcementError, setAnnouncementError] = useState(``);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<HeaderNotification[]>([]);
  const [reads, setReads] = useState<ReadState>({ actor: ``, notice: ``, ready: false, readIds: [] });
  const [state, setState] = useState<NotificationState>({ actor: ``, error: ``, loading: true, notifications: [] });

  useEffect(() => {
    let mounted = true;
    setAnnouncementsLoading(true);
    setAnnouncements([]);
    setAnnouncementError(``);
    const unsubscribe = notificationsAPI.subscribeAnnouncements(records => {
      if (!mounted) return;
      setAnnouncements(records);
      setAnnouncementError(``);
      setAnnouncementsLoading(false);
    }, failure => {
      if (!mounted) return;
      setAnnouncements([]);
      setAnnouncementError(failure.message);
      setAnnouncementsLoading(false);
    });
    return () => { mounted = false; unsubscribe(); };
  }, [revision]);

  useEffect(() => {
    if (!ready || authLoading) return;
    let mounted = true;
    setReads({ actor, notice: ``, ready: false, readIds: [] });
    setBusy(false);
    const unsubscribe = subscribeNotificationReads(reader, snapshot => {
      if (mounted) setReads({ actor, ready: true, ...snapshot });
    }, failure => {
      if (mounted) setReads(current => ({ actor, ready: false, readIds: current.actor === actor ? current.readIds : [], notice: failure.message }));
    });
    return () => { mounted = false; unsubscribe(); };
  }, [actor, reader, ready, revision, authLoading]);

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
          body: record.body,
          slug: record.slug,
          kind: record.kind,
          suffix: record.suffix,
          source: `account`,
          title: record.title || record.name,
          link: record.link ? { ...record.link } : undefined,
          message: record.body || record.description || record.details,
          icon: record.icon === `Sparkles` ? `Sparkles` : `Info`,
        })),
      });
    }, failure => {
      if (mounted) setState({ actor, notifications: [], loading: false, error: failure.message });
    });
    return () => { mounted = false; unsubscribe(); };
  }, [actor, ready, revision, authLoading]);

  const current = state.actor === actor ? state : { error: ``, loading: !!actor, notifications: [] };
  const currentReads = reads.actor === actor ? reads : { notice: ``, ready: false, readIds: [] };
  const notifications = useMemo(() => {
    const sharedIDs = new Set(announcements.map(notification => notification.id));
    const accountNotifications = state.actor === actor ? state.notifications : [];
    const readIDs = new Set(reads.actor === actor ? reads.readIds : []);
    return [...announcements, ...accountNotifications.filter(notification => !sharedIDs.has(notification.id))]
      .map(notification => ({ ...notification, isRead: readIDs.has(notification.id) }));
  }, [actor, state, reads, announcements]);
  const markReadIds = async (ids: string[]): Promise<boolean> => {
    if (busy || authLoading || !ready || !currentReads.ready) return false;
    const requestActor = actor;
    setBusy(true);
    try {
      const snapshot = await markNotificationsRead(reader, ids);
      if (latestActor.current !== requestActor) return false;
      setReads({ actor: requestActor, ready: true, ...snapshot });
      return true;
    } catch (failure) {
      if (latestActor.current === requestActor) setReads(previous => ({ actor: requestActor, ready: previous.actor === requestActor && previous.ready, readIds: previous.actor === requestActor ? previous.readIds : [], notice: failure instanceof Error ? failure.message : `Could Not Mark Notification(s) Read` }));
      return false;
    } finally { if (latestActor.current === requestActor) setBusy(false); }
  };
  const markRead = (id: string) => notifications.some(notification => notification.id === id) ? markReadIds([id]) : Promise.resolve(false);
  const markAllRead = () => markReadIds(notifications.filter(notification => !notification.isRead).map(notification => notification.id));
  const reload = () => setRevision(value => value + 1);

  return {
    busy,
    reload,
    markRead,
    markAllRead,
    notifications,
    readReady: currentReads.ready,
    notice: currentReads.notice,
    error: announcementError || current.error,
    unreadCount: notifications.filter(notification => !notification.isRead).length,
    loading: !notifications.length && (announcementsLoading || !ready || authLoading || current.loading),
  };
};
