import { Link } from 'expo-router';
import TrendChart from '../AdminCharts';
import { elementProps } from '../../shared/elementProps';
import { useAdminObservability } from './useAdminObservability';
import { Text, View, Pressable, TextInput, ScrollView } from 'react-native';
import type { ObservabilityMetric, ObservabilityRow } from '../../shared/analytics/types';
import { AdminPanel, AdminStats, StatusCell, AdminButton, AdminLoading } from '../AdminWidgets';
import { Cpu, List, Download, BarChart3, ArrowRight, RefreshCw, CalendarDays, CircleAlert, Info } from 'lucide-react-native';
import { runtimeViews, runtimeMetrics, compactMetrics, compactTrends, reportingPeriods, hasMeasurement, formatRuntimeTime, formatRuntimeValue, formatRuntimeBucket } from './data';

type RuntimeState = ReturnType<typeof useAdminObservability>;

const RuntimeRanking = ({ id, rows, state }: { id: string; rows: ObservabilityRow[]; state: RuntimeState }) => {
  const { styles, metric, presentation } = state;
  const maximum = Math.max(1, ...rows.flatMap(row => {
    const value = row?.values?.[metric];
    return hasMeasurement(value) ? [value] : [];
  }));
  return <View {...elementProps(`admin-runtime-ranking`, id)} style={styles.rows}>
    {rows.length ? <ScrollView {...elementProps(`admin-runtime-ranking-scroll`, id)} style={styles.table} nestedScrollEnabled>
      {rows.map((row, index) => {
        const value = row?.values?.[metric];
        const label = row.value || `Unknown`;
        return <View key={`${row.value}-${index}`} {...elementProps(`admin-runtime-row`, `${id}-${index}`)} style={styles.row}>
          <View {...elementProps(`admin-runtime-row-heading`, `${id}-${index}`)} style={styles.rowHeading}>
            <Text {...elementProps(`admin-runtime-row-label`, `${id}-${index}`)} style={styles.rowLabel} selectable>{label}</Text>
            <Text {...elementProps(`admin-runtime-row-value`, `${id}-${index}`)} style={styles.rowValue} accessibilityLabel={`${label}: ${formatRuntimeValue(metric, value)}`}>{formatRuntimeValue(metric, value)}</Text>
          </View>
          {presentation === `chart` && hasMeasurement(value) ? <View {...elementProps(`admin-runtime-track`, `${id}-${index}`)} style={styles.track}>
            <View {...elementProps(`admin-runtime-bar`, `${id}-${index}`)} style={[styles.bar, { width: `${Math.min(100, Math.max(0, value / maximum * 100))}%` }]} />
          </View> : null}
        </View>;
      })}
    </ScrollView> : <Text {...elementProps(`admin-runtime-ranking-empty`, id)} style={styles.muted}>{state.search.trim() ? `No Matching Rows` : `No Breakdown Measurements For This Period`}</Text>}
    <Text {...elementProps(`admin-runtime-ranking-note`, id)} style={styles.small}>{presentation === `chart` ? `Bars Compare Available Measurements To The Highest Row · — Means Unavailable` : `Provider Ranking · — Means Unavailable`}</Text>
  </View>;
};

