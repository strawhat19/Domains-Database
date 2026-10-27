import { getAppCollectionIDNumber } from '../common/ids';
import { feedbackLimits, type SupportThread, type FeedbackEntry, type SupportMessage, type SupportReadState } from './types';

export const feedbackText = (value: unknown, label: string, maximum: number, required = false) => {
  if (value === undefined && !required) return ``;
  if (typeof value !== `string` || value.trim().length > maximum || (required && !value.trim())) throw new Error(`Enter ${label}${required ? ` Of 1 To ${maximum} Characters` : ` Of ${maximum} Characters Or Fewer`}`);
  return value.trim();
};

export const normalizePublicMediaUrl = (value: unknown): string => {
  const text = feedbackText(value, `A Public Screenshot Or Video URL`, feedbackLimits.mediaUrl);
  if (!text) return ``;
  let url: URL;
  try { url = new URL(text); } catch { throw new Error(`Enter A Public HTTPS Screenshot Or Video URL`); }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, ``);
  const ipv4 = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(host);
  const blockedIp = ipv4 && (Number(ipv4[1]) === 0 || Number(ipv4[1]) === 10 || Number(ipv4[1]) === 127
    || Number(ipv4[1]) >= 224 || (Number(ipv4[1]) === 169 && Number(ipv4[2]) === 254)
    || (Number(ipv4[1]) === 172 && Number(ipv4[2]) >= 16 && Number(ipv4[2]) <= 31)
    || (Number(ipv4[1]) === 192 && Number(ipv4[2]) === 168) || (Number(ipv4[1]) === 100 && Number(ipv4[2]) >= 64 && Number(ipv4[2]) <= 127));
  if (url.protocol !== `https:` || url.username || url.password || url.port || url.href.length > feedbackLimits.mediaUrl || !host.includes(`.`) || host.includes(`:`)
    || blockedIp || /(^|\.)(localhost|local|internal|test|invalid|example)$/.test(host)) throw new Error(`Enter A Public HTTPS Screenshot Or Video URL`);
  return url.href;
};

const dataObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== `object` || Array.isArray(value)) throw new Error(`Saved Feedback Could Not Be Read`);
  return value as Record<string, unknown>;
};
const stringValue = (data: Record<string, unknown>, key: string, limit: number) => {
  const value = data[key];
  if (typeof value !== `string` || value.length > limit) throw new Error(`Saved Feedback Could Not Be Read`);
  return value;
};
const dateValue = (data: Record<string, unknown>, key: string) => {
  const value = stringValue(data, key, 40);
  if (!Number.isFinite(Date.parse(value))) throw new Error(`Saved Feedback Date Could Not Be Read`);
  return value;
};
const identity = (data: Record<string, unknown>, type: string, expectedId?: string) => {
  if (data.type !== type || typeof data.id !== `string` || (expectedId && expectedId !== data.id)
    || !Number.isSafeInteger(data.number) || Number(data.number) < 1 || getAppCollectionIDNumber(data.id, type) !== data.number) throw new Error(`Saved Feedback Identity Could Not Be Read`);
  return { id: data.id, number: data.number as number };
};

export const readSupportThread = (value: unknown, expectedId?: string): SupportThread => {
  const data = dataObject(value);
  const record = identity(data, `SupportThread`, expectedId);
  if (typeof data.status !== `string` || ![`open`, `closed`].includes(data.status) || !Number.isSafeInteger(data.lastMessageNumber) || Number(data.lastMessageNumber) < 1) throw new Error(`Saved Conversation Could Not Be Read`);
  return { ...record, type: `SupportThread`, status: data.status as SupportThread[`status`],
    customerId: stringValue(data, `customerId`, 250), customerName: stringValue(data, `customerName`, 100),
    customerEmail: stringValue(data, `customerEmail`, 254), customerPhone: stringValue(data, `customerPhone`, 40),
    subject: stringValue(data, `subject`, feedbackLimits.title), created: dateValue(data, `created`), updated: dateValue(data, `updated`),
    lastMessageNumber: Number(data.lastMessageNumber), lastMessageAt: dateValue(data, `lastMessageAt`),
    lastMessageText: stringValue(data, `lastMessageText`, 200), lastSenderId: stringValue(data, `lastSenderId`, 250) };
};

export const readSupportMessage = (value: unknown, expectedId?: string): SupportMessage => {
  const data = dataObject(value);
  const record = identity(data, `SupportMessage`, expectedId);
  if (typeof data.senderKind !== `string` || ![`owner`, `customer`].includes(data.senderKind)) throw new Error(`Saved Message Could Not Be Read`);
  return { ...record, type: `SupportMessage`, senderKind: data.senderKind as SupportMessage[`senderKind`],
    threadId: stringValue(data, `threadId`, 250), senderId: stringValue(data, `senderId`, 250), senderName: stringValue(data, `senderName`, 100),
    body: stringValue(data, `body`, feedbackLimits.description), created: dateValue(data, `created`) };
};

export const readFeedbackEntry = (value: unknown, expectedId?: string): FeedbackEntry => {
  const data = dataObject(value);
  const record = identity(data, `Feedback`, expectedId);
  if (typeof data.kind !== `string` || ![`review`, `bug`].includes(data.kind) || typeof data.status !== `string` || ![`new`, `read`, `archived`].includes(data.status)
    || (data.kind === `review` ? !Number.isInteger(data.rating) || Number(data.rating) < 1 || Number(data.rating) > 5 : data.rating !== null)) throw new Error(`Saved Feedback Could Not Be Read`);
  return { ...record, type: `Feedback`, kind: data.kind as FeedbackEntry[`kind`], status: data.status as FeedbackEntry[`status`], rating: data.rating as number | null,
    authorId: stringValue(data, `authorId`, 250), authorName: stringValue(data, `authorName`, 100), authorEmail: stringValue(data, `authorEmail`, 254),
    title: stringValue(data, `title`, feedbackLimits.title), description: stringValue(data, `description`, feedbackLimits.description),
    mediaUrl: normalizePublicMediaUrl(data.mediaUrl), created: dateValue(data, `created`), updated: dateValue(data, `updated`) };
};

export const readSupportReadState = (value: unknown): SupportReadState => {
  const data = dataObject(value);
  if (!Number.isSafeInteger(data.lastMessageNumber) || Number(data.lastMessageNumber) < 0) throw new Error(`Saved Read State Could Not Be Read`);
  return { threadId: stringValue(data, `threadId`, 250), userId: stringValue(data, `userId`, 250), lastMessageNumber: Number(data.lastMessageNumber), updated: dateValue(data, `updated`) };
};
