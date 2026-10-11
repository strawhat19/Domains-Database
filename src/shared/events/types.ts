import type { CalendarEvent } from '../models/events/Event';

export interface EventInput {
  name: string;
  allDay: boolean;
  endsAt: string;
  startsAt: string;
  location: string;
  description: string;
}
export interface EventRange { end: string; start: string }
export interface EventWindow { hasMore: boolean; records: CalendarEvent[] }
export const eventLimits = { name: 100, records: 500, location: 200, durationDays: 366, description: 2000 } as const;
