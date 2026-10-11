'use client';

import './styles.scss';
import { Link } from 'expo-router';
import AdminSkeleton from './Skeleton';
import { createPortal } from 'react-dom';
import { useState, type FormEvent } from 'react';
import TrafficTrend from './traffic-trend/traffic-trend';
import { useAuth } from '../../shared/authContext/useAuth';
import { routes as siteRoutes } from '../../shared/routes';
import TrafficBreakdown from './traffic-breakdown/traffic-breakdown';
import { getAnalyticsDateRange, useTrafficAnalytics } from '../../shared/analytics/useTrafficAnalytics';
import { Globe, Users, Gavel, Search, MapPin, Monitor, Link2, FileText, ArrowUp, ArrowDown, Minus, RefreshCw, Download, X, Filter, UserPlus, Globe2, ArrowUpRight, AlertCircle, BarChart3 } from 'lucide-react';
import { getTrafficChange, getTrafficOptions, getTrafficDateError, countTrafficOutcomes, formatTrafficCount, formatTrafficSegment, type TrafficMetric, type TrafficOutcomes, type TrafficSegment } from './data';

const segmentDefinitions = [
  { key: `country`, label: `Country`, all: `All Countries`, icon: MapPin },
  { key: `device`, label: `Device`, all: `All Devices`, icon: Monitor },
  { key: `referrer`, label: `Source`, all: `All Sources`, icon: Link2 },
  { key: `path`, label: `Page`, all: `All Pages`, icon: FileText },
] as const;
const journeys = [
  { path: `/signup`, label: `Signup Page`, icon: UserPlus },
  { path: `/domains`, label: `Domain Portfolio`, icon: Globe2 },
  { path: `/search`, label: `Domain Search`, icon: Search },
  { path: `/auction`, label: `Auction Discovery`, icon: Gavel },
];
type TrafficAnalyticsProps = { outcomes?: TrafficOutcomes; outcomesLoading?: boolean; headingActionsTarget?: HTMLElement | null };

