import type { HeaderNotification } from '../../shared/sampleNotifications';

export interface NotificationCardProps {
  index?: number;
  prefix?: string;
  onNavigate?: () => void;
  notification?: HeaderNotification;
}
