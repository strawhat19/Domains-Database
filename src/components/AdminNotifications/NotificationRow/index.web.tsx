import './styles.scss';
import type { NotificationRowProps } from './types';
import { X, Heart, Trash2, Settings, Construction } from 'lucide-react';
import { getNotificationStatusLabel, formatNotificationDate } from '../useAdminNotifications';

const NotificationRow = ({ busy, record, confirming, onEdit, onDelete, onStatus, onRequestDelete, onCancelDelete }: NotificationRowProps) => {
  const rowId = `admin-notification-${record.id}`;
  const Icon = record.kind === `development` ? Construction : Heart;
  const active = getNotificationStatusLabel(record) === `Active`;
  return <tr id={rowId} className={`admin-notification-row`}>
    <td id={`${rowId}-number`} className={`admin-notification-number`}><span id={`${rowId}-number-badge`} className={`admin-record-number-badge`}>{record.number}</span></td>
    <td id={`${rowId}-title-cell`} className={`admin-notification-main`}>
      <div id={`${rowId}-identity`} className={`admin-notification-identity`}>
        <span id={`${rowId}-thumbnail`} className={`admin-notification-thumbnail`} aria-hidden><Icon size={18} strokeWidth={1.6} id={`${rowId}-icon`} className={`admin-notification-icon`} /></span>
        <div id={`${rowId}-copy`} className={`admin-notification-copy`}>
          <strong id={`${rowId}-title`} className={`admin-notification-title`}>{record.title || record.name}</strong>
          <span id={`${rowId}-slug`} className={`admin-notification-slug`}>{record.slug || `—`}</span>
          <span id={`${rowId}-body`} className={`admin-notification-body`}>{record.body || record.description || record.details}</span>
        </div>
      </div>
    </td>
    <td id={`${rowId}-kind`} className={`admin-notification-kind`}>{record.kind === `development` ? `Development` : `Announcement`}</td>
    <td id={`${rowId}-status-cell`} className={`admin-notification-status`}>
      <div id={`${rowId}-status-actions`} className={`actionsCell`}>
        <button type={`button`} disabled={busy} aria-pressed={active} id={`${rowId}-status`} className={`rowStatus is-editable is-${active ? `green` : `gray`}`} aria-label={`${active ? `Deactivate` : `Activate`} ${record.title || record.name}`} onClick={() => { void onStatus(record); }}>
          <span id={`${rowId}-status-dot-wrap`} className={`statusDotWrap`} aria-hidden><span id={`${rowId}-status-dot`} className={`statusDot`} /></span>
          <span id={`${rowId}-status-text`} className={`statusText`}>{active ? `Active` : `Inactive`}</span>
        </button>
      </div>
    </td>
    <td id={`${rowId}-updated`} className={`admin-notification-updated`}><time dateTime={record.updated} id={`${rowId}-updated-time`} className={`admin-notification-updated-time`}>{formatNotificationDate(record.updated)}</time></td>
    <td id={`${rowId}-actions-cell`} className={`admin-notification-actions-cell`}>
      <div id={`${rowId}-actions`} className={`actionsCell`}>
        <button type={`button`} disabled={busy} id={`${rowId}-edit`} className={`admin-notification-action`} onClick={() => onEdit(record)} title={`Edit ${record.title}`} aria-label={`Edit ${record.title}`}><Settings size={14} aria-hidden id={`${rowId}-edit-icon`} className={`admin-notification-action-icon`} /></button>
        <button type={`button`} disabled={busy} id={`${rowId}-delete`} className={`admin-notification-action is-danger`} aria-expanded={confirming} aria-controls={confirming ? `${rowId}-delete-confirmation` : undefined} onClick={() => onRequestDelete(record)} title={`Delete ${record.title}`} aria-label={`Delete ${record.title}`}><Trash2 size={14} aria-hidden id={`${rowId}-delete-icon`} className={`admin-notification-action-icon`} /></button>
      </div>
      {confirming && <div id={`${rowId}-delete-confirmation`} className={`admin-notification-delete-confirmation`} role={`group`} aria-labelledby={`${rowId}-delete-title`}>
        <p id={`${rowId}-delete-title`} className={`admin-notification-delete-title`}>{`Delete “${record.title}”?`}</p>
        <p id={`${rowId}-delete-note`} className={`admin-notification-delete-note`}>{`This removes the saved notification from Admin and public pages.`}</p>
        <div id={`${rowId}-delete-actions`} className={`actionsCell`}>
          <button type={`button`} disabled={busy} id={`${rowId}-delete-confirm`} className={`admin-notification-action is-danger`} onClick={() => { void onDelete(record).then(saved => { if (saved) onCancelDelete(); }); }} title={`Confirm Delete ${record.title}`} aria-label={`Confirm Delete ${record.title}`}><Trash2 size={14} aria-hidden id={`${rowId}-delete-confirm-icon`} className={`admin-notification-action-icon`} /></button>
          <button type={`button`} disabled={busy} id={`${rowId}-delete-cancel`} className={`admin-notification-action`} onClick={onCancelDelete} title={`Cancel Delete ${record.title}`} aria-label={`Cancel Delete ${record.title}`}><X size={14} aria-hidden id={`${rowId}-delete-cancel-icon`} className={`admin-notification-action-icon`} /></button>
        </div>
      </div>}
    </td>
  </tr>;
};

export default NotificationRow;
