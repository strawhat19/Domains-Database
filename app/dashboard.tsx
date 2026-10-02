import { routes } from '../src/shared/routes';
import PageMeta from '../src/components/PageMeta';
import AccountPage from '../src/components/AccountPage';
import ProtectedRoute from '../src/components/ProtectedRoute';

const DashboardRoute = () => (
  <>
    <PageMeta title={`Dashboard`} description={`Your local account and portfolio statistics`} />
    <ProtectedRoute minRole={routes.dashboard.minRole}>
      <AccountPage page={`dashboard`} />
    </ProtectedRoute>
  </>
);

export default DashboardRoute;
