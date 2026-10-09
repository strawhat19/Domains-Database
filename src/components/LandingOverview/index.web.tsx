import './styles.scss';
import { Link } from 'expo-router';
import RouterAnchor from '../RouterAnchor';
import StackPillShape from '../StackPillShape';
import { getBlogHref } from '../../shared/blog/metadata';
import { Globe2, Search, Layers3, BookOpen, CalendarDays, ArrowUpRight } from 'lucide-react';
import { overviewNote, overviewTitle, overviewFeatures, overviewDescription } from './content';

const featureIcons = { inventory: Globe2, renewals: CalendarDays, projects: Layers3, discovery: Search };

const LandingOverview = () => {
  const renderCardShape = (id: string) => (
    <>
      <div aria-hidden id={`${id}-backing`} className={`landing-overview-card-backing`}>
        <StackPillShape id={`${id}-backing`} />
      </div>
      <StackPillShape id={`${id}-foreground`} />
    </>
  );

  return (
    <section id={`landing-overview`} className={`landing-section landing-overview`} aria-labelledby={`landing-overview-title`}>
      <div id={`landing-overview-inner`} className={`landing-section-inner`}>
        <div id={`landing-overview-intro`} className={`landing-overview-intro`}>
          <div id={`landing-overview-copy`} className={`landing-overview-copy`}>
            <p id={`landing-overview-eyebrow`} className={`landing-eyebrow`}>{`From Scattered Names To Clear Plans`}</p>
            <h2 id={`landing-overview-title`} className={`landing-section-title`}>{overviewTitle}</h2>
            <p id={`landing-overview-description`} className={`landing-section-description`}>{overviewDescription}</p>
            <p id={`landing-overview-summary`} className={`landing-overview-summary`}>{`Know what you own, what it costs, and what you want to build next.`}</p>
          </div>
          <figure id={`landing-overview-illustration`} className={`landing-overview-illustration`}>
            {renderCardShape(`landing-overview-illustration`)}
            <img
              loading={`lazy`}
              decoding={`async`}
              width={1200}
              height={750}
              id={`landing-overview-image`}
              className={`landing-overview-image`}
              src={`/images/blog/domain-portfolio-management.svg`}
              alt={`Illustration of domain folders and a portfolio list with Renew, Review, and Keep labels`}
            />
            <figcaption id={`landing-overview-caption`} className={`landing-overview-caption`}>
              <span id={`landing-overview-caption-label`} className={`landing-overview-caption-label`}>{`A Little Order. A Lot Of Possibility.`}</span>
              <Link asChild href={getBlogHref(`domain-portfolio-management`)}>
                <RouterAnchor id={`landing-overview-guide`} className={`landing-text-link landing-small-link`}>
                  <BookOpen size={13} aria-hidden id={`landing-overview-guide-icon`} className={`landing-link-icon`} />
                  <span id={`landing-overview-guide-label`} className={`landing-link-label`}>{`Portfolio Guide`}</span>
                  <ArrowUpRight size={13} aria-hidden id={`landing-overview-guide-arrow`} className={`landing-link-icon`} />
                </RouterAnchor>
              </Link>
            </figcaption>
          </figure>
        </div>
        <div id={`landing-overview-features`} className={`landing-overview-features`}>
          {overviewFeatures.map(feature => {
            const Icon = featureIcons[feature.id as keyof typeof featureIcons];
            return (
              <article key={feature.id} id={`landing-overview-feature-${feature.id}`} className={`landing-overview-feature`}>
                {renderCardShape(`landing-overview-feature-${feature.id}`)}
                <Icon size={21} aria-hidden id={`landing-overview-feature-icon-${feature.id}`} className={`landing-overview-feature-icon`} />
                <h3 id={`landing-overview-feature-title-${feature.id}`} className={`landing-overview-feature-title`}>{feature.title}</h3>
                <p id={`landing-overview-feature-description-${feature.id}`} className={`landing-card-description`}>{feature.description}</p>
              </article>
            );
          })}
        </div>
        <p id={`landing-overview-note`} className={`landing-section-note`}>{overviewNote}</p>
      </div>
    </section>
  );
};

export default LandingOverview;
