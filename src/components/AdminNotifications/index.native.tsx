import { useMemo } from 'react';
import EditorModal from './EditorModal';
import NotificationRow from './NotificationRow';
import NotificationEditor from './NotificationEditor';
import type { AdminNotificationsProps } from './types';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useAdminNotifications } from './useAdminNotifications';
import { createStyles, notificationColumns } from './styles.native';
import { Bell, Plus, Search, CircleCheck, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react-native';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, useWindowDimensions } from 'react-native';

const columns = [`No.`, `Title`, `Kind`, `Status`, `Updated`, `Actions`];
const AdminNotifications = (_props: AdminNotificationsProps = {}) => {
  const state = useAdminNotifications();
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const compact = width <= 480;
  const record = state.editor && state.editor !== `new` ? state.editor : null;
  const editorId = record?.id ?? `new`;
  if (!state.allowed) return <Text {...elementProps(`native-admin-notifications-access`)} accessibilityRole={`alert`} style={styles.error}>{`Active Admin Or Owner Access Is Required`}</Text>;
  return <View {...elementProps(`native-admin-notifications`)} style={styles.root} accessibilityState={{ busy: state.busy }}>
    <View {...elementProps(`native-admin-notifications-heading`)} style={styles.heading}>
      <Bell size={20} color={palette.accent} {...elementProps(`native-admin-notifications-title-icon`)} />
      <Text {...elementProps(`native-admin-notifications-title`)} accessibilityRole={`header`} style={styles.title}>{`Notification Directory`}</Text>
    </View>
    <Text {...elementProps(`native-admin-notifications-source`)} style={styles.note}>{`${state.mode} · Page ${state.page.page} · Search And Filters Apply To This Page`}</Text>
    <View {...elementProps(`native-admin-notifications-summary`)} style={[styles.summary, compact && styles.compactSummary]}>
      {[
        { id: `total`, label: `Notifications On This Page`, value: state.records.length },
        { id: `active`, label: `Active`, value: state.active },
        { id: `inactive`, label: `Inactive`, value: state.records.length - state.active },
      ].map(item => <View key={item.id} {...elementProps(`native-admin-notifications-summary-card`, item.id)} style={[styles.summaryCard, compact && styles.compactCard]}>
        <Text {...elementProps(`native-admin-notifications-summary-label`, item.id)} style={styles.summaryLabel}>{item.label}</Text>
        {state.page.loading ? <View {...elementProps(`native-admin-notifications-summary-skeleton`, item.id)} style={styles.skeleton} accessible={false} /> : <Text {...elementProps(`native-admin-notifications-summary-value`, item.id)} style={styles.summaryValue}>{state.page.error ? `—` : item.value}</Text>}
      </View>)}
    </View>
    {!!state.error && <Text {...elementProps(`native-admin-notifications-error`)} accessibilityRole={`alert`} style={styles.error}>{state.error}</Text>}
    {!!state.notice && <View {...elementProps(`native-admin-notifications-notice`)} style={styles.notice}>
      <CircleCheck size={14} color={palette.accent} {...elementProps(`native-admin-notifications-notice-icon`)} />
      <Text {...elementProps(`native-admin-notifications-notice-text`)} accessibilityLiveRegion={`polite`} style={styles.noticeLabel}>{state.notice}</Text>
    </View>}
    {state.editor && <EditorModal busy={state.busy} error={state.error} key={editorId} onClose={state.closeEditor} id={`admin-notifications-editor-modal`} labelledBy={`admin-notification-editor-${editorId}-title`}>{dismiss => <NotificationEditor busy={state.busy} record={record} onSave={state.save} onClose={dismiss} />}</EditorModal>}
    <View {...elementProps(`native-admin-notifications-filters`)} style={styles.filters}>
      <View {...elementProps(`native-admin-notifications-search-wrap`)} style={styles.search}>
        <Search size={15} color={palette.muted} {...elementProps(`native-admin-notifications-search-icon`)} />
        <TextInput value={state.search} style={styles.searchInput} onChangeText={state.setSearch} placeholder={`Search notifications`} placeholderTextColor={palette.muted} accessibilityLabel={`Search Notifications On This Page`} {...elementProps(`native-admin-notifications-search`)} />
      </View>
      <View {...elementProps(`native-admin-notifications-filter-choices`)} style={styles.filterChoices}>
        {[[`all`, `All Statuses`], [`active`, `Active`], [`inactive`, `Inactive`]].map(([value, label]) => <Pressable key={value} onPress={() => state.setFilter(value)} accessibilityRole={`radio`} accessibilityState={{ selected: state.filter === value }} style={[styles.filter, state.filter === value && styles.selected]} {...elementProps(`native-admin-notifications-filter`, value)}><Text style={styles.filterLabel} {...elementProps(`native-admin-notifications-filter-label`, value)}>{label}</Text></Pressable>)}
      </View>
      <Pressable onPress={() => state.edit(`new`)} disabled={state.busy || !!state.page.error} accessibilityRole={`button`} accessibilityState={{ disabled: state.busy || !!state.page.error }} style={[styles.add, (state.busy || !!state.page.error) && styles.disabled]} {...elementProps(`native-admin-notifications-add`)}>
        <Plus size={14} color={palette.contrast} {...elementProps(`native-admin-notifications-add-icon`)} />
        <Text style={styles.addLabel} {...elementProps(`native-admin-notifications-add-label`)}>{`Add Notification`}</Text>
      </Pressable>
    </View>
    <View {...elementProps(`native-admin-notifications-table-wrap`)} style={styles.tableWrap}>
      <ScrollView horizontal keyboardShouldPersistTaps={`handled`} {...elementProps(`native-admin-notifications-table-scroll`)}>
        <View {...elementProps(`native-admin-notifications-table`)} style={styles.table}>
          <View {...elementProps(`native-admin-notifications-table-head`)} style={styles.tableHead}>{columns.map((label, index) => <Text key={label} style={[styles.column, { width: notificationColumns[index] }]} {...elementProps(`native-admin-notifications-column`, index)}>{label}</Text>)}</View>
          {state.page.loading ? <View style={styles.loading} {...elementProps(`native-admin-notifications-loading`)}><ActivityIndicator color={palette.accent} {...elementProps(`native-admin-notifications-loading-spinner`)} /><Text style={styles.note} {...elementProps(`native-admin-notifications-loading-label`)}>{`Loading Realtime Notifications`}</Text></View> : state.matchingRecords.length ? state.matchingRecords.map(item => <NotificationRow key={item.id} busy={state.busy} record={item} onEdit={state.edit} onDelete={state.remove} onStatus={state.changeStatus} onRequestDelete={state.requestDelete} confirming={state.deletingId === item.id} onCancelDelete={state.cancelDelete} />) : <Text style={styles.empty} {...elementProps(`native-admin-notifications-empty`)}>{state.page.error ? `Notification Records Unavailable` : state.records.length ? `No notifications match these filters.` : `No notifications saved yet. Add a notification to get started.`}</Text>}
        </View>
      </ScrollView>
    </View>
    <View {...elementProps(`native-admin-notifications-pagination`)} style={styles.pagination}>
      <Text {...elementProps(`native-admin-notifications-pagination-label`)} style={styles.note}>{`Page ${state.page.page} · ${state.matchingRecords.length} Matching Notification(s) In This Realtime Page`}</Text>
      <View {...elementProps(`native-admin-notifications-pagination-controls`)} style={styles.paginationControls}>
        {[
          { id: `previous`, label: `Previous`, Icon: ArrowLeft, action: state.page.previousPage, disabled: state.busy || !state.page.hasPrevious },
          { id: `next`, label: `Next`, Icon: ArrowRight, action: state.page.nextPage, disabled: state.busy || !state.page.hasNext },
          { id: `latest`, label: `Latest`, Icon: RotateCcw, action: state.page.refresh, disabled: state.busy },
        ].map(({ id, label, Icon, action, disabled }) => <Pressable key={id} onPress={action} disabled={disabled} accessibilityRole={`button`} accessibilityState={{ disabled }} style={[styles.pageButton, disabled && styles.disabled]} {...elementProps(`native-admin-notifications-page-button`, id)}><Icon size={11} color={palette.accent} {...elementProps(`native-admin-notifications-page-icon`, id)} /><Text style={styles.pageLabel} {...elementProps(`native-admin-notifications-page-label`, id)}>{label}</Text></Pressable>)}
      </View>
    </View>
  </View>;
};

export default AdminNotifications;
