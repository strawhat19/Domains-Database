import { routes } from '../src/shared/routes';
import PageMeta from '../src/components/PageMeta';
import AdminDashboard from '../src/components/AdminDashboard';

const AdminReportsRoute = () => <>
  <PageMeta title={`Admin · Reports`} description={`Review recent account and domain records alongside private contact requests`} />
  <AdminDashboard section={routes.adminReports.adminSection} />
</>;

export default AdminReportsRoute;
