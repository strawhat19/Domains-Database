import About from '../About';
import PageMeta from '../PageMeta';
import StaticPage from '../StaticPage';
import { pageContent, type PageName } from '../../shared/pages';

const StaticRoute = ({ page }: { page: PageName }) => (
  <>
    <PageMeta noIndex={page === `api`} canonicalPath={`/${page}`} title={pageContent[page].eyebrow} description={pageContent[page].description} />
    {page === `about` ? <About /> : <StaticPage page={page} />}
  </>
);

export default StaticRoute;
