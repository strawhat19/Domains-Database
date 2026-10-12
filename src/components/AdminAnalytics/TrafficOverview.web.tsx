'use client';

import './overview.scss';
import { Link } from 'expo-router';
import AdminSkeleton from './Skeleton';
import { useRef, type KeyboardEvent } from 'react';
import TrafficTrend from './traffic-trend/traffic-trend';
import { useTrafficOverview } from './useTrafficOverview';
import { routes as siteRoutes } from '../../shared/routes';
import { getTrafficSegmentIdentity } from './traffic-segment-icon/traffic-segment-identity';
import TrafficOverviewCountries from './traffic-overview-countries/traffic-overview-countries';
import TrafficOverviewBreakdown from './traffic-overview-breakdown/traffic-overview-breakdown';
import { getTrafficChange, getTrafficOptions, formatTrafficDate, formatTrafficCount } from './data';
import { Globe, Users, MapPin, Monitor, Link2, FileText, BarChart3, CalendarDays, RefreshCw, Download, Filter, X, List, Check, AlertCircle, ArrowUpRight } from 'lucide-react';

const views = [
  { key: `overview`, label: `Overview`, icon: BarChart3 },
  { key: `trend`, label: `Daily`, icon: CalendarDays },
  { key: `country`, label: `Countries`, icon: MapPin },
  { key: `referrer`, label: `Sources`, icon: Link2 },
  { key: `path`, label: `Pages`, icon: FileText },
  { key: `device`, label: `Devices`, icon: Monitor },
] as const;
const segments = [
  { key: `country`, label: `Country`, all: `All Countries`, icon: MapPin },
  { key: `referrer`, label: `Source`, all: `All Sources`, icon: Link2 },
  { key: `path`, label: `Page`, all: `All Pages`, icon: FileText },
  { key: `device`, label: `Device`, all: `All Devices`, icon: Monitor },
] as const;

