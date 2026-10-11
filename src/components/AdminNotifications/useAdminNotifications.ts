import { useRef, useState } from 'react';
import { useLocalStorage } from '../../shared/config';
import { useAuth } from '../../shared/authContext/useAuth';
import { firebaseEnabled } from '../../shared/firebase/config';
import { canManageNotifications } from '../../shared/admin/permissions';
import { useCollectionPage } from '../../shared/firebase/useCollectionPage';
import { notificationsAPI, type AdminNotificationInput } from '../../api/notifications';
import { Notification, AnnouncementStatus } from '../../shared/models/notifications/Notification';

type Editor = Notification | `new` | null;
const emptyControls = (actor: string) => ({ actor, search: ``, filter: `all`, deletingId: ``, editor: null as Editor });
export const getNotificationStatusLabel = (record: Notification) => record.status === AnnouncementStatus.Active ? `Active` : `Inactive`;
export const formatNotificationDate = (value: string) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString(undefined, { day: `numeric`, year: `numeric`, month: `short` }) : `—`;
};

export const useAdminNotifications = () => {
  const { user } = useAuth();
  const allowed = canManageNotifications(user);
  const actor = allowed ? `${user?.id}:${user?.role}` : ``;
  const page = useCollectionPage(actor, notificationsAPI.subscribeAdminNotifications);
  const [controls, setControls] = useState(() => emptyControls(actor));
  const [feedback, setFeedback] = useState({ actor, busy: ``, error: ``, notice: `` });
  const scope = useRef(actor);
  const pending = useRef<{ actor: string } | null>(null);
  scope.current = actor;
  const current = controls.actor === actor ? controls : emptyControls(actor);
  const response = feedback.actor === actor ? feedback : { actor, busy: ``, error: ``, notice: `` };
  const setControl = <K extends keyof ReturnType<typeof emptyControls>>(key: K, value: ReturnType<typeof emptyControls>[K]) => setControls(state => ({ ...(state.actor === actor ? state : emptyControls(actor)), [key]: value }));
  const query = current.search.trim().toLocaleLowerCase();
  const records = page.records;
  const matchingRecords = records.filter(record => (current.filter === `all` || getNotificationStatusLabel(record).toLowerCase() === current.filter) && [record.number, record.title, record.body, record.description, record.slug, record.kind, record.suffix, getNotificationStatusLabel(record), record.link?.label, record.link?.href].join(` `).toLocaleLowerCase().includes(query));
  const active = records.filter(record => record.status === AnnouncementStatus.Active).length;
  const runMutation = async (id: string, operation: () => Promise<unknown>, notice: string) => {
    if (!actor || pending.current?.actor === actor) return false;
    const request = { actor };
    pending.current = request;
    setFeedback({ actor, notice: ``, error: ``, busy: id });
    try {
      await operation();
      if (scope.current !== actor) return false;
      setFeedback({ actor, notice, error: ``, busy: `` });
      return true;
    } catch (failure) {
      if (scope.current === actor) setFeedback({ actor, busy: ``, notice: ``, error: failure instanceof Error ? failure.message : `Notification Could Not Be Saved` });
      return false;
    } finally { if (pending.current === request) pending.current = null; }
  };
  const save = async (input: AdminNotificationInput, id?: string) => {
    const saved = await runMutation(id ?? `new`, () => notificationsAPI.saveAnnouncement(input, id), `Notification Saved`);
    if (saved && !id) page.refresh();
    return saved;
  };
  const remove = (record: Notification) => runMutation(record.id, () => notificationsAPI.deleteAnnouncement(record.id), `Notification Deleted`);
  const changeStatus = (record: Notification) => {
    const status = record.status === AnnouncementStatus.Active ? AnnouncementStatus.Draft : AnnouncementStatus.Active;
    return runMutation(record.id, () => notificationsAPI.updateAnnouncementStatus(record.id, status), status === AnnouncementStatus.Active ? `Notification Activated` : `Notification Deactivated`);
  };
  return {
    page, save, remove, active, allowed, records, changeStatus, matchingRecords,
    editor: current.editor,
    search: current.search,
    filter: current.filter,
    notice: response.notice,
    deletingId: current.deletingId,
    error: response.error || page.error,
    busy: !!response.busy || page.loading,
    isFiltered: !!query || current.filter !== `all`,
    mode: firebaseEnabled && !useLocalStorage ? `Firebase Realtime` : useLocalStorage ? `Local Demo · This Device` : `Connection Needed`,
    setSearch: (value: string) => setControl(`search`, value),
    setFilter: (value: string) => setControl(`filter`, value),
    closeEditor: () => setControl(`editor`, null),
    cancelDelete: () => setControl(`deletingId`, ``),
    edit: (record: Notification | `new`) => { setControl(`deletingId`, ``); setControl(`editor`, record); },
    requestDelete: (record: Notification) => { setControl(`editor`, null); setControl(`deletingId`, record.id); },
  };
};