const RuntimeTrend = ({ id, state }: { id: string; state: RuntimeState }) => {
  const { styles, currentReport, definition, points, presentation, metric, period } = state;
  if (!currentReport) return null;
  return <View {...elementProps(`admin-runtime-trend`, id)} style={styles.section}>
    {presentation === `chart` ? points.length ? <TrendChart id={id} points={points} label={`${definition.label} (${definition.unit})`} /> : <View {...elementProps(`admin-runtime-trend-empty`, id)} style={styles.empty}><Text {...elementProps(`admin-runtime-trend-empty-text`, id)} style={styles.muted}>{`No Measurements For This Metric In This Period`}</Text></View> : <ScrollView {...elementProps(`admin-runtime-buckets`, id)} style={styles.table} nestedScrollEnabled>
      <View {...elementProps(`admin-runtime-table-heading`, id)} style={styles.tableHeader}>
        <Text {...elementProps(`admin-runtime-time-column`, id)} style={styles.label}>{`Time · UTC`}</Text>
        <Text {...elementProps(`admin-runtime-metric-column`, id)} style={styles.label}>{definition.label}</Text>
      </View>
      {currentReport.trend.map((point, index) => <View key={point.timestamp} {...elementProps(`admin-runtime-bucket`, `${id}-${index}`)} style={styles.tableRow}>
        <Text {...elementProps(`admin-runtime-bucket-time`, `${id}-${index}`)} style={styles.rowLabel}>{formatRuntimeTime(point.timestamp, period)}</Text>
        <Text {...elementProps(`admin-runtime-row-value`, `${id}-bucket-${index}`)} style={styles.rowValue}>{formatRuntimeValue(metric, point?.values?.[metric])}</Text>
      </View>)}
      {!currentReport.trend.length ? <Text {...elementProps(`admin-runtime-buckets-empty`, id)} style={styles.muted}>{`No Measurements For This Period`}</Text> : null}
    </ScrollView>}
    <Text {...elementProps(`admin-runtime-measurement-note`, id)} style={styles.small}>{`${formatRuntimeBucket(currentReport.bucketSeconds)} · UTC${state.missingPoints ? ` · ${state.missingPoints} Unavailable Bucket(s) Excluded From Chart` : ``}`}</Text>
  </View>;
};

const RuntimeChoice = ({ id, label, selected, disabled, onPress, Icon, state }: {
  id: string; label: string; selected: boolean; disabled?: boolean; onPress: () => void;
  Icon?: typeof Cpu; state: RuntimeState;
}) => <Pressable
  {...elementProps(`admin-runtime-choice`, id)}
  disabled={disabled}
  onPress={onPress}
  accessibilityRole={`button`}
  accessibilityLabel={label}
  accessibilityState={{ selected, disabled: !!disabled }}
  style={[state.styles.choice, selected && state.styles.selected, disabled && state.styles.disabled]}
>
  {Icon ? <Icon {...elementProps(`admin-runtime-choice-icon`, id)} size={13} color={selected ? state.palette.accent : state.palette.muted} /> : null}
  <Text {...elementProps(`admin-runtime-choice-label`, id)} style={state.styles.label}>{label}</Text>
</Pressable>;

