import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { FormSubmission } from '../../shared/models/forms/FormSubmission';
import { useFormSubmissions, submissionDate, submissionStatuses } from './useFormSubmissions';

interface SubmissionRowProps {
  disabled: boolean;
  saving: boolean;
  submission: FormSubmission;
  updateStatus: ReturnType<typeof useFormSubmissions>[`updateStatus`];
}

const SubmissionRow = ({ submission, saving, disabled, updateStatus }: SubmissionRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const status = submissionStatuses.find(option => option.value === submission.status) ?? submissionStatuses[0];
  const Icon = expanded ? ChevronUp : ChevronDown;
  return (
    <tr id={`form-submission-row-${submission.id}`} className={`form-submission-row`}>
      <td id={`form-submission-name-${submission.id}`} className={`form-submission-name`}>{submission.name}</td>
      <td id={`form-submission-email-${submission.id}`} className={`form-submission-email`}>{submission.email}</td>
      <td id={`form-submission-subject-${submission.id}`} className={`form-submission-subject`}>{submission.subject}</td>
      <td id={`form-submission-message-cell-${submission.id}`} className={`form-submission-message-cell`}>
        <p id={`form-submission-message-${submission.id}`} className={`form-submission-message${expanded ? ` expanded` : ``}`}>{submission.message}</p>
        <button
          type={`button`}
          aria-expanded={expanded}
          className={`form-submission-expand`}
          id={`form-submission-expand-${submission.id}`}
          onClick={() => setExpanded(previous => !previous)}
          aria-controls={`form-submission-message-${submission.id}`}
        >
          <Icon id={`form-submission-expand-icon-${submission.id}`} className={`form-submission-expand-icon`} size={13} aria-hidden />
          {expanded ? `Show Less` : `Read Message`}
        </button>
      </td>
      <td id={`form-submission-created-${submission.id}`} className={`form-submission-created`}>
        <time id={`form-submission-time-${submission.id}`} className={`form-submission-time`} dateTime={submission.created}>{submissionDate(submission.created)}</time>
      </td>
      <td id={`form-submission-status-cell-${submission.id}`} className={`actionsCell form-submission-status-cell`}>
        <div id={`form-submission-status-${submission.id}`} className={`rowStatus form-submission-status status-${status.color}`}>
          <span id={`form-submission-dot-wrap-${submission.id}`} className={`statusDotWrap`}>
            <span id={`form-submission-dot-${submission.id}`} className={`statusDot`} />
          </span>
          <span id={`form-submission-status-text-${submission.id}`} className={`statusText`}>{saving ? `Saving…` : status.label}</span>
        </div>
        <select
          value={submission.status}
          disabled={disabled}
          className={`form-submission-status-select`}
          id={`form-submission-status-select-${submission.id}`}
          aria-label={`Status For ${submission.subject} From ${submission.name}`}
          onChange={event => { void updateStatus(submission.id, event.target.value as FormSubmission[`status`]); }}
        >
          {submissionStatuses.map(option => <option key={option.value} id={`form-submission-status-option-${submission.id}-${option.value}`} value={option.value}>{option.label}</option>)}
        </select>
      </td>
    </tr>
  );
};

export default SubmissionRow;
