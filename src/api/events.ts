import { createEvent, updateEvent, deleteEvent, subscribeEvents } from '../shared/events/service';

export const eventsAPI = { createEvent, updateEvent, deleteEvent, subscribeEvents };
export { eventLimits } from '../shared/events/types';
export { eventStorageSource } from '../shared/events/service';
export type { EventInput, EventRange, EventWindow } from '../shared/events/types';
