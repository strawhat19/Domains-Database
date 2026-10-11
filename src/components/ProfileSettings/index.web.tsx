import './styles.scss';
import { useLocalStorage } from '../../shared/config';
import { useProfileSettings } from './useProfileSettings';
import { Save, Lock, Globe2, RotateCcw } from 'lucide-react';
import { firebaseEnabled } from '../../shared/firebase/config';

const ProfileSettings = () => {
  const state = useProfileSettings();
  const sharingNote = useLocalStorage ? `Community is shared between local accounts on this device; it does not publish to the internet.` : firebaseEnabled ? `` : `Connect a backend to save your profile preferences.`;
  return (
    <form id={`profile-settings`} className={`profile-settings`} onSubmit={event => { event.preventDefault(); void state.save(); }}>
      <dl id={`profile-settings-record`} className={`profile-record profile-settings-record`}>
        <div id={`profile-name-field`} className={`profile-record-row profile-input-row`}>
          <dt id={`profile-name-label`} className={`profile-record-label`}><label htmlFor={`profile-name-input`} id={`profile-name-input-label`} className={`profile-input-label`}>{`Name`}</label></dt>
          <dd id={`profile-name-value`} className={`profile-record-value`}>
            <div id={`profile-name-form`} className={`profile-name-form`}>
              <input required type={`text`} name={`name`} value={state.name} maxLength={100} disabled={state.busy} autoComplete={`name`} onChange={event => state.setName(event.target.value)} id={`profile-name-input`} className={`profile-input profile-name-input`} placeholder={`Your name or username`} />
              <div id={`profile-name-actions`} className={`profile-name-actions`}>
                <button type={`submit`} aria-busy={state.busy} disabled={state.busy || !state.dirty} id={`profile-settings-save`} className={`profile-save-name`}><Save size={14} aria-hidden id={`profile-settings-save-icon`} className={`profile-settings-save-icon`} />{state.busy ? `Saving Profile` : `Save Profile`}</button>
                <button type={`button`} onClick={state.cancel} disabled={state.busy || !state.dirty} id={`profile-settings-cancel`} className={`profile-cancel-name`}><RotateCcw size={14} aria-hidden id={`profile-settings-cancel-icon`} className={`profile-settings-cancel-icon`} />{`Cancel`}</button>
              </div>
              {(state.error || state.notice) && <p id={`profile-settings-feedback`} className={`profile-name-feedback${state.error ? ` is-error` : ` is-success`}`} role={state.error ? `alert` : `status`}>{state.error || state.notice}</p>}
            </div>
          </dd>
        </div>
        <div id={`profile-email-field`} className={`profile-record-row profile-input-row`}>
          <dt id={`profile-email-label`} className={`profile-record-label`}><label htmlFor={`profile-email-input`} id={`profile-email-input-label`} className={`profile-input-label`}>{`Email`}</label></dt>
          <dd id={`profile-email-value`} className={`profile-record-value profile-email-field`}>
            {state.isGoogle && <img width={18} height={18} src={`/images/google-g.png`} alt={`Google Account`} id={`profile-email-provider-icon`} className={`profile-email-provider-icon`} />}
            <input disabled readOnly type={`email`} name={`email`} value={state.email} id={`profile-email-input`} className={`profile-input profile-email-input`} />
          </dd>
        </div>
        <div id={`profile-bio-field`} className={`profile-record-row profile-input-row`}>
          <dt id={`profile-bio-label`} className={`profile-record-label`}><label htmlFor={`profile-bio-input`} id={`profile-bio-input-label`} className={`profile-input-label`}>{`Bio`}</label></dt>
          <dd id={`profile-bio-value`} className={`profile-record-value`}><textarea id={`profile-bio-input`} name={`bio`} className={`profile-input profile-bio-input`} maxLength={2000} disabled={state.busy} value={state.description} placeholder={`A little about you`} onChange={event => state.setDescription(event.target.value)} /></dd>
        </div>
        <div id={`profile-privacy-field`} className={`profile-record-row`}>
          <dt id={`profile-privacy-label`} className={`profile-record-label`}>{`Visibility`}</dt>
          <dd id={`profile-privacy-value`} className={`profile-record-value`}>
            <div role={`radiogroup`} aria-labelledby={`profile-privacy-label`} id={`profile-privacy-options`} className={`profile-privacy-options`}>
              {[{ value: `private`, label: `Private`, Icon: Lock }, { value: `public`, label: `Public`, Icon: Globe2 }].map(({ value, label, Icon }) => <button key={value} type={`button`} role={`radio`} aria-checked={state.privacy === value} disabled={state.busy} id={`profile-privacy-option-${value}`} className={`profile-privacy-option${state.privacy === value ? ` is-selected` : ``}`} onClick={() => state.changePrivacy(value as `private` | `public`)}><Icon size={16} aria-hidden id={`profile-privacy-icon-${value}`} className={`profile-privacy-icon`} />{label}</button>)}
            </div>
          </dd>
        </div>
        <div id={`profile-sharing-field`} className={`profile-record-row`}>
          <dt id={`profile-sharing-label`} className={`profile-record-label`}>{`Portfolio`}</dt>
          <dd id={`profile-sharing-value`} className={`profile-record-value`}>
            <label htmlFor={`profile-domains-sharing-switch`} id={`profile-domains-sharing-label`} className={`profile-sharing-control`}>
              <input type={`checkbox`} role={`switch`} id={`profile-domains-sharing-switch`} className={`profile-sharing-switch`} disabled={state.busy || state.privacy !== `public`} checked={state.privacy === `public` && state.publicDomains} aria-checked={state.privacy === `public` && state.publicDomains} onChange={event => state.setPublicDomains(event.target.checked)} />
              <span id={`profile-domains-sharing-text`} className={`profile-domains-sharing-text`}>{`Share Domain Names`}</span>
            </label>
            {sharingNote && <p id={`profile-sharing-note`} className={`profile-settings-copy`}>{sharingNote}</p>}
          </dd>
        </div>
      </dl>
    </form>
  );
};

export default ProfileSettings;
