import './styles.scss';
import Toast from '../Toast';
import PageMeta from '../PageMeta';
import { Link } from 'expo-router';
import RouterAnchor from '../RouterAnchor';
import { useContactPage } from './useContactPage';
import { contactFields, contactTopics, contactDescription } from './content';
import { Mail, Send, Plug, Globe2, Lightbulb, ArrowRight, ArrowUpRight, MessageCircle, CheckCircle2 } from 'lucide-react';

const topicIcons = { ideas: Lightbulb, support: Plug };

const ContactPage = () => {
  const state = useContactPage();
  return (
    <>
      <PageMeta title={`Contact`} canonicalPath={`/contact`} description={contactDescription} />
      <article id={`contact-page`} className={`contact-page`} aria-labelledby={`contact-title`}>
        <section id={`contact-intro`} className={`contact-intro`} data-scroll-hero aria-labelledby={`contact-title`}>
          <p id={`contact-eyebrow`} className={`contact-eyebrow`}>
            <MessageCircle id={`contact-eyebrow-icon`} className={`contact-eyebrow-icon`} size={15} aria-hidden />
            {`LET'S CONNECT`}
          </p>
          <h1 id={`contact-title`} className={`contact-title`}>
            {`Good things start`}
            <span id={`contact-title-accent`} className={`contact-title-accent`}>{`with a hello.`}</span>
          </h1>
          <p id={`contact-description`} className={`contact-description`}>{contactDescription}</p>
          <div id={`contact-illustration`} className={`contact-illustration`} aria-hidden>
            <div id={`contact-orbit`} className={`contact-orbit`} />
            <span id={`contact-orbit-dot`} className={`contact-orbit-dot`} />
            <div id={`contact-domain-card`} className={`contact-domain-card`}>
              <Globe2 id={`contact-domain-icon`} className={`contact-domain-icon`} size={24} />
              <span id={`contact-domain-name`} className={`contact-domain-name`}>{`your.next.idea`}</span>
              <span id={`contact-domain-note`} className={`contact-domain-note`}>{`Room to grow`}</span>
            </div>
            <div id={`contact-message-card`} className={`contact-message-card`}>
              <MessageCircle id={`contact-message-icon`} className={`contact-message-icon`} size={20} />
              <span id={`contact-message-copy`} className={`contact-message-copy`}>{`Let's make it happen.`}</span>
              <span id={`contact-message-line`} className={`contact-message-line`} />
            </div>
            <span id={`contact-spark`} className={`contact-spark`}>
              <Lightbulb id={`contact-spark-icon`} className={`contact-spark-icon`} size={19} />
            </span>
          </div>
          <div id={`contact-topics`} className={`contact-topics`}>
            {contactTopics.map(topic => {
              const Icon = topicIcons[topic.id];
              return (
                <div key={topic.id} id={`contact-topic-${topic.id}`} className={`contact-topic`}>
                  <span id={`contact-topic-symbol-${topic.id}`} className={`contact-topic-symbol`}><Icon id={`contact-topic-icon-${topic.id}`} className={`contact-topic-icon`} size={17} aria-hidden /></span>
                  <h2 id={`contact-topic-title-${topic.id}`} className={`contact-topic-title`}>{topic.label}</h2>
                  <p id={`contact-topic-copy-${topic.id}`} className={`contact-topic-copy`}>{topic.copy}</p>
                </div>
              );
            })}
          </div>
          <nav id={`contact-help-links`} className={`contact-help-links`} aria-label={`Workspace Help`}>
            <Link href={`/about`} asChild>
              <RouterAnchor id={`contact-about-link`} className={`contact-help-link`}>
                <Globe2 id={`contact-about-link-icon`} className={`contact-help-link-icon`} size={14} aria-hidden />
                {`Meet the workspace`}
                <ArrowUpRight id={`contact-about-arrow`} className={`contact-help-arrow`} size={13} aria-hidden />
              </RouterAnchor>
            </Link>
            <Link href={`/profile/connections`} asChild>
              <RouterAnchor id={`contact-connections-link`} className={`contact-help-link`}>
                <Plug id={`contact-connections-link-icon`} className={`contact-help-link-icon`} size={14} aria-hidden />
                {`Your connections`}
                <ArrowUpRight id={`contact-connections-arrow`} className={`contact-help-arrow`} size={13} aria-hidden />
              </RouterAnchor>
            </Link>
          </nav>
        </section>
        <section id={`contact-form-panel`} className={`contact-form-panel`} aria-labelledby={state.submitted ? `contact-success-title` : `contact-form-title`}>
          {state.submitted ? (
            <div id={`contact-success`} className={`contact-success`} role={`status`} aria-live={`polite`}>
              <span id={`contact-success-symbol`} className={`contact-success-symbol`}><CheckCircle2 id={`contact-success-icon`} className={`contact-success-icon`} size={32} aria-hidden /></span>
              <p id={`contact-success-eyebrow`} className={`contact-eyebrow`}>{state.copy.eyebrow}</p>
              <h2 id={`contact-success-title`} className={`contact-form-title`}>{state.copy.title}</h2>
              <p id={`contact-success-copy`} className={`contact-form-description`}>{state.copy.description}</p>
              <span id={`contact-success-reference`} className={`contact-success-reference`}>{`Message #${state.submitted.number}`}</span>
              <button id={`contact-another`} className={`contact-submit`} type={`button`} onClick={state.sendAnother}>
                <MessageCircle id={`contact-another-icon`} className={`contact-submit-icon`} size={17} aria-hidden />
                {state.copy.another}
                <ArrowRight id={`contact-another-arrow`} className={`contact-submit-arrow`} size={17} aria-hidden />
              </button>
            </div>
          ) : (
            <>
              <div id={`contact-form-heading`} className={`contact-form-heading`}>
                <span id={`contact-form-symbol`} className={`contact-form-symbol`}><Mail id={`contact-form-icon`} className={`contact-form-icon`} size={20} aria-hidden /></span>
                <h2 id={`contact-form-title`} className={`contact-form-title`}>{`Drop us a note.`}</h2>
                <p id={`contact-form-description`} className={`contact-form-description`}>{`Big ideas and small questions are equally welcome.`}</p>
              </div>
              <form id={`contact-form`} className={`contact-form`} noValidate aria-busy={state.pending} onSubmit={event => { event.preventDefault(); void state.submit(); }}>
                <div id={`contact-fields`} className={`contact-fields`}>
                  {contactFields.map(field => (
                    <div key={field.id} id={`contact-field-${field.id}`} className={`contact-field contact-field-${field.id}`}>
                      <label id={`contact-label-${field.id}`} className={`contact-label`} htmlFor={`contact-input-${field.id}`}>{field.label}</label>
                      {field.id === `message` ? (
                        <textarea
                          rows={5}
                          required
                          name={field.id}
                          maxLength={field.limit}
                          disabled={state.pending}
                          value={state.fields[field.id]}
                          placeholder={field.placeholder}
                          id={`contact-input-${field.id}`}
                          className={`contact-input contact-message-input`}
                          aria-invalid={Boolean(state.errors[field.id])}
                          aria-describedby={state.errors[field.id] ? `contact-error-${field.id}` : `contact-message-hint`}
                          onChange={event => state.updateField(field.id, event.target.value)}
                        />
                      ) : (
                        <input
                          required
                          name={field.id}
                          maxLength={field.limit}
                          className={`contact-input`}
                          disabled={state.pending}
                          value={state.fields[field.id]}
                          placeholder={field.placeholder}
                          id={`contact-input-${field.id}`}
                          type={field.id === `email` ? `email` : `text`}
                          autoComplete={field.id === `subject` ? `off` : field.id}
                          aria-invalid={Boolean(state.errors[field.id])}
                          aria-describedby={state.errors[field.id] ? `contact-error-${field.id}` : undefined}
                          onChange={event => state.updateField(field.id, event.target.value)}
                        />
                      )}
                      {state.errors[field.id] && <p id={`contact-error-${field.id}`} className={`contact-field-error`}>{state.errors[field.id]}</p>}
                    </div>
                  ))}
                  <div id={`contact-website-field`} className={`contact-honeypot`} aria-hidden>
                    <label id={`contact-website-label`} className={`contact-label`} htmlFor={`contact-website`}>{`Website`}</label>
                    <input id={`contact-website`} className={`contact-input`} type={`text`} name={`website`} tabIndex={-1} autoComplete={`off`} value={state.fields.website} onChange={event => state.updateField(`website`, event.target.value)} />
                  </div>
                </div>
                <div id={`contact-message-hint`} className={`contact-message-hint`}>
                  <span id={`contact-message-safety`} className={`contact-message-safety`}>{`Please leave out passwords and API keys.`}</span>
                  <span id={`contact-message-count`} className={`contact-message-count`}>{`${state.fields.message.length.toLocaleString()} / 5,000`}</span>
                </div>
                <button id={`contact-submit`} className={`contact-submit`} type={`submit`} disabled={state.pending}>
                  <Send id={`contact-submit-icon`} className={`contact-submit-icon`} size={17} aria-hidden />
                  {state.pending ? state.copy.pending : state.copy.submit}
                  <ArrowRight id={`contact-submit-arrow`} className={`contact-submit-arrow`} size={17} aria-hidden />
                </button>
                <p id={`contact-privacy-note`} className={`contact-privacy-note`}>
                  {`Your message and contact details are handled according to our `}
                  <Link href={`/privacy`} asChild><RouterAnchor id={`contact-privacy-link`} className={`contact-privacy-link`}>{`Privacy Policy`}</RouterAnchor></Link>
                  {`.`}
                </p>
              </form>
            </>
          )}
        </section>
      </article>
      <Toast id={`contact-feedback`} message={state.feedback} kind={state.submitted ? `success` : `error`} onDismiss={state.clearFeedback} />
    </>
  );
};

export default ContactPage;
