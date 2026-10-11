import { routes } from '../../src/shared/routes';
import PageMeta from '../../src/components/PageMeta';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import AdminDashboard from '../../src/components/AdminDashboard';

const AdminDomainsRoute = () => (
  <>
    <PageMeta title={`Admin · Domains`} description={`Domain renewals, registrars, and portfolio insights`} />
    <ProtectedRoute adminSection={routes.adminDomains.adminSection}>
      <AdminDashboard section={routes.adminDomains.adminSection} />
    </ProtectedRoute>
  </>
);

export default AdminDomainsRoute;
