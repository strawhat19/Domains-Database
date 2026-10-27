import { routes } from '../src/shared/routes';
import PageMeta from '../src/components/PageMeta';
import AdminDashboard from '../src/components/AdminDashboard';

const BugReportsRoute = () => <>
  <PageMeta title={`Admin · Bug`} description={`Review private bug reports and supplied media links`} />
  <AdminDashboard section={routes.adminBugReports.adminSection} />
</>;
export default BugReportsRoute;
