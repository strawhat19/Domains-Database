import PageMeta from '../PageMeta';
import StaticPage from '../StaticPage';
import { pageContent, type PageName } from '../../shared/pages';

const StaticRoute = ({ page }: { page: PageName }) => (
  <>
    <PageMeta title={pageContent[page].eyebrow} description={pageContent[page].description} />
    <StaticPage page={page} />
  </>
);

export default StaticRoute;
