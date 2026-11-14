import { useState } from 'react';
import { useAfternicActivity } from './useAfternicActivity';
import { Activity, LoaderCircle, RefreshCw, Search, X } from 'lucide-react';
import { afternicActivityRanges } from '../../shared/marketplaceAfternic/activity';
import { activityCheckedAt, activitySaleDetails, activitySalesCoverage, activityStatsPresentation } from './activityPresentation';

const AfternicActivity = () => {
  const [open, setOpen] = useState(false);
  const state = useAfternicActivity();
  const stats = state.stats ? activityStatsPresentation(state.stats) : null;
  const domainStats = state.domainStats ? activityStatsPresentation(state.domainStats) : null;
  const sales = state.sales;

  return <section id={`afternic-activity`} className={`afternic-activity`} aria-labelledby={`afternic-activity-heading`}>
    <h3 id={`afternic-activity-heading`} className={`marketplace-afternic-subtitle`}>
      <button type={`button`} id={`afternic-activity-toggle`} className={`marketplace-afternic-button`} aria-expanded={open} aria-controls={open ? `afternic-activity-content` : undefined}
        onClick={() => { if (!open && !state.stats && !sales && !state.busy) void state.load(state.days); setOpen(!open); }}>
        <Activity size={15} aria-hidden />{`Afternic Activity`}
      </button>
    </h3>
    {open && <div id={`afternic-activity-content`} className={`marketplace-afternic-list`} aria-busy={state.busy}>
      <div id={`afternic-activity-actions`} className={`marketplace-afternic-actions`}>
        {afternicActivityRanges.map(days => <button key={days} type={`button`} id={`afternic-activity-range-${days}`} className={`marketplace-afternic-button`}
          aria-pressed={days === state.days} onClick={() => { if (days !== state.days) void state.load(days); }}>{`${days} Days`}</button>)}
        <button type={`button`} id={`afternic-activity-refresh`} className={`marketplace-afternic-button`} disabled={state.busy} onClick={() => void state.load(state.days)}>
          {state.busy ? <LoaderCircle size={15} className={`afternic-activity-spinner`} aria-hidden /> : <RefreshCw size={15} aria-hidden />}
          {state.busy ? `Checking Afternic…` : `Refresh Activity`}
        </button>
      </div>
      <div id={`afternic-activity-stats`} className={`marketplace-afternic-list`}>
        <h4 id={`afternic-activity-stats-title`} className={`marketplace-afternic-subtitle`}>{`Account Views And Leads`}</h4>
        {state.statsError && <p id={`afternic-activity-stats-error`} className={`marketplace-afternic-error`} role={`status`}>{state.statsError}</p>}
        {stats && state.stats && <>
          <p id={`afternic-activity-stats-counts`} className={`marketplace-afternic-note`}>{`${stats.views} · ${stats.leads} · ${stats.reported}`}</p>
          <p id={`afternic-activity-stats-freshness`} className={`marketplace-afternic-note`}>{`${stats.range} · ${activityCheckedAt(state.stats.checkedAt)}`}</p>
          {stats.rows.length > 0 && <details id={`afternic-activity-days`} className={`marketplace-afternic-note`}>
            <summary id={`afternic-activity-days-toggle`} className={`marketplace-afternic-details-label`}>{`Daily Breakdown`}</summary>
            <div id={`afternic-activity-days-scroll`} className={`afternic-activity-days-scroll`}>
              <table id={`afternic-activity-days-table`} className={`afternic-activity-days-table`} aria-label={`Daily Afternic Views And Leads`}>
                <thead><tr><th scope={`col`}>{`Date (UTC)`}</th><th scope={`col`}>{`Views`}</th><th scope={`col`}>{`Leads`}</th></tr></thead>
                <tbody>{stats.rows.map(row => <tr key={row.date} id={`afternic-activity-day-${row.date}`}><th scope={`row`}>{row.label}</th><td>{row.viewsLabel}</td><td>{row.leadsLabel}</td></tr>)}</tbody>
              </table>
            </div>
          </details>}
        </>}
      </div>
      <div id={`afternic-activity-sales`} className={`marketplace-afternic-list`}>
        <h4 id={`afternic-activity-sales-title`} className={`marketplace-afternic-subtitle`}>{`Sales History`}</h4>
        <div id={`afternic-activity-sales-filter`} className={`marketplace-afternic-actions`}>
          <input type={`search`} maxLength={253} id={`afternic-activity-sales-domain`} className={`afternic-activity-domain-input`}
            aria-label={`Choose A Domain For Afternic Sales And Activity`} placeholder={`example.com`} value={state.domainInput} onChange={event => state.setDomainInput(event.currentTarget.value)}
            onKeyDown={event => { if (event.key === `Enter` && !state.busy) { event.preventDefault(); state.filterSales(); } }} />
          <button type={`button`} id={`afternic-activity-sales-apply`} className={`marketplace-afternic-button`} disabled={state.busy || !state.domainInput.trim()} onClick={state.filterSales}>
            <Search size={14} aria-hidden />{`Filter Sales`}
          </button>
          {state.domain && <button type={`button`} id={`afternic-activity-sales-clear`} className={`marketplace-afternic-button`} disabled={state.busy} onClick={state.clearSalesFilter}>
            <X size={14} aria-hidden />{`Clear Filter`}
          </button>}
        </div>
        {state.salesError && <p id={`afternic-activity-sales-error`} className={`marketplace-afternic-error`} role={`status`}>{state.salesError}</p>}
        {sales && <>
          <p id={`afternic-activity-sales-freshness`} className={`marketplace-afternic-note`}>{`${activitySalesCoverage(sales)} · ${activityCheckedAt(sales.checkedAt)}`}</p>
          {sales.skipped > 0 && <p id={`afternic-activity-sales-skipped`} className={`marketplace-afternic-note`}>{`${sales.skipped} Unreadable Or Duplicate Row(s)`}</p>}
          {sales.sales.length > 0 && <ul id={`afternic-activity-sale-list`} className={`marketplace-afternic-grid`}>
            {sales.sales.map(sale => <li id={`afternic-sale-${sale.id}`} key={sale.id} className={`marketplace-afternic-card`}>
              <strong id={`afternic-sale-domain-${sale.id}`} className={`marketplace-afternic-domain`}>{sale.domain}</strong>
              {activitySaleDetails(sale).map(detail => <span key={detail.id} id={`afternic-sale-${sale.id}-${detail.id}`} className={`marketplace-afternic-note`}>{detail.label}</span>)}
            </li>)}
          </ul>}
          {sales.nextOffset !== null && <button type={`button`} id={`afternic-activity-sales-more`} className={`marketplace-afternic-button`} disabled={state.busy}
            onClick={() => void state.load(state.days, sales)}>{`Load More Sales`}</button>}
        </>}
      </div>
      {state.domain && <div id={`afternic-activity-domain-stats`} className={`marketplace-afternic-list`} aria-busy={state.domainStatsBusy}>
        <h4 id={`afternic-activity-domain-stats-title`} className={`marketplace-afternic-subtitle`}>{`Afternic Views And Leads · ${state.domain}`}</h4>
        <button type={`button`} id={`afternic-activity-domain-stats-load`} className={`marketplace-afternic-button`} disabled={state.domainStatsBusy || state.busy}
          onClick={() => void state.loadDomainStats()}>
          {state.domainStatsBusy ? <LoaderCircle size={15} className={`afternic-activity-spinner`} aria-hidden /> : <Activity size={15} aria-hidden />}
          {state.domainStatsBusy ? `Checking Domain Activity…` : domainStats ? `Refresh Domain Activity` : `Check Domain Activity`}
        </button>
        {state.domainStatsError && <p id={`afternic-activity-domain-stats-error`} className={`marketplace-afternic-error`} role={`status`}>{state.domainStatsError}</p>}
        {domainStats && state.domainStats && <>
          <p id={`afternic-activity-domain-stats-counts`} className={`marketplace-afternic-note`}>{`${domainStats.views} · ${domainStats.leads} · ${domainStats.reported}`}</p>
          <p id={`afternic-activity-domain-stats-freshness`} className={`marketplace-afternic-note`}>{`${domainStats.range} · ${activityCheckedAt(state.domainStats.checkedAt)}`}</p>
          {domainStats.rows.length > 0 && <details id={`afternic-activity-domain-days`} className={`marketplace-afternic-note`}>
            <summary id={`afternic-activity-domain-days-toggle`} className={`marketplace-afternic-details-label`}>{`Daily Breakdown`}</summary>
            <div id={`afternic-activity-domain-days-scroll`} className={`afternic-activity-days-scroll`}>
              <table id={`afternic-activity-domain-days-table`} className={`afternic-activity-days-table`} aria-label={`Daily Afternic Views And Leads For ${state.domain}`}>
                <thead><tr><th scope={`col`}>{`Date (UTC)`}</th><th scope={`col`}>{`Views`}</th><th scope={`col`}>{`Leads`}</th></tr></thead>
                <tbody>{domainStats.rows.map(row => <tr key={row.date} id={`afternic-activity-domain-day-${row.date}`}><th scope={`row`}>{row.label}</th><td>{row.viewsLabel}</td><td>{row.leadsLabel}</td></tr>)}</tbody>
              </table>
            </div>
          </details>}
        </>}
      </div>}
    </div>}
  </section>;
};

export default AfternicActivity;
