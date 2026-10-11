import { routes } from '../../src/shared/routes';
import PageMeta from '../../src/components/PageMeta';
import AdminDashboard from '../../src/components/AdminDashboard';

const AdminRequestsRoute = () => <>
  <PageMeta title={`Admin · Requests`} description={`Review saved contact form submissions and update their status`} />
  <AdminDashboard section={routes.adminRequests.adminSection} />
</>;

export default AdminRequestsRoute;
