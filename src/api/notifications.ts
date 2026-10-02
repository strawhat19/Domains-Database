import { authAPI } from './auth';
import { createCollection } from '../shared/common/collection';
import { Notification } from '../shared/models/notifications/Notification';

const collection = createCollection(`domains-database:notifications:v1`, Notification, async () => {
  const session = await authAPI.restoreSession();
  if (!session?.user) throw new Error(`Sign In To Access Notification(s)`);
  return session.user.id;
});

export const notificationsAPI = {
  getNotifications: collection.get,
  createNotification: collection.create,
  updateNotification: collection.update,
  deleteNotification: collection.remove,
};
