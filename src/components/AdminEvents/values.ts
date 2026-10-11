import type { CalendarEvent } from '../../shared/models/events/Event';

export interface EventDraft {
  name: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string;
  description: string;
}

const pad = (value: number) => `${value}`.padStart(2, `0`);
export const dateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const dateInput = (date: Date) => `${dateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
export const dayDate = (key: string) => {
  const [year, month, day] = key.split(`-`).map(Number);
  return new Date(year, month - 1, day);
};
export const localInstant = (value: string) => {
  const input = value.trim().replace(` `, `T`);
  const parsed = new Date(input);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input) || !Number.isFinite(parsed.getTime()) || dateInput(parsed) !== input) {
    throw new Error(`Choose A Valid Local Date And Time`);
  }
  return parsed.toISOString();
};
export const calendarInstant = (value: string) => {
  const input = value.trim().replace(` `, `T`);
  const key = input.slice(0, 10);
  const parsed = new Date(`${key}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?$/.test(input) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== key) {
    throw new Error(`Choose A Valid Calendar Date`);
  }
  return parsed.toISOString();
};
export const eventsOnDay = (records: CalendarEvent[], key: string) => {
  const start = dayDate(key);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  return records.filter(event => event.allDay
    ? event.startsAt.slice(0, 10) <= key && event.endsAt.slice(0, 10) > key
    : new Date(event.startsAt) < end && new Date(event.endsAt) > start);
};
export const formatEventSchedule = (event: CalendarEvent, timeZone?: string) => {
  const starts = new Date(event.startsAt);
  const ends = new Date(event.endsAt);
  if (event.allDay) {
    const lastDay = new Date(ends.getTime() - 1);
    const format = new Intl.DateTimeFormat(`en-US`, { timeZone: `UTC`, month: `short`, day: `numeric`, year: `numeric` });
    return `${format.format(starts)}${event.startsAt.slice(0, 10) === lastDay.toISOString().slice(0, 10) ? `` : ` – ${format.format(lastDay)}`} · All Day`;
  }
  const format = new Intl.DateTimeFormat(`en-US`, { timeZone, month: `short`, day: `numeric`, hour: `numeric`, minute: `2-digit` });
  return `${format.format(starts)} – ${format.format(ends)}`;
};
