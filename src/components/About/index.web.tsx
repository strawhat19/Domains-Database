import './styles.scss';
import { Link } from 'expo-router';
import Brackets from '../Brackets';
import RouterAnchor from '../RouterAnchor';
import StackPillShape from '../StackPillShape';
import { useAbout, aboutSectionIcons } from './useAbout';
import { Link2, Search, Layers3, ArrowLeft, ShieldCheck, SlidersHorizontal } from 'lucide-react';

const sectionIcons = { Link2, Search, Layers3, ShieldCheck, SlidersHorizontal };

const About = () => {
  const content = useAbout();
  const renderShape = (id: string) => <>
    <div aria-hidden id={`${id}-backing`} className={`about-card-backing`}><StackPillShape id={`${id}-backing`} /></div>
    <StackPillShape id={`${id}-foreground`} />
  </>;

  return <article id={`about-page`} className={`about-page`} aria-labelledby={`about-title`}>
    <div id={`about-inner`} className={`about-content`}>
      <Link href={`/`} asChild>
        <RouterAnchor id={`about-back`} className={`about-back-link`}>
          <ArrowLeft id={`about-back-icon`} className={`about-back-icon`} size={15} aria-hidden />
          <span id={`about-back-label`} className={`about-back-label`}>{`Back to overview`}</span>
        </RouterAnchor>
      </Link>
      <header data-scroll-hero id={`about-intro`} className={`about-intro`}>
        <div id={`about-intro-copy`} className={`about-intro-copy`}>
          <p id={`about-eyebrow`} className={`about-eyebrow`}>{content.eyebrow}</p>
          <h1 id={`about-title`} className={`about-title`}>{content.title}</h1>
          <p id={`about-description`} className={`about-description`}>{content.description}</p>
        </div>
        <div aria-hidden id={`about-illustration`} className={`about-illustration`}>
          {renderShape(`about-illustration`)}
          <Brackets suffix={`about`} />
        </div>
      </header>
      <section id={`about-topics`} className={`about-topics`} aria-label={`${content.eyebrow} topics`}>
        {content.sections.map((section, index) => {
          const Icon = sectionIcons[aboutSectionIcons[index] ?? `Layers3`];
          const id = `about-topic-${index}`;
          return <section key={section.title} id={id} aria-labelledby={`${id}-title`} className={`about-topic${index === content.sections.length - 1 ? ` about-topic-highlight` : ``}`}>
            {renderShape(id)}
            <div id={`${id}-heading`} className={`about-topic-heading`}>
              <span id={`${id}-icon-wrap`} className={`about-topic-icon-wrap`}><Icon id={`${id}-icon`} size={21} aria-hidden className={`about-topic-icon`} /></span>
              <span id={`${id}-number`} className={`about-topic-number`}>{String(index + 1).padStart(2, `0`)}</span>
            </div>
            <h2 id={`${id}-title`} className={`about-topic-title`}>{section.title}</h2>
            <div id={`${id}-body`} className={`about-topic-body`}>
              {section.body.map((paragraph, paragraphIndex) => <p key={paragraphIndex} id={`${id}-paragraph-${paragraphIndex}`} className={`about-topic-paragraph`}>{paragraph}</p>)}
            </div>
          </section>;
        })}
      </section>
    </div>
  </article>;
};

export default About;
