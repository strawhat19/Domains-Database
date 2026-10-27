import { routes } from '../src/shared/routes';
import PageMeta from '../src/components/PageMeta';
import ProtectedRoute from '../src/components/ProtectedRoute';
import AdminDashboard from '../src/components/AdminDashboard';

const AdminAnalyticsRoute = () => (
  <>
    <PageMeta title={`Admin · Analytics`} description={`Website traffic and GitHub repository analytics`} />
    <ProtectedRoute adminSection={routes.adminAnalytics.adminSection}>
      <AdminDashboard section={routes.adminAnalytics.adminSection} />
    </ProtectedRoute>
  </>
);

export default AdminAnalyticsRoute;
