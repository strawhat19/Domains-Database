import './styles.scss';
import PageMeta from '../PageMeta';
import StatePanel from '../StatePanel';
import { Link } from 'expo-router';
import RouterAnchor from '../RouterAnchor';
import { notFoundContent } from './content';
import { routes } from '../../shared/routes';
import { House, Globe2, BookOpen, ArrowRight } from 'lucide-react';

const NotFoundPage = () => (
  <>
    <PageMeta noIndex title={`404 · Page Not Found`} description={notFoundContent.description} />
    <section id={`not-found-page`} className={`not-found-page`} aria-labelledby={`state-panel-title-not-found`}>
      <StatePanel icon={`error`} id={`not-found`} eyebrow={notFoundContent.eyebrow} title={notFoundContent.title} description={notFoundContent.description}>
        <div id={`not-found-links`} className={`not-found-copy`}>
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
        </div>
      </StatePanel>
    </section>
  </>
);

export default NotFoundPage;
