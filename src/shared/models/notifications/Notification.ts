import { Types } from '../../../types/types';
import { Data, type JSONValue } from '../Data';
import { isAppCollectionID } from '../../common/ids';

export enum AnnouncementStatus {
  Draft = `Draft`,
  Active = `Active`,
  Archived = `Archived`,
}

export type NotificationInput = Omit<Partial<Notification>, `id` | `status`> & {
  id?: string | number;
  status?: AnnouncementStatus | string;
  message?: string;
  body_html?: string;
  bodyHTML?: string;
  created_at?: string;
  updated_at?: string;
};

export class Notification extends Data {
  icon: string;
  active: boolean;
  details: string;
  showTitle: boolean;
  providerId?: string;
  status: AnnouncementStatus;
  metadata: Record<string, JSONValue>;

  constructor(data: NotificationInput = {}) {
    const appID = isAppCollectionID(data.id, Types.Notification);
    super({
      ...data,
      type: Types.Notification,
      id: appID ? String(data.id) : undefined,
      created: data.created ?? data.created_at,
      updated: data.updated ?? data.updated_at,
      description: data.description || data.message || data.body_html || data.bodyHTML,
    });
    this.status = Object.values(AnnouncementStatus).find(status => status.toLowerCase() === data.status?.toLowerCase())
      ?? (data.active ? AnnouncementStatus.Active : AnnouncementStatus.Draft);
    this.active = this.status === AnnouncementStatus.Active;
    this.icon = data.icon || `Campaign`;
    this.details = data.details ?? ``;
    this.showTitle = data.showTitle ?? false;
    this.providerId = data.providerId || (!appID && data.id !== undefined ? String(data.id) : undefined);
    this.metadata = { ...data.metadata };
    this.refreshProperties();
  }
}
