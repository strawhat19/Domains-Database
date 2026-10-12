'use client';

import './traffic-overview-countries.scss';
import type { TrafficMetric } from '../data';
import { MapPin, ArrowUpRight } from 'lucide-react';
import type { AnalyticsBreakdown } from '../../../shared/analytics/types';
import TrafficOverviewBreakdown from '../traffic-overview-breakdown/traffic-overview-breakdown';

type TrafficOverviewCountriesProps = {
  id: string;
  total: number;
  inline?: boolean;
  loading: boolean;
  selected: string;
  showShare: boolean;
  view: `bars` | `list`;
  metric: TrafficMetric;
  rows: AnalyticsBreakdown[];
  onExplore: () => void;
  onSelect: (value: string) => void;
};

const TrafficOverviewCountries = ({ id, rows, view, total, metric, loading, selected, showShare, onSelect, onExplore, inline = false }: TrafficOverviewCountriesProps) => {
  return <section id={id} className={`dd-traffic-overview-countries${inline ? ` is-inline` : ``}`} aria-labelledby={`${id}-title`}>
    <div id={`${id}-heading`} className={`dd-traffic-overview-countries-heading`}>
      <h3 id={`${id}-title`} className={`dd-traffic-overview-countries-title`}><MapPin className={`dd-report-icon`} size={14} aria-hidden={`true`} />Countries</h3>
      <button
        type={`button`}
        onClick={onExplore}
        id={`${id}-explore`}
        aria-label={`View All Countries In The Countries Tab`}
        className={`dd-traffic-overview-countries-explore`}
      ><span id={`${id}-explore-label`}>View All</span><ArrowUpRight className={`dd-report-icon`} size={12} aria-hidden={`true`} /></button>
    </div>
    <div id={`${id}-content`} className={`dd-traffic-overview-countries-content`}>
      <TrafficOverviewBreakdown
        rows={rows}
        view={view}
        total={total}
        metric={metric}
        segment={`country`}
        loading={loading}
        selected={selected}
        onSelect={onSelect}
        showShare={showShare}
        id={`${id}-breakdown`}
      />
    </div>
  </section>;
};

export default TrafficOverviewCountries;
