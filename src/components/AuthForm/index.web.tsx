import './styles.scss';
import Toast from '../Toast';
import { useLocalStorage } from '../../shared/config';
import { useAuthForm, type AuthMode } from './useAuthForm';
import { Eye, EyeOff, Mail, Globe2, Layers3, UserRound, ArrowRight, LockKeyhole, HardDrive } from 'lucide-react';

const inputFields = [
  { id: `email`, type: `email`, icon: Mail, label: `Email address`, placeholder: `you@example.com` },
  { id: `password`, type: `password`, icon: LockKeyhole, label: `Password`, placeholder: `Enter your password` },
] as const;

const AuthForm = ({ mode }: { mode: AuthMode }) => {
  const state = useAuthForm(mode);
  const PasswordIcon = state.showPassword ? EyeOff : Eye;
  const fields = inputFields;

  return (
    <section
      id={`auth-form-page-${mode}`}
      className={`auth-form-page`}
      aria-labelledby={`auth-form-title-${mode}`}
    >
      <aside id={`auth-form-story-${mode}`} className={`auth-form-story`} aria-labelledby={`auth-form-story-title-${mode}`}>
        <p id={`auth-form-story-eyebrow-${mode}`} className={`auth-form-story-eyebrow`}>
          <span id={`auth-form-story-marker-${mode}`} className={`auth-form-story-marker`} aria-hidden />
          {`PERSONAL DOMAIN REGISTRY`}
        </p>
        <div id={`auth-form-preview-${mode}`} className={`auth-form-preview`}>
          <div id={`auth-form-preview-heading-${mode}`} className={`auth-form-preview-heading`}>
            <Layers3 id={`auth-form-preview-icon-${mode}`} className={`auth-form-preview-icon`} size={19} aria-hidden />
            <span id={`auth-form-preview-label-${mode}`} className={`auth-form-preview-label`}>
              {`PORTFOLIO PREVIEW`}
            </span>
          </div>
          {[`com`, `io`, `dev`].map(extension => (
            <div key={extension} id={`auth-form-preview-record-${mode}-${extension}`} className={`auth-form-preview-record`}>
              <span id={`auth-form-preview-record-mark-${mode}-${extension}`} className={`auth-form-preview-record-mark`}>
                <Globe2 id={`auth-form-preview-record-icon-${mode}-${extension}`} className={`auth-form-preview-record-icon`} size={17} aria-hidden />
              </span>
              <span id={`auth-form-preview-record-name-${mode}-${extension}`} className={`auth-form-preview-record-name`}>
                {`yourname.${extension}`}
              </span>
              <span id={`auth-form-preview-record-extension-${mode}-${extension}`} className={`auth-form-preview-record-extension`}>
                {`.${extension}`}
              </span>
            </div>
          ))}
          <div id={`auth-form-preview-footer-${mode}`} className={`auth-form-preview-footer`}>
            <span id={`auth-form-preview-footer-dot-${mode}`} className={`auth-form-preview-footer-dot`} aria-hidden />
            <span id={`auth-form-preview-footer-text-${mode}`} className={`auth-form-preview-footer-text`}>
              {`Names. Renewals. Registrars.`}
            </span>
          </div>
        </div>
        <div id={`auth-form-story-copy-${mode}`} className={`auth-form-story-copy`}>
          <h2 id={`auth-form-story-title-${mode}`} className={`auth-form-story-title`}>
            {`Your domains.`}
            <span id={`auth-form-story-accent-${mode}`} className={`auth-form-story-accent`}>
              {`In good order.`}
            </span>
          </h2>
          <p id={`auth-form-story-description-${mode}`} className={`auth-form-story-description`}>
            {`Keep every name, registrar, and renewal together. Make room for your next idea.`}
          </p>
        </div>
      </aside>
      <div id={`auth-form-content-${mode}`} className={`auth-form-content`}>
        <nav id={`auth-form-mode-navigation-${mode}`} className={`auth-form-mode-navigation`} aria-label={`Account Access`}>
          {([`signin`, `signup`] as const).map(item => {
            const Icon = item === `signin` ? LockKeyhole : UserRound;
            return (
              <button
                key={item}
                type={`button`}
                disabled={state.disabled}
                id={`auth-form-mode-${mode}-${item}`}
                aria-current={mode === item ? `page` : undefined}
                onClick={() => { if (mode !== item) state.navigate(item === `signin` ? `/signin` : `/signup`); }}
                className={`auth-form-mode${mode === item ? ` auth-form-mode-active` : ``}`}
              >
                <Icon id={`auth-form-mode-icon-${mode}-${item}`} className={`auth-form-mode-icon`} size={15} aria-hidden />
                {item === `signin` ? `Sign in` : `Create account`}
              </button>
            );
          })}
        </nav>
        {state.auth.loading ? (
          <div id={`auth-form-loading-${mode}`} className={`auth-form-panel auth-form-loading`} role={`status`} aria-busy aria-live={`polite`}>
            <h1 id={`auth-form-title-${mode}`} className={`auth-form-sr-only`}>
              {`Loading your account…`}
            </h1>
            <div id={`auth-form-skeleton-heading-${mode}`} className={`auth-form-heading`} aria-hidden>
              <div id={`auth-form-skeleton-eyebrow-${mode}`} className={`auth-form-skeleton auth-form-skeleton-eyebrow`} />
              <div id={`auth-form-skeleton-title-${mode}`} className={`auth-form-skeleton auth-form-skeleton-title`} />
              <div id={`auth-form-skeleton-copy-${mode}`} className={`auth-form-skeleton auth-form-skeleton-copy`} />
            </div>
            <div id={`auth-form-skeleton-fields-${mode}`} className={`auth-form-fields`} aria-hidden>
              {fields.map(field => (
                <div key={field.id} id={`auth-form-skeleton-field-${mode}-${field.id}`} className={`auth-form-skeleton auth-form-skeleton-field`} />
              ))}
              <div id={`auth-form-skeleton-submit-${mode}`} className={`auth-form-skeleton auth-form-skeleton-field`} />
            </div>
          </div>
        ) : state.auth.user ? (
          <div id={`auth-form-signed-in-${mode}`} className={`auth-form-panel`}>
            <div id={`auth-form-heading-${mode}`} className={`auth-form-heading`}>
              <p id={`auth-form-eyebrow-${mode}`} className={`auth-form-eyebrow`}>
                {`YOUR DOMAIN COLLECTION`}
              </p>
              <h1 id={`auth-form-title-${mode}`} className={`auth-form-title`}>
                {`You're already signed in.`}
              </h1>
              <p id={`auth-form-description-${mode}`} className={`auth-form-description`}>
                {state.auth.user.email}
              </p>
            </div>
            <button
              type={`button`}
              disabled={state.disabled}
              className={`auth-form-submit`}
              id={`auth-form-profile-${mode}`}
              onClick={() => state.navigate(`/profile`)}
            >
              <UserRound id={`auth-form-profile-icon-${mode}`} className={`auth-form-button-icon`} size={17} aria-hidden />
              {`View profile`}
              <ArrowRight id={`auth-form-profile-arrow-${mode}`} className={`auth-form-button-arrow`} size={17} aria-hidden />
            </button>
          </div>
        ) : (
          <div id={`auth-form-panel-${mode}`} className={`auth-form-panel`}>
            <div id={`auth-form-heading-${mode}`} className={`auth-form-heading`}>
              <p id={`auth-form-eyebrow-${mode}`} className={`auth-form-eyebrow`}>
                {`YOUR DOMAIN COLLECTION`}
              </p>
              <h1 id={`auth-form-title-${mode}`} className={`auth-form-title`}>
                {state.signingUp ? `Create account.` : `Welcome back.`}
              </h1>
              <p id={`auth-form-description-${mode}`} className={`auth-form-description`}>
                {state.signingUp ? `Bring your domains together.` : `Pick up where you left off.`}
              </p>
            </div>
            <form
              noValidate
              id={`auth-form-fields-${mode}`}
              className={`auth-form-fields`}
              aria-busy={state.auth.busy}
              onSubmit={event => { event.preventDefault(); void state.submit(); }}
            >
              {fields.map(field => {
                const Icon = field.icon;
                const password = field.type === `password`;
                return (
                  <div key={field.id} id={`auth-form-field-${mode}-${field.id}`} className={`auth-form-field`}>
                    <label id={`auth-form-label-${mode}-${field.id}`} className={`auth-form-label`} htmlFor={`auth-form-input-${mode}-${field.id}`}>
                      {field.label}
                    </label>
                    <div id={`auth-form-input-frame-${mode}-${field.id}`} className={`auth-form-input-frame`}>
                      <Icon id={`auth-form-input-icon-${mode}-${field.id}`} className={`auth-form-input-icon`} size={17} aria-hidden />
                      <input
                        required
                        name={field.id}
                        disabled={state.disabled}
                        spellCheck={false}
                        className={`auth-form-input`}
                        value={state.fields[field.id]}
                        id={`auth-form-input-${mode}-${field.id}`}
                        type={password && state.showPassword ? `text` : field.type}
                        autoCapitalize={`none`}
                        autoComplete={password ? state.signingUp ? `new-password` : `current-password` : field.id}
                        onChange={event => state.updateField(field.id, event.currentTarget.value)}
                        placeholder={field.placeholder}
                      />
                      {field.id === `password` && (
                        <button
                          type={`button`}
                          disabled={state.disabled}
                          className={`auth-form-password-toggle`}
                          id={`auth-form-password-toggle-${mode}`}
                          aria-pressed={state.showPassword}
                          aria-label={state.showPassword ? `Hide Password` : `Show Password`}
                          onClick={() => state.setShowPassword(value => !value)}
                        >
                          <PasswordIcon id={`auth-form-password-toggle-icon-${mode}`} className={`auth-form-password-toggle-icon`} size={18} aria-hidden />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {!!state.error && <Toast id={`auth-form-${mode}`} message={state.error} onDismiss={state.clearFeedback} />}
              {!!state.auth.notice && !state.error && (
                <Toast id={`auth-form-notice-${mode}`} kind={`success`} message={state.auth.notice} onDismiss={state.auth.clearNotice} />
              )}
              <button type={`submit`} id={`auth-form-submit-${mode}`} className={`auth-form-submit`} disabled={state.disabled}>
                {state.auth.busy ? `Please wait…` : state.signingUp ? `Create account` : `Sign in`}
                <ArrowRight id={`auth-form-submit-icon-${mode}`} className={`auth-form-button-arrow`} size={18} aria-hidden />
              </button>
            </form>
          </div>
        )}
        <div id={`auth-form-local-note-${mode}`} className={`auth-form-local-note`}>
          <HardDrive id={`auth-form-local-note-icon-${mode}`} className={`auth-form-local-note-icon`} size={15} aria-hidden />
          <p id={`auth-form-local-note-copy-${mode}`} className={`auth-form-local-copy`}>
            {useLocalStorage ? `Manage your portfolio with your account.` : `Accounts are available once the service is connected.`}
          </p>
        </div>
      </div>
    </section>
  );
};

export default AuthForm;
