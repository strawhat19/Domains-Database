import './styles.scss';
import type { CSSProperties } from 'react';
import type { ChartPoint, DistributionItem } from './types';

export { default } from './index.native';
export type { ChartPoint, DistributionItem } from './types';

const formatCount = (value: number) => new Intl.NumberFormat(`en-US`).format(value);
type ActivityChartProps = { id: string; points: ChartPoint[]; label?: string; secondaryLabel?: string };

export const ActivityChart = ({ id, points, label = `Records`, secondaryLabel }: ActivityChartProps) => {
  const categories = [{ key: `value` as const, label, color: `var(--accent)` }, ...(secondaryLabel ? [{ key: `secondary` as const, label: secondaryLabel, color: `var(--warning)` }] : [])];
  const maximum = Math.max(1, ...points.flatMap(point => categories.map(category => point[category.key] ?? 0)));
  const total = points.reduce((sum, point) => sum + categories.reduce((count, category) => count + (point[category.key] ?? 0), 0), 0);
  return <div id={id} className={`dd-owner-activity`}>
    <div id={`${id}-legend`} className={`dd-owner-chart-legend`}>{categories.map(category => <span key={category.key} id={`${id}-legend-${category.key}`} className={`dd-owner-chart-key`}><span id={`${id}-legend-dot-${category.key}`} aria-hidden={`true`} style={{ background: category.color }} />{category.label}</span>)}</div>
    <div id={`${id}-bars`} className={`dd-owner-activity-bars`} role={`img`} aria-label={`New Database Records Over The Last Six Months. ${points.map(point => `${point.label}: ${categories.map(category => `${formatCount(point[category.key] ?? 0)} ${category.label}`).join(`, `)}`).join(`. `)}`}>
      {points.map((point, monthIndex) => <div key={`${point.label}-${monthIndex}`} id={`${id}-month-${monthIndex}`} className={`dd-owner-activity-month`} aria-hidden={`true`}>
        <div id={`${id}-group-${monthIndex}`} className={`dd-owner-activity-group`}>{categories.map((category, categoryIndex) => <span key={category.key} id={`${id}-bar-${monthIndex}-${category.key}`} className={`dd-owner-activity-bar`} title={`${point.label}: ${formatCount(point[category.key] ?? 0)} ${category.label}`} style={{ background: category.color, '--dd-bar-height': `${(point[category.key] ?? 0) / maximum * 100}%`, '--dd-motion-delay': `${100 + monthIndex * 70 + categoryIndex * 35}ms` } as CSSProperties} />)}</div>
        <span id={`${id}-label-${monthIndex}`} className={`dd-owner-activity-label`}>{point.label}</span>
      </div>)}
    </div>
    <p id={`${id}-note`} className={`dd-owner-chart-note`}>{total ? `${formatCount(total)} Record(s) Created In This Period` : `No New Records In This Period`}</p>
  </div>;
};

export const DistributionChart = ({ id, items, label = `Records` }: { id: string; items: DistributionItem[]; label?: string }) => {
  const colors = [`var(--accent)`, `var(--success)`, `var(--warning)`, `var(--danger)`, `var(--muted)`];
  const data = items.filter(item => Number.isFinite(item.value) && item.value >= 0).map((item, index) => ({ ...item, color: item.color ?? colors[index % colors.length] }));
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let segmentStart = 0;
  const segments = data.filter(item => item.value > 0).map(item => {
    const start = segmentStart;
    const length = item.value / total * 100;
    segmentStart += length;
    return { ...item, start, length };
  });
  return <div id={id} className={`dd-owner-status-chart-content`}>
    <div id={`${id}-donut`} className={`dd-owner-status-donut`} role={`img`} aria-label={total ? data.map(item => `${item.label}: ${formatCount(item.value)}`).join(`, `) : `No Records Yet`}>
      <svg id={`${id}-rings`} focusable={`false`} viewBox={`0 0 132 132`} aria-hidden={`true`} className={`dd-owner-status-donut-rings`}>
        <circle r={59} cx={66} cy={66} id={`${id}-track`} className={`dd-owner-status-donut-ring dd-owner-status-donut-track`} />
        {segments.map((segment, index) => <circle key={`${segment.label}-${index}`} r={59} cx={66} cy={66} pathLength={100} stroke={segment.color} id={`${id}-segment-${index}`} className={`dd-owner-status-donut-ring dd-owner-status-donut-segment`} style={{ strokeDashoffset: -segment.start, strokeDasharray: `${segment.length} ${100 - segment.length}`, '--dd-segment-duration': `${Math.max(1, segment.length * 10)}ms`, '--dd-motion-delay': `${160 + segment.start * 10}ms` } as CSSProperties} />)}
      </svg>
      <span id={`${id}-center`} aria-hidden={`true`} className={`dd-owner-status-donut-center`}><strong id={`${id}-total`} className={`dd-owner-status-total`}>{formatCount(total)}</strong><span id={`${id}-caption`} className={`dd-owner-status-total-label`}>{label}</span></span>
    </div>
    <ul id={`${id}-legend`} className={`dd-owner-status-legend`}>{data.map((item, index) => <li key={`${item.label}-${index}`} id={`${id}-legend-${index}`} className={`dd-owner-status-legend-item`} style={{ '--dd-motion-delay': `${280 + index * 65}ms` } as CSSProperties}><span id={`${id}-dot-${index}`} aria-hidden={`true`} className={`dd-owner-status-legend-dot`} style={{ background: item.color }} /><span id={`${id}-label-${index}`} className={`dd-owner-status-legend-label`}>{item.label}</span><strong id={`${id}-count-${index}`} className={`dd-owner-status-legend-count`}>{formatCount(item.value)}</strong></li>)}</ul>
  </div>;
};
