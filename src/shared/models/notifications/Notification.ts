import { Types } from '../../../types/types';
import { Data, type JSONValue } from '../Data';
import { isAppCollectionID } from '../../common/ids';

export enum AnnouncementStatus {
  Draft = `Draft`,
  Active = `Active`,
  Archived = `Archived`,
}

export type NotificationKind = `development` | `announcement`;
export type NotificationLink = { href: string; label: string };
export interface AdminNotificationInput {
  body: string;
  slug: string;
  title: string;
  icon?: string;
  suffix?: string;
  showTitle?: boolean;
  link?: NotificationLink;
  kind: NotificationKind;
  status: AnnouncementStatus;
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
  body: string;
  slug: string;
  icon: string;
  suffix?: string;
  active: boolean;
  details: string;
  showTitle: boolean;
  link?: NotificationLink;
  providerId?: string;
  kind: NotificationKind;
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
    const before = typeof this.metadata.before === `string` ? this.metadata.before : ``;
    const after = typeof this.metadata.after === `string` ? this.metadata.after : ``;
    const original = [`development`, `support`].includes(this.providerId ?? ``) && !!(before || after);
    const originalBody = original && this.description === `${before}sign up${after}`;
    this.body = data.body ?? (originalBody ? before : this.description || this.details);
    this.slug = data.slug ?? (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(this.providerId ?? ``) ? this.providerId! : `notification-${this.number}`);
    this.kind = data.kind ?? (this.providerId === `development` ? `development` : `announcement`);
    this.suffix = data.suffix ?? (originalBody ? after : undefined);
    this.link = data.link ? { ...data.link } : originalBody ? { href: `/signup`, label: `sign up` } : undefined;
    this.refreshProperties();
  }
}

export type NotificationRecord = Notification;