const TrafficAnalytics = ({ outcomes, headingActionsTarget, outcomesLoading = false }: TrafficAnalyticsProps) => {
  const { error, report, loading, filters, refresh, setFilters } = useTrafficAnalytics(useAuth().user);
  const [metric, setMetric] = useState<TrafficMetric>(`visitors`);
  const [dateError, setDateError] = useState(``);
  const [customFrom, setCustomFrom] = useState(filters.from);
  const [customTo, setCustomTo] = useState(filters.to);
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const oldest = new Date(Date.parse(`${today}T00:00:00Z`) - 364 * 86400000).toISOString().slice(0, 10);
  const activeSegments = segmentDefinitions.filter(({ key }) => filters[key]);
  const breakdownRows = { country: report?.countries ?? [], device: report?.devices ?? [], referrer: report?.referrers ?? [], path: report?.pages ?? [] };
  const selectedDays = Math.round((Date.parse(`${filters.to}T00:00:00Z`) - Date.parse(`${filters.from}T00:00:00Z`)) / 86400000) + 1;
  const setSegment = (key: TrafficSegment, value: string) => setFilters({ ...filters, [key]: filters[key] === value ? `` : value });
  const setPreset = (days: number) => { const range = getAnalyticsDateRange(days); setDateError(``); setCustomTo(range.to); setCustomFrom(range.from); setFilters({ ...filters, ...range }); };
  const applyDates = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const failure = getTrafficDateError(customFrom, customTo); setDateError(failure); if (!failure) setFilters({ ...filters, to: customTo, from: customFrom }); };
  const exportReport = () => {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: `application/json` }));
    const link = document.createElement(`a`);
    link.href = url;
    link.download = `domains-database-traffic-${report.filters.from}-${report.filters.to}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const metrics = report ? [
    { key: `visitors`, label: `Visitors`, icon: Users, value: formatTrafficCount(report.current.visitors), change: getTrafficChange(report.current.visitors, report.previous.visitors), note: `Anonymous Visitor Counts` },
    { key: `pageviews`, label: `Page Views`, icon: FileText, value: formatTrafficCount(report.current.pageviews), change: getTrafficChange(report.current.pageviews, report.previous.pageviews), note: `Every Recorded Page Load` },
    { key: `depth`, label: `Views Per Visitor`, icon: BarChart3, value: (report.current.visitors ? report.current.pageviews / report.current.visitors : 0).toFixed(1), change: null, note: `Page Views ÷ Visitor Counts` },
  ] : [];
  const outcomeCards = outcomes && report ? [
    { key: `accounts`, label: siteRoutes.adminUsers.label, icon: UserPlus, dates: outcomes.accounts, href: siteRoutes.adminUsers.href },
    { key: `domains`, label: siteRoutes.adminDomains.label, icon: Globe2, dates: outcomes.domains, href: siteRoutes.adminDomains.href },
  ] : [];
  const isSetupError = error?.code === `analytics_not_configured`;
  const actions = <>
    <button type={`button`} disabled={!report || loading} onClick={exportReport} id={`dd-traffic-export`} className={`dd-traffic-button`}><Download className={`dd-report-icon`} id={`dd-traffic-export-icon`} size={13} aria-hidden={`true`} />Export JSON</button>
    <button type={`button`} disabled={loading} onClick={refresh} id={`dd-traffic-refresh`} className={`dd-traffic-button`}><RefreshCw id={`dd-traffic-refresh-icon`} size={13} className={loading ? `is-spinning` : undefined} aria-hidden={`true`} />Refresh</button>
  </>;

  return (
    <section id={`dd-traffic-analytics`} className={`dd-traffic-analytics${loading ? ` is-loading` : ``}`} aria-label={`Website Traffic Analytics`} aria-busy={loading}>
      {headingActionsTarget ? createPortal(actions, headingActionsTarget) : <div id={`dd-traffic-heading-actions`} className={`dd-traffic-heading-actions`}>{actions}</div>}
      <div id={`dd-traffic-summary`} className={`dd-traffic-summary${report || loading ? `` : ` is-filters-only`}`}>
        <div id={`dd-traffic-filters`} className={`dd-traffic-filters`}>
          <div id={`dd-traffic-range-controls`} className={`dd-traffic-range-controls`}>
            <div id={`dd-traffic-date-presets`} className={`dd-traffic-toggle`} aria-label={`Reporting Period`}>
              {[7, 30, 90].map((days) => <button key={days} type={`button`} disabled={loading} onClick={() => setPreset(days)} id={`dd-traffic-date-preset-${days}`} aria-pressed={selectedDays === days && filters.to === today} className={`dd-traffic-toggle-button${selectedDays === days && filters.to === today ? ` is-active` : ``}`}>{days} Days</button>)}
            </div>
            <form id={`dd-traffic-date-form`} className={`dd-traffic-date-form`} onSubmit={applyDates}>
              <label htmlFor={`dd-traffic-date-from`} id={`dd-traffic-date-from-label`} className={`dd-traffic-date-label`}><span id={`dd-traffic-date-from-caption`} className={`dd-traffic-caption`}>From</span><input required type={`date`} min={oldest} max={customTo || today} disabled={loading} value={customFrom} id={`dd-traffic-date-from`} className={`dd-traffic-input`} onChange={(event) => setCustomFrom(event.target.value)} aria-describedby={dateError ? `dd-traffic-date-error` : undefined} /></label>
              <label htmlFor={`dd-traffic-date-to`} id={`dd-traffic-date-to-label`} className={`dd-traffic-date-label`}><span id={`dd-traffic-date-to-caption`} className={`dd-traffic-caption`}>To</span><input required min={customFrom || oldest} max={today} type={`date`} disabled={loading} value={customTo} id={`dd-traffic-date-to`} className={`dd-traffic-input`} onChange={(event) => setCustomTo(event.target.value)} aria-describedby={dateError ? `dd-traffic-date-error` : undefined} /></label>
              <button type={`submit`} disabled={loading} id={`dd-traffic-date-apply`} className={`dd-traffic-button`}><Filter className={`dd-report-icon`} size={12} aria-hidden={`true`} />Apply</button>
            </form>
          </div>
          {dateError && <p role={`alert`} id={`dd-traffic-date-error`} className={`dd-traffic-date-error`}>{dateError}</p>}
          <div id={`dd-traffic-segment-controls`} className={`dd-traffic-segment-controls`}>
            {segmentDefinitions.map(({ key, label, all, icon: Icon }) => <label key={key} htmlFor={`dd-traffic-filter-${key}`} id={`dd-traffic-filter-label-${key}`} className={`dd-traffic-select-label`}><span id={`dd-traffic-filter-caption-${key}`} className={`dd-traffic-caption`}><Icon className={`dd-report-icon`} size={12} aria-hidden={`true`} />{label}</span><select value={filters[key]} disabled={loading || !report} id={`dd-traffic-filter-${key}`} className={`dd-traffic-input dd-traffic-select`} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })}><option value={``}>{all}</option>{getTrafficOptions(breakdownRows[key], filters[key]).map((value) => <option key={value} value={value}>{formatTrafficSegment(key, value)}</option>)}</select></label>)}
          </div>
          {activeSegments.length > 0 && <div id={`dd-traffic-active-filters`} className={`dd-traffic-active-filters`} aria-label={`Active Filters`}>
            {activeSegments.map(({ key, label }) => <button key={key} type={`button`} disabled={loading} id={`dd-traffic-clear-${key}`} className={`dd-traffic-filter-chip`} aria-label={`Remove ${label} Filter`} onClick={() => setFilters({ ...filters, [key]: `` })}>{label}: {formatTrafficSegment(key, filters[key])}<X className={`dd-report-icon`} size={11} aria-hidden={`true`} /></button>)}
            <button type={`button`} disabled={loading} id={`dd-traffic-clear-filters`} className={`dd-traffic-text-button`} onClick={() => setFilters({ ...filters, path: ``, device: ``, country: ``, referrer: `` })}><X className={`dd-report-icon`} size={12} aria-hidden={`true`} />Clear Filters</button>
          </div>}
        </div>
        {(report || loading) && <div id={`dd-traffic-summary-stats`} className={`dd-traffic-summary-stats${report && loading ? ` is-loading` : ``}`}>
          {loading && !report ? <div role={`status`} id={`dd-traffic-skeleton-cards`} className={`dd-traffic-skeleton-cards`} aria-label={`Loading Traffic Counts`}>{[0, 1, 2].map((index) => <span key={index} id={`dd-traffic-skeleton-card-${index}`} className={`dd-traffic-skeleton-card`} />)}</div> : report && <>
            <div id={`dd-traffic-metrics`} className={`dd-traffic-metrics`}>
              {metrics.map(({ key, label, icon: Icon, value, change, note }, index) => { const ChangeIcon = change?.direction === `up` ? ArrowUp : change?.direction === `down` ? ArrowDown : Minus; return <article key={key} id={`dd-traffic-kpi-${key}`} className={`dd-traffic-kpi`} style={{ animationDelay: `${index * 65}ms` }}><span id={`dd-traffic-kpi-label-${key}`} className={`dd-traffic-kpi-label`}><Icon className={`dd-report-icon`} size={14} aria-hidden={`true`} />{label}</span><strong id={`dd-traffic-kpi-value-${key}`} className={`dd-traffic-kpi-value`}>{value}</strong>{change && <span id={`dd-traffic-kpi-change-${key}`} className={`dd-traffic-kpi-change is-${change.direction}`}><ChangeIcon className={`dd-report-icon`} size={11} aria-hidden={`true`} />{change.label}<span id={`dd-traffic-kpi-period-${key}`} className={`dd-traffic-kpi-period`}>vs Previous {selectedDays} Day(s)</span></span>}<span id={`dd-traffic-kpi-note-${key}`} className={`dd-traffic-caption`}>{note}</span></article>; })}
            </div>
          </>}
        </div>}
      </div>
      {error && <div role={`alert`} id={`dd-traffic-error`} className={`dd-traffic-feedback${isSetupError ? ` is-setup` : ` is-error`}`}><AlertCircle className={`dd-report-icon`} size={19} aria-hidden={`true`} /><div id={`dd-traffic-error-copy`} className={`dd-traffic-feedback-copy`}><h3 id={`dd-traffic-error-title`} className={`dd-traffic-feedback-title`}>{isSetupError ? `Connect Vercel Reporting` : `Traffic Report Unavailable`}</h3><p id={`dd-traffic-error-message`} className={`dd-traffic-description`}>{isSetupError ? `The dashboard’s server connection to Vercel Web Analytics needs to be configured before live reports can appear here.` : error.message}</p>{report && <p id={`dd-traffic-stale-note`} className={`dd-traffic-caption`}>Showing The Last Successful Report</p>}</div></div>}
      {loading && !report && <div role={`status`} id={`dd-traffic-loading`} className={`dd-traffic-skeleton`} aria-label={`Loading Traffic Report`}><span id={`dd-traffic-skeleton-chart`} className={`dd-traffic-skeleton-chart`} /></div>}
      {report && <div id={`dd-traffic-report`} className={`dd-traffic-report`}>
        {report.current.pageviews === 0 && <div id={`dd-traffic-no-data`} className={`dd-traffic-feedback is-empty`}><Globe className={`dd-report-icon`} size={19} aria-hidden={`true`} /><div id={`dd-traffic-no-data-copy`} className={`dd-traffic-feedback-copy`}><h3 id={`dd-traffic-no-data-title`} className={`dd-traffic-feedback-title`}>No Website Traffic Yet</h3><p id={`dd-traffic-no-data-description`} className={`dd-traffic-description`}>No page views were recorded for these dates and filters. Try a broader period or clear your segments.</p></div></div>}
        <TrafficTrend key={`${report.fetchedAt}-${JSON.stringify(report.filters)}`} points={report.trend} metric={metric} onMetricChange={setMetric} />
        <div id={`dd-traffic-breakdowns`} className={`dd-traffic-breakdowns`}>
          <TrafficBreakdown rows={report.countries} icon={MapPin} segment={`country`} title={`Where They Visit From`} selected={filters.country} total={report.current.pageviews} onSelect={(value) => setSegment(`country`, value)} />
          <TrafficBreakdown rows={report.referrers} icon={Link2} segment={`referrer`} title={`How They Find You`} selected={filters.referrer} total={report.current.pageviews} onSelect={(value) => setSegment(`referrer`, value)} />
          <TrafficBreakdown rows={report.pages} icon={FileText} segment={`path`} title={`Pages They Explore`} selected={filters.path} total={report.current.pageviews} onSelect={(value) => setSegment(`path`, value)} />
          <TrafficBreakdown rows={report.devices} icon={Monitor} segment={`device`} title={`Their Devices`} selected={filters.device} total={report.current.pageviews} onSelect={(value) => setSegment(`device`, value)} />
        </div>
        <section id={`dd-traffic-journeys`} className={`dd-traffic-panel dd-traffic-journeys`} aria-labelledby={`dd-traffic-journeys-title`}>
          <div id={`dd-traffic-journeys-heading`} className={`dd-traffic-panel-heading`}><h3 id={`dd-traffic-journeys-title`} className={`dd-traffic-panel-title`}>From Discovery To Domain Management</h3><span id={`dd-traffic-journeys-caption`} className={`dd-traffic-caption`}>Explore Page Interest</span></div>
          <div id={`dd-traffic-journey-links`} className={`dd-traffic-journey-links`}>{journeys.map(({ path, label, icon: Icon }, index) => <button key={path} type={`button`} disabled={loading} id={`dd-traffic-journey-${index}`} className={`dd-traffic-journey-button${filters.path === path ? ` is-selected` : ``}`} aria-pressed={filters.path === path} onClick={() => setSegment(`path`, path)}><Icon className={`dd-report-icon`} size={14} aria-hidden={`true`} />{label}<ArrowUpRight className={`dd-report-icon`} size={12} aria-hidden={`true`} /></button>)}</div>
          {outcomesLoading ? <AdminSkeleton cards={4} variant={`summary`} id={`dd-traffic-outcomes-loading`} label={`Loading Domain Activity`} /> : outcomeCards.length > 0 && <div id={`dd-traffic-outcomes`} className={`dd-traffic-outcomes`}>{outcomeCards.map(({ key, label, icon: Icon, dates, href }) => <Link key={key} href={href} id={`dd-traffic-outcome-${key}`} className={`dd-traffic-outcome`}><span id={`dd-traffic-outcome-label-${key}`} className={`dd-traffic-outcome-label`}><Icon className={`dd-report-icon`} size={13} aria-hidden={`true`} />{label}</span><strong id={`dd-traffic-outcome-count-${key}`} className={`dd-traffic-outcome-count`}>{formatTrafficCount(countTrafficOutcomes(dates, report.filters))}</strong><ArrowUpRight size={12} aria-hidden={`true`} className={`dd-traffic-outcome-arrow`} /></Link>)}</div>}
          {!outcomesLoading && outcomeCards.length > 0 && <p id={`dd-traffic-outcomes-note`} className={`dd-traffic-caption`}>Created In Selected Dates · Loaded Record Window · Website Segments Do Not Filter These Counts</p>}
        </section>
      </div>}
    </section>
  );
};

export default TrafficAnalytics;
