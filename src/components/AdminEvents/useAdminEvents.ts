import { eventsAPI } from '../../api/events';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../shared/authContext/useAuth';
import { canManageEvents } from '../../shared/admin/permissions';
import type { CalendarEvent } from '../../shared/models/events/Event';
import { dayDate, dateKey, dateInput, localInstant, eventsOnDay, calendarInstant, type EventDraft } from './values';

interface Controls {
  actor: string;
  month: Date;
  selectedDay: string;
  draft: EventDraft | null;
  editorId?: string;
  deleting: CalendarEvent | null;
}
const initialControls = (actor: string): Controls => {
  const today = new Date();
  return { actor, month: new Date(today.getFullYear(), today.getMonth(), 1), selectedDay: dateKey(today), draft: null, deleting: null };
};
const newDraft = (key: string): EventDraft => {
  const start = dayDate(key);
  start.setHours(9);
  const end = new Date(start);
  end.setHours(10);
  return { name: ``, location: ``, description: ``, allDay: false, start: dateInput(start), end: dateInput(end) };
};

export const useAdminEvents = () => {
  const { user } = useAuth();
  const actor = canManageEvents(user) ? `${user?.id}:${user?.role}` : ``;
  const [controls, setControls] = useState(() => initialControls(actor));
  const current = controls.actor === actor ? controls : initialControls(actor);
  const month = current.month;
  const first = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first.getFullYear(), first.getMonth(), first.getDate() + index);
    return { date, key: dateKey(date), inMonth: date.getMonth() === month.getMonth(), today: dateKey(date) === dateKey(new Date()) };
  });
  const start = first.toISOString();
  const end = new Date(first.getFullYear(), first.getMonth(), first.getDate() + 42).toISOString();
  const key = `${actor}:${start}:${end}`;
  const [feed, setFeed] = useState({ key, records: [] as CalendarEvent[], hasMore: false, loading: Boolean(actor), error: `` });
  const data = feed.key === key ? feed : { key, records: [], hasMore: false, loading: Boolean(actor), error: `` };
  const [feedback, setFeedback] = useState({ actor, busy: false, error: ``, notice: `` });
  const response = feedback.actor === actor ? feedback : { actor, busy: false, error: ``, notice: `` };
  const scope = useRef(actor);
  const pending = useRef<{ actor: string } | null>(null);
  scope.current = actor;
  useEffect(() => {
    if (!actor) return;
    let active = true;
    const stop = eventsAPI.subscribeEvents(window => {
      if (active) setFeed({ key, records: [...window.records].sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.number - b.number), hasMore: window.hasMore, loading: false, error: `` });
    }, failure => {
      if (active) setFeed({ key, records: [], hasMore: false, loading: false, error: failure.message });
    }, { start, end });
    return () => { active = false; stop(); };
  }, [actor, key, start, end]);
  const updateControls = (update: (value: Controls) => Controls) => setControls(value => update(value.actor === actor ? value : initialControls(actor)));
  const clearFeedback = () => setFeedback({ actor, busy: false, error: ``, notice: `` });
  const runMutation = async (operation: () => Promise<unknown>, notice: string) => {
    if (!actor || pending.current?.actor === actor) return false;
    const request = { actor };
    pending.current = request;
    setFeedback({ actor, busy: true, error: ``, notice: `` });
    try {
      await operation();
      if (scope.current !== actor) return false;
      setFeedback({ actor, busy: false, error: ``, notice });
      return true;
    } catch (failure) {
      if (scope.current === actor) setFeedback({ actor, busy: false, notice: ``, error: failure instanceof Error ? failure.message : `Event Could Not Be Saved` });
      return false;
    } finally { if (pending.current === request) pending.current = null; }
  };
  const save = async () => {
    const draft = current.draft;
    if (!draft) return false;
    const saved = await runMutation(() => {
      const input = {
        name: draft.name,
        allDay: draft.allDay,
        location: draft.location,
        description: draft.description,
        startsAt: draft.allDay ? calendarInstant(draft.start) : localInstant(draft.start),
        endsAt: draft.allDay ? calendarInstant(draft.end) : localInstant(draft.end),
      };
      return current.editorId ? eventsAPI.updateEvent(current.editorId, input) : eventsAPI.createEvent(input);
    }, `Event Saved`);
    if (saved) updateControls(value => ({ ...value, draft: null, editorId: undefined }));
    return saved;
  };
  const remove = async () => {
    const deleting = current.deleting;
    if (!deleting) return false;
    const removed = await runMutation(() => eventsAPI.deleteEvent(deleting.id), `Event Deleted`);
    if (removed) updateControls(value => ({ ...value, deleting: null }));
    return removed;
  };
  const updateDraft = <K extends keyof EventDraft>(field: K, value: EventDraft[K]) => updateControls(state => {
    if (!state.draft || response.busy) return state;
    let draft = { ...state.draft, [field]: value };
    if (field === `allDay` && value === true) {
      try {
        const start = new Date(localInstant(draft.start));
        const end = new Date(localInstant(draft.end));
        const begins = dayDate(dateKey(start));
        const ends = dayDate(dateKey(end));
        if (end.getHours() || end.getMinutes()) ends.setDate(ends.getDate() + 1);
        if (ends <= begins) ends.setTime(new Date(begins.getFullYear(), begins.getMonth(), begins.getDate() + 1).getTime());
        draft = { ...draft, start: dateInput(begins), end: dateInput(ends) };
      } catch { /* Keep incomplete date fields editable. */ }
    }
    return { ...state, draft };
  });
  return {
    days, save, remove, updateDraft,
    draft: current.draft,
    editorId: current.editorId,
    deleting: current.deleting,
    selectedDay: current.selectedDay,
    selectedEvents: eventsOnDay(data.records, current.selectedDay),
    eventsForDay: (day: string) => eventsOnDay(data.records, day),
    loading: data.loading,
    hasMore: data.hasMore,
    busy: response.busy,
    notice: response.notice,
    error: response.error || data.error,
    monthLabel: new Intl.DateTimeFormat(`en-US`, { month: `long`, year: `numeric` }).format(month),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || `UTC`,
    selectDay: (selectedDay: string) => updateControls(value => ({ ...value, selectedDay })),
    changeMonth: (amount: number) => updateControls(value => {
      const month = new Date(value.month.getFullYear(), value.month.getMonth() + amount, 1);
      return { ...value, month, selectedDay: dateKey(month) };
    }),
    today: () => updateControls(value => ({ ...value, month: initialControls(actor).month, selectedDay: dateKey(new Date()) })),
    openNew: () => { clearFeedback(); updateControls(value => ({ ...value, draft: newDraft(value.selectedDay), editorId: undefined, deleting: null })); },
    edit: (event: CalendarEvent) => {
      clearFeedback();
      updateControls(value => ({ ...value, editorId: event.id, deleting: null, draft: { name: event.name, description: event.description, location: event.location, allDay: event.allDay, start: event.allDay ? `${event.startsAt.slice(0, 10)}T00:00` : dateInput(new Date(event.startsAt)), end: event.allDay ? `${event.endsAt.slice(0, 10)}T00:00` : dateInput(new Date(event.endsAt)) } }));
    },
    closeEditor: () => { if (!response.busy) updateControls(value => ({ ...value, draft: null, editorId: undefined })); },
    requestDelete: (event: CalendarEvent) => { clearFeedback(); updateControls(value => ({ ...value, deleting: event, draft: null, editorId: undefined })); },
    cancelDelete: () => { if (!response.busy) updateControls(value => ({ ...value, deleting: null })); },
  };
};
