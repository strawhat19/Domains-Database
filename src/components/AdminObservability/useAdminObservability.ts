import { createStyles } from './styles.native';
import type { ChartPoint } from '../AdminCharts';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../shared/authContext/useAuth';
import { useTheme } from '../../shared/themeContext/useTheme';
import type { ObservabilityMetric } from '../../shared/analytics/types';
import { useObservability } from '../../shared/analytics/useObservability';
import { exportReport as saveReport } from '../AdminAnalytics/exportReport';
import { runtimeViews, runtimeMetrics, hasMeasurement, formatRuntimeTime, type RuntimeView } from './data';

export const useAdminObservability = () => {
  const { user } = useAuth();
  const { palette } = useTheme();
  const state = useObservability(user);
  const [search, setSearch] = useState(``);
  const [notesOpen, setNotesOpen] = useState(false);
  const [view, setView] = useState<RuntimeView>(`requests`);
  const [metric, setMetric] = useState<ObservabilityMetric>(`requests`);
  const [presentation, setPresentation] = useState<`chart` | `list`>(`chart`);
  const [exportError, setExportError] = useState<string | null>(null);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const currentReport = state.report?.period === state.period ? state.report : null;
  const activeView = runtimeViews.find(item => item.key === view) ?? runtimeViews[0]!;
  const definition = runtimeMetrics[metric];
  const ranking = activeView.ranking;
  const rows = ranking ? (currentReport?.[ranking] ?? []).filter(row => row.value.toLowerCase().includes(search.trim().toLowerCase())) : [];
  const points: ChartPoint[] = currentReport?.trend?.flatMap(point => {
    const value = point?.values?.[metric];
    return hasMeasurement(value) ? [{ value, label: formatRuntimeTime(point.timestamp, state.period, true) }] : [];
  }) ?? [];
  const missingPoints = (currentReport?.trend?.length ?? 0) - points.length;
  const measurements = currentReport ? Object.values(currentReport.totals).filter(hasMeasurement) : [];
  const isEmpty = measurements.length > 0 && measurements.every(value => value === 0);
  const selectView = (nextView: RuntimeView) => {
    const next = runtimeViews.find(item => item.key === nextView);
    if (!next) return;
    setSearch(``);
    setView(nextView);
    setMetric(current => next.metrics.includes(current) ? current : next.metrics[0] ?? `requests`);
  };
  useEffect(() => setExportError(null), [user?.id, state.period]);
  const exportReport = async () => {
    if (!currentReport) return;
    setExportError(null);
    try {
      await saveReport(`domains-database-runtime-${currentReport.period}h-${currentReport.fetchedAt.slice(0, 10)}`, currentReport);
    } catch (failure) {
      setExportError(failure instanceof Error ? failure.message : `Report Export Failed`);
    }
  };
  return {
    ...state, rows, view, metric, points, styles, search, palette, ranking, isEmpty, notesOpen,
    definition, activeView, exportError, missingPoints, currentReport, selectView, setSearch,
    setMetric, exportReport, setNotesOpen, presentation, setPresentation,
  };
};
