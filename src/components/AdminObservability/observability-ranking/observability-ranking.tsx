import './observability-ranking.scss';
import type { CSSProperties } from 'react';
import { Route, Activity, Database } from 'lucide-react';
import type { ObservabilityRow, ObservabilityMetric } from '../../../shared/analytics/types';
import { getTrafficSegmentIdentity } from '../../AdminAnalytics/traffic-segment-icon/traffic-segment-identity';
import { observabilityMetrics, formatObservabilityValue, hasObservabilityValue, type ObservabilityRankingKind } from '../data.web';

type ObservabilityRankingProps = {
  id: string;
  total: number | null;
  view: `bars` | `list`;
  metric: ObservabilityMetric;
  rows: ObservabilityRow[];
  kind: ObservabilityRankingKind;
};

const rankingLabels = { routes: `Function Routes`, statuses: `HTTP Statuses`, cache: `Cache Results` };
const ObservabilityRanking = ({ id, rows, kind, view, total, metric }: ObservabilityRankingProps) => {
  const rankedRows = [...rows].sort((first, second) => (hasObservabilityValue(second.values[metric]) ? second.values[metric] : -1) - (hasObservabilityValue(first.values[metric]) ? first.values[metric] : -1) || first.value.localeCompare(second.value));
  const largest = Math.max(0, ...rankedRows.map((row) => hasObservabilityValue(row.values[metric]) ? row.values[metric] : 0));
  const label = observabilityMetrics[metric].label;
  const rankingDescription = `${kind === `routes` ? `Top 20 By Active CPU Time, Sorted By` : `Ranked By`} ${label}`;
  const alternateMetric = metric === `invocations` ? `cpuMs` : `invocations`;
  const identityFor = (value: string) => {
    const Icon = kind === `routes` ? Route : kind === `statuses` ? Activity : Database;
    if (!value) return { Icon, label: `Unclassified`, caption: undefined };
    if ([`__unknown__`, `unknown`].includes(value.toLowerCase())) return { Icon, label: `Unknown`, caption: undefined };
    return kind === `routes` ? getTrafficSegmentIdentity(`path`, value) : { Icon, label: value, caption: undefined };
  };

  return <section id={id} className={`dd-observability-ranking is-${view}`} aria-label={`${rankingLabels[kind]} ${rankingDescription}`}>
    <div id={`${id}-heading`} className={`dd-observability-ranking-heading`}><span id={`${id}-count`} role={`status`}>{rankedRows.length} Result(s){kind === `routes` && ` · Top 20 By CPU Time`}</span><span id={`${id}-label`}>{kind === `routes` ? `Sorted By` : `Ranked By`} {label}</span></div>
    {!rankedRows.length ? <p role={`status`} id={`${id}-empty`} className={`dd-observability-ranking-empty`}>No {rankingLabels[kind]} For This Period</p> : view === `list` ? <div id={`${id}-table-wrap`} className={`dd-observability-ranking-table-wrap`} tabIndex={0} role={`region`} aria-label={`${rankingLabels[kind]} Table`}>
      <table id={`${id}-table`} className={`dd-observability-ranking-table`}>
        <caption className={`dd-observability-sr`}>{rankingLabels[kind]} {rankingDescription}</caption>
        <thead><tr><th scope={`col`}>{kind === `routes` ? `Route` : kind === `statuses` ? `Status` : `Cache Result`}</th><th scope={`col`} title={observabilityMetrics[metric].description}>{label}</th><th scope={`col`}>{kind === `routes` ? observabilityMetrics[alternateMetric].label : `Request Share`}</th></tr></thead>
        <tbody>{rankedRows.map((row, index) => {
          const identity = identityFor(row.value);
          const value = row.values[metric];
          const share = hasObservabilityValue(value) && hasObservabilityValue(total) && total > 0 ? `${(value / total * 100).toFixed(1)}%` : `—`;
          return <tr key={row.value} id={`${id}-row-${index}`}><th scope={`row`} title={row.value || `Unclassified`}><span className={`dd-observability-ranking-identity`}><identity.Icon className={`dd-report-icon`} size={13} aria-hidden={`true`} /><span className={`dd-observability-ranking-copy`}><span>{identity.label}</span>{identity.caption && <small>{identity.caption}</small>}</span></span></th><td>{formatObservabilityValue(metric, value)}</td><td>{kind === `routes` ? formatObservabilityValue(alternateMetric, row.values[alternateMetric]) : share}</td></tr>;
        })}</tbody>
      </table>
    </div> : <div id={`${id}-scroll`} className={`dd-observability-ranking-scroll`} tabIndex={0} role={`region`} aria-label={`${rankingLabels[kind]} Rankings`}>
      <ol id={`${id}-rows`} className={`dd-observability-ranking-rows`}>{rankedRows.map((row, index) => {
        const identity = identityFor(row.value);
        const value = row.values[metric];
        const width = hasObservabilityValue(value) && largest > 0 ? Math.min(100, Math.max(0, value / largest * 100)) : 0;
        const share = hasObservabilityValue(value) && hasObservabilityValue(total) && total > 0 ? `${(value / total * 100).toFixed(1)}% Of Requests` : `Share Unavailable`;
        const rowId = `${id}-row-${index}`;
        return <li key={row.value} id={rowId} className={`dd-observability-ranking-row${kind === `statuses` && row.value.startsWith(`5`) ? ` is-error` : ``}`} style={{ '--dd-runtime-row-delay': `${Math.min(index, 12) * 25}ms` } as CSSProperties}>
          <span id={`${rowId}-rank`} className={`dd-observability-ranking-rank`} aria-hidden={`true`}>{index + 1}</span>
          <identity.Icon size={14} id={`${rowId}-icon`} className={`dd-observability-ranking-icon`} aria-hidden={`true`} />
          <span id={`${rowId}-identity`} className={`dd-observability-ranking-copy`} title={row.value || `Unclassified`}><span id={`${rowId}-label`}>{identity.label}</span>{identity.caption && <small id={`${rowId}-caption`}>{identity.caption}</small>}</span>
          <span id={`${rowId}-values`} className={`dd-observability-ranking-values`}><strong id={`${rowId}-value`}>{formatObservabilityValue(metric, value)}</strong><small id={`${rowId}-alternate`}>{kind === `routes` ? `${formatObservabilityValue(alternateMetric, row.values[alternateMetric])} ${observabilityMetrics[alternateMetric].label}` : share}</small></span>
          <span id={`${rowId}-track`} className={`dd-observability-ranking-track`} aria-hidden={`true`}>{hasObservabilityValue(value) && <span id={`${rowId}-bar`} className={`dd-observability-ranking-bar`} style={{ width: `${width}%` }} />}</span>
        </li>;
      })}</ol>
    </div>}
  </section>;
};

export default ObservabilityRanking;
