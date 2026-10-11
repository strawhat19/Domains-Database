'use client';

import './traffic-breakdown.scss';
import { useState, type CSSProperties } from 'react';
import type { AnalyticsBreakdown } from '../../../shared/analytics/types';
import TrafficSegmentIcon from '../traffic-segment-icon/traffic-segment-icon';
import { ArrowUpRight, ChevronDown, ChevronUp, type LucideIcon } from 'lucide-react';
import { getTrafficSegmentIdentity } from '../traffic-segment-icon/traffic-segment-identity';
import { formatTrafficCount, formatTrafficSegment, isOtherTrafficSegment, type TrafficSegment } from '../data';

const deviceColors: Record<string, string> = { mobile: `var(--accent)`, tablet: `var(--warning)`, desktop: `var(--muted)`, unknown: `var(--line)` };
type TrafficBreakdownProps = { title: string; total: number; icon: LucideIcon; segment: TrafficSegment; selected: string; rows: AnalyticsBreakdown[]; onSelect: (value: string) => void };

const TrafficBreakdown = ({ rows, title, total, icon: Icon, segment, selected, onSelect }: TrafficBreakdownProps) => {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = rows.slice(0, expanded ? rows.length : 6);
  const donutTotal = rows.reduce((count, row) => count + row.pageviews, 0);
  let segmentStart = 0;
  const donutSegments = rows.filter(({ pageviews }) => pageviews > 0).map((row) => { const start = segmentStart; const length = row.pageviews / Math.max(1, donutTotal) * 100; segmentStart += length; return { ...row, start, length }; });

  return (
    <section id={`dd-traffic-breakdown-${segment}`} className={`dd-traffic-panel dd-traffic-breakdown is-${segment}`} aria-labelledby={`dd-traffic-breakdown-title-${segment}`}>
      <div id={`dd-traffic-breakdown-heading-${segment}`} className={`dd-traffic-panel-heading`}>
        <h3 id={`dd-traffic-breakdown-title-${segment}`} className={`dd-traffic-panel-title`}><Icon className={`dd-report-icon`} size={17} aria-hidden={`true`} />{title}</h3>
        <span id={`dd-traffic-breakdown-caption-${segment}`} className={`dd-traffic-caption`}>Page Views</span>
      </div>
      {segment === `device` && donutTotal > 0 && <div id={`dd-traffic-device-donut`} className={`dd-traffic-device-donut`} role={`img`} aria-label={rows.map(({ value, pageviews }) => `${formatTrafficSegment(segment, value)}: ${formatTrafficCount(pageviews)} page views`).join(`, `)}>
        <svg viewBox={`0 0 132 132`} id={`dd-traffic-device-rings`} className={`dd-traffic-device-rings`} aria-hidden={`true`}>
          <circle r={54} cx={66} cy={66} id={`dd-traffic-device-track`} className={`dd-traffic-device-track`} />
          {donutSegments.map(({ value, start, length }, index) => <circle r={54} cx={66} cy={66} key={value} pathLength={100} id={`dd-traffic-device-segment-${index}`} className={`dd-traffic-device-segment`} stroke={deviceColors[value] ?? deviceColors.unknown} style={{ strokeDashoffset: -start, strokeDasharray: `${length} ${100 - length}`, '--dd-traffic-delay': `${index * 100}ms` } as CSSProperties} />)}
        </svg>
        <span id={`dd-traffic-device-center`} className={`dd-traffic-device-center`} aria-hidden={`true`}><strong id={`dd-traffic-device-total`} className={`dd-traffic-device-total`}>{formatTrafficCount(donutTotal)}</strong><span id={`dd-traffic-device-label`} className={`dd-traffic-caption`}>Page Views</span></span>
      </div>}
      {visibleRows.length ? <ol id={`dd-traffic-breakdown-list-${segment}`} className={`dd-traffic-breakdown-list`}>
        {visibleRows.map(({ value, visitors, pageviews }, index) => {
          const share = total ? pageviews / total * 100 : 0;
          const identity = getTrafficSegmentIdentity(segment, value);
          const { label, caption } = identity;
          const accessibleLabel = caption ? `${label} (${caption})` : label;
          return <li key={value} id={`dd-traffic-breakdown-row-${segment}-${index}`} className={`dd-traffic-breakdown-row`} style={{ '--dd-traffic-delay': `${index * 45}ms` } as CSSProperties}>
            <button
              type={`button`}
              onClick={() => onSelect(value)}
              aria-pressed={selected === value}
              disabled={isOtherTrafficSegment(value)}
              id={`dd-traffic-breakdown-select-${segment}-${index}`}
              className={`dd-traffic-breakdown-button${selected === value ? ` is-selected` : ``}`}
              aria-label={`${accessibleLabel}: ${formatTrafficCount(pageviews)} Page Views, ${formatTrafficCount(visitors)} Visitors${isOtherTrafficSegment(value) ? `` : `. Filter Report By ${accessibleLabel}`}`}
            >
              <span id={`dd-traffic-breakdown-name-${segment}-${index}`} className={`dd-traffic-breakdown-name`} style={segment === `device` ? { '--dd-traffic-device-color': deviceColors[value.toLowerCase()] ?? deviceColors.unknown } as CSSProperties : undefined}>
                <TrafficSegmentIcon key={`${segment}:${value}`} identity={identity} id={`dd-traffic-breakdown-icon-${segment}-${index}`} />
                <span id={`dd-traffic-breakdown-identity-${segment}-${index}`} className={`dd-traffic-breakdown-identity`}><span title={label} id={`dd-traffic-breakdown-label-${segment}-${index}`} className={`dd-traffic-breakdown-label`}>{label}</span>{caption && <span title={caption} id={`dd-traffic-breakdown-raw-${segment}-${index}`} className={`dd-traffic-breakdown-raw`}>{caption}</span>}</span>
              </span>
              <span id={`dd-traffic-breakdown-value-${segment}-${index}`} className={`dd-traffic-breakdown-value`}>{formatTrafficCount(pageviews)}<span id={`dd-traffic-breakdown-share-${segment}-${index}`} className={`dd-traffic-breakdown-share`}>{share.toFixed(1)}%</span></span>
              <span id={`dd-traffic-breakdown-track-${segment}-${index}`} className={`dd-traffic-breakdown-track`} aria-hidden={`true`}><span id={`dd-traffic-breakdown-bar-${segment}-${index}`} className={`dd-traffic-breakdown-bar`} style={{ width: `${Math.min(100, Math.max(0, share))}%` }} /></span>
              <span id={`dd-traffic-breakdown-visitors-${segment}-${index}`} className={`dd-traffic-breakdown-visitors`}>{formatTrafficCount(visitors)} Visitor(s)</span>
              {!isOtherTrafficSegment(value) && <ArrowUpRight size={12} className={`dd-traffic-breakdown-arrow`} aria-hidden={`true`} />}
            </button>
          </li>;
        })}
      </ol> : <p id={`dd-traffic-breakdown-empty-${segment}`} className={`dd-traffic-empty-caption`}>No Traffic In This Segment Yet</p>}
      {rows.length > 6 && <button type={`button`} id={`dd-traffic-breakdown-expand-${segment}`} className={`dd-traffic-text-button`} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? <ChevronUp className={`dd-report-icon`} size={13} aria-hidden={`true`} /> : <ChevronDown className={`dd-report-icon`} size={13} aria-hidden={`true`} />}{expanded ? `Show Less` : `Show ${formatTrafficCount(rows.length)} Results`}</button>}
    </section>
  );
};

export default TrafficBreakdown;
