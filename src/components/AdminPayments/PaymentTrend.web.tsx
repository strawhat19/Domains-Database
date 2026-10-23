import { MoveHorizontal } from 'lucide-react';
import type { PaymentTrendProps } from './types';
import { useRef, useState, useEffect } from 'react';
import { dayLabel, metricValue, metricReading, trendGeometry } from './data';

const PaymentTrend = ({ id, points, series }: PaymentTrendProps) => {
  const plotRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  useEffect(() => {
    const element = plotRef.current;
    if (!element) return;
    const measure = () => setWidth(Math.max(180, element.getBoundingClientRect().width));
    measure();
    if (typeof ResizeObserver !== `undefined`) {
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    }
    window.addEventListener(`resize`, measure);
    return () => window.removeEventListener(`resize`, measure);
  }, []);
  const height = 220;
  const geometry = trendGeometry(points, series, width, height);
  const activeIndex = Math.min(hovered ?? selected ?? points.length - 1, points.length - 1);
  const active = points?.[activeIndex];
  const indexAt = (clientX: number, element: SVGSVGElement) => {
    const bounds = element.getBoundingClientRect();
    const x = (clientX - bounds.left) / Math.max(1, bounds.width) * width;
    return Math.min(points.length - 1, Math.max(0, Math.round((x - geometry.plot.left) / (geometry.plot.right - geometry.plot.left) * (points.length - 1))));
  };
  const labels = [...new Set([0, ...(width >= 420 ? [Math.floor((points.length - 1) / 2)] : []), points.length - 1])].filter(index => points?.[index]);
  return <div id={`${id}-trend`} className={`admin-payments-trend`}>
    <div id={`${id}-legend`} className={`admin-payments-legend`}>{series.map(item => <span key={item.key} id={`${id}-legend-${item.key}`} className={`admin-payments-legend-item`}><i id={`${id}-legend-dot-${item.key}`} className={`admin-payments-dot is-${item.tone}`} aria-hidden />{item.label}</span>)}</div>
    <div id={`${id}-reading`} className={`admin-payments-reading`} aria-live={`polite`}><span id={`${id}-reading-date`}>{active ? `${dayLabel(active.date, true)} · UTC` : `No Measurements`}</span><strong id={`${id}-reading-value`}>{metricReading(active, series)}</strong></div>
    <div ref={plotRef} id={`${id}-plot`} className={`admin-payments-plot`}>
      <svg id={`${id}-svg`} className={`admin-payments-svg`} viewBox={`0 0 ${width} ${height}`} role={`img`} aria-labelledby={`${id}-svg-title ${id}-svg-description`} onPointerLeave={() => setHovered(null)} onPointerMove={event => setHovered(indexAt(event.clientX, event.currentTarget))} onPointerDown={event => { setSelected(indexAt(event.clientX, event.currentTarget)); setHovered(null); }}>
        <title id={`${id}-svg-title`}>{series.map(item => item.label).join(` And `)} By UTC Day</title>
        <desc id={`${id}-svg-description`}>{`Missing measurements retain their day and break the line. Use Day Timeline or List to inspect every value. ${geometry.measured ? `` : `No measurements are available.`}`}</desc>
        {[0, .5, 1].map(fraction => <g key={fraction} id={`${id}-axis-${fraction}`} aria-hidden>
          <line id={`${id}-grid-${fraction}`} x1={geometry.plot.left} x2={geometry.plot.right} y1={geometry.y(geometry.ceiling * fraction)} y2={geometry.y(geometry.ceiling * fraction)} className={`admin-payments-grid-line`} vectorEffect={`non-scaling-stroke`} />
          <text id={`${id}-tick-${fraction}`} x={geometry.plot.left - 8} y={geometry.y(geometry.ceiling * fraction) + 4} textAnchor={`end`} className={`admin-payments-axis`}>{metricValue(series[0]?.key ?? ``, geometry.ceiling * fraction)}</text>
        </g>)}
        {geometry.lines.map(line => <g key={line.key} id={`${id}-series-${line.key}`} className={`admin-payments-series is-${line.tone}`} aria-hidden>
          <path id={`${id}-line-${line.key}`} d={line.path} fill={`none`} strokeWidth={2.5} vectorEffect={`non-scaling-stroke`} strokeLinejoin={`round`} strokeLinecap={`round`} />
          {line.coordinates.map((point, index) => point.y === null ? null : <circle key={index} id={`${id}-point-${line.key}-${index}`} cx={point.x} cy={point.y} r={index === activeIndex ? 4 : 1.8} strokeWidth={1} vectorEffect={`non-scaling-stroke`} />)}
        </g>)}
        {active ? <line id={`${id}-selection`} x1={geometry.x(activeIndex)} x2={geometry.x(activeIndex)} y1={geometry.plot.top} y2={geometry.plot.bottom} className={`admin-payments-guide`} vectorEffect={`non-scaling-stroke`} aria-hidden /> : null}
        {labels.map(index => <text key={index} id={`${id}-date-${index}`} x={geometry.x(index)} y={height - 7} className={`admin-payments-axis`} textAnchor={index === 0 ? `start` : index === points.length - 1 ? `end` : `middle`} aria-hidden>{dayLabel(points[index].date)}</text>)}
      </svg>
    </div>
    {!geometry.measured ? <p id={`${id}-measurements-unavailable`} className={`admin-payments-caption`}>{`No Measurements Available For This Chart`}</p> : null}
    {points.length > 1 ? <label id={`${id}-timeline-label`} className={`admin-payments-timeline`} htmlFor={`${id}-timeline`}>
      <span id={`${id}-timeline-copy`} className={`admin-payments-timeline-copy`}><span id={`${id}-timeline-caption`}><MoveHorizontal id={`${id}-timeline-icon`} size={13} aria-hidden />Day Timeline</span><span id={`${id}-timeline-hint`}>{`Drag Or Use Arrow Keys To Inspect`}</span></span>
      <input id={`${id}-timeline`} className={`admin-payments-slider`} type={`range`} min={0} max={points.length - 1} step={1} value={Math.max(0, activeIndex)} aria-labelledby={`${id}-timeline-caption`} aria-describedby={`${id}-timeline-hint`} aria-valuetext={active ? `${dayLabel(active.date, true)}, ${metricReading(active, series)}` : `No Measurements`} onChange={event => { setHovered(null); setSelected(Number(event.target.value)); }} />
    </label> : null}
    <p id={`${id}-missing-note`} className={`admin-payments-caption`}>{`UTC Daily Buckets · — Means Unavailable · Today Is Partial`}</p>
  </div>;
};
export default PaymentTrend;
