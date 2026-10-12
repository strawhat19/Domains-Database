import './styles.scss';
import PlanRow from './PlanRow';
import '../AdminUsers/records.scss';
import PlanEditor from './PlanEditor';
import EditorModal from './EditorModal';
import { createPortal } from 'react-dom';
import type { AdminPlansProps } from './types';
import { AdminLoading } from '../AdminWidgets';
import { useAdminPlans } from './useAdminPlans';
import { Layers3, Plus, Search, CircleCheck, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

const columns = [`No.`, `Plan`, `Price`, `Score`, `Features`, `Status`, `Order`, `Updated`, `Actions`];
const AdminPlans = ({ headingActionsTarget }: AdminPlansProps = {}) => {
  const state = useAdminPlans();
  if (!state.allowed) return <p id={`admin-plans-access`} className={`admin-records-error`} role={`alert`}>{`Active Admin Or Owner Access Is Required`}</p>;
  const record = state.editor && state.editor !== `new` ? state.editor : null;
  const editorId = record?.id ?? `new`;
  const addAction = <button type={`button`} disabled={state.busy || !!state.page.error} id={`admin-plans-add`} className={`admin-plans-add`} onClick={() => state.edit(`new`)}><Plus size={14} aria-hidden id={`admin-plans-add-icon`} className={`admin-plans-add-icon`} />{`Add Plan`}</button>;
  return <section id={`admin-plans`} className={`admin-plans admin-records`} aria-labelledby={`admin-plans-title`} aria-busy={state.busy}>
    <div id={`admin-plans-heading`} className={`admin-records-heading`}>
      <div id={`admin-plans-heading-copy`} className={`admin-records-heading-copy`}>
        <h2 id={`admin-plans-title`} className={headingActionsTarget ? `admin-records-table-caption` : `admin-records-title`}><Layers3 size={20} aria-hidden id={`admin-plans-title-icon`} className={`admin-plans-title-icon`} />{`Plan Directory`}</h2>
        <p id={`admin-plans-source`} className={`admin-records-note`}>{`${state.mode} · Page ${state.page.page} · Search And Filters Apply To This Page`}</p>
      </div>
      <dl id={`admin-plans-summary`} className={`admin-plans-summary`} aria-label={state.page.loading ? `Loading Plans Summary` : undefined}>
        {[
          { id: `total`, label: `Plans On This Page`, value: state.records.length },
          { id: `active`, label: `Active`, value: state.active },
          { id: `inactive`, label: `Inactive`, value: state.records.length - state.active },
        ].map(item => <div key={item.id} id={`admin-plans-summary-${item.id}`} className={`admin-plans-summary-card`}><dt id={`admin-plans-summary-${item.id}-label`} className={`admin-plans-summary-label`}>{item.label}</dt><dd id={`admin-plans-summary-${item.id}-value`} className={`admin-plans-summary-value`}>{state.page.loading ? <span id={`admin-plans-summary-${item.id}-skeleton`} className={`admin-plans-summary-skeleton`} aria-hidden /> : state.page.error ? `—` : item.value}</dd></div>)}
      </dl>
    </div>
    {!!state.error && <p id={`admin-plans-error`} className={`admin-records-error`} role={`alert`}>{state.error}</p>}
    {!!state.scores.error && <p id={`admin-plans-score-error`} className={`admin-records-error`} role={`alert`}>{`Plan Scores: ${state.scores.error}${state.scores.ready ? ` · Last Confirmed Scores` : ``}`}</p>}
    {!!state.notice && <p id={`admin-plans-notice`} className={`admin-records-notice`} role={`status`}><CircleCheck size={14} aria-hidden id={`admin-plans-notice-icon`} className={`admin-plans-notice-icon`} />{state.notice}</p>}
    {state.editor && <EditorModal busy={state.busy} error={state.error} key={editorId} onClose={state.closeEditor} id={`admin-plans-editor-modal`} labelledBy={`admin-plan-editor-${editorId}-title`}>{dismiss => <PlanEditor busy={state.busy} record={record} onSave={state.save} onClose={dismiss} />}</EditorModal>}
    <div id={`admin-plans-filters`} className={`admin-records-filters`}>
      <label id={`admin-plans-search-label`} htmlFor={`admin-plans-search`} className={`admin-records-search`}><Search size={15} aria-hidden id={`admin-plans-search-icon`} className={`admin-plans-search-icon`} /><input type={`search`} value={state.search} id={`admin-plans-search`} className={`admin-records-search-input`} aria-label={`Search Plans On This Page`} placeholder={`Search plans`} onChange={event => state.setSearch(event.currentTarget.value)} /></label>
      <label id={`admin-plans-filter-label`} htmlFor={`admin-plans-filter`} className={`admin-records-filter-label`}>{`Status`}</label>
      <select id={`admin-plans-filter`} value={state.filter} className={`admin-records-filter`} onChange={event => state.setFilter(event.currentTarget.value)}>
        <option id={`admin-plans-filter-all`} className={`admin-plans-filter-option`} value={`all`}>{`All Statuses`}</option>
        <option id={`admin-plans-filter-active`} className={`admin-plans-filter-option`} value={`active`}>{`Active`}</option>
        <option id={`admin-plans-filter-inactive`} className={`admin-plans-filter-option`} value={`inactive`}>{`Inactive`}</option>
      </select>
      <div id={`admin-plans-filter-actions`} className={`admin-plans-filter-actions`}>{headingActionsTarget ? createPortal(addAction, headingActionsTarget) : addAction}</div>
    </div>
    <div id={`admin-plans-table-wrap`} className={`admin-records-table-wrap`} tabIndex={0} role={`region`} aria-label={`Plan Directory Table`}>
      <table id={`admin-plans-table`} className={`admin-records-table admin-plans-table`}>
        <caption id={`admin-plans-caption`} className={`admin-records-table-caption`}>{`Saved Pricing Plans · Realtime Page ${state.page.page}`}</caption>
        <thead id={`admin-plans-table-head`} className={`admin-records-table-head`}><tr id={`admin-plans-column-row`} className={`admin-records-column-row`}>{columns.map((label, index) => <th key={label} scope={`col`} id={`admin-plans-column-${index}`} className={`admin-records-column`}>{label}</th>)}</tr></thead>
        <tbody id={`admin-plans-table-body`} className={`admin-records-table-body`}>
          {state.page.loading ? <tr id={`admin-plans-loading-row`} className={`admin-plans-loading-row`}><td colSpan={columns.length} id={`admin-plans-loading-cell`} className={`admin-records-state-cell`}><AdminLoading id={`plans`} label={`Loading Realtime Plans`} /></td></tr> : state.matchingRecords.length ? state.matchingRecords.map(plan => <PlanRow key={plan.id} busy={state.busy} record={plan} onEdit={state.edit} score={state.scores.score(plan.id)} scoreLoading={state.scores.loading} saving={state.pendingId === plan.id} onArchive={state.archive} onStatus={state.changeStatus} onRequestArchive={state.requestArchive} confirming={state.archivingId === plan.id} onCancelArchive={state.cancelArchive} />) : <tr id={`admin-plans-empty-row`} className={`admin-plans-empty-row`}><td colSpan={columns.length} id={`admin-plans-empty-cell`} className={`admin-records-state-cell`}><p id={`admin-plans-empty`} className={`admin-records-empty`}>{state.page.error ? `Plan Records Unavailable` : state.records.length ? `No plans match these filters.` : `No plans saved yet. Add a plan to get started.`}</p></td></tr>}
        </tbody>
        <tfoot id={`admin-plans-table-footer`} className={`admin-records-table-footer`}><tr id={`admin-plans-pagination-row`} className={`admin-plans-pagination-row`}><td colSpan={columns.length} id={`admin-plans-pagination-cell`} className={`admin-plans-pagination-cell`}>
          <div id={`admin-plans-pagination`} className={`admin-record-pagination`}>
            <span id={`admin-plans-pagination-label`} className={`admin-record-pagination-label`}>{`Page ${state.page.page} · ${state.matchingRecords.length} Matching Plan(s) In This Realtime Page`}</span>
            <div id={`admin-plans-pagination-controls`} className={`admin-record-pagination-controls`}>
              <button type={`button`} disabled={state.busy || !state.page.hasPrevious} onClick={state.page.previousPage} id={`admin-plans-previous`} className={`admin-record-pagination-button`}><ArrowLeft size={11} aria-hidden id={`admin-plans-previous-icon`} className={`admin-record-pagination-icon`} />{`Previous`}</button>
              <button type={`button`} disabled={state.busy || !state.page.hasNext} onClick={state.page.nextPage} id={`admin-plans-next`} className={`admin-record-pagination-button`}>{`Next`}<ArrowRight size={11} aria-hidden id={`admin-plans-next-icon`} className={`admin-record-pagination-icon`} /></button>
              <button type={`button`} disabled={state.busy} onClick={state.refresh} id={`admin-plans-latest`} className={`admin-record-pagination-button`}><RotateCcw size={11} aria-hidden id={`admin-plans-latest-icon`} className={`admin-record-pagination-icon`} />{`Latest`}</button>
            </div>
          </div>
        </td></tr></tfoot>
      </table>
    </div>
  </section>;
};

export default AdminPlans;
