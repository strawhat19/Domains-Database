import './styles.scss';
import Pricing from '../Pricing';
import { Link } from 'expo-router';
import type { CSSProperties } from 'react';
import RouterAnchor from '../RouterAnchor';
import { routes } from '../../shared/routes';
import StackPillShape from '../StackPillShape';
import LandingOverview from '../LandingOverview';
import DomainEtymology from '../DomainEtymology';
import { getBlogHref } from '../../shared/blog/metadata';
import { domainBasics, ctaActivityCells } from './content';
import { useLandingActivity } from './useLandingActivity.web';
import { Play, Rocket, Globe2, Server, BookOpen, Lightbulb, Settings2, ArrowRight, ArrowUpRight, ClipboardList, LayoutTemplate } from 'lucide-react';

const basicIcons = { domain: Globe2, hosting: Server, website: LayoutTemplate };
const workflowSteps = [
  { id: `idea`, label: `Idea.`, Icon: Lightbulb },
  { id: `plan`, label: `Plan.`, Icon: ClipboardList },
  { id: `manage`, label: `Manage.`, Icon: Settings2 },
  { id: `execute`, label: `Execute.`, Icon: Play },
  { id: `launch`, label: `Launch.`, Icon: Rocket },
];

const LandingSections = () => {
  const ctaActivity = useLandingActivity();
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
          <div id={`landing-domain-etymology`} className={`landing-etymology`}>
            <DomainEtymology compact id={`landing-etymology-graphic`} />
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
        </div>
      </section>

      <section id={`landing-portfolio-cta`} className={`landing-section landing-portfolio-cta`} aria-labelledby={`landing-cta-title`}>
        <div id={`landing-cta-inner`} className={`landing-section-inner landing-cta-inner`}>
          <div id={`landing-cta-copy`} className={`landing-heading-copy`}>
            <p id={`landing-cta-eyebrow`} className={`landing-eyebrow`}>{`Less Scattered. More Sorted.`}</p>
            <h2 id={`landing-cta-title`} className={`landing-section-title`}>{`Your next idea deserves a place.`}</h2>
            <p id={`landing-cta-description`} className={`landing-section-description`}>{`Bring your domains, projects, registrars, and renewal dates together. Leave a little more room for what comes next.`}</p>
          </div>
          <div id={`landing-cta-actions`} className={`landing-cta-actions`}>
            <div
              aria-hidden
              ref={ctaActivity.gridRef}
              data-paused={ctaActivity.paused}
              id={`landing-cta-activity-grid`}
              className={`landing-activity-grid landing-cta-activity-grid`}
            >
              {ctaActivityCells.map(cell => (
                <span
                  key={cell.index}
                  id={`landing-cta-activity-cell-${cell.index}`}
                  className={`landing-activity-cell landing-activity-level-${cell.level}`}
                  style={{ [`--activity-delay`]: `${-(Math.floor(cell.index / 7) * .18 + cell.index % 7 * .32)}s` } as CSSProperties}
                />
              ))}
            </div>
            <Link asChild href={routes.domains.href}>
              <RouterAnchor id={`landing-cta-button`} className={`landing-button landing-button-primary`} aria-label={`Explore Your Portfolio`}>
                <Globe2 size={16} aria-hidden id={`landing-cta-icon`} className={`landing-link-icon`} />
                <span id={`landing-cta-label`} className={`landing-link-label`}>{`Explore`}</span>
                <ArrowRight size={16} aria-hidden id={`landing-cta-arrow`} className={`landing-link-icon`} />
              </RouterAnchor>
            </Link>
          </div>
        </div>
      </section>

      <LandingOverview />

      <Pricing />

      <section id={`landing-final-cta`} className={`landing-section landing-final-cta`} aria-labelledby={`landing-final-title`}>
        <div id={`landing-final-inner`} className={`landing-section-inner landing-final-inner`}>
          <p id={`landing-final-eyebrow`} className={`landing-eyebrow landing-workflow`}>
            {workflowSteps.map(({ id, label, Icon }) => <span
              key={id}
              className={`landing-workflow-step`}
              id={`landing-final-workflow-${id}`}
            >
              <Icon size={13} aria-hidden className={`landing-workflow-icon`} id={`landing-final-workflow-icon-${id}`} />
              <span className={`landing-workflow-label`} id={`landing-final-workflow-label-${id}`}>{label}</span>
            </span>)}
          </p>
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
