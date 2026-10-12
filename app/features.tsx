import { routes } from '../src/shared/routes';
import PageMeta from '../src/components/PageMeta';
import ProtectedRoute from '../src/components/ProtectedRoute';
import AdminDashboard from '../src/components/AdminDashboard';

const AdminFeaturesRoute = () => (
  <>
    <PageMeta title={`Admin · Features`} description={`Owner feature controls for Domains Database`} />
    <ProtectedRoute adminSection={routes.adminFeatures.adminSection}>
      <AdminDashboard section={routes.adminFeatures.adminSection} />
    </ProtectedRoute>
  </>
);

export default AdminFeaturesRoute;
