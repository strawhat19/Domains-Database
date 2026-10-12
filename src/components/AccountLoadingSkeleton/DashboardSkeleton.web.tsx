import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Cpu, Globe, Users, FileText, BarChart3, Zap, ShieldAlert, Activity, Bell, Globe2, CircleCheck, CalendarClock } from 'lucide-react';

const prefix = `account-loading-dashboard`;
const Placeholder = ({ id, shape = `short` }: { id: string; shape?: string }) => <span id={`${prefix}-${id}`} className={`account-loading-placeholder is-${shape}`} />;
const Segments = ({ id, count }: { id: string; count: number }) => <div id={`${prefix}-${id}`} className={`account-loading-segmented`}>{Array.from({ length: count }, (_, index) => <Placeholder key={index} id={`${id}-${index}`} shape={`button`} />)}</div>;
const Tabs = ({ id, tabs }: { id: string; tabs: string[] }) => <div id={`${prefix}-${id}-tabs`} className={`account-loading-tabs`}>{tabs.map((tab, index) => <span key={tab} id={`${prefix}-${id}-tab-${tab}`} className={`account-loading-tab${!index ? ` is-active` : ``}`}><Placeholder id={`${id}-tab-icon-${tab}`} shape={`icon`} /><Placeholder id={`${id}-tab-label-${tab}`} /></span>)}</div>;

const Report = ({ id, title, Icon, children, countries = false }: { id: string; title: string; Icon: LucideIcon; children: ReactNode; countries?: boolean }) => (
  <section id={`${prefix}-${id}`} className={`account-loading-panel account-loading-report is-${id}`}>
    <div id={`${prefix}-${id}-heading`} className={`account-loading-panel-heading`}>
      <h2 id={`${prefix}-${id}-title`} className={`account-loading-report-title`}><Icon id={`${prefix}-${id}-icon`} size={19} aria-hidden={`true`} />{title}</h2>
      {countries && <div id={`${prefix}-${id}-countries`} className={`account-loading-countries`}>{[0, 1].map(index => <div key={index} id={`${prefix}-${id}-country-${index}`} className={`account-loading-country`}><Placeholder id={`${id}-country-icon-${index}`} shape={`icon`} /><Placeholder id={`${id}-country-label-${index}`} /><Placeholder id={`${id}-country-value-${index}`} shape={`value`} /></div>)}</div>}
      <div id={`${prefix}-${id}-actions`} className={`account-loading-report-actions`}><Placeholder id={`${id}-refresh`} shape={`icon`} /><Placeholder id={`${id}-export`} shape={`icon`} />{countries && <Placeholder id={`${id}-details`} shape={`button`} />}</div>
    </div>
    {children}
  </section>
);

const Metric = ({ id, label, Icon }: { id: string; label: string; Icon: LucideIcon }) => (
  <div id={`${prefix}-${id}-kpi`} className={`account-loading-kpi`}>
    <span id={`${prefix}-${id}-label`} className={`account-loading-kpi-label`}><Icon id={`${prefix}-${id}-icon`} size={12} aria-hidden={`true`} />{label}</span>
    <Placeholder id={`${id}-value`} shape={`value`} />
  </div>
);

const Chart = ({ id, heading = false }: { id: string; heading?: boolean }) => (
  <div id={`${prefix}-${id}-chart`} className={`account-loading-chart`}>
    {heading && <div id={`${prefix}-${id}-chart-heading`} className={`account-loading-chart-reading`}><Placeholder id={`${id}-chart-title`} shape={`title`} /><Placeholder id={`${id}-chart-period`} /></div>}
    <div id={`${prefix}-${id}-chart-reading`} className={`account-loading-chart-reading`}><Placeholder id={`${id}-chart-date`} /><Placeholder id={`${id}-chart-value`} shape={`value`} /></div>
    <div id={`${prefix}-${id}-plot`} className={`account-loading-plot`}><Placeholder id={`${id}-plot-surface`} shape={`plot`} /></div>
    <div id={`${prefix}-${id}-timeline`} className={`account-loading-timeline`}><Placeholder id={`${id}-timeline-label`} /><span id={`${prefix}-${id}-timeline-track`} className={`account-loading-timeline-track`}><span id={`${prefix}-${id}-timeline-handle`} className={`account-loading-timeline-handle`} /></span></div>
  </div>
);

