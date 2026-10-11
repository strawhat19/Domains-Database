import './styles.scss';
import { eventLimits } from '../../api/events';
import { useAdminEvents } from './useAdminEvents';
import { formatEventSchedule } from './values';
import { X, Plus, Save, Clock3, Pencil, MapPin, Trash2, CircleAlert, CircleCheck, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const weeks = [0, 1, 2, 3, 4, 5];
const weekdays = [`Sun`, `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`];
const dateLabel = new Intl.DateTimeFormat(undefined, {
  day: `numeric`,
  year: `numeric`,
  month: `long`,
  weekday: `long`,
});

const AdminEvents = () => {
  const state = useAdminEvents();
  const editorScope = `admin-event-editor-${state.editorId ?? `new`}`;
  const selectedDate = state.days.find(day => day.key === state.selectedDay)?.date
    ?? new Date(`${state.selectedDay}T12:00:00`);
  const selectedLabel = Number.isFinite(selectedDate.getTime())
    ? dateLabel.format(selectedDate)
    : state.selectedDay;

  return (
    <section
      id={`admin-events`}
      className={`admin-events`}
      aria-busy={state.loading || state.busy}
      aria-labelledby={`admin-events-title`}
    >
      <div id={`admin-events-heading`} className={`admin-events-heading`}>
        <div id={`admin-events-heading-copy`} className={`admin-events-heading-copy`}>
          <h2 id={`admin-events-title`} className={`admin-events-title`}>
            <CalendarDays id={`admin-events-title-icon`} className={`admin-events-icon`} size={20} aria-hidden />
            {`Scheduled Events`}
          </h2>
          <p id={`admin-events-source`} className={`admin-events-note`}>
            {`Times Shown In ${state.timezone}`}
          </p>
        </div>
        <button
          type={`button`}
          id={`admin-events-add`}
          onClick={state.openNew}
          disabled={state.loading || state.busy}
          className={`admin-events-button is-primary`}
        >
          <Plus id={`admin-events-add-icon`} className={`admin-events-icon`} size={15} aria-hidden />
          {`Add Event`}
        </button>
      </div>

      {!!state.error && (
        <p id={`admin-events-error`} className={`admin-events-feedback is-error`} role={`alert`}>
          <CircleAlert id={`admin-events-error-icon`} className={`admin-events-icon`} size={16} aria-hidden />
          {state.error}
        </p>
      )}
      {!!state.notice && (
        <p id={`admin-events-notice`} className={`admin-events-feedback is-success`} role={`status`}>
          <CircleCheck id={`admin-events-notice-icon`} className={`admin-events-icon`} size={16} aria-hidden />
          {state.notice}
        </p>
      )}
      {state.hasMore && (
        <p id={`admin-events-coverage`} className={`admin-events-coverage`}>
          {`More saved events exist. Calendar counts and previews cover the loaded event window.`}
        </p>
      )}

      <section id={`admin-events-calendar`} className={`admin-events-calendar`} aria-labelledby={`admin-events-month`}>
        <div id={`admin-events-calendar-toolbar`} className={`admin-events-calendar-toolbar`}>
          <h3 id={`admin-events-month`} className={`admin-events-month`} aria-live={`polite`}>
            {state.monthLabel}
          </h3>
          <div id={`admin-events-month-actions`} className={`admin-events-month-actions`}>
            <button
              type={`button`}
              disabled={state.busy}
              id={`admin-events-previous-month`}
              aria-label={`Previous Month`}
              className={`admin-events-button is-icon`}
              onClick={() => state.changeMonth(-1)}
            >
              <ChevronLeft id={`admin-events-previous-month-icon`} className={`admin-events-icon`} size={18} aria-hidden />
            </button>
            <button
              type={`button`}
              onClick={state.today}
              disabled={state.busy}
              id={`admin-events-today`}
              className={`admin-events-button`}
            >
              <CalendarDays id={`admin-events-today-icon`} className={`admin-events-icon`} size={14} aria-hidden />
              {`Today`}
            </button>
            <button
              type={`button`}
              disabled={state.busy}
              id={`admin-events-next-month`}
              aria-label={`Next Month`}
              onClick={() => state.changeMonth(1)}
              className={`admin-events-button is-icon`}
            >
              <ChevronRight id={`admin-events-next-month-icon`} className={`admin-events-icon`} size={18} aria-hidden />
            </button>
          </div>
        </div>
        <table id={`admin-events-calendar-table`} className={`admin-events-calendar-table`}>
          <caption id={`admin-events-calendar-caption`} className={`admin-events-sr-only`}>
            {`${state.monthLabel} · Select A Day To View Its Scheduled Events`}
          </caption>
          <thead id={`admin-events-calendar-head`} className={`admin-events-calendar-head`}>
            <tr id={`admin-events-weekdays`} className={`admin-events-weekdays`}>
              {weekdays.map((weekday, index) => (
                <th
                  scope={`col`}
                  key={weekday}
                  id={`admin-events-weekday-${index}`}
                  className={`admin-events-weekday`}
                >
                  {weekday}
                </th>
              ))}
            </tr>
          </thead>
          <tbody id={`admin-events-calendar-body`} className={`admin-events-calendar-body`}>
            {weeks.map(week => (
              <tr key={week} id={`admin-events-week-${week}`} className={`admin-events-week`}>
                {state.days.slice(week * 7, week * 7 + 7).map(day => {
                  const events = state.eventsForDay(day.key);
                  const selected = state.selectedDay === day.key;
                  return (
                    <td key={day.key} id={`admin-events-day-cell-${day.key}`} className={`admin-events-day-cell`}>
                      <button
                        type={`button`}
                        aria-pressed={selected}
                        disabled={state.busy}
                        id={`admin-events-day-${day.key}`}
                        onClick={() => state.selectDay(day.key)}
                        aria-current={day.today ? `date` : undefined}
                        className={`admin-events-day${selected ? ` is-selected` : ``}${day.today ? ` is-today` : ``}${day.inMonth ? `` : ` is-outside`}`}
                        aria-label={`${dateLabel.format(day.date)} · ${state.loading ? `Loading Events` : `${events.length} Scheduled Event(s)`}`}
                      >
                        <span id={`admin-events-day-heading-${day.key}`} className={`admin-events-day-heading`}>
                          <span id={`admin-events-day-number-${day.key}`} className={`admin-events-day-number`}>{day.date.getDate()}</span>
                          {!state.loading && events.length > 0 && (
                            <span id={`admin-events-day-count-${day.key}`} className={`admin-events-day-count`} aria-hidden>
                              {events.length}
                            </span>
                          )}
                        </span>
                        {state.loading ? (
                          <span id={`admin-events-day-loading-${day.key}`} className={`admin-events-day-loading`} aria-hidden>
                            <span id={`admin-events-day-skeleton-${day.key}`} className={`admin-events-skeleton is-day`} />
                          </span>
                        ) : (
                          <span id={`admin-events-day-previews-${day.key}`} className={`admin-events-day-previews`} aria-hidden>
                            {events.slice(0, 2).map(record => (
                              <span key={record.id} id={`admin-events-day-preview-${day.key}-${record.id}`} className={`admin-events-day-preview`}>
                                {record.name}
                              </span>
                            ))}
                            {events.length > 2 && (
                              <span id={`admin-events-day-more-${day.key}`} className={`admin-events-day-more`}>{`+${events.length - 2} More`}</span>
                            )}
                          </span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {state.draft && (
        <form
          id={editorScope}
          className={`admin-event-editor`}
          aria-labelledby={`${editorScope}-title`}
          onSubmit={event => { event.preventDefault(); void state.save(); }}
        >
          <div id={`${editorScope}-heading`} className={`admin-event-editor-heading`}>
            <h3 id={`${editorScope}-title`} className={`admin-event-editor-title`}>
              <Pencil id={`${editorScope}-title-icon`} className={`admin-events-icon`} size={18} aria-hidden />
              {state.editorId ? `Edit Event` : `New Event`}
            </h3>
            <button
              type={`button`}
              disabled={state.busy}
              onClick={state.closeEditor}
              id={`${editorScope}-close`}
              aria-label={`Close Event Editor`}
              className={`admin-events-button is-icon`}
            >
              <X id={`${editorScope}-close-icon`} className={`admin-events-icon`} size={18} aria-hidden />
            </button>
          </div>
          <fieldset id={`${editorScope}-fields`} className={`admin-event-editor-fields`} disabled={state.busy}>
            <legend id={`${editorScope}-legend`} className={`admin-events-sr-only`}>{`Event Details`}</legend>
            <label id={`${editorScope}-name-label`} className={`admin-event-field is-wide`} htmlFor={`${editorScope}-name`}>
              <span id={`${editorScope}-name-caption`} className={`admin-event-field-caption`}>{`Name`}</span>
              <input
                required
                type={`text`}
                name={`name`}
                maxLength={eventLimits.name}
                autoComplete={`off`}
                id={`${editorScope}-name`}
                value={state.draft.name}
                className={`admin-event-input`}
                onChange={event => state.updateDraft(`name`, event.currentTarget.value)}
              />
            </label>
            <label id={`${editorScope}-start-label`} className={`admin-event-field`} htmlFor={`${editorScope}-start`}>
              <span id={`${editorScope}-start-caption`} className={`admin-event-field-caption`}>{`Start`}</span>
              <input
                required
                step={60}
                name={`start`}
                type={`datetime-local`}
                id={`${editorScope}-start`}
                value={state.draft.start}
                className={`admin-event-input`}
                aria-describedby={`${editorScope}-schedule-note`}
                onChange={event => state.updateDraft(`start`, event.currentTarget.value)}
              />
            </label>
            <label id={`${editorScope}-end-label`} className={`admin-event-field`} htmlFor={`${editorScope}-end`}>
              <span id={`${editorScope}-end-caption`} className={`admin-event-field-caption`}>{state.draft.allDay ? `End (Exclusive)` : `End`}</span>
              <input
                required
                step={60}
                name={`end`}
                type={`datetime-local`}
                min={state.draft.start}
                id={`${editorScope}-end`}
                value={state.draft.end}
                className={`admin-event-input`}
                aria-describedby={`${editorScope}-schedule-note`}
                onChange={event => state.updateDraft(`end`, event.currentTarget.value)}
              />
            </label>
            <div id={`${editorScope}-schedule`} className={`admin-event-schedule-options is-wide`}>
              <label id={`${editorScope}-all-day-label`} className={`admin-event-checkbox`} htmlFor={`${editorScope}-all-day`}>
                <input
                  name={`allDay`}
                  type={`checkbox`}
                  id={`${editorScope}-all-day`}
                  checked={state.draft.allDay}
                  className={`admin-event-checkbox-input`}
                  onChange={event => state.updateDraft(`allDay`, event.currentTarget.checked)}
                />
                <span id={`${editorScope}-all-day-caption`} className={`admin-event-field-caption`}>{`All Day`}</span>
              </label>
              <p id={`${editorScope}-schedule-note`} className={`admin-events-note`}>
                {state.draft.allDay ? `Dates only. Choose the day after the final event day as the end.` : `${state.timezone} · Enter the local start and end time.`}
              </p>
            </div>
            <label id={`${editorScope}-location-label`} className={`admin-event-field is-wide`} htmlFor={`${editorScope}-location`}>
              <span id={`${editorScope}-location-caption`} className={`admin-event-field-caption`}>{`Location (Optional)`}</span>
              <input
                type={`text`}
                name={`location`}
                maxLength={eventLimits.location}
                id={`${editorScope}-location`}
                value={state.draft.location}
                className={`admin-event-input`}
                onChange={event => state.updateDraft(`location`, event.currentTarget.value)}
              />
            </label>
            <label id={`${editorScope}-description-label`} className={`admin-event-field is-wide`} htmlFor={`${editorScope}-description`}>
              <span id={`${editorScope}-description-caption`} className={`admin-event-field-caption`}>{`Description (Optional)`}</span>
              <textarea
                rows={4}
                name={`description`}
                maxLength={eventLimits.description}
                id={`${editorScope}-description`}
                value={state.draft.description}
                className={`admin-event-input is-textarea`}
                onChange={event => state.updateDraft(`description`, event.currentTarget.value)}
              />
            </label>
          </fieldset>
          <div id={`${editorScope}-actions`} className={`admin-event-editor-actions`}>
            <button type={`button`} id={`${editorScope}-cancel`} className={`admin-events-button`} onClick={state.closeEditor} disabled={state.busy}>
              <X id={`${editorScope}-cancel-icon`} className={`admin-events-icon`} size={14} aria-hidden />
              {`Cancel`}
            </button>
            <button type={`submit`} id={`${editorScope}-save`} className={`admin-events-button is-primary`} disabled={state.busy}>
              <Save id={`${editorScope}-save-icon`} className={`admin-events-icon`} size={14} aria-hidden />
              {state.busy ? `Saving…` : `Save Event`}
            </button>
          </div>
        </form>
      )}

      {state.deleting && (
        <section
          role={`group`}
          className={`admin-event-delete-confirmation`}
          id={`admin-event-delete-${state.deleting.id}`}
          aria-labelledby={`admin-event-delete-title-${state.deleting.id}`}
        >
          <div id={`admin-event-delete-copy-${state.deleting.id}`} className={`admin-event-delete-copy`}>
            <h3 id={`admin-event-delete-title-${state.deleting.id}`} className={`admin-event-delete-title`}>
              <Trash2 id={`admin-event-delete-title-icon-${state.deleting.id}`} className={`admin-events-icon`} size={16} aria-hidden />
              {`Delete ${state.deleting.name}?`}
            </h3>
            <p id={`admin-event-delete-note-${state.deleting.id}`} className={`admin-events-note`} role={`alert`}>
              {`This permanently removes the saved event from the calendar.`}
            </p>
          </div>
          <div id={`admin-event-delete-actions-${state.deleting.id}`} className={`admin-event-delete-actions`}>
            <button type={`button`} className={`admin-events-button`} id={`admin-event-delete-cancel-${state.deleting.id}`} disabled={state.busy} onClick={state.cancelDelete}>
              <X id={`admin-event-delete-cancel-icon-${state.deleting.id}`} className={`admin-events-icon`} size={14} aria-hidden />
              {`Cancel`}
            </button>
            <button type={`button`} className={`admin-events-button is-danger`} id={`admin-event-delete-confirm-${state.deleting.id}`} disabled={state.busy} onClick={() => void state.remove()}>
              <Trash2 id={`admin-event-delete-confirm-icon-${state.deleting.id}`} className={`admin-events-icon`} size={14} aria-hidden />
              {state.busy ? `Deleting…` : `Delete Event`}
            </button>
          </div>
        </section>
      )}

      <section id={`admin-events-agenda`} className={`admin-events-agenda`} aria-labelledby={`admin-events-agenda-title`}>
        <div id={`admin-events-agenda-heading`} className={`admin-events-agenda-heading`}>
          <h3 id={`admin-events-agenda-title`} className={`admin-events-agenda-title`}>{selectedLabel}</h3>
          <span id={`admin-events-agenda-count`} className={`admin-events-agenda-count`} aria-live={`polite`}>
            {state.loading ? `Loading Events` : `${state.selectedEvents.length} Scheduled Event(s)`}
          </span>
        </div>
        {state.loading ? (
          <div id={`admin-events-loading`} className={`admin-events-loading`} role={`progressbar`} aria-label={`Loading Scheduled Events`}>
            {[0, 1, 2].map(index => (
              <div key={index} id={`admin-events-loading-card-${index}`} className={`admin-event-card is-loading`} aria-hidden>
                <span id={`admin-events-loading-title-${index}`} className={`admin-events-skeleton is-title`} />
                <span id={`admin-events-loading-schedule-${index}`} className={`admin-events-skeleton is-schedule`} />
                <span id={`admin-events-loading-description-${index}`} className={`admin-events-skeleton is-description`} />
              </div>
            ))}
          </div>
        ) : state.selectedEvents.length ? (
          <div id={`admin-events-agenda-list`} className={`admin-events-agenda-list`}>
            {state.selectedEvents.map(record => (
              <article key={record.id} id={`admin-event-${record.id}`} className={`admin-event-card`} aria-labelledby={`admin-event-title-${record.id}`}>
                <div id={`admin-event-heading-${record.id}`} className={`admin-event-heading`}>
                  <div id={`admin-event-heading-copy-${record.id}`} className={`admin-event-heading-copy`}>
                    <h4 id={`admin-event-title-${record.id}`} className={`admin-event-title`}>{record.name}</h4>
                    <p id={`admin-event-schedule-${record.id}`} className={`admin-event-schedule`}>
                      <Clock3 id={`admin-event-schedule-icon-${record.id}`} className={`admin-events-icon`} size={14} aria-hidden />
                      <span id={`admin-event-schedule-copy-${record.id}`} className={`admin-event-schedule-copy`}>{formatEventSchedule(record, state.timezone)}</span>
                    </p>
                  </div>
                  <span id={`admin-event-number-${record.id}`} className={`admin-event-number`}>{`#${record.number}`}</span>
                </div>
                {!!record.location && (
                  <p id={`admin-event-location-${record.id}`} className={`admin-event-location`}>
                    <MapPin id={`admin-event-location-icon-${record.id}`} className={`admin-events-icon`} size={14} aria-hidden />
                    <span id={`admin-event-location-copy-${record.id}`} className={`admin-event-location-copy`}>{record.location}</span>
                  </p>
                )}
                {!!record.description && <p id={`admin-event-description-${record.id}`} className={`admin-event-description`}>{record.description}</p>}
                <div id={`admin-event-actions-${record.id}`} className={`admin-event-actions`}>
                  <button type={`button`} id={`admin-event-edit-${record.id}`} className={`admin-events-button`} disabled={state.busy} onClick={() => state.edit(record)} aria-label={`Edit ${record.name}`}>
                    <Pencil id={`admin-event-edit-icon-${record.id}`} className={`admin-events-icon`} size={14} aria-hidden />
                    {`Edit`}
                  </button>
                  <button type={`button`} id={`admin-event-delete-request-${record.id}`} className={`admin-events-button is-danger-outline`} disabled={state.busy} onClick={() => state.requestDelete(record)} aria-label={`Delete ${record.name}`}>
                    <Trash2 id={`admin-event-delete-request-icon-${record.id}`} className={`admin-events-icon`} size={14} aria-hidden />
                    {`Delete`}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p id={`admin-events-empty`} className={`admin-events-empty`}>
            <CalendarDays id={`admin-events-empty-icon`} className={`admin-events-icon`} size={22} aria-hidden />
            {state.error ? `No events available for this day.` : `No events scheduled for this day. Add an event to get started.`}
          </p>
        )}
      </section>
    </section>
  );
};

export default AdminEvents;
