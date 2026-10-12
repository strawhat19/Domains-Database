'use client';

import './styles.scss';
import { createPortal } from 'react-dom';
import AdminSkeleton from '../AdminAnalytics/Skeleton';
import { useAuth } from '../../shared/authContext/useAuth';
import { useRef, useState, type KeyboardEvent } from 'react';
import { useObservability } from '../../shared/analytics/useObservability';
import ObservabilityTrend from './observability-trend/observability-trend';
import ObservabilityRanking from './observability-ranking/observability-ranking';
import type { ObservabilityMetric, ObservabilityPeriod } from '../../shared/analytics/types';
import { Cpu, List, Info, Search, Download, BarChart3, ChevronDown, RefreshCw, AlertCircle, ArrowUpRight, CalendarDays } from 'lucide-react';
import { observabilityViews, observabilityMetrics, formatObservabilityValue, formatObservabilityBucket, formatObservabilityTimestamp, hasObservabilityValue, type ObservabilityView } from './data.web';

type ObservabilityPanelProps = { compact?: boolean; headingActionsTarget?: HTMLElement | null };
const reportingPeriods: { value: ObservabilityPeriod; label: string }[] = [{ value: 24, label: `24 Hours` }, { value: 168, label: `7 Days` }, { value: 720, label: `30 Days` }];
const compactMetrics: ObservabilityMetric[] = [`requests`, `invocations`, `cpuMs`, `errors`];
const allMetrics = Object.keys(observabilityMetrics) as ObservabilityMetric[];

