import './styles.scss';
import { Link } from 'expo-router';
import StatePanel from '../StatePanel';
import RouterAnchor from '../RouterAnchor';
import { routes } from '../../shared/routes';
import type { AdminFeedbackProps } from './types';
import { feedbackCards, feedbackComingSoon } from './data';
import { Bot, Star, ArrowLeft, ArrowUpRight, ClipboardList, MessageCircle, MessagesSquare } from 'lucide-react';

const icons = { Bot, Star, ClipboardList, MessageCircle, MessagesSquare };

const AdminFeedback = ({ section = `feedback` }: AdminFeedbackProps = {}) => {
  const detail = section === `feedback` ? null : feedbackComingSoon[section];
  const route = detail?.route ?? routes.adminFeedback;
  const Icon = icons[route.icon];

  return (
    <section
      id={`admin-feedback-${section}`}
      className={`admin-feedback`}
      aria-labelledby={`admin-feedback-title-${section}`}
    >
      <div id={`admin-feedback-heading-${section}`} className={`admin-feedback-heading`}>
        <h2 id={`admin-feedback-title-${section}`} className={`admin-feedback-title`}>
          <Icon id={`admin-feedback-title-icon-${section}`} className={`admin-feedback-icon`} size={21} aria-hidden />
          {route.label}
        </h2>
        <p id={`admin-feedback-intro-${section}`} className={`admin-feedback-copy`}>
          {detail ? `A planned feedback channel` : `Browse feedback channels and saved submissions`}
        </p>
      </div>

      {detail ? (
        <StatePanel
          icon={`planned`}
          variant={`inline`}
          eyebrow={`PLANNED FEATURE`}
          description={detail.description}
          title={`This channel is planned`}
          id={`admin-feedback-coming-soon-${section}`}
        >
          <Link asChild href={routes.adminFormSubmissions.href}><RouterAnchor id={`admin-feedback-submissions-${section}`} className={`admin-feedback-link is-primary`}>
            <ClipboardList id={`admin-feedback-submissions-icon-${section}`} className={`admin-feedback-link-icon`} size={15} aria-hidden />
            {`View Forms`}
          </RouterAnchor></Link>
          <Link asChild href={routes.adminFeedback.href}><RouterAnchor id={`admin-feedback-back-${section}`} className={`admin-feedback-link`}>
            <ArrowLeft id={`admin-feedback-back-icon-${section}`} className={`admin-feedback-link-icon`} size={15} aria-hidden />
            {`Back to Feedback`}
          </RouterAnchor></Link>
        </StatePanel>
      ) : (
        <div id={`admin-feedback-cards`} className={`admin-feedback-cards`}>
          {feedbackCards.map(card => {
            const CardIcon = icons[card.route.icon];
            const status = card.available ? `Available` : `Coming Soon`;
            return (
              <Link asChild key={card.id} href={card.route.href}>
                <RouterAnchor
                id={`admin-feedback-card-${card.id}`}
                className={`admin-feedback-card`}
                aria-label={`${card.route.label} · ${status} · ${card.description}`}
              >
                <span id={`admin-feedback-card-icon-wrap-${card.id}`} className={`admin-feedback-icon-wrap`}>
                  <CardIcon id={`admin-feedback-card-icon-${card.id}`} className={`admin-feedback-icon`} size={23} aria-hidden />
                </span>
                <div id={`admin-feedback-card-copy-${card.id}`} className={`admin-feedback-card-copy`}>
                  <div id={`admin-feedback-card-heading-${card.id}`} className={`admin-feedback-card-heading`}>
                    <h3 id={`admin-feedback-card-title-${card.id}`} className={`admin-feedback-card-title`}>{card.route.label}</h3>
                    <span id={`admin-feedback-card-status-${card.id}`} className={`admin-feedback-badge${card.available ? ` is-available` : ``}`}>{status}</span>
                  </div>
                  <p id={`admin-feedback-card-description-${card.id}`} className={`admin-feedback-copy`}>{card.description}</p>
                  <span id={`admin-feedback-card-open-${card.id}`} className={`admin-feedback-card-open`}>
                    {`Open ${card.route.label}`}
                    <ArrowUpRight id={`admin-feedback-card-arrow-${card.id}`} className={`admin-feedback-icon`} size={13} aria-hidden />
                  </span>
                </div>
                </RouterAnchor>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default AdminFeedback;
