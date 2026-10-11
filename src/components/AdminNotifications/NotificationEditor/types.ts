import type { AdminNotificationInput } from '../../../api/notifications';
import type { Notification } from '../../../shared/models/notifications/Notification';

export interface NotificationEditorProps {
  busy: boolean;
  onClose: () => void;
  record: Notification | null;
  onSave: (input: AdminNotificationInput, id?: string) => Promise<boolean>;
}
