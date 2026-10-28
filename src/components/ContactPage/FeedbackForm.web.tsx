import SupportChat from '../SupportChat';
import { Link } from 'expo-router';
import { feedbackTabs } from './content';
import RouterAnchor from '../RouterAnchor';
import ModalTabs from '../ModalTabs/index.web';
import type { useContactPage } from './useContactPage';
import { Bug, Send, Star, RotateCcw, ArrowRight, MessageCircle, CheckCircle2 } from 'lucide-react';

const icons = { bug: Bug, review: Star, contact: MessageCircle };
const options = feedbackTabs.map(tab => ({ ...tab, Icon: icons[tab.id] }));

const FeedbackForm = ({ state }: { state: ReturnType<typeof useContactPage> }) => {
  const channel = feedbackTabs.find(tab => tab.id === state.tab) ?? feedbackTabs[0];
  const Icon = icons[state.tab];
  const guestContact = !state.signedIn && state.tab === `contact`;
  const saved = state.tab === `contact` ? state.submitted : state.feedbackSubmission;
  const guestFields = state.signedIn || state.tab === `contact` ? [] : state.inputFields.filter(field => [`name`, `email`, `phone`].includes(field.id));
  const channelFields = state.inputFields.filter(field => !guestFields.includes(field));
  const renderField = (field: typeof state.inputFields[number]) => {
    const inputId = `contact-feedback-input-${state.tab}-${field.id}`;
    return (
      <div key={field.id} id={`contact-feedback-field-${state.tab}-${field.id}`} className={`contact-field contact-field-${field.id}${!guestFields.includes(field) && state.tab !== `contact` ? ` contact-feedback-field` : ``}`}>
        <label id={`${inputId}-label`} htmlFor={inputId} className={`contact-label`}>{field.label}</label>
        {field.multiline ? (
          <textarea
            rows={5}
            id={inputId}
            name={field.id}
            value={field.value}
            required={field.required}
            maxLength={field.limit}
            disabled={state.pending}
            placeholder={field.placeholder}
            aria-invalid={Boolean(field.error)}
            className={`contact-input contact-message-input`}
            aria-describedby={field.error ? `${inputId}-error` : undefined}
            onChange={event => field.onChange(event.target.value)}
          />
        ) : (
          <input
            id={inputId}
            name={field.id}
            value={field.value}
            autoComplete={field.id === `name` ? `name` : field.id === `email` ? `email` : field.id === `phone` ? `tel` : `off`}
            required={field.required}
            maxLength={field.limit}
            disabled={state.pending}
            className={`contact-input`}
            placeholder={field.placeholder}
            aria-invalid={Boolean(field.error)}
            type={field.id === `mediaUrl` ? `url` : field.id === `phone` ? `tel` : field.id === `email` ? `email` : `text`}
            aria-describedby={field.error ? `${inputId}-error` : undefined}
            onChange={event => field.onChange(event.target.value)}
          />
        )}
        {field.error && <p id={`${inputId}-error`} className={`contact-field-error`}>{field.error}</p>}
      </div>
    );
  };
  const content = state.tab === `contact` && state.supportThread ? (
    <SupportChat thread={state.supportThread} onBack={state.closeConversation} />
  ) : saved ? (
    <div id={`contact-feedback-success-${state.tab}`} className={`contact-success`} role={`status`}>
      <span id={`contact-feedback-success-symbol-${state.tab}`} className={`contact-success-symbol`}><CheckCircle2 size={32} aria-hidden id={`contact-feedback-success-icon-${state.tab}`} className={`contact-success-icon`} /></span>
      <h2 id={`contact-feedback-success-title-${state.tab}`} className={`contact-form-title`}>{guestContact ? state.copy.title : state.tab === `review` ? `Thank you for your review.` : `Your bug report is saved.`}</h2>
      <p id={`contact-feedback-success-copy-${state.tab}`} className={`contact-form-description`}>{guestContact ? state.copy.description : `Your feedback is saved for the team to review.`}</p>
      <span id={`contact-feedback-success-reference-${state.tab}`} className={`contact-success-reference`}>{`${state.tab === `contact` ? `Message` : state.tab === `review` ? `Review` : `Bug Report`} #${saved.number}`}</span>
      <button type={`button`} id={`contact-feedback-another-${state.tab}`} className={`contact-submit`} onClick={state.sendAnother}>
        <Icon size={17} aria-hidden id={`contact-feedback-another-icon-${state.tab}`} className={`contact-submit-icon`} />
        {guestContact ? state.copy.another : state.tab === `review` ? `Write Another Review` : `Report Another Bug`}
      </button>
    </div>
  ) : (
    <>
      {state.tab === `contact` && (state.conversationLoading || state.conversationError || state.ownThread) && (
        <div id={`contact-conversation-resume`} className={`contact-conversation-resume`}>
          {state.conversationLoading ? <p id={`contact-conversation-loading`} className={`contact-form-description`} role={`status`}>{`Loading Your Conversation…`}</p> : state.conversationError ? <>
            <p id={`contact-conversation-error`} className={`contact-field-error`} role={`alert`}>{state.conversationError}</p>
            <button type={`button`} disabled={state.pending} id={`contact-conversation-refresh`} className={`contact-conversation-button`} onClick={state.refreshConversation}><RotateCcw size={15} aria-hidden id={`contact-conversation-refresh-icon`} className={`contact-submit-icon`} />{`Retry Conversation`}</button>
          </> : state.ownThread ? <button type={`button`} disabled={state.pending} id={`contact-conversation-open`} className={`contact-conversation-button`} onClick={state.openConversation}>
            <MessageCircle size={16} aria-hidden id={`contact-conversation-open-icon`} className={`contact-submit-icon`} />
            {`Continue Conversation`}
            <span id={`contact-conversation-reference`} className={`contact-conversation-reference`}>{`#${state.ownThread.number}`}</span>
          </button> : null}
        </div>
      )}
      <div id={`contact-feedback-heading-${state.tab}`} className={`contact-form-heading`}>
        <span id={`contact-feedback-symbol-${state.tab}`} className={`contact-form-symbol`}><Icon size={20} aria-hidden id={`contact-feedback-icon-${state.tab}`} className={`contact-form-icon`} /></span>
        <h2 id={`contact-feedback-title-${state.tab}`} className={`contact-form-title`}>{guestContact ? `Drop us a note.` : channel.title}</h2>
        <p id={`contact-feedback-description-${state.tab}`} className={`contact-form-description`}>{guestContact ? `Big ideas and small questions are equally welcome.` : channel.description}</p>
      </div>
      <form id={`contact-feedback-form-${state.tab}`} className={`contact-form`} noValidate aria-busy={state.pending} onSubmit={event => { event.preventDefault(); void state.submit(); }}>
        {!!guestFields.length && <div id={`contact-feedback-identity-fields-${state.tab}`} className={`contact-fields`}>{guestFields.map(renderField)}</div>}
        {!state.signedIn && <div id={`contact-feedback-website-field-${state.tab}`} className={`contact-honeypot`} aria-hidden>
          <label id={`contact-feedback-website-label-${state.tab}`} htmlFor={`contact-feedback-website-${state.tab}`}>{`Website`}</label>
          <input type={`text`} name={`website`} tabIndex={-1} autoComplete={`off`} disabled={state.pending} value={state.fields.website} id={`contact-feedback-website-${state.tab}`} onChange={event => state.updateField(`website`, event.target.value)} />
        </div>}
        {state.tab === `review` && (
          <div id={`contact-review-rating-field`} className={`contact-field`}>
            <span id={`contact-review-rating-label`} className={`contact-label`}>{`Rating`}</span>
            <div id={`contact-review-rating`} role={`group`} aria-labelledby={`contact-review-rating-label`} aria-describedby={state.draftErrors.rating ? `contact-review-rating-error` : undefined} className={`contact-rating`}>
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type={`button`}
                  disabled={state.pending}
                  id={`contact-review-rating-${rating}`}
                  className={`contact-rating-choice`}
                  aria-pressed={state.draft.rating === rating}
                  aria-label={`${rating} Of 5 Stars`}
                  onClick={() => state.updateDraft(`rating`, rating)}
                >
                  <Star size={23} aria-hidden id={`contact-review-rating-icon-${rating}`} className={`contact-rating-icon${state.draft.rating >= rating ? ` is-selected` : ``}`} fill={state.draft.rating >= rating ? `currentColor` : `none`} />
                </button>
              ))}
              <span id={`contact-review-rating-value`} className={`contact-rating-value`}>{state.draft.rating ? `${state.draft.rating} / 5` : `Choose A Rating`}</span>
            </div>
            {state.draftErrors.rating && <p role={`alert`} id={`contact-review-rating-error`} className={`contact-field-error`}>{state.draftErrors.rating}</p>}
          </div>
        )}
        <div id={`contact-feedback-fields-${state.tab}`} className={`contact-fields`}>
          {channelFields.map(renderField)}
        </div>
        <button type={`submit`} disabled={state.pending} id={`contact-feedback-submit-${state.tab}`} className={`contact-submit`}>
          <Send size={17} aria-hidden id={`contact-feedback-submit-icon-${state.tab}`} className={`contact-submit-icon`} />
          {state.pending ? guestContact ? state.copy.pending : channel.pending : guestContact ? state.copy.submit : channel.submit}
          <ArrowRight size={17} aria-hidden id={`contact-feedback-submit-arrow-${state.tab}`} className={`contact-submit-arrow`} />
        </button>
        <p id={`contact-feedback-privacy-${state.tab}`} className={`contact-privacy-note`}>
          {state.tab === `contact` ? state.signedIn ? `Your conversation is private to you and authorized support staff.` : `Your message and contact details are private to the team.` : `Reviews and bug reports are private feedback for the team.`}
          {!state.signedIn && <>{` Read our `}<Link href={`/privacy`} asChild><RouterAnchor id={`contact-feedback-privacy-link-${state.tab}`} className={`contact-privacy-link`}>{`Privacy Policy`}</RouterAnchor></Link>{`.`}</>}
        </p>
      </form>
    </>
  );

  return (
    <div id={`contact-feedback-content`} className={`contact-feedback`}>
      <ModalTabs id={`contact-feedback`} value={state.tab} options={options} onChange={state.setTab} disabled={state.pending} label={`Contact And Feedback`} />
      {feedbackTabs.map(tab => <div key={tab.id} role={`tabpanel`} hidden={state.tab !== tab.id} id={`contact-feedback-panel-${tab.id}`} className={`contact-feedback-panel`} aria-labelledby={`contact-feedback-tab-${tab.id}`}>{state.tab === tab.id ? content : null}</div>)}
    </div>
  );
};

export default FeedbackForm;
