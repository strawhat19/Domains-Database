import { routes } from '../../src/shared/routes';
import PageMeta from '../../src/components/PageMeta';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import AdminDashboard from '../../src/components/AdminDashboard';

const AdminObservabilityRoute = () => (
  <>
    <PageMeta title={`Admin · Health`} description={`Connected service status and runtime observability`} />
    <ProtectedRoute adminSection={routes.adminObservability.adminSection}>
      <AdminDashboard section={routes.adminObservability.adminSection} />
    </ProtectedRoute>
  </>
);

export default AdminObservabilityRoute;
