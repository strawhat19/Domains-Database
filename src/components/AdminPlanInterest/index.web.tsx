import './styles.scss';
import { useAdminPlanInterest } from './useAdminPlanInterest';
import { ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';

const reportColumns = [`Plan`, `Upvotes`, `Downvotes`, `Signed-in Interest`, `Last Response`];
const AdminPlanInterest = () => {
  const state = useAdminPlanInterest();
  if (!state.allowed) return null;
  return <section id={`admin-plan-interest`} className={`admin-plan-interest`} aria-labelledby={`admin-plan-interest-title`} aria-busy={state.loading}>
    <header id={`admin-plan-interest-heading`} className={`admin-plan-interest-heading`}>
      <div id={`admin-plan-interest-copy`} className={`admin-plan-interest-copy`}>
        <h2 id={`admin-plan-interest-title`} className={`admin-plan-interest-title`}><ThumbsUp size={19} aria-hidden id={`admin-plan-interest-icon`} className={`admin-plan-interest-icon`} />{`Plan Interest`}</h2>
        <p id={`admin-plan-interest-description`} className={`admin-plan-interest-description`}>{state.source === `local` ? `Votes And Interest Saved On This Device` : `Saved Plan Votes And Signed-in Interest`}{state.error && state.ready ? ` · Last Confirmed Results` : ``}</p>
      </div>
      <button type={`button`} disabled={state.loading} onClick={state.refresh} id={`admin-plan-interest-refresh`} className={`admin-feature-toggle`}><RotateCcw size={13} aria-hidden id={`admin-plan-interest-refresh-icon`} />{`Refresh`}</button>
    </header>
    {state.error && <p role={`alert`} id={`admin-plan-interest-error`} className={`admin-records-error`}>{state.error}</p>}
    <div tabIndex={0} role={`region`} id={`admin-plan-interest-table-wrap`} className={`admin-records-table-wrap`} aria-label={`Plan Interest Table`}>
      <table id={`admin-plan-interest-table`} className={`admin-records-table`}>
        <caption id={`admin-plan-interest-caption`} className={`admin-records-table-caption`}>{`Saved Plan Interest`}</caption>
        <thead id={`admin-plan-interest-head`}><tr id={`admin-plan-interest-head-row`}>{reportColumns.map((label, index) => <th key={label} scope={`col`} id={`admin-plan-interest-column-${index}`}>{label}</th>)}</tr></thead>
        <tbody id={`admin-plan-interest-body`}>
          {!state.ready ? <tr id={`admin-plan-interest-pending`}><td colSpan={reportColumns.length} id={`admin-plan-interest-pending-label`}>{state.loading ? `Loading Plan Interest` : `Plan Interest Is Unavailable`}</td></tr>
            : state.records.length ? state.records.map(record => <tr key={record.planId} id={`admin-plan-interest-row-${record.planId}`}>
              <td id={`admin-plan-interest-plan-${record.planId}`}>{record.planName}</td>
              <td id={`admin-plan-interest-up-${record.planId}`}><span id={`admin-plan-interest-up-count-${record.planId}`} className={`admin-plan-interest-count admin-plan-interest-up`}><ThumbsUp size={13} aria-hidden id={`admin-plan-interest-up-icon-${record.planId}`} />{record.up}</span></td>
              <td id={`admin-plan-interest-down-${record.planId}`}><span id={`admin-plan-interest-down-count-${record.planId}`} className={`admin-plan-interest-count admin-plan-interest-down`}><ThumbsDown size={13} aria-hidden id={`admin-plan-interest-down-icon-${record.planId}`} />{record.down}</span></td>
              <td id={`admin-plan-interest-interested-${record.planId}`}>{record.interested}</td>
              <td id={`admin-plan-interest-updated-${record.planId}`}><time dateTime={record.updated} id={`admin-plan-interest-timestamp-${record.planId}`} className={`admin-plan-interest-timestamp`}>{new Date(record.updated).toLocaleString()}</time></td>
            </tr>) : <tr id={`admin-plan-interest-empty`}><td colSpan={reportColumns.length} id={`admin-plan-interest-empty-label`}>{`No Plan Responses Yet`}</td></tr>}
        </tbody>
      </table>
    </div>
  </section>;
};
export default AdminPlanInterest;