const ObservabilityPanel = ({ compact = false, headingActionsTarget }: ObservabilityPanelProps) => {
  const { error, report, period, loading, refresh, setPeriod } = useObservability(useAuth().user);
  const [search, setSearch] = useState(``);
  const [view, setView] = useState<ObservabilityView>(`compute`);
  const [metric, setMetric] = useState<ObservabilityMetric>(`cpuMs`);
  const [presentation, setPresentation] = useState<`chart` | `list`>(`chart`);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = compact ? `dd-observability-overview` : `dd-observability-analytics`;
  const activeView = observabilityViews.find(({ key }) => key === view) ?? observabilityViews[0];
  const currentReport = report?.period === period ? report : null;
  const ranking = activeView.ranking;
  const rows = ranking ? (currentReport?.[ranking] ?? []).filter((row) => row.value.toLowerCase().includes(search.trim().toLowerCase())) : [];
  const metricDefinition = observabilityMetrics[metric];
  const periodLabel = reportingPeriods.find(({ value }) => value === period)?.label ?? `24 Hours`;
  const totals = currentReport ? Object.values(currentReport.totals).filter(hasObservabilityValue) : [];
  const isEmpty = currentReport && totals.length > 0 && totals.every((value) => value === 0);
  const isPlusError = error?.code === `observability_plus_required`;
  const isSetupError = error?.code === `observability_not_configured`;
  const selectView = (key: ObservabilityView) => {
    const next = observabilityViews.find((item) => item.key === key);
    if (!next) return;
    setView(key);
    setSearch(``);
    setMetric((value) => next.metrics.includes(value) ? value : next.metrics?.[0] ?? `cpuMs`);
  };
  const inspectMetric = (value: ObservabilityMetric) => {
    const next = observabilityViews.find((item) => !item.ranking && item.metrics.includes(value));
    if (next) selectView(next.key);
    setMetric(value);
  };
  const moveTab = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === `Home` ? 0 : event.key === `End` ? observabilityViews.length - 1 : event.key === `ArrowRight` ? (index + 1) % observabilityViews.length : event.key === `ArrowLeft` ? (index + observabilityViews.length - 1) % observabilityViews.length : null;
    if (next === null) return;
    event.preventDefault();
    const nextView = observabilityViews?.[next];
    if (nextView) selectView(nextView.key);
    tabRefs.current?.[next]?.focus();
  };
  const exportReport = () => {
    if (!currentReport) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(currentReport, null, 2)], { type: `application/json` }));
    const link = document.createElement(`a`);
    link.href = url;
    link.download = `domains-database-runtime-${currentReport.period}h-${currentReport.fetchedAt.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const actions = <div id={`${id}-actions`} className={`dd-observability-actions`}>
    <button type={`button`} disabled={!currentReport || loading} onClick={exportReport} id={`${id}-export`} className={`dd-observability-button${compact ? ` is-icon` : ``}`} aria-label={`Export Health JSON`} title={`Export Health JSON`}><Download className={`dd-report-icon`} size={13} aria-hidden={`true`} />{!compact && `Export JSON`}</button>
    <button type={`button`} disabled={loading} onClick={refresh} id={`${id}-refresh`} className={`dd-observability-button${compact ? ` is-icon` : ``}`} aria-label={`Refresh Health`} title={`Refresh Health · Reports Cached Up To 5 Minutes${currentReport ? ` · Updated ${formatObservabilityTimestamp(currentReport.fetchedAt, period)}` : ``}`}><RefreshCw size={13} aria-hidden={`true`} className={loading ? `is-spinning` : undefined} />{!compact && `Refresh`}</button>
  </div>;

  return <section id={id} className={`dd-observability-panel${compact ? ` is-compact` : ``}${!ranking && presentation === `chart` ? ` is-trend` : ``}`} aria-labelledby={`${id}-title`} aria-busy={loading}>
    <div id={`${id}-heading`} className={`dd-observability-heading`}><h2 id={`${id}-title`} className={`dd-observability-title`}><Cpu className={`dd-report-icon`} size={19} aria-hidden={`true`} />Health</h2>{!compact && headingActionsTarget ? createPortal(actions, headingActionsTarget) : actions}</div>
    <div id={`${id}-tabs`} className={`dd-observability-tabs`} role={`tablist`} aria-label={`Health Views`}>
      {observabilityViews.map(({ key, label, icon: Icon }, index) => <button key={key} type={`button`} role={`tab`} tabIndex={view === key ? 0 : -1} aria-selected={view === key} aria-controls={`${id}-panel`} id={`${id}-tab-${key}`} className={`dd-observability-tab${view === key ? ` is-active` : ``}`} ref={(element) => { tabRefs.current[index] = element; }} onClick={() => selectView(key)} onKeyDown={(event) => moveTab(event, index)}><Icon className={`dd-report-icon`} size={12} aria-hidden={`true`} />{label}</button>)}
    </div>
    <div id={`${id}-toolbar`} className={`dd-observability-toolbar`}>
      <div id={`${id}-periods`} className={`dd-observability-segmented`} role={`group`} aria-label={`Runtime Reporting Period`}>{reportingPeriods.map(({ value, label }) => <button key={value} type={`button`} disabled={loading} aria-pressed={period === value} id={`${id}-period-${value}`} className={`dd-observability-control${period === value ? ` is-active` : ``}`} onClick={() => setPeriod(value)}><CalendarDays className={`dd-report-icon`} size={11} aria-hidden={`true`} />{label}</button>)}</div>
      <label htmlFor={`${id}-metric`} id={`${id}-metric-label`} className={`dd-observability-metric-picker`}><span className={`dd-observability-sr`}>Runtime Metric</span><select id={`${id}-metric`} className={`dd-observability-select`} value={metric} title={metricDefinition.description} onChange={(event) => setMetric(event.target.value as ObservabilityMetric)}>{activeView.metrics.map((value) => <option key={value} value={value}>{observabilityMetrics[value].label}</option>)}</select><ChevronDown size={12} aria-hidden={`true`} className={`dd-observability-select-arrow`} /></label>
      <div id={`${id}-presentation`} className={`dd-observability-segmented`} role={`group`} aria-label={`Runtime Data Display`}>
        <button type={`button`} aria-pressed={presentation === `chart`} id={`${id}-display-chart`} className={`dd-observability-control${presentation === `chart` ? ` is-active` : ``}`} onClick={() => setPresentation(`chart`)}><BarChart3 className={`dd-report-icon`} size={11} aria-hidden={`true`} />{ranking ? `Bars` : `Chart`}</button>
        <button type={`button`} aria-pressed={presentation === `list`} id={`${id}-display-list`} className={`dd-observability-control${presentation === `list` ? ` is-active` : ``}`} onClick={() => setPresentation(`list`)}><List className={`dd-report-icon`} size={11} aria-hidden={`true`} />List</button>
      </div>
    </div>
    <div role={`tabpanel`} tabIndex={0} id={`${id}-panel`} aria-labelledby={`${id}-tab-${view}`} className={`dd-observability-viewport${loading && currentReport ? ` is-refreshing` : ``}`}>
      {!currentReport && !error && <div id={`${id}-loading`} className={`dd-observability-loading`}><AdminSkeleton cards={compact ? 4 : 5} variant={`summary`} id={`${id}-summary-loading`} label={`Loading Health Metrics`} /><AdminSkeleton variant={`chart`} id={`${id}-chart-loading`} label={`Loading Health Chart`} /></div>}
      {error && <div role={`alert`} id={`${id}-error`} className={`dd-observability-error`}><AlertCircle className={`dd-report-icon`} size={18} aria-hidden={`true`} /><div id={`${id}-error-copy`} className={`dd-observability-error-copy`}><h3 id={`${id}-error-title`} className={`dd-observability-error-title`}>{isPlusError ? `Observability Plus Required` : isSetupError ? `Connect Vercel Observability` : `Health Unavailable`}</h3><p id={`${id}-error-message`} className={`dd-observability-description`}>{error.message}</p><div id={`${id}-error-actions`} className={`dd-observability-error-actions`}><button type={`button`} disabled={loading} onClick={refresh} id={`${id}-retry`} className={`dd-observability-button`}><RefreshCw className={`dd-report-icon`} size={12} aria-hidden={`true`} />Retry</button>{(isPlusError || isSetupError) && <a target={`_blank`} rel={`noopener noreferrer`} href={`https://vercel.com/docs/observability`} id={`${id}-documentation`} className={`dd-observability-button`}>Vercel Observability<ArrowUpRight className={`dd-report-icon`} size={12} aria-hidden={`true`} /></a>}</div></div></div>}
      {currentReport && <div id={`${id}-report`} className={`dd-observability-report`}>
        <div id={`${id}-metrics`} className={`dd-observability-metrics`} role={`group`} aria-label={`Runtime Summary Metrics`}>
          {(compact ? compactMetrics : allMetrics).map((value, index) => { const definition = observabilityMetrics[value]; const Icon = definition.icon; return <button key={value} type={`button`} onClick={() => inspectMetric(value)} aria-pressed={!ranking && metric === value} id={`${id}-metric-${value}`} className={`dd-observability-kpi${!ranking && metric === value ? ` is-active` : ``}${value === `errors` && (currentReport.totals.errors ?? 0) > 0 ? ` has-errors` : ``}`} title={definition.description} style={{ animationDelay: `${index * 35}ms` }} aria-label={`${definition.label}: ${formatObservabilityValue(value, currentReport.totals[value])}. Show ${definition.label} Trend`}><span id={`${id}-label-${value}`} className={`dd-observability-kpi-label`}><Icon className={`dd-report-icon`} size={12} aria-hidden={`true`} />{definition.label}</span><strong id={`${id}-value-${value}`} className={`dd-observability-kpi-value`}>{formatObservabilityValue(value, currentReport.totals[value])}</strong></button>; })}
        </div>
        <div id={`${id}-data`} className={`dd-observability-data`}>
          <div id={`${id}-view-heading`} className={`dd-observability-view-heading`}><h3 id={`${id}-view-title`} className={`dd-observability-view-title`}>{ranking ? `${activeView.label} · ${metricDefinition.label}` : metricDefinition.label}<span id={`${id}-metric-info`} className={`dd-observability-metric-info`} tabIndex={0} title={metricDefinition.description} aria-label={metricDefinition.description}><Info className={`dd-report-icon`} size={12} aria-hidden={`true`} /></span></h3>{ranking ? <label htmlFor={`${id}-search`} className={`dd-observability-search`}><Search className={`dd-report-icon`} size={12} aria-hidden={`true`} /><input id={`${id}-search`} type={`search`} value={search} placeholder={`Search ${activeView.label}`} aria-label={`Search ${activeView.label}`} onChange={(event) => setSearch(event.target.value)} /></label> : <span id={`${id}-bucket-size`} className={`dd-observability-caption`}>{formatObservabilityBucket(currentReport.bucketSeconds)} · UTC</span>}</div>
          {currentReport.warnings.length > 0 && <details id={`${id}-warnings`} className={`dd-observability-warnings`}><summary id={`${id}-warnings-toggle`}><Info className={`dd-report-icon`} size={12} aria-hidden={`true`} />Report Notes ({currentReport.warnings.length})</summary><ul id={`${id}-warning-list`}>{currentReport.warnings.map((warning, index) => <li key={`${index}-${warning}`} id={`${id}-warning-${index}`}>{warning}</li>)}</ul></details>}
          {isEmpty && <p role={`status`} id={`${id}-empty`} className={`dd-observability-empty`}>No Runtime Activity In The Last {periodLabel}</p>}
          {ranking ? <ObservabilityRanking key={`${view}-${metric}-${presentation}`} id={`${id}-ranking-${ranking}`} rows={rows} kind={ranking} metric={metric} total={currentReport.totals.requests} view={presentation === `chart` ? `bars` : `list`} /> : presentation === `chart` ? <ObservabilityTrend key={`${currentReport.fetchedAt}-${period}-${metric}`} id={`${id}-trend`} points={currentReport.trend} period={period} metric={metric} /> : <div id={`${id}-table-wrap`} className={`dd-observability-table-wrap`} role={`region`} tabIndex={0} aria-label={`${metricDefinition.label} By Reporting Bucket`}><table id={`${id}-table`} className={`dd-observability-table`}><caption className={`dd-observability-sr`}>{metricDefinition.label} For The Last {periodLabel}, UTC</caption><thead><tr><th scope={`col`}>Time · UTC</th><th scope={`col`} title={metricDefinition.description}>{metricDefinition.label}</th></tr></thead><tbody>{currentReport.trend.map((point, index) => <tr key={point.timestamp} id={`${id}-bucket-${index}`}><th scope={`row`}>{formatObservabilityTimestamp(point.timestamp, period)}</th><td id={`${id}-bucket-${index}-value`}>{formatObservabilityValue(metric, point.values[metric])}</td></tr>)}</tbody></table>{!currentReport.trend.length && <p role={`status`} id={`${id}-table-empty`} className={`dd-observability-empty`}>No Measurements For This Period</p>}</div>}
        </div>
      </div>}
    </div>
  </section>;
};

export default ObservabilityPanel;
