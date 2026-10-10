import './styles.scss';
import Toast from '../Toast';
import SubmissionRow from './SubmissionRow.web';
import { useFormSubmissions } from './useFormSubmissions';
import { Inbox, RefreshCw, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

const FormSubmissions = () => {
  const state = useFormSubmissions();
  if (!state.allowed) return null;
  return (
    <section id={`form-submissions`} className={`form-submissions`} aria-labelledby={`form-submissions-title`} aria-busy={state.disabled}>
      <div id={`form-submissions-heading`} className={`form-submissions-heading`}>
        <div id={`form-submissions-intro`} className={`form-submissions-intro`}>
          <h2 id={`form-submissions-title`} className={`form-submissions-title`}><Inbox id={`form-submissions-title-icon`} className={`form-submissions-title-icon`} size={18} aria-hidden />{`Form Submissions`}</h2>
          <p id={`form-submissions-description`} className={`form-submissions-description`}>{`Contact messages, saved privately for review. Up to 50 per page, newest first.`}</p>
        </div>
        <button id={`form-submissions-refresh`} className={`form-submissions-refresh`} type={`button`} disabled={state.disabled} onClick={() => { void state.refresh(); }}>
          <RefreshCw id={`form-submissions-refresh-icon`} className={`form-submissions-refresh-icon`} size={14} aria-hidden />
          {state.loading ? `Loading…` : `Latest`}
        </button>
      </div>
      <Toast id={`form-submissions-error`} message={state.error} />
      {state.loading && !state.submissions.length ? (
        <div id={`form-submissions-loading`} className={`form-submissions-loading`} role={`status`} aria-label={`Loading Form Submissions`}>
          {[0, 1, 2].map(index => <div key={index} id={`form-submissions-skeleton-${index}`} className={`form-submissions-skeleton`} />)}
        </div>
      ) : state.submissions.length ? (
        <div id={`form-submissions-table-wrap`} className={`form-submissions-table-wrap`}>
          <table id={`form-submissions-table`} className={`form-submissions-table`}>
            <caption id={`form-submissions-caption`} className={`form-submissions-caption`}>{`${state.submissions.length} Contact Submission(s) On This Page`}</caption>
            <thead id={`form-submissions-table-head`} className={`form-submissions-table-head`}>
              <tr id={`form-submissions-header-row`} className={`form-submissions-header-row`}>
                {[`Name`, `Email`, `Subject`, `Message`, `Submitted`, `Status`].map(label => <th key={label} id={`form-submissions-header-${label.toLowerCase()}`} className={`form-submissions-header`} scope={`col`}>{label}</th>)}
              </tr>
            </thead>
            <tbody id={`form-submissions-table-body`} className={`form-submissions-table-body`}>
              {state.submissions.map(submission => <SubmissionRow key={submission.id} submission={submission} saving={state.savingId === submission.id} disabled={state.disabled} updateStatus={state.updateStatus} />)}
            </tbody>
          </table>
        </div>
      ) : !state.error && (
        <div id={`form-submissions-empty`} className={`form-submissions-empty`}>
          <Inbox id={`form-submissions-empty-icon`} className={`form-submissions-empty-icon`} size={24} aria-hidden />
          <h3 id={`form-submissions-empty-title`} className={`form-submissions-empty-title`}>{state.page > 1 ? `No Submission(s) On This Page` : `No Form Submissions Yet`}</h3>
          <p id={`form-submissions-empty-copy`} className={`form-submissions-empty-copy`}>{`Messages sent from the contact page will appear here.`}</p>
        </div>
      )}
      <nav id={`form-submissions-pagination`} className={`form-submissions-pagination`} aria-label={`Form Submission Pages`}>
        <span id={`form-submissions-page`} className={`form-submissions-page`}>{`Page ${state.page}`}</span>
        <button id={`form-submissions-previous`} className={`form-submissions-refresh`} type={`button`} disabled={state.disabled || !state.hasPrevious} onClick={state.previousPage}>
          <ArrowLeft id={`form-submissions-previous-icon`} className={`form-submissions-page-icon`} size={14} aria-hidden />{`Newer`}
        </button>
        <button id={`form-submissions-next`} className={`form-submissions-refresh`} type={`button`} disabled={state.disabled || !state.hasNext} onClick={state.nextPage}>
          {`Older`}<ArrowRight id={`form-submissions-next-icon`} className={`form-submissions-page-icon`} size={14} aria-hidden />
        </button>
      </nav>
      <p id={`form-submissions-privacy`} className={`form-submissions-privacy`}><ShieldCheck id={`form-submissions-privacy-icon`} className={`form-submissions-privacy-icon`} size={13} aria-hidden />{`Only Owners Can View These Messages`}</p>
    </section>
  );
};

export default FormSubmissions;
