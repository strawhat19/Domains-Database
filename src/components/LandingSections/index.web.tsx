import './styles.scss';
import { Link } from 'expo-router';
import type { CSSProperties } from 'react';
import RouterAnchor from '../RouterAnchor';
import { routes } from '../../shared/routes';
import StackPillShape from '../StackPillShape';
import LandingOverview from '../LandingOverview';
import type { LandingSectionsProps } from './types';
import LandingDomainCard from '../LandingDomainCard';
import { getBlogHref } from '../../shared/blog/metadata';
import { useLandingActivity } from './useLandingActivity.web';
import { activityCells, domainBasics, landingPlans, portfolioSteps } from './content';
import { Check, Search, Globe2, Server, LayoutTemplate, BookOpen, Sparkles, TrendingUp, ArrowRight, ArrowUpRight, LockKeyhole } from 'lucide-react';

const basicIcons = { domain: Globe2, hosting: Server, website: LayoutTemplate };

const LandingSections = ({ search }: LandingSectionsProps) => {
  const activity = useLandingActivity();
  const discovery = search.discovery;
  const trending = discovery.results.filter(result => result.statuses.includes(`trending`)).slice(0, 6);
  const loading = search.trendingCountLoading;
  const renderCardShape = (id: string) => (
    <>
      <div aria-hidden id={`${id}-backing`} className={`landing-card-backing`}>
        <StackPillShape id={`${id}-backing`} />
      </div>
      <StackPillShape id={`${id}-foreground`} />
    </>
  );

  return (
    <div id={`landing-sections`} className={`landing-sections`}>
      <section id={`landing-domain-basics`} className={`landing-section landing-domain-basics`} aria-labelledby={`landing-basics-title`}>
        <div id={`landing-basics-inner`} className={`landing-section-inner`}>
          <div id={`landing-basics-heading`} className={`landing-section-heading`}>
            <div id={`landing-basics-copy`} className={`landing-heading-copy`}>
              <p id={`landing-basics-eyebrow`} className={`landing-eyebrow`}>{`Start With The Basics`}</p>
              <h2 id={`landing-basics-title`} className={`landing-section-title`}>{`What are domains?`}</h2>
              <p id={`landing-basics-description`} className={`landing-section-description`}>{`An address. A place to build. An experience to share. Three different pieces of your next idea.`}</p>
            </div>
            <Link asChild href={getBlogHref(`domain-vs-hosting-vs-website`)}>
              <RouterAnchor id={`landing-basics-guide`} className={`landing-text-link landing-small-link`}>
                <BookOpen size={14} aria-hidden id={`landing-basics-guide-icon`} className={`landing-link-icon`} />
                <span id={`landing-basics-guide-label`} className={`landing-link-label`}>{`Read The Guide`}</span>
                <ArrowUpRight size={14} aria-hidden id={`landing-basics-guide-arrow`} className={`landing-link-icon`} />
              </RouterAnchor>
            </Link>
          </div>
          <div id={`landing-basics-grid`} className={`landing-basics-grid`}>
            {domainBasics.map(basic => {
              const Icon = basicIcons[basic.id as keyof typeof basicIcons];
              return (
                <article key={basic.id} id={`landing-basic-${basic.id}`} className={`landing-basic-card`}>
                  {renderCardShape(`landing-basic-${basic.id}`)}
                  <div id={`landing-basic-top-${basic.id}`} className={`landing-basic-top`}>
                    <span id={`landing-basic-label-${basic.id}`} className={`landing-card-label`}>{basic.label}</span>
                    <Icon size={20} aria-hidden id={`landing-basic-icon-${basic.id}`} className={`landing-basic-icon`} />
                  </div>
                  <h3 id={`landing-basic-title-${basic.id}`} className={`landing-card-title`}>{basic.title}</h3>
                  <p id={`landing-basic-example-${basic.id}`} className={`landing-basic-example`}>{basic.example}</p>
                  <p id={`landing-basic-description-${basic.id}`} className={`landing-card-description`}>{basic.description}</p>
                </article>
              );
            })}
          </div>
          <p id={`landing-basics-dns`} className={`landing-section-note`}>
            <span id={`landing-basics-dns-label`} className={`landing-note-label`}>{`The Connection? DNS.`}</span>
            {` It points your domain to the services you use. You can keep your name even when your hosting changes.`}
          </p>
        </div>
      </section>

      <LandingOverview />

      <section id={`landing-portfolio-cta`} className={`landing-section landing-portfolio-cta`} aria-labelledby={`landing-cta-title`}>
        <div id={`landing-cta-inner`} className={`landing-section-inner landing-cta-inner`}>
          <div id={`landing-cta-copy`} className={`landing-heading-copy`}>
            <p id={`landing-cta-eyebrow`} className={`landing-eyebrow`}>{`Less Scattered. More Sorted.`}</p>
            <h2 id={`landing-cta-title`} className={`landing-section-title`}>{`Your next idea deserves a place.`}</h2>
            <p id={`landing-cta-description`} className={`landing-section-description`}>{`Bring your domains, projects, registrars, and renewal dates together. Leave a little more room for what comes next.`}</p>
          </div>
          <Link asChild href={routes.domains.href}>
            <RouterAnchor id={`landing-cta-button`} className={`landing-button landing-button-primary`}>
              <Globe2 size={16} aria-hidden id={`landing-cta-icon`} className={`landing-link-icon`} />
              <span id={`landing-cta-label`} className={`landing-link-label`}>{`Explore Your Portfolio`}</span>
              <ArrowRight size={16} aria-hidden id={`landing-cta-arrow`} className={`landing-link-icon`} />
            </RouterAnchor>
          </Link>
        </div>
      </section>

      <section id={`landing-trending-domains`} className={`landing-section landing-trending-domains`} aria-labelledby={`landing-trending-title`}>
        <div id={`landing-trending-inner`} className={`landing-section-inner`}>
          <div id={`landing-trending-heading`} className={`landing-section-heading`}>
            <div id={`landing-trending-copy`} className={`landing-heading-copy`}>
              <p id={`landing-trending-eyebrow`} className={`landing-eyebrow`}>{`A Little Inspiration`}</p>
              <h2 id={`landing-trending-title`} className={`landing-section-title`}>{`Trending domains. Fresh possibilities.`}</h2>
              <p id={`landing-trending-description`} className={`landing-section-description`}>{`Curated tech and creator name ideas, with availability checked through connected registrars.`}</p>
            </div>
            <Link asChild href={routes.search.href}>
              <RouterAnchor id={`landing-trending-link`} className={`landing-text-link`}>
                <TrendingUp size={15} aria-hidden id={`landing-trending-link-icon`} className={`landing-link-icon`} />
                <span id={`landing-trending-link-label`} className={`landing-link-label`}>{`Explore Names`}</span>
                <ArrowUpRight size={15} aria-hidden id={`landing-trending-link-arrow`} className={`landing-link-icon`} />
              </RouterAnchor>
            </Link>
          </div>
          <div id={`landing-trending-results`} className={`landing-trending-results`} aria-busy={loading}>
            {trending.length > 0 ? (
              <div id={`landing-trending-grid`} className={`landing-trending-grid`}>
                {trending.map(result => <LandingDomainCard key={result.domain} result={result} onSearch={search.searchDomain} />)}
              </div>
            ) : loading ? (
              <div id={`landing-trending-skeletons`} className={`landing-trending-grid`} aria-label={`Loading Trending Domains`} role={`status`}>
                {[0, 1, 2].map(index => (
                  <div key={index} aria-hidden id={`landing-trending-skeleton-${index}`} className={`landing-trending-skeleton`}>
                    {renderCardShape(`landing-trending-skeleton-${index}`)}
                    <span id={`landing-trending-skeleton-name-${index}`} className={`landing-skeleton-line landing-skeleton-name`} />
                    <span id={`landing-trending-skeleton-copy-${index}`} className={`landing-skeleton-line landing-skeleton-copy`} />
                    <span id={`landing-trending-skeleton-price-${index}`} className={`landing-skeleton-line landing-skeleton-price`} />
                  </div>
                ))}
              </div>
            ) : (
              <div id={`landing-trending-empty`} className={`landing-trending-empty`} role={`status`}>
                {renderCardShape(`landing-trending-empty`)}
                <Search size={28} aria-hidden id={`landing-trending-empty-icon`} className={`landing-empty-icon`} />
                <h3 id={`landing-trending-empty-title`} className={`landing-card-title`}>{discovery.eligible ? `Your next name is out there` : `Connect to discover your next name`}</h3>
                <p id={`landing-trending-empty-description`} className={`landing-card-description`}>
                  {discovery.error || (discovery.eligible ? `No trending names are available from the latest check. Try a domain search of your own.` : `Connect a supported registrar to check these name ideas and see current registration quotes.`)}
                </p>
                <Link asChild href={discovery.eligible ? routes.search.href : routes.connections.href}>
                  <RouterAnchor id={`landing-trending-empty-link`} className={`landing-text-link`}>
                    <span id={`landing-trending-empty-label`} className={`landing-link-label`}>{discovery.eligible ? `Search Domains` : `Connect A Registrar`}</span>
                    <ArrowUpRight size={14} aria-hidden id={`landing-trending-empty-arrow`} className={`landing-link-icon`} />
                  </RouterAnchor>
                </Link>
              </div>
            )}
          </div>
          {trending.length > 0 && (
            <p id={`landing-trending-note`} className={`landing-section-note`} role={discovery.error ? `status` : undefined}>
              {discovery.error || `Availability and registrar quotes can change. Open a name to check again before registering.`}
            </p>
          )}
        </div>
      </section>

      <section id={`landing-activity`} className={`landing-section landing-activity`} aria-labelledby={`landing-activity-title`}>
        <div id={`landing-activity-inner`} className={`landing-section-inner`}>
          <div id={`landing-activity-heading`} className={`landing-section-heading`}>
            <div id={`landing-activity-copy`} className={`landing-heading-copy`}>
              <p id={`landing-activity-eyebrow`} className={`landing-eyebrow`}>{`Small Steps. Bigger Ideas.`}</p>
              <h2 id={`landing-activity-title`} className={`landing-section-title`}>{`Build a little momentum.`}</h2>
              <p id={`landing-activity-description`} className={`landing-section-description`}>{`A name today. A plan tomorrow. Keep moving from possibility to something people can find.`}</p>
            </div>
            <span id={`landing-activity-tag`} className={`landing-activity-tag`}>
              <Sparkles size={14} aria-hidden id={`landing-activity-tag-icon`} className={`landing-link-icon`} />
              <span id={`landing-activity-tag-label`} className={`landing-link-label`}>{`Idea → Launch`}</span>
            </span>
          </div>
          <div id={`landing-activity-frame`} className={`landing-activity-frame`}>
            {renderCardShape(`landing-activity-frame`)}
            <div ref={activity.gridRef} aria-hidden id={`landing-activity-grid`} className={`landing-activity-grid`} data-paused={activity.paused}>
              {activityCells.map(cell => (
                <span
                  key={cell.index}
                  id={`landing-activity-cell-${cell.index}`}
                  className={`landing-activity-cell landing-activity-level-${cell.level}`}
                  style={{ [`--activity-delay`]: `${cell.delay}s`, [`--activity-duration`]: `${cell.duration}s` } as CSSProperties}
                />
              ))}
            </div>
            <div id={`landing-activity-caption`} className={`landing-activity-caption`}>
              <span id={`landing-activity-caption-label`} className={`landing-activity-caption-label`}>{`Make Space For Your Next Idea`}</span>
              <div aria-hidden id={`landing-activity-legend`} className={`landing-activity-legend`}>
                <span id={`landing-activity-legend-less`} className={`landing-legend-label`}>{`Idea`}</span>
                {[0, 1, 2, 3, 4].map(level => <span key={level} id={`landing-activity-legend-${level}`} className={`landing-legend-cell landing-activity-level-${level}`} />)}
                <span id={`landing-activity-legend-more`} className={`landing-legend-label`}>{`Launch`}</span>
              </div>
            </div>
          </div>
          <div id={`landing-activity-steps`} className={`landing-activity-steps`}>
            {portfolioSteps.map((step, index) => (
              <div key={step.id} id={`landing-step-${step.id}`} className={`landing-step`}>
                <span id={`landing-step-number-${step.id}`} className={`landing-step-number`}>{`0${index + 1}`}</span>
                <div id={`landing-step-copy-${step.id}`} className={`landing-step-copy`}>
                  <h3 id={`landing-step-title-${step.id}`} className={`landing-step-title`}>{step.label}</h3>
                  <p id={`landing-step-description-${step.id}`} className={`landing-step-description`}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id={`landing-pricing`} className={`landing-section landing-pricing`} aria-labelledby={`landing-pricing-title`}>
        <div id={`landing-pricing-inner`} className={`landing-section-inner`}>
          <div id={`landing-pricing-heading`} className={`landing-section-heading`}>
            <div id={`landing-pricing-copy`} className={`landing-heading-copy`}>
              <p id={`landing-pricing-eyebrow`} className={`landing-eyebrow`}>{`Room To Grow`}</p>
              <h2 id={`landing-pricing-title`} className={`landing-section-title`}>{`Start free. Plan for more.`}</h2>
              <p id={`landing-pricing-description`} className={`landing-section-description`}>{`Use the portfolio tools today. Here is a look at the higher-tier features planned for growing portfolios and teams.`}</p>
            </div>
          </div>
          <div id={`landing-pricing-grid`} className={`landing-pricing-grid`}>
            {landingPlans.map(plan => (
              <article key={plan.id} id={`landing-plan-${plan.id}`} className={`landing-plan${plan.id === `pro` ? ` landing-plan-featured` : ``}`}>
                {renderCardShape(`landing-plan-${plan.id}`)}
                <span id={`landing-plan-label-${plan.id}`} className={`landing-plan-label`}>{plan.label}</span>
                <h3 id={`landing-plan-name-${plan.id}`} className={`landing-card-title`}>{plan.name}</h3>
                <p id={`landing-plan-description-${plan.id}`} className={`landing-card-description`}>{plan.description}</p>
                <p id={`landing-plan-price-${plan.id}`} className={`landing-plan-price${plan.id === `free` ? `` : ` landing-plan-price-planned`}`}>
                  {plan.price}
                  {plan.id === `free` && <span id={`landing-plan-period-${plan.id}`} className={`landing-plan-period`}>{` / To Get Started`}</span>}
                </p>
                <ul id={`landing-plan-features-${plan.id}`} className={`landing-plan-features`}>
                  {plan.features.map((feature, index) => (
                    <li key={feature} id={`landing-plan-feature-${plan.id}-${index}`} className={`landing-plan-feature`}>
                      <Check size={14} aria-hidden id={`landing-plan-feature-icon-${plan.id}-${index}`} className={`landing-feature-icon`} />
                      <span id={`landing-plan-feature-label-${plan.id}-${index}`} className={`landing-feature-label`}>{feature}</span>
                    </li>
                  ))}
                  {plan.plannedFeatures.map((feature, index) => (
                    <li key={feature} id={`landing-plan-unlock-${plan.id}-${index}`} className={`landing-plan-feature landing-plan-unlock`}>
                      <LockKeyhole size={14} aria-hidden id={`landing-plan-unlock-icon-${plan.id}-${index}`} className={`landing-feature-icon`} />
                      <span id={`landing-plan-unlock-label-${plan.id}-${index}`} className={`landing-feature-label`}>{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.id !== `free` && <p id={`landing-plan-preview-${plan.id}`} className={`landing-plan-preview`}>{`Planned Unlocks · Pricing To Be Announced`}</p>}
                <Link asChild href={plan.id === `free` ? routes.domains.href : routes.contact.href}>
                  <RouterAnchor id={`landing-plan-action-${plan.id}`} className={`landing-button${plan.id === `free` ? ` landing-button-primary` : ``}`}>
                    <span id={`landing-plan-action-label-${plan.id}`} className={`landing-link-label`}>{plan.action}</span>
                    <ArrowUpRight size={15} aria-hidden id={`landing-plan-action-arrow-${plan.id}`} className={`landing-link-icon`} />
                  </RouterAnchor>
                </Link>
              </article>
            ))}
          </div>
          <p id={`landing-pricing-note`} className={`landing-section-note`}>{`Pro and Team are planned tiers and are not available to purchase yet. Domain registrations and hosting are billed separately by your providers.`}</p>
        </div>
      </section>

      <section id={`landing-final-cta`} className={`landing-section landing-final-cta`} aria-labelledby={`landing-final-title`}>
        <div id={`landing-final-inner`} className={`landing-section-inner landing-final-inner`}>
          <p id={`landing-final-eyebrow`} className={`landing-eyebrow`}>{`Idea. Plan. Manage. Execute. Launch.`}</p>
          <h2 id={`landing-final-title`} className={`landing-section-title`}>{`Give your next idea a name.`}</h2>
          <p id={`landing-final-description`} className={`landing-section-description`}>{`Find the address. Keep the details together. Build what comes next.`}</p>
          <div id={`landing-final-actions`} className={`landing-final-actions`}>
            <Link asChild href={routes.domains.href}>
              <RouterAnchor id={`landing-final-portfolio`} className={`landing-button landing-button-primary`}>
                <Globe2 size={16} aria-hidden id={`landing-final-portfolio-icon`} className={`landing-link-icon`} />
                <span id={`landing-final-portfolio-label`} className={`landing-link-label`}>{`Open Your Portfolio`}</span>
                <ArrowRight size={16} aria-hidden id={`landing-final-portfolio-arrow`} className={`landing-link-icon`} />
              </RouterAnchor>
            </Link>
            <Link asChild href={routes.blog.href}>
              <RouterAnchor id={`landing-final-guides`} className={`landing-text-link`}>
                <BookOpen size={15} aria-hidden id={`landing-final-guides-icon`} className={`landing-link-icon`} />
                <span id={`landing-final-guides-label`} className={`landing-link-label`}>{`Get Inspired`}</span>
                <ArrowUpRight size={15} aria-hidden id={`landing-final-guides-arrow`} className={`landing-link-icon`} />
              </RouterAnchor>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingSections;
