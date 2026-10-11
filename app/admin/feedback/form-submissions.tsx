import { routes } from '../../../src/shared/routes';
import PageMeta from '../../../src/components/PageMeta';
import AdminDashboard from '../../../src/components/AdminDashboard';

const AdminFormSubmissionsRoute = () => (
  <>
    <PageMeta title={`Admin · Forms`} description={`Review saved contact form submissions and update their status`} />
    <AdminDashboard section={routes.adminFormSubmissions.adminSection} />
  </>
);

export default AdminFormSubmissionsRoute;
