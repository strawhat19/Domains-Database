import './styles.scss';
import Toast from '../Toast';
import SubmissionRow from './SubmissionRow.web';
import { useFormSubmissions, submissionStatuses } from './useFormSubmissions';
import { Inbox, Search, RefreshCw, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

const FormSubmissions = () => {
  const state = useFormSubmissions();
  if (!state.allowed) return null;
  return (
    <section id={`form-submissions`} className={`form-submissions`} aria-labelledby={`form-submissions-title`} aria-busy={state.disabled}>
      <div id={`form-submissions-heading`} className={`form-submissions-heading`}>
        <div id={`form-submissions-intro`} className={`form-submissions-intro`}>
          <h2 id={`form-submissions-title`} className={`form-submissions-title`}><Inbox id={`form-submissions-title-icon`} className={`form-submissions-title-icon`} size={18} aria-hidden />{`Contact Form Submissions`}</h2>
          <p id={`form-submissions-description`} className={`form-submissions-description`}>{`Contact messages saved privately for review. New submissions appear automatically. Up to 50 per page, newest first.`}</p>
        </div>
        <button id={`form-submissions-refresh`} className={`form-submissions-refresh`} type={`button`} disabled={state.disabled} onClick={() => { void state.refresh(); }}>
          <RefreshCw id={`form-submissions-refresh-icon`} className={`form-submissions-refresh-icon`} size={14} aria-hidden />
          {state.loading ? `Loading…` : `Latest`}
        </button>
      </div>
      <div id={`form-submissions-filters`} className={`form-submissions-filters`}>
        <label id={`form-submissions-search-label`} className={`form-submissions-search`} htmlFor={`form-submissions-search`}><Search id={`form-submissions-search-icon`} className={`form-submissions-search-icon`} size={15} aria-hidden /><input type={`search`} id={`form-submissions-search`} className={`form-submissions-search-input`} value={state.search} placeholder={`Search Contact Requests`} aria-label={`Search Requests On This Page`} onChange={event => state.setSearch(event.currentTarget.value)} /></label>
        <label id={`form-submissions-filter-label`} className={`form-submissions-filter-label`} htmlFor={`form-submissions-status-filter`}>Status</label>
        <select id={`form-submissions-status-filter`} className={`form-submissions-filter`} value={state.statusFilter} onChange={event => state.setStatusFilter(event.currentTarget.value)}><option id={`form-submissions-filter-all`} value={`all`}>All Statuses</option>{submissionStatuses.map(option => <option key={option.value} id={`form-submissions-filter-${option.value}`} value={option.value}>{option.label}</option>)}</select>
        <span id={`form-submissions-filter-note`} className={`form-submissions-page`} aria-live={`polite`}>{`${state.visible.length} Of ${state.submissions.length} Loaded Request(s) · Filters Apply To This Page`}</span>
      </div>
      <Toast id={`form-submissions-error`} message={state.error} />
      {state.notice ? <p role={`status`} id={`form-submissions-notice`} className={`form-submissions-notice`}>{state.notice}</p> : null}
      {state.loading && !state.submissions.length ? (
        <div id={`form-submissions-loading`} className={`form-submissions-loading`} role={`status`} aria-label={`Loading Form Submissions`}>
          {[0, 1, 2].map(index => <div key={index} id={`form-submissions-skeleton-${index}`} className={`form-submissions-skeleton`} />)}
        </div>
      ) : state.visible.length ? (
        <div id={`form-submissions-table-wrap`} className={`form-submissions-table-wrap`}>
          <table id={`form-submissions-table`} className={`form-submissions-table`}>
            <caption id={`form-submissions-caption`} className={`form-submissions-caption`}>{`${state.visible.length} Matching Contact Request(s) On This Page`}</caption>
            <thead id={`form-submissions-table-head`} className={`form-submissions-table-head`}>
              <tr id={`form-submissions-header-row`} className={`form-submissions-header-row`}>
                {[`No.`, `Name`, `Email`, `Subject`, `Message`, `Submitted`, `Status`].map((label, index) => <th key={label} id={`form-submissions-header-${index}`} className={`form-submissions-header`} scope={`col`}>{label}</th>)}
              </tr>
            </thead>
            <tbody id={`form-submissions-table-body`} className={`form-submissions-table-body`}>
              {state.visible.map(submission => <SubmissionRow key={submission.id} submission={submission} saving={state.savingId === submission.id} disabled={state.disabled} updateStatus={state.updateStatus} />)}
            </tbody>
          </table>
        </div>
      ) : !state.error && (
        <div id={`form-submissions-empty`} className={`form-submissions-empty`}>
          <Inbox id={`form-submissions-empty-icon`} className={`form-submissions-empty-icon`} size={24} aria-hidden />
          <h3 id={`form-submissions-empty-title`} className={`form-submissions-empty-title`}>{state.filtered ? `No Matching Requests On This Page` : state.page > 1 ? `No Request(s) On This Page` : `No Form Submissions Yet`}</h3>
          <p id={`form-submissions-empty-copy`} className={`form-submissions-empty-copy`}>{state.filtered ? `Change The Search Or Status Filter, Or Browse Another Page` : `Messages saved from the contact form will appear here.`}</p>
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
