import { routes } from '../src/shared/routes';
import PageMeta from '../src/components/PageMeta';
import AdminDashboard from '../src/components/AdminDashboard';
import ProtectedRoute from '../src/components/ProtectedRoute';

const DashboardRoute = () => (
  <>
    <PageMeta title={`Admin Dashboard`} description={`Domain portfolio, account, analytics, and runtime insights`} />
    <ProtectedRoute adminSection={routes.dashboard.adminSection}>
      <AdminDashboard />
    </ProtectedRoute>
  </>
);

export default DashboardRoute;
