'use client';

import './traffic-trend.scss';
import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import type { AnalyticsTrendPoint } from '../../../shared/analytics/types';
import { formatTrafficDate, formatTrafficCount, type TrafficMetric } from '../data';

type TrafficTrendProps = {
  title?: string;
  showArea?: boolean;
  metric: TrafficMetric;
  showHeading?: boolean;
  showDaySlider?: boolean;
  showMetricSwitch?: boolean;
  points: AnalyticsTrendPoint[];
  onMetricChange: (metric: TrafficMetric) => void;
};

const TrafficTrend = ({ points, metric, onMetricChange, showArea = true, showHeading = true, showDaySlider = true, showMetricSwitch = true, title = `A Little More Discovery` }: TrafficTrendProps) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const plot = { left: 48, right: 780, top: 18, bottom: 204 };
  const peak = Math.max(1, ...points.map((point) => point[metric]));
  const ceiling = Math.max(4, Math.ceil(peak / 4) * 4);
  const coordinates = points.map((point, index) => ({ ...point, x: points.length > 1 ? plot.left + index / (points.length - 1) * (plot.right - plot.left) : (plot.left + plot.right) / 2, y: plot.bottom - point[metric] / ceiling * (plot.bottom - plot.top) }));
  const activeIndex = Math.min(hovered ?? selected ?? points.length - 1, points.length - 1);
  const active = coordinates?.[activeIndex];
  const line = coordinates.map(({ x, y }, index) => `${index ? `L` : `M`}${x},${y}`).join(` `);
  const area = coordinates.length ? `${line} L${coordinates[coordinates.length - 1].x},${plot.bottom} L${coordinates[0].x},${plot.bottom} Z` : ``;
  const label = metric === `visitors` ? `Visitors` : `Page Views`;
  const labels = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])].filter((index) => points?.[index]);

  return (
    <section id={`dd-traffic-trend`} className={`dd-traffic-panel dd-traffic-trend`} aria-labelledby={showHeading ? `dd-traffic-trend-title` : undefined} aria-label={showHeading ? undefined : `${title} · ${label}`}>
      {showHeading && <div id={`dd-traffic-trend-heading`} className={`dd-traffic-panel-heading`}>
        <div id={`dd-traffic-trend-copy`} className={`dd-traffic-panel-copy`}>
          <h3 id={`dd-traffic-trend-title`} className={`dd-traffic-panel-title`}>{title}</h3>
          <p id={`dd-traffic-trend-description`} className={`dd-traffic-caption`}>Daily Traffic · UTC</p>
        </div>
        {showMetricSwitch && <div id={`dd-traffic-metric-switch`} className={`dd-traffic-toggle`} aria-label={`Chart Metric`}>
          {([`visitors`, `pageviews`] as const).map((value) => <button key={value} type={`button`} id={`dd-traffic-metric-${value}`} className={`dd-traffic-toggle-button${metric === value ? ` is-active` : ``}`} aria-pressed={metric === value} onClick={() => onMetricChange(value)}>{value === `visitors` ? `Visitors` : `Page Views`}</button>)}
        </div>}
      </div>}
      <div id={`dd-traffic-trend-reading`} className={`dd-traffic-trend-reading`} aria-live={`polite`}>
        <span id={`dd-traffic-trend-reading-date`} className={`dd-traffic-trend-reading-date`}><CalendarDays className={`dd-report-icon`} size={13} aria-hidden={`true`} />{active ? formatTrafficDate(active.date, true) : `No Traffic Yet`}</span>
        <strong id={`dd-traffic-trend-reading-count`} className={`dd-traffic-trend-reading-count`}>{active ? formatTrafficCount(active[metric]) : `0`} <span id={`dd-traffic-trend-reading-label`} className={`dd-traffic-caption`}>{label}</span></strong>
      </div>
      <svg
        key={metric}
        role={`img`}
        viewBox={`0 0 800 244`}
        id={`dd-traffic-trend-chart`}
        className={`dd-traffic-trend-chart`}
        onPointerLeave={() => setHovered(null)}
        aria-labelledby={`dd-traffic-trend-svg-title dd-traffic-trend-svg-description`}
        onPointerMove={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); const x = (event.clientX - bounds.left) / bounds.width * 800; setHovered(Math.min(points.length - 1, Math.max(0, Math.round((x - plot.left) / (plot.right - plot.left) * (points.length - 1))))); }}
      >
        <title id={`dd-traffic-trend-svg-title`}>{label} By Day</title>
        <desc id={`dd-traffic-trend-svg-description`}>{points.length ? `${formatTrafficDate(points[0].date)} to ${formatTrafficDate(points[points.length - 1].date)}. Highest daily count: ${formatTrafficCount(peak === 1 && points.every((point) => point[metric] === 0) ? 0 : peak)}.${showDaySlider && points.length > 1 ? ` Use the day slider below to inspect each value.` : ``}` : `No traffic recorded in this date range`}</desc>
        <defs><linearGradient id={`dd-traffic-trend-fill`} x1={0} y1={0} x2={0} y2={1}><stop offset={`0%`} stopColor={`currentColor`} stopOpacity={.22} /><stop offset={`100%`} stopColor={`currentColor`} stopOpacity={0} /></linearGradient></defs>
        {[0, 1, 2, 3, 4].map((tick) => { const y = plot.bottom - tick / 4 * (plot.bottom - plot.top); return <g key={tick} id={`dd-traffic-trend-grid-${tick}`} className={`dd-traffic-trend-grid`} aria-hidden={`true`}><line x1={plot.left} y1={y} x2={plot.right} y2={y} /><text x={plot.left - 10} y={y + 4} textAnchor={`end`}>{formatTrafficCount(ceiling / 4 * tick)}</text></g>; })}
        {showArea && <path d={area} id={`dd-traffic-trend-area`} className={`dd-traffic-trend-area`} aria-hidden={`true`} fill={`url(#dd-traffic-trend-fill)`} />}
        <path d={line} pathLength={1} id={`dd-traffic-trend-line`} className={`dd-traffic-trend-line`} aria-hidden={`true`} />
        {active && <g id={`dd-traffic-trend-active`} className={`dd-traffic-trend-active`} aria-hidden={`true`}><line x1={active.x} y1={plot.top} x2={active.x} y2={plot.bottom} /><circle r={5} cx={active.x} cy={active.y} /></g>}
        {labels.map((index) => <text key={index} x={coordinates[index].x} y={230} textAnchor={index === 0 ? `start` : index === points.length - 1 ? `end` : `middle`} id={`dd-traffic-trend-label-${index}`} className={`dd-traffic-trend-label`} aria-hidden={`true`}>{formatTrafficDate(points[index].date, true)}</text>)}
      </svg>
      {showDaySlider && points.length > 1 && <label id={`dd-traffic-trend-slider-label`} className={`dd-traffic-trend-slider-label`} htmlFor={`dd-traffic-trend-slider`}><span id={`dd-traffic-trend-slider-caption`} className={`dd-traffic-caption`}>Explore Each Day</span><input min={0} type={`range`} step={1} max={points.length - 1} value={Math.max(0, activeIndex)} id={`dd-traffic-trend-slider`} className={`dd-traffic-trend-slider`} aria-valuetext={active ? `${formatTrafficDate(active.date)}, ${formatTrafficCount(active[metric])} ${label}` : undefined} onChange={(event) => { setHovered(null); setSelected(Number(event.target.value)); }} /></label>}
    </section>
  );
};

export default TrafficTrend;