const DashboardSkeleton = () => (
  <div id={prefix} className={`account-loading-dashboard`} aria-hidden={`true`}>
    <Report id={`traffic`} title={`Traffic`} Icon={Globe} countries>
      <Tabs id={`traffic`} tabs={[`overview`, `daily`, `countries`, `sources`, `pages`, `devices`]} />
      <div id={`${prefix}-traffic-toolbar`} className={`account-loading-toolbar`}>
        <Segments id={`traffic-periods`} count={4} />
        <Segments id={`traffic-metrics`} count={2} />
        <Segments id={`traffic-presentation`} count={2} />
        <Placeholder id={`traffic-filters`} shape={`button`} />
        <div id={`${prefix}-traffic-switches`} className={`account-loading-switches`}>{[0, 1, 2, 3].map(index => <span key={index} id={`${prefix}-traffic-switch-${index}`} className={`account-loading-switch`}><Placeholder id={`traffic-switch-track-${index}`} shape={`toggle`} /><Placeholder id={`traffic-switch-label-${index}`} /></span>)}</div>
      </div>
      <div id={`${prefix}-traffic-grid`} className={`account-loading-traffic-grid`}>
        <div id={`${prefix}-traffic-kpis`} className={`account-loading-kpis`}>
          <Metric id={`traffic-visitors`} label={`Visitors`} Icon={Users} />
          <Metric id={`traffic-pageviews`} label={`Page Views`} Icon={FileText} />
          <Metric id={`traffic-depth`} label={`Views Per Visitor`} Icon={BarChart3} />
        </div>
        <Chart id={`traffic`} />
      </div>
    </Report>
    <Report id={`health`} title={`Health`} Icon={Cpu}>
      <Tabs id={`health`} tabs={[`compute`, `memory`, `requests`, `latency`, `routes`, `statuses`, `cache`]} />
      <div id={`${prefix}-health-toolbar`} className={`account-loading-toolbar`}><Segments id={`health-periods`} count={3} /><Placeholder id={`health-metric-picker`} shape={`button`} /><Segments id={`health-presentation`} count={2} /></div>
      <div id={`${prefix}-health-kpis`} className={`account-loading-kpis`}>
        <Metric id={`health-requests`} label={`Requests`} Icon={Activity} />
        <Metric id={`health-invocations`} label={`Invocations`} Icon={Zap} />
        <Metric id={`health-cpu`} label={`Active CPU Time`} Icon={Cpu} />
        <Metric id={`health-errors`} label={`5xx Errors`} Icon={ShieldAlert} />
      </div>
      <Chart id={`health`} heading />
    </Report>
    <div id={`${prefix}-business-grid`} className={`account-loading-business-grid`}>
      <section id={`${prefix}-activity`} className={`account-loading-panel is-activity`}>
        <div id={`${prefix}-activity-heading`} className={`account-loading-panel-heading`}><h2 id={`${prefix}-activity-title`} className={`account-loading-report-title`}>Domain Activity</h2></div>
        <Placeholder id={`activity-description`} shape={`long`} />
        <div id={`${prefix}-activity-legend`} className={`account-loading-chart-reading`}><Placeholder id={`activity-accounts`} /><Placeholder id={`activity-domains`} /></div>
        <div id={`${prefix}-activity-plot`} className={`account-loading-plot is-business`}><Placeholder id={`activity-plot-surface`} shape={`plot`} /></div>
      </section>
      <section id={`${prefix}-status`} className={`account-loading-panel is-status`}>
        <div id={`${prefix}-status-heading`} className={`account-loading-panel-heading`}><h2 id={`${prefix}-status-title`} className={`account-loading-report-title`}>Domain Status</h2></div>
        <Placeholder id={`status-description`} />
        <div id={`${prefix}-status-distribution`} className={`account-loading-distribution`}><span id={`${prefix}-status-donut`} className={`account-loading-donut`} /><div id={`${prefix}-status-legend`} className={`account-loading-distribution-legend`}>{[0, 1, 2].map(index => <Placeholder key={index} id={`status-legend-${index}`} shape={`long`} />)}</div></div>
        <Placeholder id={`status-caption`} shape={`long`} />
      </section>
    </div>
    <div id={`${prefix}-summary`} className={`account-loading-summary`}>{[
      { id: `registered`, Icon: Users },
      { id: `users`, Icon: Users },
      { id: `domains`, Icon: Globe2 },
      { id: `notifications`, Icon: Bell },
      { id: `active`, Icon: CircleCheck },
      { id: `renewals`, Icon: CalendarClock },
    ].map(({ id, Icon }) => <div key={id} id={`${prefix}-summary-${id}`} className={`account-loading-summary-pill`}><Icon id={`${prefix}-summary-icon-${id}`} size={15} aria-hidden={`true`} /><Placeholder id={`summary-label-${id}`} /><Placeholder id={`summary-value-${id}`} shape={`value`} /></div>)}</div>
  </div>
);

export default DashboardSkeleton;
