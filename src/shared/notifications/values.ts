import { Types } from '../../types/types';
import { Timestamp } from 'firebase/firestore';
import { getAppCollectionIDNumber } from '../common/ids';
import type { HeaderNotification } from '../sampleNotifications';
import { Notification, AnnouncementStatus, type AdminNotificationInput, type NotificationInput } from '../models/notifications/Notification';

const text = (value: unknown, label: string, maximum: number, optional = false, preserveSpacing = false) => {
  if (typeof value !== `string` || value.length > maximum || (!optional && !value.trim())) throw new Error(`Enter A Valid ${label}`);
  return preserveSpacing ? value : value.trim();
};
export const notificationHref = (value: unknown) => {
  const href = text(value, `Link`, 2048);
  if (/[\s\\\u0000-\u001f\u007f]/.test(href)) throw new Error(`Use An Internal Path Or HTTP URL`);
  if (href.startsWith(`/`) && !href.startsWith(`//`)) return href;
  if (/^https?:\/\/[^/]/i.test(href)) {
    try {
      const url = new URL(href);
      if (url.hostname && !url.username && !url.password && [`http:`, `https:`].includes(url.protocol) && url.href.length <= 2048) return url.href;
    } catch { throw new Error(`Use An Internal Path Or HTTP URL`); }
  }
  throw new Error(`Use An Internal Path Or HTTP URL`);
};
export const normalizeAnnouncement = (input: AdminNotificationInput): AdminNotificationInput => {
  const slug = text(input?.slug, `Slug`, 100);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Use Lowercase Letters, Numbers, And Hyphens For The Slug`);
  if (![`development`, `announcement`].includes(input?.kind)) throw new Error(`Choose A Valid Notification Type`);
  if (!Object.values(AnnouncementStatus).includes(input?.status)) throw new Error(`Choose A Valid Notification Status`);
  if (input?.showTitle !== undefined && typeof input.showTitle !== `boolean`) throw new Error(`Choose A Valid Title Display`);
  if (input?.link !== undefined && (!input.link || typeof input.link !== `object` || Array.isArray(input.link))) throw new Error(`Enter A Valid Link`);
  return {
    slug,
    kind: input.kind,
    status: input.status,
    title: text(input.title, `Title`, 160),
    body: text(input.body, `Body`, 5000, false, true),
    showTitle: input.showTitle ?? true,
    icon: text(input.icon ?? (input.kind === `development` ? `Info` : `Sparkles`), `Icon`, 80),
    ...(input.suffix !== undefined ? { suffix: text(input.suffix, `Suffix`, 300, true, true) } : {}),
    ...(input.link ? { link: { href: notificationHref(input.link.href), label: text(input.link.label, `Link Label`, 120) } } : {}),
  };
};
const timestamp = (value: unknown) => {
  const date = value instanceof Timestamp ? value.toDate() : typeof value === `string` ? new Date(value) : null;
  if (!date || !Number.isFinite(date.getTime())) throw new Error(`Saved Notification Date Needs Attention`);
  return date.toISOString();
};
export const announcementId = (id: unknown) => {
  if (typeof id !== `string` || id.length > 240 || !getAppCollectionIDNumber(id, Types.Notification)) throw new Error(`Choose A Valid Notification`);
  return id;
};
export const readAnnouncement = (data: Record<string, unknown> | undefined, id: string): Notification => {
  if (!data || data.id !== id || data.uid !== `` || data.type !== Types.Notification || data.number !== getAppCollectionIDNumber(id, Types.Notification)
    || !Number.isSafeInteger(data.number) || Number(data.number) < 1 || typeof data.active !== `boolean`
    || typeof data.title !== `string` || typeof data.name !== `string` || typeof data.description !== `string`
    || (data.status !== undefined && (!Object.values(AnnouncementStatus).includes(data.status as AnnouncementStatus) || data.active !== (data.status === AnnouncementStatus.Active)))) throw new Error(`Saved Notification Data Needs Attention`);
  const metadata = data.metadata;
  if (metadata !== undefined && (!metadata || typeof metadata !== `object` || Array.isArray(metadata))) throw new Error(`Saved Notification Metadata Needs Attention`);
  const record = new Notification({ ...data, id, created: timestamp(data.created ?? data.created_at), updated: timestamp(data.updated ?? data.updated_at) } as NotificationInput);
  normalizeAnnouncement({ title: record.title, body: record.body, slug: record.slug, kind: record.kind, status: record.status, icon: record.icon, showTitle: record.showTitle, ...(record.suffix !== undefined ? { suffix: record.suffix } : {}), ...(record.link ? { link: record.link } : {}) });
  return record;
};
export const toHeaderNotification = (record: Notification): HeaderNotification => ({
  source: `announcement`,
  body: record.body,
  slug: record.slug,
  kind: record.kind,
  title: record.title,
  suffix: record.suffix,
  message: record.body,
  link: record.link ? { ...record.link } : undefined,
  id: [`development`, `support`].includes(record.providerId ?? ``) ? record.providerId! : record.id,
  icon: record.icon === `Sparkles` ? `Sparkles` : `Info`,
  before: typeof record.metadata.before === `string` ? record.metadata.before : ``,
  after: typeof record.metadata.after === `string` ? record.metadata.after : ``,
});