const TrafficOverview = () => {
  const { error, report, filters, loading, refresh, rows, today, oldest, metric, compare, showArea, isPreset, dateError, activeView, showShares, filterCount, filtersOpen, presentation, selectedDays, draftFilters, showDaySlider, setMetric, setCompare, selectView, openFilters, setPreset, setShowArea, exportReport, applyFilters, clearSegments, toggleFilters, selectSegment, setShowShares, setPresentation, setDraftFilters, setShowDaySlider, clearDraftSegments } = useTrafficOverview();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const isSetupError = error?.code === `analytics_not_configured`;
  const segment = activeView === `overview` || activeView === `trend` ? null : activeView;
  const metricLabel = metric === `visitors` ? `Visitors` : `Page Views`;
  const dailyMetrics = [metric, metric === `visitors` ? `pageviews` : `visitors`] as const;
  const depth = report?.current.visitors ? report.current.pageviews / report.current.visitors : 0;
  const previousDepth = report?.previous.visitors ? report.previous.pageviews / report.previous.visitors : 0;
  const viewLabel = views.find(({ key }) => key === activeView)?.label ?? `Overview`;
  const metrics = report ? [
    { id: `visitors`, label: `Visitors`, icon: Users, value: formatTrafficCount(report.current.visitors), previous: formatTrafficCount(report.previous.visitors), change: getTrafficChange(report.current.visitors, report.previous.visitors) },
    { id: `pageviews`, label: `Page Views`, icon: FileText, value: formatTrafficCount(report.current.pageviews), previous: formatTrafficCount(report.previous.pageviews), change: getTrafficChange(report.current.pageviews, report.previous.pageviews) },
    { id: `depth`, label: `Views Per Visitor`, icon: BarChart3, value: depth.toFixed(1), previous: previousDepth.toFixed(1), change: getTrafficChange(depth, previousDepth) },
  ] : [];
  const switches = segment ? [{ key: `shares`, label: `Percentages`, checked: showShares, onChange: setShowShares }] : [
    ...(activeView === `overview` ? [{ key: `compare`, label: `Compare Totals`, checked: compare, onChange: setCompare }, { key: `shares`, label: `Percentages`, checked: showShares, onChange: setShowShares }] : []),
    ...(presentation === `visual` ? [{ key: `fill`, label: `Fill`, checked: showArea, onChange: setShowArea }, { key: `inspect`, label: `Inspect Days`, checked: showDaySlider, onChange: setShowDaySlider }] : []),
  ];
  const moveTab = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === `Home` ? 0 : event.key === `End` ? views.length - 1 : event.key === `ArrowRight` ? (index + 1) % views.length : event.key === `ArrowLeft` ? (index + views.length - 1) % views.length : null;
    if (next === null) return;
    event.preventDefault();
    selectView(views[next].key);
    tabRefs.current?.[next]?.focus();
  };
  const exploreCountries = () => {
    selectView(`country`);
    tabRefs.current?.[views.findIndex(({ key }) => key === `country`)]?.focus();
  };

  return (
    <section id={`dd-traffic-overview`} className={`dd-traffic-overview${!filtersOpen && !segment && presentation === `visual` ? ` is-chart` : ``}`} aria-labelledby={`dd-traffic-overview-title`} aria-busy={loading}>
      <div id={`dd-traffic-overview-heading`} className={`dd-traffic-overview-heading`}>
        <div id={`dd-traffic-overview-copy`} className={`dd-traffic-overview-copy`}>
          <h2 id={`dd-traffic-overview-title`} className={`dd-traffic-overview-title`}><Globe className={`dd-report-icon`} size={19} aria-hidden={`true`} />Traffic</h2>
        </div>
        {report && activeView === `overview` && !filtersOpen && <TrafficOverviewCountries inline id={`dd-traffic-overview-heading-countries`} rows={rows.country} metric={metric} total={report.current[metric]} selected={filters.country} loading={loading} showShare={showShares} view={presentation === `visual` ? `bars` : `list`} onSelect={(value) => selectSegment(`country`, value)} onExplore={exploreCountries} />}
        <div id={`dd-traffic-overview-actions`} className={`dd-traffic-overview-actions`}>
          <button type={`button`} disabled={loading} onClick={refresh} id={`dd-traffic-overview-refresh`} className={`dd-traffic-overview-icon-button`} aria-label={`Refresh Traffic`} title={`Refresh Traffic`}><RefreshCw size={13} aria-hidden={`true`} className={loading ? `is-spinning` : undefined} /></button>
          <button type={`button`} disabled={!report || loading} onClick={exportReport} id={`dd-traffic-overview-export`} className={`dd-traffic-overview-icon-button`} aria-label={`Export Traffic JSON`} title={`Export Traffic JSON`}><Download className={`dd-report-icon`} size={13} aria-hidden={`true`} /></button>
          <Link href={siteRoutes.adminAnalytics.href} id={`dd-traffic-overview-details`} className={`dd-traffic-overview-link`}>View Analytics<ArrowUpRight className={`dd-report-icon`} size={13} aria-hidden={`true`} /></Link>
        </div>
      </div>
      <div id={`dd-traffic-overview-tabs`} className={`dd-traffic-overview-tabs`} role={`tablist`} aria-label={`Traffic Views`}>
        {views.map(({ key, label, icon: Icon }, index) => <button key={key} type={`button`} role={`tab`} tabIndex={activeView === key ? 0 : -1} aria-selected={activeView === key} aria-controls={`dd-traffic-overview-panel`} id={`dd-traffic-overview-tab-${key}`} className={`dd-traffic-overview-tab${activeView === key ? ` is-active` : ``}`} ref={(element) => { tabRefs.current[index] = element; }} onClick={() => selectView(key)} onKeyDown={(event) => moveTab(event, index)}><Icon className={`dd-report-icon`} size={12} aria-hidden={`true`} />{label}</button>)}
      </div>
      <div id={`dd-traffic-overview-toolbar`} className={`dd-traffic-overview-toolbar`}>
        <div id={`dd-traffic-overview-periods`} className={`dd-traffic-overview-segmented`} role={`group`} aria-label={`Reporting Period`}>
          {[7, 30, 90].map((days) => <button key={days} type={`button`} disabled={loading} aria-pressed={isPreset && selectedDays === days} id={`dd-traffic-overview-period-${days}`} className={`dd-traffic-overview-control${isPreset && selectedDays === days ? ` is-active` : ``}`} onClick={() => setPreset(days)}>{days} Days</button>)}
          <button type={`button`} id={`dd-traffic-overview-period-custom`} className={`dd-traffic-overview-control${!isPreset ? ` is-active` : ``}`} aria-pressed={!isPreset} onClick={openFilters}><CalendarDays className={`dd-report-icon`} size={11} aria-hidden={`true`} />Custom</button>
        </div>
        <div id={`dd-traffic-overview-metric-controls`} className={`dd-traffic-overview-segmented`} role={`group`} aria-label={`Traffic Metric`}>
          {([`visitors`, `pageviews`] as const).map((value) => <button key={value} type={`button`} id={`dd-traffic-overview-metric-control-${value}`} className={`dd-traffic-overview-control${metric === value ? ` is-active` : ``}`} aria-pressed={metric === value} onClick={() => setMetric(value)}>{value === `visitors` ? <Users className={`dd-report-icon`} size={11} aria-hidden={`true`} /> : <FileText className={`dd-report-icon`} size={11} aria-hidden={`true`} />}{value === `visitors` ? `Visitors` : `Page Views`}</button>)}
        </div>
        <div id={`dd-traffic-overview-presentation`} className={`dd-traffic-overview-segmented`} role={`group`} aria-label={`Data Display`}>
          <button type={`button`} id={`dd-traffic-overview-display-visual`} className={`dd-traffic-overview-control${presentation === `visual` ? ` is-active` : ``}`} aria-pressed={presentation === `visual`} onClick={() => setPresentation(`visual`)}><BarChart3 className={`dd-report-icon`} size={11} aria-hidden={`true`} />{segment ? `Bars` : `Chart`}</button>
          <button type={`button`} id={`dd-traffic-overview-display-list`} className={`dd-traffic-overview-control${presentation === `list` ? ` is-active` : ``}`} aria-pressed={presentation === `list`} onClick={() => setPresentation(`list`)}><List className={`dd-report-icon`} size={11} aria-hidden={`true`} />List</button>
        </div>
        <button type={`button`} ref={filterButtonRef} id={`dd-traffic-overview-filters-toggle`} className={`dd-traffic-overview-control dd-traffic-overview-filter-toggle${filtersOpen || filterCount ? ` is-active` : ``}`} aria-expanded={filtersOpen} aria-controls={`dd-traffic-overview-panel`} onClick={toggleFilters}><Filter className={`dd-report-icon`} size={11} aria-hidden={`true`} />Filters{filterCount > 0 && <span id={`dd-traffic-overview-filter-count`} className={`dd-traffic-overview-filter-count`}>{filterCount}</span>}</button>
        {filterCount > 0 && <button type={`button`} disabled={loading} id={`dd-traffic-overview-clear`} className={`dd-traffic-overview-control`} onClick={clearSegments}><X className={`dd-report-icon`} size={11} aria-hidden={`true`} />Clear</button>}
        {report && !filtersOpen && <div id={`dd-traffic-overview-switches`} role={`group`} className={`dd-traffic-overview-switches`} aria-label={`Traffic Display Options`}>{switches.map(({ key, label, checked, onChange }) => <button key={key} type={`button`} role={`switch`} aria-checked={checked} id={`dd-traffic-overview-switch-${key}`} className={`dd-traffic-overview-switch`} onClick={() => onChange(!checked)}><span aria-hidden={`true`} className={`dd-traffic-overview-switch-track${checked ? ` is-on` : ``}`} />{label}</button>)}</div>}
      </div>
      <div id={`dd-traffic-overview-panel`} role={`tabpanel`} tabIndex={0} aria-labelledby={`dd-traffic-overview-tab-${activeView}`} className={`dd-traffic-overview-viewport${loading && report ? ` is-loading` : ``}`}>
        {filtersOpen ? <form id={`dd-traffic-overview-filters`} className={`dd-traffic-overview-filters`} onSubmit={(event) => { if (applyFilters(event)) filterButtonRef.current?.focus(); }}>
          <div id={`dd-traffic-overview-filter-heading`} className={`dd-traffic-overview-view-heading`}><h3 id={`dd-traffic-overview-filter-title`} className={`dd-traffic-overview-view-title`}>Dates & Segments</h3><button type={`button`} id={`dd-traffic-overview-filter-close`} className={`dd-traffic-overview-control`} onClick={() => { toggleFilters(); filterButtonRef.current?.focus(); }}><X className={`dd-report-icon`} size={11} aria-hidden={`true`} />Close</button></div>
          <div id={`dd-traffic-overview-filter-fields`} className={`dd-traffic-overview-filter-fields`}>
            {([`from`, `to`] as const).map((key) => <label key={key} id={`dd-traffic-overview-date-label-${key}`} className={`dd-traffic-overview-field`} htmlFor={`dd-traffic-overview-date-${key}`}><span>{key === `from` ? `From` : `To`}</span><input required type={`date`} id={`dd-traffic-overview-date-${key}`} className={`dd-traffic-overview-input`} value={draftFilters[key]} min={key === `from` ? oldest : draftFilters.from || oldest} max={key === `from` ? draftFilters.to || today : today} aria-describedby={dateError ? `dd-traffic-overview-date-error` : undefined} onChange={(event) => setDraftFilters({ ...draftFilters, [key]: event.target.value })} /></label>)}
            {segments.map(({ key, label, all, icon: Icon }) => <label key={key} id={`dd-traffic-overview-segment-label-${key}`} className={`dd-traffic-overview-field`} htmlFor={`dd-traffic-overview-segment-${key}`}><span><Icon className={`dd-report-icon`} size={11} aria-hidden={`true`} />{label}</span><select id={`dd-traffic-overview-segment-${key}`} className={`dd-traffic-overview-input`} value={draftFilters[key]} disabled={loading || !report} onChange={(event) => setDraftFilters({ ...draftFilters, [key]: event.target.value })}><option value={``}>{all}</option>{getTrafficOptions(rows[key], draftFilters[key]).map((value, index) => { const identity = getTrafficSegmentIdentity(key, value); return <option key={value} value={value} id={`dd-traffic-overview-option-${key}-${index}`}>{identity.label}{identity.caption && identity.caption !== identity.label ? ` · ${identity.caption}` : ``}</option>; })}</select></label>)}
          </div>
          {dateError && <p role={`alert`} id={`dd-traffic-overview-date-error`} className={`dd-traffic-overview-date-error`}>{dateError}</p>}
          <div id={`dd-traffic-overview-filter-actions`} className={`dd-traffic-overview-filter-actions`}><button type={`button`} id={`dd-traffic-overview-filter-reset`} className={`dd-traffic-overview-control`} onClick={clearDraftSegments}><X className={`dd-report-icon`} size={11} aria-hidden={`true`} />Reset Segments</button><button type={`submit`} disabled={loading} id={`dd-traffic-overview-filter-apply`} className={`dd-traffic-overview-control is-active`}><Check className={`dd-report-icon`} size={11} aria-hidden={`true`} />Apply</button></div>
        </form> : <>
          {loading && !report && <div id={`dd-traffic-overview-loading`} className={`dd-traffic-overview-layout dd-traffic-overview-loading${activeView === `overview` ? ` has-countries` : ``}`}><AdminSkeleton cards={3} variant={`summary`} id={`dd-traffic-overview-metrics-loading`} label={`Loading Vercel Traffic Counts`} /><AdminSkeleton variant={`chart`} id={`dd-traffic-overview-chart-loading`} label={`Loading Vercel Traffic Chart`} />{activeView === `overview` && <AdminSkeleton rows={4} variant={`inline`} id={`dd-traffic-overview-countries-loading`} label={`Loading Traffic Countries`} />}</div>}
          {error && <div role={`alert`} id={`dd-traffic-overview-error`} className={`dd-traffic-overview-error`}><AlertCircle className={`dd-report-icon`} size={18} aria-hidden={`true`} /><div id={`dd-traffic-overview-error-copy`} className={`dd-traffic-overview-error-copy`}><h3 id={`dd-traffic-overview-error-title`} className={`dd-traffic-overview-error-title`}>{isSetupError ? `Connect Vercel Reporting` : `Traffic Report Unavailable`}</h3><p id={`dd-traffic-overview-error-message`} className={`dd-traffic-overview-caption`}>{error.message}</p><button type={`button`} onClick={refresh} disabled={loading} id={`dd-traffic-overview-retry`} className={`dd-traffic-overview-retry`}><RefreshCw className={`dd-report-icon`} size={12} aria-hidden={`true`} />Retry</button></div></div>}
          {report && <div key={activeView} id={`dd-traffic-overview-active-view`} className={`dd-traffic-overview-active-view`}>
            {activeView !== `overview` && <div id={`dd-traffic-overview-view-heading`} className={`dd-traffic-overview-view-heading`}><h3 id={`dd-traffic-overview-view-title`} className={`dd-traffic-overview-view-title`}>{segment ? `${viewLabel} · ${metricLabel}` : `Daily ${metricLabel}`}</h3></div>}
            {segment ? <TrafficOverviewBreakdown id={`dd-traffic-overview-breakdown-${segment}`} rows={rows[segment]} segment={segment} metric={metric} total={report.current[metric]} selected={filters[segment]} loading={loading} showShare={showShares} view={presentation === `visual` ? `bars` : `list`} onSelect={(value) => selectSegment(segment, value)} /> : <div id={`dd-traffic-overview-report`} className={`dd-traffic-overview-layout${activeView === `trend` ? ` is-trend-only` : ` has-countries`}`}>
              {activeView === `overview` && <dl id={`dd-traffic-overview-metrics`} className={`dd-traffic-overview-metrics`}>{metrics.map(({ id, label, icon: Icon, value, previous, change }) => <div key={id} id={`dd-traffic-overview-metric-${id}`} className={`dd-traffic-overview-metric`}><dt id={`dd-traffic-overview-label-${id}`} className={`dd-traffic-overview-metric-label`}><Icon className={`dd-report-icon`} size={12} aria-hidden={`true`} />{label}</dt><dd id={`dd-traffic-overview-value-${id}`} className={`dd-traffic-overview-metric-value`}>{value}</dd>{compare && <dd id={`dd-traffic-overview-comparison-${id}`} className={`dd-traffic-overview-comparison is-${change.direction}`}><span>{change.label}</span><span className={`dd-traffic-overview-caption`}>{previous} Previous</span></dd>}</div>)}</dl>}
              <div id={`dd-traffic-overview-chart-wrap`} className={`dd-traffic-overview-chart-wrap`}>
                {presentation === `visual` ? <TrafficTrend key={`${report.fetchedAt}-${JSON.stringify(report.filters)}`} title={`Daily Traffic`} showArea={showArea} showHeading={false} showDaySlider={showDaySlider} showMetricSwitch={false} points={report.trend} metric={metric} onMetricChange={setMetric} /> : <table id={`dd-traffic-overview-daily-table`} className={`dd-traffic-overview-daily-table`}><caption className={`dd-traffic-overview-table-caption`}>Daily Traffic For The Selected Dates</caption><thead><tr><th scope={`col`}>Date</th>{dailyMetrics.map((value) => <th key={value} scope={`col`} className={value === metric ? `is-primary` : undefined}>{value === `visitors` ? `Visitors` : `Page Views`}</th>)}</tr></thead><tbody>{report.trend.map((point, index) => <tr key={point.date} id={`dd-traffic-overview-day-${index}`}><th scope={`row`}>{formatTrafficDate(point.date, true)}</th>{dailyMetrics.map((value) => <td key={value} id={`dd-traffic-overview-day-${index}-${value}`} className={value === metric ? `is-primary` : undefined}>{formatTrafficCount(point[value])}</td>)}</tr>)}</tbody></table>}
                {report.current.pageviews === 0 && <p role={`status`} id={`dd-traffic-overview-empty`} className={`dd-traffic-overview-empty`}>No page views for the selected dates and filters.</p>}
              </div>
              {activeView === `overview` && <TrafficOverviewCountries id={`dd-traffic-overview-countries`} rows={rows.country} metric={metric} total={report.current[metric]} selected={filters.country} loading={loading} showShare={showShares} view={presentation === `visual` ? `bars` : `list`} onSelect={(value) => selectSegment(`country`, value)} onExplore={exploreCountries} />}
            </div>}
          </div>}
        </>}
      </div>
    </section>
  );
};

export default TrafficOverview;
