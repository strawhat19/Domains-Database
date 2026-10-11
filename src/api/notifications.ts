import { authAPI } from './auth';
import { createCollection } from '../shared/common/collection';
import { sampleNotifications } from '../shared/sampleNotifications';
import { NOTIFICATIONS_STORAGE_KEY } from '../shared/accountData/keys';
import { Notification, AnnouncementStatus } from '../shared/models/notifications/Notification';
import { subscribeAnnouncements, populateInitialAnnouncements } from '../shared/notifications/announcements';
import { saveAnnouncement, deleteAnnouncement, subscribeAdminNotifications, updateAnnouncementStatus, getAdminNotificationsPage } from '../shared/notifications/service';

const collection = createCollection(NOTIFICATIONS_STORAGE_KEY, Notification, async () => {
  const session = await authAPI.restoreSession();
  if (!session?.user) throw new Error(`Sign In To Access Notification(s)`);
  return session.user.id;
});

export const notificationsAPI = {
  saveAnnouncement,
  deleteAnnouncement,
  getAdminNotificationsPage,
  subscribeAdminNotifications,
  updateAnnouncementStatus,
  subscribeAnnouncements,
  populateInitialAnnouncements,
  getNotifications: collection.get,
  subscribeNotifications: collection.subscribe,
  createNotification: collection.create,
  updateNotification: (id: string, input: Partial<Notification>) => collection.update(id, {
    ...input,
    ...(input.status === undefined && typeof input.active === `boolean` ? { status: input.active ? AnnouncementStatus.Active : AnnouncementStatus.Draft } : {}),
  }),
  deleteNotification: collection.remove,
  getSampleNotifications: async () => sampleNotifications.map(notification => ({ ...notification })),
};

export type { AdminNotificationInput } from '../shared/models/notifications/Notification';
