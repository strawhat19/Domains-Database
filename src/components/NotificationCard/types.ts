import type { HeaderNotification } from '../../shared/sampleNotifications';

export interface NotificationCardProps {
  index?: number;
  prefix?: string;
  readReady?: boolean;
  onNavigate?: () => void;
  onRead?: (id: string) => Promise<boolean>;
  notification?: HeaderNotification;
}
