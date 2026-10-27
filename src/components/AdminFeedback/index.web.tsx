import './styles.scss';
import { Link } from 'expo-router';
import SupportInbox from '../SupportInbox';
import FeedbackEntries from '../FeedbackEntries';
import RouterAnchor from '../RouterAnchor';
import { routes } from '../../shared/routes';
import type { AdminFeedbackProps } from './types';
import { feedbackCards } from './data';
import { Bug, Star, ArrowUpRight, ClipboardList, MessageCircle, MessagesSquare } from 'lucide-react';

const icons = { Bug, Star, ClipboardList, MessageCircle, MessagesSquare };

const AdminFeedback = ({ section = `feedback` }: AdminFeedbackProps = {}) => {
  if (section === `reviews` || section === `bugReports`) return <FeedbackEntries kind={section === `reviews` ? `review` : `bug`} />;
  if (section === `aiChats` || section === `messages`) return <SupportInbox />;
  const route = routes.adminFeedback;
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
          {`Browse feedback channels and saved submissions`}
        </p>
      </div>

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
    </section>
  );
};

export default AdminFeedback;
