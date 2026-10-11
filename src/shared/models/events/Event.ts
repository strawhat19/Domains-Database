import { Types } from '../../../types/types';
import { Data, type JSONValue } from '../Data';

export class CalendarEvent extends Data {
  allDay: boolean;
  endsAt: string;
  startsAt: string;
  location: string;
  creatorId: string;

  constructor(data: Partial<CalendarEvent> = {}) {
    super({ ...data, type: Types.Event });
    this.allDay = data.allDay ?? false;
    this.endsAt = data.endsAt ?? ``;
    this.startsAt = data.startsAt ?? ``;
    this.location = data.location ?? ``;
    this.creatorId = data.creatorId ?? ``;
    this.refreshProperties();
  }

  toRecord(): Record<string, JSONValue> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      allDay: this.allDay,
      endsAt: this.endsAt,
      number: this.number,
      created: this.created,
      updated: this.updated,
      startsAt: this.startsAt,
      location: this.location,
      creatorId: this.creatorId,
      description: this.description,
    };
  }
}
