import { Link } from 'expo-router';
import TrendChart from '../AdminCharts';
import { useMemo, useState } from 'react';
import { routes } from '../../shared/routes';
import { exportReport } from './exportReport';
import { createStyles } from './styles.native';
import { Text, View, Pressable } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { useAuth } from '../../shared/authContext/useAuth';
import type { TrafficOutcomes, TrafficSegment } from './data';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useTrafficAnalytics } from '../../shared/analytics/useTrafficAnalytics';
import TrafficSegmentIcon from './traffic-segment-icon/traffic-segment-icon.native';
import type { TrafficPeriod, AnalyticsBreakdown } from '../../shared/analytics/types';
import { AdminPanel, AdminStats, StatusCell, AdminButton, AdminLoading } from '../AdminWidgets';
import { getTrafficSegmentIdentity } from './traffic-segment-icon/traffic-segment-identity.native';
import { Globe2, Users, Eye, RotateCcw, Download, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react-native';

const formatCount = (value: number) => new Intl.NumberFormat().format(value);
const comparison = (current: number, previous: number) => previous > 0 ? `${current >= previous ? `+` : ``}${((current - previous) / previous * 100).toFixed(1)}% Vs Previous Period` : current > 0 ? `No Previous Traffic To Compare` : `No Traffic In Either Period`;
const dateLabel = (value: string) => new Date(value).toLocaleDateString(undefined, { day: `numeric`, month: `short`, timeZone: `UTC` });

const TrafficBreakdown = ({ id, title, rows, segment }: { id: string; title: string; segment: TrafficSegment; rows: AnalyticsBreakdown[] }) => {
  const { palette } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const deviceColors: Record<string, string> = { tablet: palette.warning, mobile: palette.accent, desktop: palette.muted, unknown: palette.line };
  const ExpandIcon = expanded ? ChevronUp : ChevronDown;
  return <AdminPanel id={id} title={title} note={`Visitors / Page Views · Provider Ranking`}>
    {rows.length ? rows.slice(0, expanded ? rows.length : 6).map((row, index) => {
      const identity = getTrafficSegmentIdentity(segment, row.value);
      const rowId = `${id}-${index}`;
      return <View key={`${row.value}-${index}`} {...elementProps(`admin-analytics-breakdown-row`, rowId)} style={styles.row}>
        <View {...elementProps(`admin-analytics-breakdown-identity`, rowId)} style={styles.identity}>
          <TrafficSegmentIcon key={`${segment}:${row.value}`} id={`admin-analytics-breakdown-icon-${rowId}`} identity={identity} color={segment === `device` ? deviceColors[row.value.trim().toLowerCase()] ?? deviceColors.unknown : undefined} />
          <View {...elementProps(`admin-analytics-breakdown-copy`, rowId)} style={styles.rowCopy}>
            <Text {...elementProps(`admin-analytics-breakdown-label`, rowId)} style={styles.rowLabel} selectable>{identity.label}</Text>
            {!!identity.caption && <Text {...elementProps(`admin-analytics-breakdown-caption`, rowId)} style={styles.rowCaption} numberOfLines={1} selectable>{identity.caption}</Text>}
          </View>
        </View>
        <View {...elementProps(`admin-analytics-breakdown-values`, rowId)} style={styles.values}><Text {...elementProps(`admin-analytics-breakdown-count`, rowId)} style={styles.label}>{`${formatCount(row.visitors)} / ${formatCount(row.pageviews)}`}</Text></View>
      </View>;
    }) : <Text {...elementProps(`admin-analytics-breakdown-empty`, id)} style={styles.copy}>{`No Traffic In This Range`}</Text>}
    {rows.length > 6 && <Pressable onPress={() => setExpanded(current => !current)} accessibilityRole={`button`} accessibilityState={{ expanded }} {...elementProps(`admin-analytics-breakdown-expand`, id)} style={styles.expand}>
      <ExpandIcon size={13} color={palette.accent} {...elementProps(`admin-analytics-breakdown-expand-icon`, id)} />
      <Text {...elementProps(`admin-analytics-breakdown-expand-label`, id)} style={styles.expandLabel}>{expanded ? `Show Less` : `Show ${formatCount(rows.length)} Results`}</Text>
    </Pressable>}
  </AdminPanel>;
};

const AdminAnalytics = ({ compact = false }: { compact?: boolean; outcomes?: TrafficOutcomes; outcomesLoading?: boolean; headingActionsTarget?: HTMLElement | null }) => {
  const { user } = useAuth();
  const state = useTrafficAnalytics(user);
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [exportError, setExportError] = useState(``);
  const report = state.report;
  const points = useMemo(() => report?.trend.map(point => ({ label: dateLabel(point.date), value: point.visitors, secondary: point.pageviews })) ?? [], [report]);
  const saveReport = async () => {
    if (!report) return;
    setExportError(``);
    try { await exportReport(`domains-database-traffic-${report.filters.from}-${report.filters.to}`, report); }
    catch { setExportError(`Report Could Not Be Exported`); }
  };
  return <View {...elementProps(`admin-analytics`, compact ? `preview` : `full`)} style={styles.root}>
    <View {...elementProps(`admin-analytics-toolbar`)} style={styles.toolbar}>
      {compact ? <Text {...elementProps(`admin-analytics-preview-title`)} style={styles.title} accessibilityRole={`header`}>{`Traffic`}</Text> : <View {...elementProps(`admin-analytics-periods`)} style={styles.periods}>
        {([7, 30, 90] as TrafficPeriod[]).map(period => <Pressable key={period} {...elementProps(`admin-analytics-period`, String(period))} style={[styles.period, state.period === period && styles.selected]} accessibilityRole={`button`} accessibilityState={{ selected: state.period === period }} onPress={() => { setExportError(``); state.setPeriod(period); }}><Text {...elementProps(`admin-analytics-period-label`, String(period))} style={styles.label}>{`${period} Days`}</Text></Pressable>)}
      </View>}
      <View {...elementProps(`admin-analytics-actions`)} style={styles.periods}>
        {report ? <StatusCell id={`traffic-source`} label={`Vercel Web Analytics`} /> : null}
        <AdminButton id={`traffic-refresh`} Icon={RotateCcw} label={`Refresh`} disabled={state.loading} onPress={state.refresh} />
        {!compact ? <AdminButton id={`traffic-export`} Icon={Download} label={`Export JSON`} disabled={state.loading || !report} onPress={() => { void saveReport(); }} /> : null}
      </View>
    </View>
    {state.error ? <AdminPanel id={`traffic-unavailable`} title={state.error.code.includes(`configured`) || state.error.code.includes(`configuration`) ? `Connect Website Analytics` : `Website Analytics Unavailable`}>
      <Text {...elementProps(`admin-analytics-error`)} style={styles.error} accessibilityRole={`alert`}>{state.error.message}</Text>
      <Text {...elementProps(`admin-analytics-connection-note`)} style={styles.copy}>{`Reporting Uses The Project's Server Connection And Your Admin Session`}</Text>
    </AdminPanel> : null}
    {exportError ? <Text {...elementProps(`admin-analytics-export-error`)} style={styles.error} accessibilityRole={`alert`}>{exportError}</Text> : null}
    {state.loading ? <AdminLoading id={`traffic`} label={`Loading Vercel Traffic`} /> : null}
    {report ? <>
      <AdminStats id={`traffic`} stats={[
        { id: `visitors`, Icon: Users, label: `Visitors`, value: formatCount(report.current.visitors), hint: comparison(report.current.visitors, report.previous.visitors) },
        { id: `views`, Icon: Eye, label: `Page Views`, value: formatCount(report.current.pageviews), hint: comparison(report.current.pageviews, report.previous.pageviews) },
        ...(!compact ? [{ id: `previous-visitors`, label: `Previous Visitors`, value: formatCount(report.previous.visitors) }, { id: `previous-views`, label: `Previous Page Views`, value: formatCount(report.previous.pageviews) }] : []),
      ]} />
      <AdminPanel id={`traffic-trend`} title={`Traffic Over Time`} note={`${dateLabel(report.filters.from)} – ${dateLabel(report.filters.to)} · UTC · Anonymous Visitors Reset Daily`}><TrendChart id={`website-traffic`} points={points} label={`Visitors`} secondaryLabel={`Page Views`} /></AdminPanel>
      {!compact ? <>
        <View {...elementProps(`admin-analytics-columns`, `acquisition`)} style={styles.columns}>
          <View {...elementProps(`admin-analytics-column`, `pages`)} style={styles.column}><TrafficBreakdown id={`traffic-pages`} title={`Top Pages`} segment={`path`} rows={report.pages} /></View>
          <View {...elementProps(`admin-analytics-column`, `referrers`)} style={styles.column}><TrafficBreakdown id={`traffic-referrers`} title={`Referrers`} segment={`referrer`} rows={report.referrers} /></View>
        </View>
        <View {...elementProps(`admin-analytics-columns`, `audience`)} style={styles.columns}>
          <View {...elementProps(`admin-analytics-column`, `countries`)} style={styles.column}><TrafficBreakdown id={`traffic-countries`} title={`Countries`} segment={`country`} rows={report.countries} /></View>
          <View {...elementProps(`admin-analytics-column`, `devices`)} style={styles.column}><TrafficBreakdown id={`traffic-devices`} title={`Devices`} segment={`device`} rows={report.devices} /></View>
        </View>
      </> : null}
      {compact && <TrafficBreakdown id={`traffic-preview-countries`} title={`Countries`} segment={`country`} rows={report.countries} />}
      <Text {...elementProps(`admin-analytics-freshness`)} style={styles.copy}>{`Fetched ${new Date(report.fetchedAt).toLocaleString()} · Cached Until ${new Date(report.cacheExpiresAt).toLocaleTimeString()} · Refresh May Reuse The Current Cache`}</Text>
    </> : null}
    {compact ? <Link href={routes.adminAnalytics.href} asChild><Pressable {...elementProps(`admin-analytics-link`)} style={styles.link}><Globe2 {...elementProps(`admin-analytics-link-icon`)} size={14} color={palette.accent} /><Text {...elementProps(`admin-analytics-link-label`)} style={styles.linkText}>{`Open Website Analytics`}</Text><ArrowRight {...elementProps(`admin-analytics-link-arrow`)} size={14} color={palette.accent} /></Pressable></Link> : null}
  </View>;
};

export default AdminAnalytics;