const AdminObservability = ({ compact = false }: { compact?: boolean; headingActionsTarget?: HTMLElement | null }) => {
  const state = useAdminObservability();
  const { period, loading, error, palette, styles, metric, view, definition, currentReport: report } = state;
  const id = compact ? `runtime-preview` : `runtime-full`;
  const metrics = compact ? compactMetrics : Object.keys(runtimeMetrics) as ObservabilityMetric[];
  const options = compact ? compactTrends : state.activeView.metrics;
  const setupError = error?.code.includes(`configured`) || error?.code.includes(`configuration`);
  const plusError = error?.code === `observability_plus_required`;
  const errorTitle = plusError ? `Observability Plus Required` : setupError ? `Connect Vercel Observability` : `Runtime Health Unavailable`;
  return <View {...elementProps(`admin-runtime`, id)} style={styles.root}>
    <View {...elementProps(`admin-runtime-toolbar`, id)} style={styles.toolbar}>
      <View {...elementProps(`admin-runtime-heading`, id)} style={styles.source}><Cpu {...elementProps(`admin-runtime-heading-icon`, id)} size={17} color={palette.accent} /><Text {...elementProps(`admin-runtime-title`, id)} style={styles.title} accessibilityRole={`header`}>{`Runtime Health`}</Text>{report ? <StatusCell id={`${id}-source`} label={`Vercel Observability`} /> : null}</View>
      <View {...elementProps(`admin-runtime-actions`, id)} style={styles.controls}>
        <AdminButton id={`${id}-refresh`} Icon={RefreshCw} label={`Refresh`} disabled={loading} onPress={state.refresh} />
        {!compact ? <AdminButton id={`${id}-export`} Icon={Download} label={`Export JSON`} disabled={loading || !report} onPress={() => { void state.exportReport(); }} /> : null}
      </View>
    </View>
    <View {...elementProps(`admin-runtime-periods`, id)} style={styles.controls} accessibilityLabel={`Runtime Reporting Period`}>
      {reportingPeriods.map(item => <RuntimeChoice key={item.value} state={state} Icon={CalendarDays} id={`${id}-period-${item.value}`} label={item.label} selected={period === item.value} disabled={loading} onPress={() => state.setPeriod(item.value)} />)}
    </View>
    {error ? <View {...elementProps(`admin-runtime-error`, id)} style={styles.error}>
      <View {...elementProps(`admin-runtime-error-heading`, id)} style={styles.source}><CircleAlert {...elementProps(`admin-runtime-error-icon`, id)} size={17} color={palette.danger} /><Text {...elementProps(`admin-runtime-error-title`, id)} style={styles.title}>{errorTitle}</Text></View>
      <Text {...elementProps(`admin-runtime-error-message`, id)} style={styles.errorText} accessibilityRole={`alert`}>{error.message}</Text>
      <Text {...elementProps(`admin-runtime-connection-note`, id)} style={styles.muted}>{`Reporting Uses The Project's Server Connection And Your Admin Session`}</Text>
      <View {...elementProps(`admin-runtime-error-actions`, id)} style={styles.controls}><AdminButton id={`${id}-retry`} Icon={RefreshCw} label={`Retry`} disabled={loading} onPress={state.refresh} /></View>
    </View> : null}
    {state.exportError ? <Text {...elementProps(`admin-runtime-export-error`, id)} style={styles.errorText} accessibilityRole={`alert`}>{state.exportError}</Text> : null}
    {loading ? <><AdminStats id={`${id}-loading`} loading stats={metrics.map(key => ({ id: key, label: runtimeMetrics[key].label, Icon: runtimeMetrics[key].Icon, value: `—` }))} /><AdminLoading id={id} label={`Loading Vercel Runtime Health`} /></> : null}
    {report ? <>
      <AdminStats id={id} stats={metrics.map(key => ({ id: key, label: runtimeMetrics[key].label, Icon: runtimeMetrics[key].Icon, hint: runtimeMetrics[key].hint, value: formatRuntimeValue(key, report.totals?.[key]) }))} />
      <AdminPanel id={`${id}-measurements`} title={compact ? `Runtime Over Time` : `Runtime Measurements`} note={`${formatRuntimeTime(report.start, period)} – ${formatRuntimeTime(report.end, period)} · — Means The Provider Has No Available Measurement`}>
        {!compact ? <View {...elementProps(`admin-runtime-views`, id)} style={styles.controls} accessibilityLabel={`Runtime Health Views`}>
          {runtimeViews.map(item => <RuntimeChoice key={item.key} id={`${id}-view-${item.key}`} state={state} Icon={item.Icon} label={item.label} selected={view === item.key} onPress={() => state.selectView(item.key)} />)}
        </View> : null}
        <View {...elementProps(`admin-runtime-metric-toolbar`, id)} style={styles.toolbar}>
          <View {...elementProps(`admin-runtime-metric-options`, id)} style={styles.controls} accessibilityLabel={`Runtime Metric`}>
            {options.map(key => <RuntimeChoice key={key} id={`${id}-metric-${key}`} state={state} Icon={runtimeMetrics[key].Icon} label={runtimeMetrics[key].label} selected={metric === key} onPress={() => state.setMetric(key)} />)}
          </View>
          {!compact ? <View {...elementProps(`admin-runtime-presentation`, id)} style={styles.controls}>
            <RuntimeChoice id={`${id}-chart`} state={state} Icon={BarChart3} label={state.ranking ? `Bars` : `Chart`} selected={state.presentation === `chart`} onPress={() => state.setPresentation(`chart`)} />
            <RuntimeChoice id={`${id}-list`} state={state} Icon={List} label={`List`} selected={state.presentation === `list`} onPress={() => state.setPresentation(`list`)} />
          </View> : null}
        </View>
        {report.warnings.length ? <View {...elementProps(`admin-runtime-notes`, id)} style={styles.notice}>
          <Pressable {...elementProps(`admin-runtime-choice`, `${id}-notes`)} style={styles.source} accessibilityRole={`button`} accessibilityState={{ expanded: state.notesOpen }} onPress={() => state.setNotesOpen(value => !value)}>
            <Info {...elementProps(`admin-runtime-notes-icon`, id)} size={14} color={palette.warning} /><Text {...elementProps(`admin-runtime-notes-label`, id)} style={styles.label}>{`Report Notes (${report.warnings.length})`}</Text>
          </Pressable>
          {state.notesOpen ? report.warnings.map((warning, index) => <Text key={`${index}-${warning}`} {...elementProps(`admin-runtime-note`, `${id}-${index}`)} style={styles.muted}>{warning}</Text>) : null}
        </View> : null}
        {state.isEmpty ? <Text {...elementProps(`admin-runtime-empty`, id)} style={styles.muted}>{`No Recorded Runtime Activity In This Period`}</Text> : null}
        <View {...elementProps(`admin-runtime-view-heading`, id)} style={styles.heading}>
          <Text {...elementProps(`admin-runtime-view-title`, id)} style={styles.title}>{`${state.ranking ? `${state.activeView.label} · ` : ``}${definition.label}`}</Text>
          {!compact && state.ranking ? <TextInput
            value={state.search}
            onChangeText={state.setSearch}
            style={styles.search}
            autoCapitalize={`none`}
            placeholderTextColor={palette.placeholder}
            {...elementProps(`admin-runtime-search`, id)}
            accessibilityLabel={`Search ${state.activeView.label}`}
            placeholder={`Search ${state.activeView.label}`}
          /> : null}
        </View>
        <Text {...elementProps(`admin-runtime-metric-description`, id)} style={styles.small}>{definition.hint}</Text>
        {!compact && state.ranking ? <RuntimeRanking id={`${id}-${state.ranking}`} rows={state.rows} state={state} /> : <RuntimeTrend id={`${id}-${metric}`} state={state} />}
      </AdminPanel>
      <View {...elementProps(`admin-runtime-freshness`, id)} style={styles.footer}>
        <Text {...elementProps(`admin-runtime-fetched-time`, id)} style={styles.small}>{`Fetched ${formatRuntimeTime(report.fetchedAt, period)} · Cached Until ${formatRuntimeTime(report.cacheExpiresAt, period)}`}</Text>
        <Text {...elementProps(`admin-runtime-cache-note`, id)} style={styles.small}>{`Refresh May Reuse The Current Provider Cache`}</Text>
      </View>
    </> : null}
    {!loading && !error && !report ? <Text {...elementProps(`admin-runtime-unavailable`, id)} style={styles.muted}>{`Runtime Reporting Is Unavailable For This Account`}</Text> : null}
    {compact ? <Link {...elementProps(`admin-runtime-link-target`, id)} href={`/admin/observability`} asChild><Pressable {...elementProps(`admin-runtime-link`, id)} style={styles.link}>
      <Cpu {...elementProps(`admin-runtime-link-icon`, id)} size={14} color={palette.accent} /><Text {...elementProps(`admin-runtime-link-label`, id)} style={styles.linkText}>{`Open Runtime Health`}</Text><ArrowRight {...elementProps(`admin-runtime-link-arrow`, id)} size={14} color={palette.accent} />
    </Pressable></Link> : null}
  </View>;
};

export default AdminObservability;
