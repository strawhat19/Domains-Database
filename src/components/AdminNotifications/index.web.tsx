import './styles.scss';
import '../AdminUsers/records.scss';
import EditorModal from './EditorModal';
import { createPortal } from 'react-dom';
import { AdminLoading } from '../AdminWidgets';
import NotificationRow from './NotificationRow';
import NotificationEditor from './NotificationEditor';
import type { AdminNotificationsProps } from './types';
import { useAdminNotifications } from './useAdminNotifications';
import { Bell, Plus, Search, CircleCheck, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

const columns = [`No.`, `Title`, `Kind`, `Status`, `Updated`, `Actions`];
const NotificationSummary = ({ state }: { state: ReturnType<typeof useAdminNotifications> }) => <dl id={`admin-notifications-summary`} className={`admin-notifications-summary`} aria-label={state.page.loading ? `Loading Notifications Summary` : undefined}>
  {[
    { id: `total`, label: `Notifications On This Page`, value: state.records.length },
    { id: `active`, label: `Active`, value: state.active },
    { id: `inactive`, label: `Inactive`, value: state.records.length - state.active },
  ].map(({ id, label, value }) => <div key={id} id={`admin-notifications-summary-${id}`} className={`admin-notifications-summary-card`}>
    <dt id={`admin-notifications-summary-${id}-label`} className={`admin-notifications-summary-label`}>{label}</dt>
    <dd id={`admin-notifications-summary-${id}-value`} className={`admin-notifications-summary-value`}>{state.page.loading ? <span id={`admin-notifications-summary-${id}-skeleton`} className={`admin-notifications-summary-skeleton`} aria-hidden /> : state.page.error ? `—` : value}</dd>
  </div>)}
</dl>;

const AdminNotifications = ({ headingActionsTarget }: AdminNotificationsProps = {}) => {
  const state = useAdminNotifications();
  if (!state.allowed) return <p id={`admin-notifications-access`} className={`admin-records-error`} role={`alert`}>{`Active Admin Or Owner Access Is Required`}</p>;
  const summary = <NotificationSummary state={state} />;
  const editorRecord = state.editor && state.editor !== `new` ? state.editor : null;
  const editorId = editorRecord?.id ?? `new`;
  const pagination = <div id={`admin-notifications-pagination`} className={`admin-record-pagination`}>
    <span id={`admin-notifications-pagination-label`} className={`admin-record-pagination-label`}>{`Page ${state.page.page} · ${state.matchingRecords.length} Matching Notification(s) In This Realtime Page`}</span>
    <div id={`admin-notifications-pagination-controls`} className={`admin-record-pagination-controls`}>
      <button type={`button`} disabled={state.busy || !state.page.hasPrevious} onClick={state.page.previousPage} id={`admin-notifications-previous`} className={`admin-record-pagination-button`}><ArrowLeft size={11} aria-hidden id={`admin-notifications-previous-icon`} className={`admin-record-pagination-icon`} />{`Previous`}</button>
      <button type={`button`} disabled={state.busy || !state.page.hasNext} onClick={state.page.nextPage} id={`admin-notifications-next`} className={`admin-record-pagination-button`}>{`Next`}<ArrowRight size={11} aria-hidden id={`admin-notifications-next-icon`} className={`admin-record-pagination-icon`} /></button>
      <button type={`button`} disabled={state.busy} onClick={state.page.refresh} id={`admin-notifications-latest`} className={`admin-record-pagination-button`}><RotateCcw size={11} aria-hidden id={`admin-notifications-latest-icon`} className={`admin-record-pagination-icon`} />{`Latest`}</button>
    </div>
  </div>;
  return <section id={`admin-notifications`} className={`admin-notifications admin-records`} aria-labelledby={`admin-notifications-title`} aria-busy={state.busy}>
    <div id={`admin-notifications-heading`} className={`admin-records-heading`}>
      <div id={`admin-notifications-heading-copy`} className={`admin-records-heading-copy`}>
        <h2 id={`admin-notifications-title`} className={headingActionsTarget ? `admin-records-table-caption` : `admin-records-title`}><Bell size={20} aria-hidden id={`admin-notifications-title-icon`} className={`admin-notifications-title-icon`} />{`Notification Directory`}</h2>
        <p id={`admin-notifications-source`} className={`admin-records-note`}>{`${state.mode} · Page ${state.page.page} · Search And Filters Apply To This Page`}</p>
      </div>
      {headingActionsTarget ? createPortal(summary, headingActionsTarget) : summary}
    </div>
    {!!state.error && <p id={`admin-notifications-error`} className={`admin-records-error`} role={`alert`}>{state.error}</p>}
    {!!state.notice && <p id={`admin-notifications-notice`} className={`admin-records-notice`} role={`status`}><CircleCheck size={14} aria-hidden id={`admin-notifications-notice-icon`} className={`admin-notifications-notice-icon`} />{state.notice}</p>}
    {state.editor && <EditorModal
      busy={state.busy}
      error={state.error}
      key={editorId}
      onClose={state.closeEditor}
      id={`admin-notifications-editor-modal`}
      labelledBy={`admin-notification-editor-${editorId}-title`}
    >{dismiss => <NotificationEditor busy={state.busy} record={editorRecord} onSave={state.save} onClose={dismiss} />}</EditorModal>}
    <div id={`admin-notifications-filters`} className={`admin-records-filters`}>
      <label id={`admin-notifications-search-label`} htmlFor={`admin-notifications-search`} className={`admin-records-search`}>
        <Search size={15} aria-hidden id={`admin-notifications-search-icon`} className={`admin-notifications-search-icon`} />
        <input type={`search`} value={state.search} id={`admin-notifications-search`} className={`admin-records-search-input`} aria-label={`Search Notifications On This Page`} placeholder={`Search notifications`} onChange={event => state.setSearch(event.currentTarget.value)} />
      </label>
      <label id={`admin-notifications-filter-label`} htmlFor={`admin-notifications-filter`} className={`admin-records-filter-label`}>{`Status`}</label>
      <select id={`admin-notifications-filter`} value={state.filter} className={`admin-records-filter`} onChange={event => state.setFilter(event.currentTarget.value)}>
        <option id={`admin-notifications-filter-all`} className={`admin-notifications-filter-option`} value={`all`}>{`All Statuses`}</option>
        <option id={`admin-notifications-filter-active`} className={`admin-notifications-filter-option`} value={`active`}>{`Active`}</option>
        <option id={`admin-notifications-filter-inactive`} className={`admin-notifications-filter-option`} value={`inactive`}>{`Inactive`}</option>
      </select>
      <div id={`admin-notifications-filter-actions`} className={`admin-notifications-filter-actions`}>
        <button type={`button`} disabled={state.busy || !!state.page.error} id={`admin-notifications-add`} className={`admin-notifications-add`} onClick={() => state.edit(`new`)}><Plus size={14} aria-hidden id={`admin-notifications-add-icon`} className={`admin-notifications-add-icon`} />{`Add Notification`}</button>
      </div>
    </div>
    <div id={`admin-notifications-table-wrap`} className={`admin-records-table-wrap`} tabIndex={0} role={`region`} aria-label={`Notification Directory Table`}>
      <table id={`admin-notifications-table`} className={`admin-records-table admin-notifications-table`}>
        <caption id={`admin-notifications-caption`} className={`admin-records-table-caption`}>{`Saved App Notifications · Realtime Page ${state.page.page}`}</caption>
        <thead id={`admin-notifications-table-head`} className={`admin-records-table-head`}><tr id={`admin-notifications-column-row`} className={`admin-records-column-row`}>{columns.map((label, index) => <th key={label} scope={`col`} id={`admin-notifications-column-${index}`} className={`admin-records-column`}>{label}</th>)}</tr></thead>
        <tbody id={`admin-notifications-table-body`} className={`admin-records-table-body`}>
          {state.page.loading ? <tr id={`admin-notifications-loading-row`} className={`admin-notifications-loading-row`}><td colSpan={6} id={`admin-notifications-loading-cell`} className={`admin-records-state-cell`}><AdminLoading id={`notifications`} label={`Loading Realtime Notifications`} /></td></tr> : state.matchingRecords.length ? state.matchingRecords.map(record => <NotificationRow key={record.id} busy={state.busy} record={record} onEdit={state.edit} onDelete={state.remove} onStatus={state.changeStatus} onRequestDelete={state.requestDelete} confirming={state.deletingId === record.id} onCancelDelete={state.cancelDelete} />) : <tr id={`admin-notifications-empty-row`} className={`admin-notifications-empty-row`}><td colSpan={6} id={`admin-notifications-empty-cell`} className={`admin-records-state-cell`}><p id={`admin-notifications-empty`} className={`admin-records-empty`}>{state.page.error ? `Notification Records Unavailable` : state.records.length ? `No notifications match these filters.` : `No notifications saved yet. Add a notification to get started.`}</p></td></tr>}
        </tbody>
        <tfoot id={`admin-notifications-table-footer`} className={`admin-records-table-footer`}><tr id={`admin-notifications-pagination-row`} className={`admin-notifications-pagination-row`}><td colSpan={6} id={`admin-notifications-pagination-cell`} className={`admin-notifications-pagination-cell`}>{pagination}</td></tr></tfoot>
      </table>
    </div>
  </section>;
};

export default AdminNotifications;
