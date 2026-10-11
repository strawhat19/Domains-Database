'use client';

import './observability-trend.scss';
import { Clock3 } from 'lucide-react';
import { useState, type PointerEvent } from 'react';
import { observabilityMetrics, formatObservabilityValue, formatObservabilityTimestamp } from '../data.web';
import type { ObservabilityPoint, ObservabilityMetric, ObservabilityPeriod } from '../../../shared/analytics/types';

type ObservabilityTrendProps = {
  id: string;
  metric: ObservabilityMetric;
  period: ObservabilityPeriod;
  points: ObservabilityPoint[];
};

type TrendCoordinate = {
  x: number;
  index: number;
  y: number | null;
  timestamp: string;
  value: number | null;
};

type MeasuredCoordinate = TrendCoordinate & { y: number; value: number };

const ObservabilityTrend = ({ id, points, metric, period }: ObservabilityTrendProps) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const plot = { top: 18, left: 76, right: 782, bottom: 182 };
  const label = observabilityMetrics[metric].label;
  const values = points.map((point) => {
    const value = point.values?.[metric];
    return typeof value === `number` && Number.isFinite(value) ? value : null;
  });
  const measured = values.filter((value): value is number => value !== null);
  const missing = points.length - measured.length;
  const maximum = measured.length ? Math.max(...measured) : null;
  const minimum = Math.min(0, ...measured);
  const ceiling = Math.max(0, maximum ?? 0) || 1;
  const scale = Math.max(ceiling, Math.abs(minimum));
  const range = ceiling / scale - minimum / scale;
  const coordinates: TrendCoordinate[] = points.map((point, index) => {
    const value = values?.[index] ?? null;
    return {
      index,
      value,
      timestamp: point.timestamp,
      x: points.length > 1 ? plot.left + index / (points.length - 1) * (plot.right - plot.left) : (plot.left + plot.right) / 2,
      y: value !== null ? plot.bottom - (value / scale - minimum / scale) / range * (plot.bottom - plot.top) : null,
    };
  });
  const segments: MeasuredCoordinate[][] = [];
  let segment: MeasuredCoordinate[] | null = null;
  coordinates.forEach((point) => {
    if (point.y === null || point.value === null) {
      segment = null;
      return;
    }
    if (!segment) {
      segment = [];
      segments.push(segment);
    }
    segment.push({ ...point, y: point.y, value: point.value });
  });
  const activeIndex = Math.min(Math.max(0, hovered ?? selected ?? points.length - 1), Math.max(0, points.length - 1));
  const active = coordinates?.[activeIndex];
  const labels = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])].filter((index) => points?.[index]);
  const activeTimestamp = active ? formatObservabilityTimestamp(active.timestamp, period) : `No Measurements`;
  const activeValue = formatObservabilityValue(metric, active?.value);
  const description = points.length
    ? `${formatObservabilityTimestamp(points[0].timestamp, period)} to ${formatObservabilityTimestamp(points[points.length - 1].timestamp, period)}. ${measured.length} of ${points.length} buckets measured; ${missing} missing. ${maximum !== null ? `Maximum: ${formatObservabilityValue(metric, maximum)}.` : `No measurements available.`} Missing values appear as gaps.${points.length > 1 ? ` Use the timeline slider to inspect each bucket.` : ``}`
    : `No measurement buckets are available for this period`;
  const inspectPointer = (event: PointerEvent<SVGSVGElement>, select = false) => {
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix || !points.length) return;
    const pointer = event.currentTarget.createSVGPoint();
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    const { x } = pointer.matrixTransform(matrix.inverse());
    const index = Math.min(points.length - 1, Math.max(0, Math.round((x - plot.left) / (plot.right - plot.left) * (points.length - 1))));
    setHovered(index);
    if (select) setSelected(index);
  };

  return (
    <section id={id} className={`dd-observability-trend`} aria-label={`${label} Trend`}>
      <div aria-live={`polite`} aria-atomic={`true`} id={`${id}-reading`} className={`dd-observability-trend-reading`}>
        <span id={`${id}-reading-timestamp`} className={`dd-observability-trend-timestamp`}><Clock3 className={`dd-report-icon`} size={13} aria-hidden={`true`} />{activeTimestamp}</span>
        <strong id={`${id}-reading-value`} className={`dd-observability-trend-value`}>{activeValue}<span id={`${id}-reading-metric`} className={`dd-observability-trend-caption`}>{label}</span></strong>
      </div>
      <div id={`${id}-plot`} className={`dd-observability-trend-plot`}>
        <svg
          role={`img`}
          viewBox={`0 0 800 218`}
          id={`${id}-chart`}
          preserveAspectRatio={`none`}
          className={`dd-observability-trend-chart`}
          onPointerMove={(event) => inspectPointer(event)}
          onPointerLeave={() => setHovered(null)}
          onPointerDown={(event) => inspectPointer(event, true)}
          aria-labelledby={`${id}-svg-title ${id}-svg-description`}
        >
          <title id={`${id}-svg-title`}>{label} Over Time</title>
          <desc id={`${id}-svg-description`}>{description}</desc>
          <defs><linearGradient id={`${id}-fill`} x1={0} y1={0} x2={0} y2={1}><stop offset={`0%`} stopColor={`currentColor`} stopOpacity={.2} /><stop offset={`100%`} stopColor={`currentColor`} stopOpacity={0} /></linearGradient></defs>
          {measured.length > 0 && [0, 1, 2, 3, 4].map((tick) => {
            const y = plot.bottom - tick / 4 * (plot.bottom - plot.top);
            const value = (minimum / scale * (1 - tick / 4) + ceiling / scale * tick / 4) * scale;
            return <g key={tick} aria-hidden={`true`} id={`${id}-grid-${tick}`} className={`dd-observability-trend-grid`}><line y1={y} y2={y} x1={plot.left} x2={plot.right} /><text y={y + 4} x={plot.left - 10} textAnchor={`end`}>{formatObservabilityValue(metric, value)}</text></g>;
          })}
          {segments.map((group, index) => {
            const line = group.map((point, pointIndex) => `${pointIndex ? `L` : `M`}${point.x},${point.y}`).join(` `);
            const area = `${line} L${group[group.length - 1].x},${plot.bottom} L${group[0].x},${plot.bottom} Z`;
            return <g key={index} aria-hidden={`true`} id={`${id}-segment-${index}`} className={`dd-observability-trend-segment`}>
              {group.length > 1 && <path d={area} id={`${id}-area-${index}`} className={`dd-observability-trend-area`} fill={`url(#${id}-fill)`} />}
              {group.length > 1 ? <path d={line} pathLength={1} id={`${id}-line-${index}`} className={`dd-observability-trend-line`} /> : <circle r={3} cx={group[0].x} cy={group[0].y} id={`${id}-point-${group[0].index}`} className={`dd-observability-trend-point`} />}
            </g>;
          })}
          {active && measured.length > 0 && <g aria-hidden={`true`} id={`${id}-active`} className={`dd-observability-trend-active`}><line y1={plot.top} x1={active.x} x2={active.x} y2={plot.bottom} />{active.y !== null && <circle r={5} cx={active.x} cy={active.y} />}</g>}
          {labels.map((index) => <text key={index} y={208} x={coordinates[index].x} aria-hidden={`true`} id={`${id}-label-${index}`} className={`dd-observability-trend-label`} textAnchor={index === 0 ? `start` : index === points.length - 1 ? `end` : `middle`}>{formatObservabilityTimestamp(points[index].timestamp, period, true)}</text>)}
        </svg>
        {!measured.length && <p id={`${id}-empty`} className={`dd-observability-trend-empty`}>{points.length ? `No ${label.toLowerCase()} measurements available in this period` : `No measurement buckets available in this period`}</p>}
      </div>
      {points.length > 1 && <label htmlFor={`${id}-slider`} id={`${id}-slider-label`} className={`dd-observability-trend-slider-label`}>
        <span id={`${id}-slider-caption`} className={`dd-observability-trend-caption`}>Explore Timeline</span>
        <input
          min={0}
          step={1}
          type={`range`}
          value={activeIndex}
          id={`${id}-slider`}
          max={points.length - 1}
          className={`dd-observability-trend-slider`}
          aria-valuetext={`${activeTimestamp}, ${active?.value === null ? `No Measurement` : activeValue} ${label}`}
          onChange={(event) => { setHovered(null); setSelected(Number(event.target.value)); }}
        />
      </label>}
    </section>
  );
};

export default ObservabilityTrend;
