import { authAPI } from './auth';
import { sampleNotifications } from '../shared/sampleNotifications';
import { createCollection } from '../shared/common/collection';
import { NOTIFICATIONS_STORAGE_KEY } from '../shared/accountData/keys';
import { Notification } from '../shared/models/notifications/Notification';
import { subscribeAnnouncements, populateInitialAnnouncements } from '../shared/notifications/announcements';

const collection = createCollection(NOTIFICATIONS_STORAGE_KEY, Notification, async () => {
  const session = await authAPI.restoreSession();
  if (!session?.user) throw new Error(`Sign In To Access Notification(s)`);
  return session.user.id;
});

export const notificationsAPI = {
  subscribeAnnouncements,
  populateInitialAnnouncements,
  getNotifications: collection.get,
  subscribeNotifications: collection.subscribe,
  createNotification: collection.create,
  updateNotification: collection.update,
  deleteNotification: collection.remove,
  getSampleNotifications: async () => sampleNotifications.map(notification => ({ ...notification })),
};
