'use client';

import './traffic-overview-breakdown.scss';
import type { CSSProperties } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { AnalyticsBreakdown } from '../../../shared/analytics/types';
import TrafficSegmentIcon from '../traffic-segment-icon/traffic-segment-icon';
import { getTrafficSegmentIdentity } from '../traffic-segment-icon/traffic-segment-identity';
import { formatTrafficCount, isOtherTrafficSegment, type TrafficMetric, type TrafficSegment } from '../data';

type TrafficOverviewBreakdownProps = {
  id: string;
  total: number;
  loading: boolean;
  selected: string;
  showShare: boolean;
  view: `bars` | `list`;
  metric: TrafficMetric;
  segment: TrafficSegment;
  rows: AnalyticsBreakdown[];
  onSelect: (value: string) => void;
};

const segmentLabels: Record<TrafficSegment, string> = { path: `Pages`, device: `Devices`, country: `Countries`, referrer: `Sources` };

const TrafficOverviewBreakdown = ({ id, rows, view, total, metric, segment, loading, selected, showShare, onSelect }: TrafficOverviewBreakdownProps) => {
  const rankedRows = [...rows].sort((first, second) => second[metric] - first[metric] || first.value.localeCompare(second.value));
  const largest = Math.max(0, ...rankedRows.map((row) => row[metric]));
  const alternateMetric = metric === `visitors` ? `pageviews` : `visitors`;
  const metricLabel = metric === `visitors` ? `Visitors` : `Page Views`;
  const alternateLabel = metric === `visitors` ? `Page Views` : `Visitors`;
  const shareLabel = metric === `visitors` ? `Of Reported Visitors` : `Page View Share`;

  return (
    <div id={id} className={`dd-traffic-overview-breakdown is-${view}${loading ? ` is-loading` : ``}`} aria-busy={loading}>
      <div id={`${id}-heading`} className={`dd-traffic-overview-breakdown-heading`}>
        <span id={`${id}-result-count`} className={`dd-traffic-overview-breakdown-caption`}>{formatTrafficCount(rankedRows.length)} Result(s) · Ranked By {metricLabel}</span>
        <span id={`${id}-metric-label`} className={`dd-traffic-overview-breakdown-caption`}>{showShare ? shareLabel : metricLabel}</span>
      </div>
      <div
        tabIndex={0}
        role={`region`}
        key={`${segment}:${metric}:${view}`}
        id={`${id}-scroll`}
        className={`dd-traffic-overview-breakdown-scroll`}
        aria-label={`${segmentLabels[segment]} Ranked By ${metricLabel}`}
      >
        {rankedRows.length ? <ol id={`${id}-rows`} className={`dd-traffic-overview-breakdown-rows`}>
          {rankedRows.map((row, index) => {
            const { value } = row;
            const identity = getTrafficSegmentIdentity(segment, value);
            const isOther = isOtherTrafficSegment(value);
            const accessibleLabel = identity.caption ? `${identity.label} (${identity.caption})` : identity.label;
            const share = total > 0 ? row[metric] / total * 100 : 0;
            const relativeCount = largest > 0 ? row[metric] / largest * 100 : 0;
            const width = Math.min(100, Math.max(0, showShare ? share : relativeCount));
            const rowId = `${id}-${segment}-row-${index}`;

            return <li key={`${segment}:${value}`} id={rowId} className={`dd-traffic-overview-breakdown-row`} style={{ '--dd-overview-segment-delay': `${Math.min(index, 12) * 28}ms` } as CSSProperties}>
              <button
                type={`button`}
                id={`${rowId}-select`}
                onClick={() => onSelect(value)}
                disabled={loading || isOther}
                aria-pressed={selected === value}
                title={identity.caption ?? identity.label}
                className={`dd-traffic-overview-breakdown-button${selected === value ? ` is-selected` : ``}${isOther ? ` is-other` : ``}`}
                aria-label={`${accessibleLabel}: ${formatTrafficCount(row[metric])} ${metricLabel}, ${formatTrafficCount(row[alternateMetric])} ${alternateLabel}${showShare ? `, ${share.toFixed(1)}% ${shareLabel}` : ``}${isOther ? `` : `. Filter By ${accessibleLabel}`}`}
              >
                <span id={`${rowId}-rank`} className={`dd-traffic-overview-breakdown-rank`} aria-hidden={`true`}>{index + 1}</span>
                <TrafficSegmentIcon identity={identity} id={`${rowId}-icon`} />
                <span id={`${rowId}-identity`} className={`dd-traffic-overview-breakdown-identity`}>
                  <span id={`${rowId}-label`} className={`dd-traffic-overview-breakdown-label`}>{identity.label}</span>
                  {identity.caption && <span id={`${rowId}-raw`} className={`dd-traffic-overview-breakdown-raw`}>{identity.caption}</span>}
                </span>
                <span id={`${rowId}-values`} className={`dd-traffic-overview-breakdown-values`}>
                  <span id={`${rowId}-primary`} className={`dd-traffic-overview-breakdown-primary`}><strong id={`${rowId}-count`} className={`dd-traffic-overview-breakdown-count`}>{formatTrafficCount(row[metric])}</strong>{showShare && <span id={`${rowId}-share`} className={`dd-traffic-overview-breakdown-share`}>{share.toFixed(1)}%</span>}</span>
                  <span id={`${rowId}-alternate`} className={`dd-traffic-overview-breakdown-alternate`}>{formatTrafficCount(row[alternateMetric])} {alternateLabel}</span>
                </span>
                {view === `bars` && <span id={`${rowId}-track`} className={`dd-traffic-overview-breakdown-track`} aria-hidden={`true`}><span id={`${rowId}-bar`} className={`dd-traffic-overview-breakdown-bar`} style={{ width: `${width}%` }} /></span>}
                {!isOther && <ArrowUpRight size={11} id={`${rowId}-arrow`} className={`dd-traffic-overview-breakdown-arrow`} aria-hidden={`true`} />}
              </button>
            </li>;
          })}
        </ol> : <p role={`status`} id={`${id}-empty`} className={`dd-traffic-overview-breakdown-empty`}>{loading ? `Loading Traffic Segments` : `No Traffic Recorded For These Filters`}</p>}
      </div>
    </div>
  );
};

export default TrafficOverviewBreakdown;
