import './styles.scss';
import { X, Save } from 'lucide-react';
import type { NotificationEditorProps } from './types';
import { useNotificationEditor } from './useNotificationEditor';
import { AnnouncementStatus } from '../../../shared/models/notifications/Notification';

const NotificationEditor = (props: NotificationEditorProps) => {
  const { busy, record, onClose } = props;
  const { error, values, submit, setField } = useNotificationEditor(props);
  const editorId = `admin-notification-editor-${record?.id ?? `new`}`;
  return <form id={editorId} className={`admin-notification-editor`} aria-labelledby={`${editorId}-title`} onSubmit={event => { event.preventDefault(); if (!busy) void submit().then(saved => { if (saved) onClose(); }); }}>
    <div id={`${editorId}-heading`} className={`admin-notification-editor-heading`}>
      <h2 id={`${editorId}-title`} className={`admin-notification-editor-title`}>{`${record ? `Edit` : `Add`} Notification`}</h2>
      <button type={`button`} disabled={busy} onClick={onClose} id={`${editorId}-close`} className={`admin-notification-editor-close`} aria-label={`Close Notification Editor`}><X size={17} aria-hidden id={`${editorId}-close-icon`} className={`admin-notification-editor-close-icon`} /></button>
    </div>
    <fieldset id={`${editorId}-fields`} className={`admin-notification-editor-fields`} disabled={busy}>
      <legend id={`${editorId}-legend`} className={`admin-records-table-caption`}>{`Notification Details`}</legend>
      <label id={`${editorId}-name-label`} htmlFor={`${editorId}-name`} className={`admin-notification-editor-field is-wide`}><span id={`${editorId}-name-label-text`} className={`admin-notification-editor-field-label`}>{`Title *`}</span><input id={`${editorId}-name`} value={values.title} required maxLength={160} className={`admin-notification-editor-input`} onChange={event => setField(`title`, event.currentTarget.value)} /></label>
      <label id={`${editorId}-slug-label`} htmlFor={`${editorId}-slug`} className={`admin-notification-editor-field`}><span id={`${editorId}-slug-label-text`} className={`admin-notification-editor-field-label`}>{`URL Slug *`}</span><input id={`${editorId}-slug`} value={values.slug} required maxLength={100} pattern={`[a-z0-9]+(-[a-z0-9]+)*`} className={`admin-notification-editor-input`} placeholder={`domains-announcement`} onChange={event => setField(`slug`, event.currentTarget.value)} /></label>
      <label id={`${editorId}-kind-label`} htmlFor={`${editorId}-kind`} className={`admin-notification-editor-field`}><span id={`${editorId}-kind-label-text`} className={`admin-notification-editor-field-label`}>{`Kind`}</span><select id={`${editorId}-kind`} value={values.kind} className={`admin-notification-editor-input`} onChange={event => setField(`kind`, event.currentTarget.value)}><option id={`${editorId}-kind-announcement`} className={`admin-notification-editor-option`} value={`announcement`}>{`Announcement`}</option><option id={`${editorId}-kind-development`} className={`admin-notification-editor-option`} value={`development`}>{`Development`}</option></select></label>
      <label id={`${editorId}-body-label`} htmlFor={`${editorId}-body`} className={`admin-notification-editor-field is-wide`}><span id={`${editorId}-body-label-text`} className={`admin-notification-editor-field-label`}>{`Body *`}</span><textarea id={`${editorId}-body`} value={values.body} required maxLength={5000} rows={6} className={`admin-notification-editor-input`} onChange={event => setField(`body`, event.currentTarget.value)} /></label>
      <label id={`${editorId}-suffix-label`} htmlFor={`${editorId}-suffix`} className={`admin-notification-editor-field is-wide`}><span id={`${editorId}-suffix-label-text`} className={`admin-notification-editor-field-label`}>{`Optional Text After The Link`}</span><textarea id={`${editorId}-suffix`} value={values.suffix} maxLength={300} rows={2} className={`admin-notification-editor-input`} onChange={event => setField(`suffix`, event.currentTarget.value)} /></label>
      <label id={`${editorId}-link-label`} htmlFor={`${editorId}-link-label-input`} className={`admin-notification-editor-field`}><span id={`${editorId}-link-label-text`} className={`admin-notification-editor-field-label`}>{`Optional Link Label`}</span><input id={`${editorId}-link-label-input`} value={values.linkLabel} maxLength={120} className={`admin-notification-editor-input`} onChange={event => setField(`linkLabel`, event.currentTarget.value)} /></label>
      <label id={`${editorId}-link-href-label`} htmlFor={`${editorId}-link-href`} className={`admin-notification-editor-field`}><span id={`${editorId}-link-href-label-text`} className={`admin-notification-editor-field-label`}>{`Optional Link Destination`}</span><input id={`${editorId}-link-href`} value={values.linkHref} maxLength={2048} className={`admin-notification-editor-input`} placeholder={`/domains Or https://example.com`} onChange={event => setField(`linkHref`, event.currentTarget.value)} /></label>
      <label id={`${editorId}-status-label`} htmlFor={`${editorId}-status`} className={`admin-notification-editor-field`}><span id={`${editorId}-status-label-text`} className={`admin-notification-editor-field-label`}>{`Status`}</span><select id={`${editorId}-status`} value={values.status} className={`admin-notification-editor-input`} onChange={event => setField(`status`, event.currentTarget.value)}><option id={`${editorId}-status-inactive`} className={`admin-notification-editor-option`} value={AnnouncementStatus.Draft}>{`Inactive`}</option><option id={`${editorId}-status-active`} className={`admin-notification-editor-option`} value={AnnouncementStatus.Active}>{`Active`}</option></select></label>
    </fieldset>
    <p id={`${editorId}-visibility-note`} className={`admin-notification-editor-note`}>{`Inactive notifications stay in Admin. Active notifications appear in the bell menu and on the Notifications page.`}</p>
    {!!error && <p id={`${editorId}-error`} className={`admin-notification-editor-error`} role={`alert`}>{error}</p>}
    <div id={`${editorId}-actions`} className={`admin-notification-editor-actions`}>
      <button type={`button`} disabled={busy} onClick={onClose} id={`${editorId}-cancel`} className={`admin-notification-editor-cancel`}><X size={14} aria-hidden id={`${editorId}-cancel-icon`} className={`admin-notification-editor-action-icon`} />{`Cancel`}</button>
      <button type={`submit`} disabled={busy} id={`${editorId}-save`} className={`admin-notification-editor-save`}><Save size={14} aria-hidden id={`${editorId}-save-icon`} className={`admin-notification-editor-action-icon`} />{busy ? `Saving` : `Save`}</button>
    </div>
  </form>;
};

export default NotificationEditor;
