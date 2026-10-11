import { Types } from '../../types/types';
import { Timestamp } from 'firebase/firestore';
import { CalendarEvent } from '../models/events/Event';
import { getAppCollectionIDNumber } from '../common/ids';
import { eventLimits, type EventInput, type EventRange, type EventWindow } from './types';

const dayMilliseconds = 86_400_000;
const eventFields = [`id`, `name`, `type`, `allDay`, `endsAt`, `number`, `created`, `updated`, `startsAt`, `location`, `creatorId`, `description`];
const eventText = (value: unknown, label: string, maximum: number, optional = false) => {
  if (typeof value !== `string` || value.length > maximum || (!optional && !value.trim())) throw new Error(`Enter A Valid ${label}`);
  return value.trim();
};
const eventDate = (value: unknown, label: string) => {
  if (typeof value !== `string`) throw new Error(`Enter A Valid ${label}`);
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  const year = Number(parts?.[1]);
  const month = Number(parts?.[2]);
  const day = Number(parts?.[3]);
  const date = new Date(value);
  if (!parts || year < 1 || month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()
    || Number(parts[4]) > 23 || Number(parts[5]) > 59 || Number(parts[6]) > 59 || !Number.isFinite(date.getTime())
    || date.getUTCFullYear() < 1 || date.getUTCFullYear() > 9999) throw new Error(`Enter A Valid ${label}`);
  return date.toISOString();
};
export const normalizeEvent = (input: EventInput): EventInput => {
  const name = eventText(input?.name, `Event Name`, eventLimits.name);
  const endsAt = eventDate(input?.endsAt, `End Date`);
  const startsAt = eventDate(input?.startsAt, `Start Date`);
  const location = eventText(input?.location, `Location`, eventLimits.location, true);
  const description = eventText(input?.description, `Description`, eventLimits.description, true);
  const duration = Date.parse(endsAt) - Date.parse(startsAt);
  if (duration <= 0) throw new Error(`End Date Must Be After Start Date`);
  if (duration > eventLimits.durationDays * dayMilliseconds) throw new Error(`Events Cannot Exceed ${eventLimits.durationDays} Days`);
  if (typeof input?.allDay !== `boolean`) throw new Error(`Choose A Valid All Day Setting`);
  if (input.allDay && (!startsAt.endsWith(`T00:00:00.000Z`) || !endsAt.endsWith(`T00:00:00.000Z`))) throw new Error(`All Day Events Need UTC Midnight Start And End Dates`);
  return { name, endsAt, startsAt, location, description, allDay: input.allDay };
};
export const normalizeEventRange = (range: EventRange): EventRange => {
  const end = eventDate(range?.end, `Calendar Range End`);
  const start = eventDate(range?.start, `Calendar Range Start`);
  if (start >= end) throw new Error(`Calendar Range End Must Be After Its Start`);
  return { end, start };
};
export const eventId = (id: unknown) => {
  if (typeof id !== `string` || id.length > 240 || !getAppCollectionIDNumber(id, Types.Event)) throw new Error(`Choose A Valid Event`);
  return id;
};
const savedDate = (value: unknown) => {
  const date = value instanceof Timestamp ? value.toDate().toISOString() : value;
  return eventDate(date, `Saved Event Date`);
};
export const readEvent = (data: Record<string, unknown> | undefined, id: string): CalendarEvent => {
  eventId(id);
  if (!data || data.id !== id || data.type !== Types.Event || eventFields.some(field => !(field in data))
    || Object.keys(data).some(field => !eventFields.includes(field)) || !Number.isSafeInteger(data.number)
    || data.number !== getAppCollectionIDNumber(id, Types.Event) || typeof data.creatorId !== `string`
    || data.creatorId.length > 240 || !getAppCollectionIDNumber(data.creatorId, Types.User)) throw new Error(`Saved Event Data Needs Attention`);
  const values = normalizeEvent({ ...data, endsAt: savedDate(data.endsAt), startsAt: savedDate(data.startsAt) } as unknown as EventInput);
  return new CalendarEvent({ ...values, id, number: Number(data.number), creatorId: data.creatorId, created: savedDate(data.created), updated: savedDate(data.updated) });
};
export const selectEventWindow = (records: CalendarEvent[], range: EventRange): EventWindow => {
  const matching = records.filter(record => record.endsAt > range.start && record.startsAt < range.end)
    .sort((first, second) => first.endsAt.localeCompare(second.endsAt) || first.startsAt.localeCompare(second.startsAt)
      || (first.id === second.id ? 0 : first.id < second.id ? -1 : 1));
  return { hasMore: matching.length > eventLimits.records, records: matching.slice(0, eventLimits.records) };
};
