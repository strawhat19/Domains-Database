import './styles.scss';
import Toast from '../Toast';
import PageMeta from '../PageMeta';
import { Link } from 'expo-router';
import RouterAnchor from '../RouterAnchor';
import FeedbackForm from './FeedbackForm.web';
import { useContactPage } from './useContactPage';
import { useFeatureFlags } from '../../shared/featureFlags/useFeatureFlags';
import { contactTopics, contactDescription } from './content';
import { Plug, Globe2, Lightbulb, ArrowUpRight, MessageCircle } from 'lucide-react';

const topicIcons = { ideas: Lightbulb, support: Plug };

const ContactPage = () => {
  const state = useContactPage();
  const { error, flags, ready } = useFeatureFlags();
  const available = ready && flags.contact && !state.authLoading && !state.accountUnavailable;
  const loading = state.authLoading || (!ready && !error);
  const message = loading ? `Loading Contact Form…` : state.accountUnavailable ? `Your account is currently unavailable for contact or feedback.` : `The contact form is currently unavailable. Please try again later.`;
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
        <section id={`contact-form-panel`} className={`contact-form-panel`} aria-busy={loading} aria-label={available ? `Contact And Feedback` : undefined} aria-labelledby={!available ? `contact-unavailable-title` : undefined}>
          {!available ? (
            <div id={`contact-unavailable`} className={`contact-form-heading`}>
              <h2 id={`contact-unavailable-title`} className={`contact-form-title`}>{`Contact Form`}</h2>
              <p role={`status`} id={`contact-unavailable-message`} className={`contact-form-description`}>{message}</p>
            </div>
          ) : <FeedbackForm state={state} />}
        </section>
      </article>
      {available && <Toast id={`contact-feedback`} message={state.feedback} kind={state.feedbackKind} onDismiss={state.clearFeedback} />}
    </>
  );
};

export default ContactPage;
