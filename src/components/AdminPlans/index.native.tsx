import { useMemo } from 'react';
import PlanRow from './PlanRow';
import PlanEditor from './PlanEditor';
import EditorModal from './EditorModal';
import type { AdminPlansProps } from './types';
import { useAdminPlans } from './useAdminPlans';
import { elementProps } from '../../shared/elementProps';
import { createStyles, planColumns } from './styles.native';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Layers3, Plus, Search, CircleCheck, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react-native';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, useWindowDimensions } from 'react-native';

const columns = [`No.`, `Plan`, `Price`, `Features`, `Status`, `Updated`, `Actions`, `Score`];
const AdminPlans = (_props: AdminPlansProps = {}) => {
  const state = useAdminPlans();
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const compact = width <= 480;
  const record = state.editor && state.editor !== `new` ? state.editor : null;
  const editorId = record?.id ?? `new`;
  if (!state.allowed) return <Text {...elementProps(`native-admin-plans-access`)} accessibilityRole={`alert`} style={styles.error}>{`Active Owner Access Is Required`}</Text>;
  return <View {...elementProps(`native-admin-plans`)} style={styles.root} accessibilityState={{ busy: state.busy }}>
    <View {...elementProps(`native-admin-plans-heading`)} style={styles.heading}>
      <Layers3 size={20} color={palette.accent} {...elementProps(`native-admin-plans-title-icon`)} />
      <Text {...elementProps(`native-admin-plans-title`)} accessibilityRole={`header`} style={styles.title}>{`Plan Directory`}</Text>
    </View>
    <Text {...elementProps(`native-admin-plans-source`)} style={styles.note}>{`${state.mode} · Page ${state.page.page} · Search And Filters Apply To This Page`}</Text>
    <View {...elementProps(`native-admin-plans-summary`)} style={[styles.summary, compact && styles.compactSummary]}>
      {[
        { id: `total`, label: `Plans On This Page`, value: state.records.length },
        { id: `active`, label: `Active`, value: state.active },
        { id: `inactive`, label: `Inactive`, value: state.records.length - state.active },
      ].map(item => <View key={item.id} {...elementProps(`native-admin-plans-summary-card`, item.id)} style={[styles.summaryCard, compact && styles.compactCard]}>
        <Text {...elementProps(`native-admin-plans-summary-label`, item.id)} style={styles.summaryLabel}>{item.label}</Text>
        {state.page.loading ? <View {...elementProps(`native-admin-plans-summary-skeleton`, item.id)} style={styles.skeleton} accessible={false} /> : <Text {...elementProps(`native-admin-plans-summary-value`, item.id)} style={styles.summaryValue}>{state.page.error ? `—` : item.value}</Text>}
      </View>)}
    </View>
    {!!state.error && <Text {...elementProps(`native-admin-plans-error`)} accessibilityRole={`alert`} style={styles.error}>{state.error}</Text>}
    {!!state.scores.error && <Text {...elementProps(`native-admin-plans-score-error`)} accessibilityRole={`alert`} style={styles.error}>{`Plan Scores: ${state.scores.error}${state.scores.ready ? ` · Last Confirmed Scores` : ``}`}</Text>}
    {!!state.notice && <View {...elementProps(`native-admin-plans-notice`)} style={styles.notice}>
      <CircleCheck size={14} color={palette.accent} {...elementProps(`native-admin-plans-notice-icon`)} />
      <Text {...elementProps(`native-admin-plans-notice-text`)} accessibilityLiveRegion={`polite`} style={styles.noticeLabel}>{state.notice}</Text>
    </View>}
    {state.editor && <EditorModal busy={state.busy} error={state.error} key={editorId} onClose={state.closeEditor} id={`admin-plans-editor-modal`} labelledBy={`admin-plan-editor-${editorId}-title`}>{dismiss => <PlanEditor busy={state.busy} record={record} onSave={state.save} onClose={dismiss} />}</EditorModal>}
    <View {...elementProps(`native-admin-plans-filters`)} style={styles.filters}>
      <View {...elementProps(`native-admin-plans-search-wrap`)} style={styles.search}>
        <Search size={15} color={palette.muted} {...elementProps(`native-admin-plans-search-icon`)} />
        <TextInput value={state.search} style={styles.searchInput} onChangeText={state.setSearch} placeholder={`Search plans`} placeholderTextColor={palette.muted} accessibilityLabel={`Search Plans On This Page`} {...elementProps(`native-admin-plans-search`)} />
      </View>
      <View {...elementProps(`native-admin-plans-filter-choices`)} accessibilityRole={`radiogroup`} accessibilityLabel={`Filter Plans By Status`} style={styles.filterChoices}>
        {[[`all`, `All Statuses`], [`active`, `Active`], [`inactive`, `Inactive`]].map(([value, label]) => <Pressable key={value} onPress={() => state.setFilter(value)} accessibilityRole={`radio`} accessibilityState={{ checked: state.filter === value }} style={[styles.filter, state.filter === value && styles.selected]} {...elementProps(`native-admin-plans-filter`, value)}><Text style={styles.filterLabel} {...elementProps(`native-admin-plans-filter-label`, value)}>{label}</Text></Pressable>)}
      </View>
      <Pressable onPress={() => state.edit(`new`)} disabled={state.busy || !!state.page.error} accessibilityRole={`button`} accessibilityState={{ disabled: state.busy || !!state.page.error }} style={[styles.add, (state.busy || !!state.page.error) && styles.disabled]} {...elementProps(`native-admin-plans-add`)}>
        <Plus size={14} color={palette.contrast} {...elementProps(`native-admin-plans-add-icon`)} />
        <Text style={styles.addLabel} {...elementProps(`native-admin-plans-add-label`)}>{`Add Plan`}</Text>
      </Pressable>
    </View>
    <View {...elementProps(`native-admin-plans-table-wrap`)} style={styles.tableWrap}>
      <ScrollView horizontal keyboardShouldPersistTaps={`handled`} {...elementProps(`native-admin-plans-table-scroll`)}>
        <View {...elementProps(`native-admin-plans-table`)} style={styles.table}>
          <View {...elementProps(`native-admin-plans-table-head`)} style={styles.tableHead}>{columns.map((label, index) => <Text key={label} style={[styles.column, { width: planColumns[index] }]} {...elementProps(`native-admin-plans-column`, `${index}`)}>{label}</Text>)}</View>
          {state.page.loading ? <View style={styles.loading} {...elementProps(`native-admin-plans-loading`)}><ActivityIndicator color={palette.accent} {...elementProps(`native-admin-plans-loading-spinner`)} /><Text style={styles.note} {...elementProps(`native-admin-plans-loading-label`)}>{`Loading Realtime Plans`}</Text></View> : state.matchingRecords.length ? state.matchingRecords.map(item => <PlanRow key={item.id} busy={state.busy} record={item} score={state.scores.score(item.id)} scoreLoading={state.scores.loading} saving={state.pendingId === item.id} onEdit={state.edit} onArchive={state.archive} onStatus={state.changeStatus} onRequestArchive={state.requestArchive} confirming={state.archivingId === item.id} onCancelArchive={state.cancelArchive} />) : <Text style={styles.empty} {...elementProps(`native-admin-plans-empty`)}>{state.page.error ? `Plan Records Unavailable` : state.records.length ? `No plans match these filters.` : `No plans saved yet. Add a plan to get started.`}</Text>}
        </View>
      </ScrollView>
    </View>
    <View {...elementProps(`native-admin-plans-pagination`)} style={styles.pagination}>
      <Text {...elementProps(`native-admin-plans-pagination-label`)} style={styles.note}>{`Page ${state.page.page} · ${state.matchingRecords.length} Matching Plan(s) In This Realtime Page`}</Text>
      <View {...elementProps(`native-admin-plans-pagination-controls`)} style={styles.paginationControls}>
        {[
          { id: `previous`, label: `Previous`, Icon: ArrowLeft, action: state.page.previousPage, disabled: state.busy || !state.page.hasPrevious },
          { id: `next`, label: `Next`, Icon: ArrowRight, action: state.page.nextPage, disabled: state.busy || !state.page.hasNext },
          { id: `latest`, label: `Latest`, Icon: RotateCcw, action: state.refresh, disabled: state.busy },
        ].map(({ id, label, Icon, action, disabled }) => <Pressable key={id} onPress={action} disabled={disabled} accessibilityRole={`button`} accessibilityState={{ disabled }} style={[styles.pageButton, disabled && styles.disabled]} {...elementProps(`native-admin-plans-page-button`, id)}><Icon size={11} color={palette.accent} {...elementProps(`native-admin-plans-page-icon`, id)} /><Text style={styles.pageLabel} {...elementProps(`native-admin-plans-page-label`, id)}>{label}</Text></Pressable>)}
      </View>
    </View>
  </View>;
};

export default AdminPlans;
