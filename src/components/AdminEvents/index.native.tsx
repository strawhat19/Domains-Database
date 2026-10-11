import { useMemo } from 'react';
import { eventLimits } from '../../api/events';
import { formatEventSchedule } from './values';
import { createStyles } from './styles.native';
import { useAdminEvents } from './useAdminEvents';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import { X, Plus, Save, Clock3, MapPin, Pencil, Trash2, CircleCheck, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Text, View, Switch, Pressable, TextInput, ActivityIndicator, useWindowDimensions } from 'react-native';

const weekdays = [`Sunday`, `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`];
const inputs = [
  { field: `name`, label: `Event Name *`, wide: true },
  { field: `start`, label: `Starts *`, date: true },
  { field: `end`, label: `Ends *`, date: true },
  { field: `location`, label: `Location`, wide: true },
  { field: `description`, label: `Description`, wide: true, multiline: true },
] as const;

const AdminEvents = () => {
  const state = useAdminEvents();
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const compact = width <= 600;
  const editorId = `admin-events-editor-${state.editorId ?? `new`}`;
  const selectedDate = state.days.find(day => day.key === state.selectedDay)?.date ?? new Date(`${state.selectedDay}T12:00:00`);
  const selectedLabel = selectedDate.toLocaleDateString(`en-US`, { day: `numeric`, year: `numeric`, month: `long`, weekday: `long` });

  return <View {...elementProps(`native-admin-events`)} style={styles.root} accessibilityState={{ busy: state.busy }}>
    <View {...elementProps(`native-admin-events-heading`)} style={styles.heading}>
      <View {...elementProps(`native-admin-events-heading-copy`)} style={styles.headingCopy}>
        <CalendarDays {...elementProps(`native-admin-events-title-icon`)} size={21} color={palette.accent} accessible={false} />
        <Text {...elementProps(`native-admin-events-title`)} style={styles.title} accessibilityRole={`header`}>{`Events Calendar`}</Text>
      </View>
      <Pressable {...elementProps(`native-admin-events-add`)} onPress={state.openNew} disabled={state.busy || state.loading} style={[styles.primaryButton, (state.busy || state.loading) && styles.disabled]} accessibilityRole={`button`} accessibilityState={{ disabled: state.busy || state.loading }}>
        <Plus {...elementProps(`native-admin-events-add-icon`)} size={15} color={palette.contrast} accessible={false} />
        <Text {...elementProps(`native-admin-events-add-label`)} style={styles.primaryLabel}>{`Add Event`}</Text>
      </Pressable>
    </View>
    <Text {...elementProps(`native-admin-events-source`)} style={styles.note}>{`Calendar Time Zone: ${state.timezone}`}</Text>
    {!!state.error && !state.draft && !state.deleting && <Text {...elementProps(`native-admin-events-error`)} style={styles.error} accessibilityRole={`alert`}>{state.error}</Text>}
    {!!state.notice && <View {...elementProps(`native-admin-events-notice`)} style={styles.notice}>
      <CircleCheck {...elementProps(`native-admin-events-notice-icon`)} size={15} color={palette.success} accessible={false} />
      <Text {...elementProps(`native-admin-events-notice-label`)} style={styles.noticeLabel} accessibilityLiveRegion={`polite`}>{state.notice}</Text>
    </View>}

    {state.draft && <View {...elementProps(editorId)} style={[styles.editor, compact && styles.compactPanel]}>
      <View {...elementProps(`${editorId}-heading`)} style={styles.panelHeading}>
        <Text {...elementProps(`${editorId}-title`)} style={styles.panelTitle} accessibilityRole={`header`}>{`${state.editorId ? `Edit` : `Add`} Event`}</Text>
        <Pressable {...elementProps(`${editorId}-close`)} onPress={state.closeEditor} disabled={state.busy} style={[styles.close, state.busy && styles.disabled]} accessibilityRole={`button`} accessibilityLabel={`Close Event Editor`} accessibilityState={{ disabled: state.busy }}>
          <X {...elementProps(`${editorId}-close-icon`)} size={17} color={palette.accent} accessible={false} />
        </Pressable>
      </View>
      <Text {...elementProps(`${editorId}-format-note`)} style={styles.note}>{`Enter starts and ends as YYYY-MM-DDTHH:mm using 24-hour time, for example 2026-10-11T09:00. Times use ${state.timezone}. The end must be after the start.`}</Text>
      <View {...elementProps(`${editorId}-fields`)} style={styles.fields}>
        {inputs.map(input => <View key={input.field} {...elementProps(`${editorId}-field`, input.field)} style={[styles.field, (compact || (`wide` in input && input.wide)) && styles.wideField]}>
          <Text {...elementProps(`${editorId}-label`, input.field)} style={styles.label}>{input.label}</Text>
          <TextInput
            {...elementProps(`${editorId}-input`, input.field)}
            editable={!state.busy}
            maxLength={input.field === `name` ? eventLimits.name : input.field === `location` ? eventLimits.location : input.field === `description` ? eventLimits.description : 16}
            value={state.draft?.[input.field] ?? ``}
            accessibilityLabel={input.label}
            placeholderTextColor={palette.placeholder}
            multiline={`multiline` in input && input.multiline}
            autoCorrect={!(`date` in input && input.date)}
            autoCapitalize={`date` in input && input.date ? `none` : `sentences`}
            placeholder={`date` in input && input.date ? `YYYY-MM-DDTHH:mm` : undefined}
            onChangeText={value => state.updateDraft(input.field, value)}
            style={[styles.input, compact && styles.compactInput, `multiline` in input && input.multiline && styles.multiline]}
          />
        </View>)}
      </View>
      <View {...elementProps(`${editorId}-all-day-field`)} style={styles.switchField}>
        <Text {...elementProps(`${editorId}-all-day-label`)} style={styles.label}>{`All-Day Event`}</Text>
        <Switch {...elementProps(`${editorId}-all-day`)} value={state.draft.allDay} disabled={state.busy} onValueChange={value => state.updateDraft(`allDay`, value)} accessibilityLabel={`All-Day Event`} trackColor={{ false: palette.line, true: palette.accent }} thumbColor={palette.paper} />
      </View>
      {state.draft.allDay && <Text {...elementProps(`${editorId}-all-day-note`)} style={styles.note}>{`All-day events use the dates only. The end date is exclusive: choose the following day for a one-day event.`}</Text>}
      {!!state.error && <Text {...elementProps(`${editorId}-error`)} style={styles.error} accessibilityRole={`alert`}>{state.error}</Text>}
      <View {...elementProps(`${editorId}-actions`)} style={styles.actions}>
        <Pressable {...elementProps(`${editorId}-cancel`)} onPress={state.closeEditor} disabled={state.busy} style={[styles.button, state.busy && styles.disabled]} accessibilityRole={`button`} accessibilityState={{ disabled: state.busy }}>
          <X {...elementProps(`${editorId}-cancel-icon`)} size={14} color={palette.accent} accessible={false} />
          <Text {...elementProps(`${editorId}-cancel-label`)} style={styles.buttonLabel}>{`Cancel`}</Text>
        </Pressable>
        <Pressable {...elementProps(`${editorId}-save`)} onPress={() => { if (!state.busy) void state.save(); }} disabled={state.busy} style={[styles.primaryButton, state.busy && styles.disabled]} accessibilityRole={`button`} accessibilityState={{ busy: state.busy, disabled: state.busy }}>
          <Save {...elementProps(`${editorId}-save-icon`)} size={14} color={palette.contrast} accessible={false} />
          <Text {...elementProps(`${editorId}-save-label`)} style={styles.primaryLabel}>{state.busy ? `Saving` : `Save Event`}</Text>
        </Pressable>
      </View>
    </View>}

    {state.deleting && <View {...elementProps(`native-admin-events-delete-confirmation`, state.deleting.id)} style={styles.confirmation}>
      <Text {...elementProps(`native-admin-events-delete-title`, state.deleting.id)} style={styles.panelTitle} accessibilityRole={`header`}>{`Delete Event`}</Text>
      <Text {...elementProps(`native-admin-events-delete-description`, state.deleting.id)} style={styles.copy}>{`Delete “${state.deleting.name}”? This event will be removed from the calendar.`}</Text>
      <Text {...elementProps(`native-admin-events-delete-schedule`, state.deleting.id)} style={styles.note}>{formatEventSchedule(state.deleting, state.timezone)}</Text>
      {!!state.error && <Text {...elementProps(`native-admin-events-delete-error`, state.deleting.id)} style={styles.error} accessibilityRole={`alert`}>{state.error}</Text>}
      <View {...elementProps(`native-admin-events-delete-actions`, state.deleting.id)} style={styles.actions}>
        <Pressable {...elementProps(`native-admin-events-delete-cancel`, state.deleting.id)} onPress={state.cancelDelete} disabled={state.busy} style={[styles.button, state.busy && styles.disabled]} accessibilityRole={`button`} accessibilityState={{ disabled: state.busy }}>
          <X {...elementProps(`native-admin-events-delete-cancel-icon`, state.deleting.id)} size={14} color={palette.accent} accessible={false} />
          <Text {...elementProps(`native-admin-events-delete-cancel-label`, state.deleting.id)} style={styles.buttonLabel}>{`Cancel`}</Text>
        </Pressable>
        <Pressable {...elementProps(`native-admin-events-delete-confirm`, state.deleting.id)} onPress={() => { if (!state.busy) void state.remove(); }} disabled={state.busy} style={[styles.dangerButton, state.busy && styles.disabled]} accessibilityRole={`button`} accessibilityState={{ busy: state.busy, disabled: state.busy }}>
          <Trash2 {...elementProps(`native-admin-events-delete-confirm-icon`, state.deleting.id)} size={14} color={palette.danger} accessible={false} />
          <Text {...elementProps(`native-admin-events-delete-confirm-label`, state.deleting.id)} style={styles.dangerLabel}>{state.busy ? `Deleting` : `Delete Event`}</Text>
        </Pressable>
      </View>
    </View>}

    <View {...elementProps(`native-admin-events-calendar`)} style={styles.calendar}>
      <View {...elementProps(`native-admin-events-calendar-heading`)} style={styles.calendarHeading}>
        <Text {...elementProps(`native-admin-events-month`)} style={styles.monthTitle} accessibilityRole={`header`} accessibilityLiveRegion={`polite`}>{state.monthLabel}</Text>
        <View {...elementProps(`native-admin-events-month-controls`)} style={styles.monthControls}>
          <Pressable {...elementProps(`native-admin-events-previous-month`)} onPress={() => state.changeMonth(-1)} disabled={state.busy} style={[styles.iconButton, state.busy && styles.disabled]} accessibilityRole={`button`} accessibilityLabel={`Previous Month`} accessibilityState={{ disabled: state.busy }}><ChevronLeft {...elementProps(`native-admin-events-previous-month-icon`)} size={17} color={palette.accent} accessible={false} /></Pressable>
          <Pressable {...elementProps(`native-admin-events-today`)} onPress={state.today} disabled={state.busy} style={[styles.button, state.busy && styles.disabled]} accessibilityRole={`button`} accessibilityState={{ disabled: state.busy }}><CalendarDays {...elementProps(`native-admin-events-today-icon`)} size={14} color={palette.accent} accessible={false} /><Text {...elementProps(`native-admin-events-today-label`)} style={styles.buttonLabel}>{`Today`}</Text></Pressable>
          <Pressable {...elementProps(`native-admin-events-next-month`)} onPress={() => state.changeMonth(1)} disabled={state.busy} style={[styles.iconButton, state.busy && styles.disabled]} accessibilityRole={`button`} accessibilityLabel={`Next Month`} accessibilityState={{ disabled: state.busy }}><ChevronRight {...elementProps(`native-admin-events-next-month-icon`)} size={17} color={palette.accent} accessible={false} /></Pressable>
        </View>
      </View>
      <View {...elementProps(`native-admin-events-weekdays`)} style={styles.weekdays}>
        {weekdays.map((day, index) => <Text key={day} {...elementProps(`native-admin-events-weekday`, `${index}`)} style={styles.weekday} accessibilityLabel={day}>{day.slice(0, 3)}</Text>)}
      </View>
      <View {...elementProps(`native-admin-events-day-grid`)} style={styles.dayGrid}>
        {state.days.map(day => {
          const count = state.eventsForDay(day.key).length;
          const selected = state.selectedDay === day.key;
          const label = day.date.toLocaleDateString(`en-US`, { day: `numeric`, year: `numeric`, month: `long`, weekday: `long` });
          return <Pressable key={day.key} {...elementProps(`native-admin-events-day`, day.key)} onPress={() => state.selectDay(day.key)} disabled={state.busy} style={[styles.day, compact && styles.compactDay, !day.inMonth && styles.outsideDay, day.today && styles.todayDay, selected && styles.selectedDay, state.busy && styles.disabled]} accessibilityRole={`button`} accessibilityState={{ selected, disabled: state.busy }} accessibilityLabel={`${label}${day.today ? `, Today` : ``}, ${state.loading ? `Loading Events` : state.error ? `Event Count Unavailable` : `${count} Event(s)`}`}>
            <Text {...elementProps(`native-admin-events-day-number`, day.key)} style={[styles.dayNumber, !day.inMonth && styles.mutedDayNumber, selected && styles.selectedDayNumber]}>{day.date.getDate()}</Text>
            {state.loading ? <View {...elementProps(`native-admin-events-day-loading`, day.key)} style={styles.countSkeleton} accessible={false} /> : count > 0 && <View {...elementProps(`native-admin-events-day-count`, day.key)} style={[styles.eventCount, selected && styles.selectedEventCount]}><Text {...elementProps(`native-admin-events-day-count-label`, day.key)} style={[styles.eventCountLabel, selected && styles.selectedEventCountLabel]}>{count}</Text></View>}
          </Pressable>;
        })}
      </View>
    </View>
    {state.hasMore && <Text {...elementProps(`native-admin-events-limit-note`)} style={styles.warning}>{`This calendar shows a limited set of events. Some events may be omitted.`}</Text>}

    <View {...elementProps(`native-admin-events-agenda`, state.selectedDay)} style={styles.agenda}>
      <Text {...elementProps(`native-admin-events-agenda-title`, state.selectedDay)} style={styles.agendaTitle} accessibilityRole={`header`}>{selectedLabel}</Text>
      {state.loading ? <View {...elementProps(`native-admin-events-loading`)} style={styles.loading} accessibilityLiveRegion={`polite`}>
        {!reducedMotion && <ActivityIndicator {...elementProps(`native-admin-events-loading-spinner`)} color={palette.accent} />}
        <Text {...elementProps(`native-admin-events-loading-label`)} style={styles.note}>{`Loading Events`}</Text>
      </View> : state.selectedEvents.length ? state.selectedEvents.map(event => <View key={event.id} {...elementProps(`native-admin-events-agenda-event`, event.id)} style={styles.eventCard}>
        <View {...elementProps(`native-admin-events-event-heading`, event.id)} style={styles.eventHeading}>
          <Text {...elementProps(`native-admin-events-event-name`, event.id)} style={styles.eventName} accessibilityRole={`header`}>{event.name}</Text>
          <Text {...elementProps(`native-admin-events-event-number`, event.id)} style={styles.note}>{`#${event.number}`}</Text>
        </View>
        <View {...elementProps(`native-admin-events-event-schedule`, event.id)} style={styles.detailRow}>
          <Clock3 {...elementProps(`native-admin-events-event-schedule-icon`, event.id)} size={14} color={palette.accent} accessible={false} />
          <Text {...elementProps(`native-admin-events-event-schedule-label`, event.id)} style={styles.detailLabel}>{formatEventSchedule(event, state.timezone)}</Text>
        </View>
        {!!event.location && <View {...elementProps(`native-admin-events-event-location`, event.id)} style={styles.detailRow}>
          <MapPin {...elementProps(`native-admin-events-event-location-icon`, event.id)} size={14} color={palette.muted} accessible={false} />
          <Text {...elementProps(`native-admin-events-event-location-label`, event.id)} style={styles.detailLabel}>{event.location}</Text>
        </View>}
        {!!event.description && <Text {...elementProps(`native-admin-events-event-description`, event.id)} style={styles.copy}>{event.description}</Text>}
        <View {...elementProps(`native-admin-events-event-actions`, event.id)} style={styles.actions}>
          <Pressable {...elementProps(`native-admin-events-event-edit`, event.id)} onPress={() => state.edit(event)} disabled={state.busy} style={[styles.button, state.busy && styles.disabled]} accessibilityRole={`button`} accessibilityLabel={`Edit ${event.name}`} accessibilityState={{ disabled: state.busy }}><Pencil {...elementProps(`native-admin-events-event-edit-icon`, event.id)} size={14} color={palette.accent} accessible={false} /><Text {...elementProps(`native-admin-events-event-edit-label`, event.id)} style={styles.buttonLabel}>{`Edit`}</Text></Pressable>
          <Pressable {...elementProps(`native-admin-events-event-delete`, event.id)} onPress={() => state.requestDelete(event)} disabled={state.busy} style={[styles.dangerButton, state.busy && styles.disabled]} accessibilityRole={`button`} accessibilityLabel={`Delete ${event.name}`} accessibilityState={{ disabled: state.busy }}><Trash2 {...elementProps(`native-admin-events-event-delete-icon`, event.id)} size={14} color={palette.danger} accessible={false} /><Text {...elementProps(`native-admin-events-event-delete-label`, event.id)} style={styles.dangerLabel}>{`Delete`}</Text></Pressable>
        </View>
      </View>) : <Text {...elementProps(`native-admin-events-empty`, state.selectedDay)} style={styles.empty}>{state.error ? `Event Records Unavailable` : `No events on this day. Add an event to start scheduling.`}</Text>}
    </View>
  </View>;
};

export default AdminEvents;
