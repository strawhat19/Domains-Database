import './styles.scss';
import PageMeta from '../PageMeta';
import { Link } from 'expo-router';
import RouterAnchor from '../RouterAnchor';
import { notFoundContent } from './content';
import { routes } from '../../shared/routes';
import { House, Link2, Globe2, BookOpen, ArrowRight } from 'lucide-react';

const NotFoundPage = () => (
  <>
    <PageMeta noIndex title={`404 · Page Not Found`} description={notFoundContent.description} />
    <section id={`not-found-page`} className={`not-found-page`} aria-labelledby={`not-found-title`}>
      <div id={`not-found-artwork`} className={`not-found-artwork`} aria-hidden>
        <div id={`not-found-code`} className={`not-found-code`}>
          <span id={`not-found-first-digit`} className={`not-found-digit`}>{`4`}</span>
          <span id={`not-found-globe`} className={`not-found-globe`}>
            <Globe2 id={`not-found-globe-icon`} className={`not-found-globe-icon`} strokeWidth={1.1} />
          </span>
          <span id={`not-found-last-digit`} className={`not-found-digit`}>{`4`}</span>
        </div>
        <span id={`not-found-address`} className={`not-found-address`}>
          <Link2 id={`not-found-address-icon`} className={`not-found-address-icon`} size={13} />
          {notFoundContent.address}
        </span>
      </div>
      <div id={`not-found-copy`} className={`not-found-copy`}>
        <p id={`not-found-eyebrow`} className={`not-found-eyebrow`}>{notFoundContent.eyebrow}</p>
        <h1 id={`not-found-title`} className={`not-found-title`}>{notFoundContent.title}</h1>
        <p id={`not-found-description`} className={`not-found-description`}>{notFoundContent.description}</p>
      </div>
      <nav id={`not-found-actions`} className={`not-found-actions`} aria-label={`Find Your Way Back`}>
        <Link href={routes.home.href} asChild>
          <RouterAnchor id={`not-found-home`} className={`not-found-link not-found-home`}>
            <House id={`not-found-home-icon`} className={`not-found-link-icon`} size={16} aria-hidden />
            {notFoundContent.homeLabel}
          </RouterAnchor>
        </Link>
        <Link href={routes.domains.href} asChild>
          <RouterAnchor id={`not-found-domains`} className={`not-found-link not-found-domains`}>
            <Globe2 id={`not-found-domains-icon`} className={`not-found-link-icon`} size={16} aria-hidden />
            {notFoundContent.domainsLabel}
            <ArrowRight id={`not-found-domains-arrow`} className={`not-found-link-arrow`} size={15} aria-hidden />
          </RouterAnchor>
        </Link>
      </nav>
      <Link href={routes.blog.href} asChild>
        <RouterAnchor id={`not-found-blog`} className={`not-found-blog`}>
          <BookOpen id={`not-found-blog-icon`} className={`not-found-link-icon`} size={15} aria-hidden />
          {notFoundContent.blogLabel}
          <ArrowRight id={`not-found-blog-arrow`} className={`not-found-link-arrow`} size={14} aria-hidden />
        </RouterAnchor>
      </Link>
    </section>
  </>
);

export default NotFoundPage;
