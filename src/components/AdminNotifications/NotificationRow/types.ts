import type { Notification } from '../../../shared/models/notifications/Notification';

export interface NotificationRowProps {
  busy: boolean;
  confirming: boolean;
  onCancelDelete: () => void;
  record: Notification;
  onEdit: (record: Notification) => void;
  onRequestDelete: (record: Notification) => void;
  onDelete: (record: Notification) => Promise<boolean>;
  onStatus: (record: Notification) => Promise<boolean>;
}
