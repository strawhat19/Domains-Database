import './styles.scss';
import { Link } from 'expo-router';
import Brackets from '../Brackets';
import RouterAnchor from '../RouterAnchor';
import { useStaticPage } from './useStaticPage';
import type { PageName } from '../../shared/pages';
import { useWindowDimensions } from 'react-native';
import { Mail, Code2, Layers3, FileText, ArrowLeft, ArrowRight, ArrowUpRight, ShieldCheck } from 'lucide-react';

const pageIcons = { api: Code2, about: Layers3, contact: Mail, terms: FileText, privacy: ShieldCheck };

const StaticPage = ({ page }: { page: PageName }) => {
  const { width, height } = useWindowDimensions();
  const detailLength = height < 500 ? 90 : width > 700 ? 310 : height < 620 ? 160 : 220;
  const state = useStaticPage(page, detailLength);
  const Icon = pageIcons[page];

  return (
    <article id={`${page}-page`} className={`static-page`}>
      <div id={`${page}-intro`} className={`static-page-intro`}>
        <Link href={`/`} asChild>
          <RouterAnchor id={`${page}-back`} className={`static-page-back`}>
            <ArrowLeft id={`${page}-back-icon`} className={`static-page-back-icon`} size={15} aria-hidden />
            {`Back to overview`}
          </RouterAnchor>
        </Link>
        <div id={`${page}-brand-mark`} className={`static-page-brand-mark`}>
          <Icon id={`${page}-brand-icon`} className={`static-page-brand-icon`} size={28} aria-hidden />
        </div>
        <p id={`${page}-eyebrow`} className={`static-page-eyebrow`}>
          {state.content.eyebrow}
        </p>
        <h1 id={`${page}-title`} className={`static-page-title`}>
          {state.content.title}
        </h1>
        <p id={`${page}-description`} className={`static-page-description`}>
          {state.content.description}
        </p>
        {page === `about` && (
          <div id={`about-brackets`} className={`static-page-brackets`}>
            <Brackets suffix={`about`} />
          </div>
        )}
        {page === `contact` && (
          <a
            target={`_blank`}
            rel={`noopener noreferrer`}
            href={`https://piratechs.com/`}
            id={`contact-piratechs-link`}
            className={`static-page-contact-link`}
          >
            {`Visit Piratechs`}
            <ArrowUpRight id={`contact-piratechs-icon`} className={`static-page-contact-icon`} size={16} aria-hidden />
          </a>
        )}
      </div>
      <section id={`${page}-reader`} className={`static-page-reader`} aria-label={`${state.content.eyebrow} topics`}>
        <div id={`${page}-topic-field`} className={`static-page-topic-field`}>
          <label id={`${page}-topic-label`} className={`static-page-topic-label`} htmlFor={`${page}-topic-select`}>
            {`Explore a topic`}
          </label>
          <select
            value={state.topic}
            aria-label={`Explore a topic`}
            id={`${page}-topic-select`}
            title={state.section.title}
            className={`static-page-topic-select`}
            onChange={event => state.selectTopic(Number(event.target.value))}
          >
            {state.sections.map((section, index) => (
              <option key={section.title} value={index} id={`${page}-topic-option-${index}`}>
                {section.title}
              </option>
            ))}
          </select>
        </div>
        <div id={`${page}-section-${state.topic}`} className={`static-page-section`} aria-live={`polite`} aria-atomic>
          <p id={`${page}-section-count`} className={`static-page-section-count`}>
            {`TOPIC ${state.topic + 1} / ${state.sections.length}`}
          </p>
          <h2 id={`${page}-section-title-${state.topic}`} className={`static-page-section-title`}>
            {state.section.title}
          </h2>
          <p id={`${page}-paragraph-${state.topic}-${state.detail}`} className={`static-page-paragraph`}>
            {state.paragraph}
          </p>
        </div>
        <nav id={`${page}-reader-navigation`} className={`static-page-reader-navigation`} aria-label={`Read ${state.content.eyebrow} details`}>
          <button
            type={`button`}
            disabled={state.first}
            aria-label={`Previous detail`}
            id={`${page}-previous-detail`}
            className={`static-page-reader-button`}
            onClick={() => state.moveDetail(-1)}
          >
            <ArrowLeft id={`${page}-previous-detail-icon`} className={`static-page-reader-icon`} size={16} aria-hidden />
            <span id={`${page}-previous-detail-label`} className={`static-page-reader-button-label`}>
              {`Previous`}
            </span>
          </button>
          <span id={`${page}-detail-count`} className={`static-page-detail-count`}>
            {state.section.details.length > 1 ? `${state.detail + 1} / ${state.section.details.length}` : `${state.topic + 1} / ${state.sections.length}`}
          </span>
          <button
            type={`button`}
            disabled={state.last}
            aria-label={`Next detail`}
            id={`${page}-next-detail`}
            className={`static-page-reader-button`}
            onClick={() => state.moveDetail(1)}
          >
            <span id={`${page}-next-detail-label`} className={`static-page-reader-button-label`}>
              {`Next`}
            </span>
            <ArrowRight id={`${page}-next-detail-icon`} className={`static-page-reader-icon`} size={16} aria-hidden />
          </button>
        </nav>
      </section>
    </article>
  );
};

export default StaticPage;
