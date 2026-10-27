import { useState } from 'react';
import { formatGitHubDate, formatGitHubCount } from '../data';
import { Eye, Copy, CalendarDays, MoveHorizontal, GitCommitHorizontal } from 'lucide-react';
import type { GitHubTrendPoint } from '../../../shared/analytics/github.types';

export type GitHubMetric = `commits` | `views` | `clones`;
export const githubMetrics = { views: `Views`, clones: `Clones`, commits: `Commits` };
export const githubMetricIcons = { views: Eye, clones: Copy, commits: GitCommitHorizontal };
const plot = { top: 18, left: 48, right: 780, bottom: 204 };
const GitHubTrend = ({ points, metric }: { metric: GitHubMetric; points: GitHubTrendPoint[] }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const index = Math.max(0, Math.min(points.length - 1, hovered ?? selected ?? points.length - 1));
  const active = points?.[index];
  const peak = Math.max(0, ...points.map(point => point[metric] ?? 0));
  const ceiling = Math.max(4, Math.ceil(peak / 4) * 4);
  const coordinates = points.map((point, position) => ({ ...point, x: plot.left + position / Math.max(1, points.length - 1) * (plot.right - plot.left), y: point[metric] == null ? null : plot.bottom - point[metric] / ceiling * (plot.bottom - plot.top) }));
  const segments: typeof coordinates[] = [];
  coordinates.forEach((point, position) => {
    if (point.y == null) return;
    if (position === 0 || coordinates?.[position - 1]?.y == null) segments.push([]);
    segments[segments.length - 1]?.push(point);
  });
  const activePoint = coordinates?.[index];
  const labels = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])].filter(position => points?.[position]);
  const MetricIcon = githubMetricIcons[metric];
  return <div id={`github-trend`} className={`dd-github-trend`}>
    <div id={`github-trend-reading`} className={`dd-github-reading`} aria-live={`polite`}>
      <span id={`github-trend-reading-date`} className={`dd-github-caption`}><CalendarDays id={`github-trend-reading-date-icon`} size={14} aria-hidden={`true`} />{formatGitHubDate(active?.date)}</span>
      <strong id={`github-trend-reading-value`} className={`dd-github-reading-value`}><MetricIcon id={`github-trend-reading-metric-icon`} size={15} aria-hidden={`true`} />{active?.[metric] == null ? `No Measurement` : `${formatGitHubCount(active[metric])} ${githubMetrics[metric]}`}</strong>
    </div>
    <svg
      role={`img`}
      viewBox={`0 0 800 244`}
      id={`github-trend-chart`}
      className={`dd-github-chart`}
      onPointerLeave={() => setHovered(null)}
      aria-labelledby={`github-trend-title github-trend-description`}
      onPointerMove={event => {
        const matrix = event.currentTarget.getScreenCTM();
        if (!matrix) return;
        const pointer = event.currentTarget.createSVGPoint();
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        const x = pointer.matrixTransform(matrix.inverse()).x;
        setHovered(Math.max(0, Math.min(points.length - 1, Math.round((x - plot.left) / (plot.right - plot.left) * (points.length - 1)))));
      }}
    >
      <title id={`github-trend-title`}>{githubMetrics[metric]} By Day</title>
      <desc id={`github-trend-description`}>Daily UTC counts. Gaps indicate unavailable measurements. Use the Day Timeline or Daily Data table to inspect each date.</desc>
      <defs><linearGradient id={`github-trend-fill`} x1={0} y1={0} x2={0} y2={1}><stop offset={`0%`} stopColor={`currentColor`} stopOpacity={.22} /><stop offset={`100%`} stopColor={`currentColor`} stopOpacity={0} /></linearGradient></defs>
      {[0, 1, 2, 3, 4].map(tick => { const y = plot.bottom - tick / 4 * (plot.bottom - plot.top); return <g key={tick} id={`github-trend-grid-${tick}`} className={`dd-github-grid`} aria-hidden={`true`}><line x1={plot.left} y1={y} x2={plot.right} y2={y} /><text x={plot.left - 10} y={y + 4} textAnchor={`end`}>{formatGitHubCount(ceiling / 4 * tick)}</text></g>; })}
      {segments.map((segment, position) => { const line = segment.map((point, pointIndex) => `${pointIndex ? `L` : `M`}${point.x},${point.y}`).join(` `); const first = segment?.[0]; const last = segment?.[segment.length - 1]; return <g key={`${metric}-${position}`} id={`github-trend-segment-${position}`} aria-hidden={`true`}>
        {first && last && segment.length > 1 && <path id={`github-trend-area-${position}`} d={`${line} L${last.x},${plot.bottom} L${first.x},${plot.bottom} Z`} fill={`url(#github-trend-fill)`} className={`dd-github-chart-area`} />}
        <path id={`github-trend-line-${position}`} d={line} pathLength={1} className={`dd-github-chart-line`} />
        {segment.map(point => <circle key={point.date} id={`github-trend-point-${point.date}`} cx={point.x} cy={point.y ?? plot.bottom} r={2} className={`dd-github-chart-point`} />)}
      </g>; })}
      {activePoint && <g id={`github-trend-active`} className={`dd-github-chart-active`} aria-hidden={`true`}><line x1={activePoint.x} y1={plot.top} x2={activePoint.x} y2={plot.bottom} />{activePoint.y != null && <circle cx={activePoint.x} cy={activePoint.y} r={5} />}</g>}
      {labels.map(position => <text key={position} id={`github-trend-date-${position}`} x={coordinates[position].x} y={230} textAnchor={position === 0 ? `start` : position === points.length - 1 ? `end` : `middle`} className={`dd-github-chart-label`} aria-hidden={`true`}>{formatGitHubDate(points[position].date).replace(/, \d{4}$/, ``)}</text>)}
    </svg>
    {points.length > 1 && <label id={`github-trend-timeline-label`} htmlFor={`github-trend-timeline`} className={`dd-github-timeline`}>
      <span id={`github-trend-timeline-copy`} className={`dd-github-caption`}><MoveHorizontal size={13} aria-hidden={`true`} />Day Timeline · Drag To Inspect</span>
      <input min={0} step={1} type={`range`} value={index} max={points.length - 1} id={`github-trend-timeline`} className={`dd-github-slider`} aria-label={`Day Timeline`} aria-valuetext={`${formatGitHubDate(active?.date)}: ${active?.[metric] == null ? `No Measurement` : `${formatGitHubCount(active[metric])} ${githubMetrics[metric]}`}`} onChange={event => { setHovered(null); setSelected(Number(event.target.value)); }} />
    </label>}
  </div>;
};
export default GitHubTrend;
