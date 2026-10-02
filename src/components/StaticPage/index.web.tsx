import './styles.scss';
import { Link } from 'expo-router';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { pageContent, type PageName } from '../../shared/pages';

const StaticPage = ({ page }: { page: PageName }) => {
  const content = pageContent[page];

  return (
    <article id={`${page}-page`} className={`static-page`}>
      <Link href={`/`} asChild>
        <a id={`${page}-back`} className={`static-page-back`}>
          <ArrowLeft id={`${page}-back-icon`} className={`static-page-back-icon`} size={14} aria-hidden />
          {`Back to overview`}
        </a>
      </Link>
      <p id={`${page}-eyebrow`} className={`static-page-eyebrow`}>
        {content.eyebrow}
      </p>
      <h1 id={`${page}-title`} className={`static-page-title`}>
        {content.title}
      </h1>
      <p id={`${page}-description`} className={`static-page-description`}>
        {content.description}
      </p>
      <div id={`${page}-sections`} className={`static-page-sections`}>
        {content.sections.map((section, index) => (
          <section key={section.title} id={`${page}-section-${index}`} className={`static-page-section`}>
            <h2 id={`${page}-section-title-${index}`} className={`static-page-section-title`}>
              {section.title}
            </h2>
            {section.body.map((paragraph, paragraphIndex) => (
              <p key={paragraphIndex} id={`${page}-paragraph-${index}-${paragraphIndex}`} className={`static-page-paragraph`}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
      {page === `contact` ? (
        <a id={`contact-piratechs-link`} className={`static-page-contact-link`} href={`https://piratechs.com/`} target={`_blank`} rel={`noopener noreferrer`}>
          {`Visit Piratechs`}
          <ArrowUpRight id={`contact-piratechs-icon`} className={`static-page-contact-icon`} size={16} aria-hidden />
        </a>
      ) : null}
    </article>
  );
};

export default StaticPage;
